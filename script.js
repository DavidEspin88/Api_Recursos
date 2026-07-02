// Apunta a tu Cloud Function local en el Emulador de Firebase (sin costo)
window.API_URL = "http://127.0.0.1:5001/misfinanzas-eed96/us-central1/procesarFinanzas";
// Nota: una vez hagas el despliegue final a producción, solo tendrás que
// reemplazar esta URL local por la URL real que te entregue Firebase.


// Caché reactivo global accesible por los demás módulos del ecosistema
window.apiCache = {
    gasto: [],
    detalleGasto: [],
    registroGasto: [],
    matrizGastos: {},
    ingresos: [],
    registroGastoAnual: null,
    _anioActual: null
};

// Función de formateo de números (global)
window.formatearMoneda = function(valor) {
    return valor.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

(() => {
    // Captura de elementos del DOM de la Sección 1
    const tablaGastos = document.getElementById("tablaGastos");
    const inputNombre = document.getElementById("nombreGasto");
    const inputIdOculto = document.getElementById("editIdGasto");
    const btnGuardar = document.getElementById("btnGuardar");

    // Elementos del modal
    const modalResumen = document.getElementById("modalResumen");
    const btnResumen = document.getElementById("btnResumenCuentas");
    const btnCerrarModal = document.getElementById("btnCerrarModal");
    const btnGenerar = document.getElementById("btnGenerarResumen");
    const fechaInicio = document.getElementById("fechaInicioResumen");
    const fechaFin = document.getElementById("fechaFinResumen");
    const contenidoResumen = document.getElementById("contenidoResumen");

    // Escuchas de eventos principales del ciclo de vida
    document.addEventListener("DOMContentLoaded", cargarDatosCentral);
    if (btnGuardar) {
        btnGuardar.addEventListener("click", guardarRegistroTipo);
    }

    // Exponer la función de carga centralizada
    window.cargarDatosCentral = cargarDatosCentral;

    // --- MANEJO DEL MODAL ---
    if (btnResumen) {
        btnResumen.addEventListener("click", () => {
            modalResumen.style.display = "flex";
            const hoy = new Date();
            const anio = hoy.getFullYear();
            const mes = String(hoy.getMonth() + 1).padStart(2, '0');
            const dia = String(hoy.getDate()).padStart(2, '0');
            const fechaActual = `${anio}-${mes}-${dia}`;
            const primerDia = `${anio}-${mes}-01`;
            fechaInicio.value = primerDia;
            fechaFin.value = fechaActual;
            contenidoResumen.innerHTML = `<p class="text-muted">Seleccione un rango de fechas y presione "Generar Resumen".</p>`;
        });
    }

    if (btnCerrarModal) {
        btnCerrarModal.addEventListener("click", cerrarModal);
    }
    if (modalResumen) {
        modalResumen.addEventListener("click", (e) => {
            if (e.target === modalResumen) cerrarModal();
        });
    }

    function cerrarModal() {
        if (modalResumen) modalResumen.style.display = "none";
    }

    // --- GENERAR RESUMEN (AGRUPACIÓN AGREGADA) ---
    if (btnGenerar) {
        btnGenerar.addEventListener("click", generarResumen);
    }

    function generarResumen() {
        const inicio = fechaInicio.value;
        const fin = fechaFin.value;
        if (!inicio || !fin) {
            alert("Por favor seleccione ambas fechas.");
            return;
        }
        if (inicio > fin) {
            alert("La fecha de inicio no puede ser mayor que la fecha final.");
            return;
        }

        const anioFin = fin.substring(0, 4);
        cargarGastosAnuales(anioFin, () => {
            const ingresos = window.apiCache.ingresos || [];
            const gastos = window.apiCache.registroGastoAnual || [];

            const ingresosFiltrados = ingresos.filter(ing => ing.fecha >= inicio && ing.fecha <= fin);
            const gastosFiltrados = gastos.filter(g => g.fecha >= inicio && g.fecha <= fin);

            const totalIngresos = ingresosFiltrados.reduce((sum, ing) => sum + (ing.monto || 0), 0);
            const totalGastos = gastosFiltrados.reduce((sum, g) => sum + (g.monto || 0), 0);

            // --- PROCESO DE AGRUPACIÓN DE INGRESOS POR NOMBRE ---
            const ingresosAgrupados = ingresosFiltrados.reduce((acumulador, ing) => {
                const nombre = (ing.nombre || "Sin nombre").toUpperCase().trim();
                if (!acumulador[nombre]) {
                    acumulador[nombre] = 0;
                }
                acumulador[nombre] += (ing.monto || 0);
                return acumulador;
            }, {});

            const fechaFinObj = new Date(fin + "T00:00:00");
            const mesFin = fechaFinObj.getMonth() + 1;
            const anioReporte = fin.substring(0, 4);
            const ahorroAcumulado = calcularAhorroHasta(anioReporte, mesFin);

            let html = `<div class="resumen-detalle">`;
            html += `<h4 style="margin-bottom:12px;">Detalle de Ingresos Consolidados</h4>`;
            
            const fuentesAgrupadasKeys = Object.keys(ingresosAgrupados);
            if (fuentesAgrupadasKeys.length === 0) {
                html += `<p class="text-muted">No hay ingresos en este período.</p>`;
            } else {
                fuentesAgrupadasKeys.forEach(nombreFuente => {
                    const montoFormateado = window.formatearMoneda(ingresosAgrupados[nombreFuente]);
                    html += `<div class="resumen-detalle-ingreso">
                        <span>INGRESO ${anioReporte} - ${nombreFuente}</span>
                        <span class="monto">$ ${montoFormateado}</span>
                    </div>`;
                });
            }
            html += `<div class="resumen-total">
                <div><span>VALOR INGRESOS ${anioReporte}:</span> <strong>$ ${window.formatearMoneda(totalIngresos)}</strong></div>
                <div><span>VALOR EGRESOS ${anioReporte}:</span> <strong>$ ${window.formatearMoneda(totalGastos)}</strong></div>
                <div><span>SUELDO AHORRADO ${anioReporte}:</span> <strong class="color-ahorro-resumen">$ ${window.formatearMoneda(ahorroAcumulado)}</strong></div>
            </div>`;
            html += `</div>`;
            contenidoResumen.innerHTML = html;
        });
    }

    // --- CÁLCULO DE AHORRO ACUMULADO HASTA UN MES DADO ---
    function calcularAhorroHasta(anio, mes) {
        const ingresos = window.apiCache.ingresos || [];
        const gastos = window.apiCache.registroGastoAnual || [];

        let ahorroAcum = 0;
        for (let m = 1; m <= mes; m++) {
            const mesStr = String(m).padStart(2, '0');
            const inicioMes = `${anio}-${mesStr}-01`;
            const finMes = `${anio}-${mesStr}-31`;
            const ingMes = ingresos.filter(ing => ing.fecha >= inicioMes && ing.fecha <= finMes);
            const gastosMes = gastos.filter(g => g.fecha >= inicioMes && g.fecha <= finMes);
            const totalIngMes = ingMes.reduce((sum, ing) => sum + (ing.monto || 0), 0);
            const totalGastosMes = gastosMes.reduce((sum, g) => sum + (g.monto || 0), 0);
            ahorroAcum += (totalIngMes - totalGastosMes);
        }
        return ahorroAcum;
    }

    // --- CARGA DE DATOS CENTRAL ---
    function cargarDatosCentral() {
        const filtroMesAnioIngreso = document.getElementById("filtroMesAnioIngreso");
        let valorPeriodo = "2026-01";
        
        if (filtroMesAnioIngreso && filtroMesAnioIngreso.value) {
            valorPeriodo = filtroMesAnioIngreso.value;
        }

        const partes = valorPeriodo.split("-");
        const anioSelect = partes[0];
        
        const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
        const indiceMes = parseInt(partes[1], 10) - 1;
        const mesSelect = mesesNombres[indiceMes] || "ENERO";
        
        const urlConFiltros = `${window.API_URL}?anio=${anioSelect}&mes=${mesSelect}`;

        fetch(urlConFiltros)
            .then(res => res.json())
            .then(data => {
                window.apiCache.gasto = data.gasto || [];
                window.apiCache.detalleGasto = data.detalleGasto || [];
                window.apiCache.registroGasto = data.registroGasto || [];
                window.apiCache.ingresos = data.ingresos || [];
                window.apiCache.inversiones = data.inversiones || [];

                renderizarTablaTipos();

                if (typeof window.renderizarModuloDetalles === "function") window.renderizarModuloDetalles();
                if (typeof window.renderizarModuloRegistroGastos === "function") window.renderizarModuloRegistroGastos();
                if (typeof window.renderizarModuloIngresos === "function") window.renderizarModuloIngresos();
                if (typeof window.renderizarModuloInversiones === "function") window.renderizarModuloInversiones();

                if (window.apiCache._anioActual !== anioSelect) {
                    window.apiCache._anioActual = anioSelect;
                    window.apiCache.registroGastoAnual = null;
                    cargarGastosAnuales(anioSelect);
                }
            })
            .catch(error => {
                console.error("Error al cargar:", error);
                if (tablaGastos) {
                    tablaGastos.innerHTML = `<tr><td colspan="3" class="text-center" style="color:red;">Fallo de comunicación con el servidor.</td></tr>`;
                }
            });
    }

    function cargarGastosAnuales(anio, callback) {
        const urlCompleta = `${window.API_URL}?anio=${anio}&modo=completo`;
        fetch(urlCompleta)
            .then(res => res.json())
            .then(data => {
                window.apiCache.registroGastoAnual = data.registroGasto || [];
                if (callback) {
                    callback();
                } else if (typeof window.renderizarModuloIngresos === "function") {
                    window.renderizarModuloIngresos();
                }
            })
            .catch(err => {
                console.error("Error al cargar gastos anuales:", err);
                window.apiCache.registroGastoAnual = [];
                if (callback) callback();
            });
    }

    function renderizarTablaTipos() {
        if (!tablaGastos) return;
        tablaGastos.innerHTML = "";
        const listaTipos = window.apiCache.gasto || [];

        if (listaTipos.length === 0) {
            tablaGastos.innerHTML = `<tr><td colspan="3" class="text-center">No se encontraron tipos de gasto registrados.</td></tr>`;
            return;
        }

        listaTipos.forEach(item => {
            const fila = document.createElement("tr");

            const celdaId = document.createElement("td");
            celdaId.textContent = item.idGasto;
            fila.appendChild(celdaId);

            const celdaNombre = document.createElement("td");
            celdaNombre.innerHTML = `<span class="badge-tipo">${item.nombreGasto}</span>`;
            fila.appendChild(celdaNombre);

            const celdaAcciones = document.createElement("td");
            celdaAcciones.className = "text-center";

            const btnEditar = document.createElement("button");
            btnEditar.textContent = "Editar";
            btnEditar.className = "btn-action-edit";
            btnEditar.addEventListener("click", () => prepararEdicionTipo(item.idGasto, item.nombreGasto));

            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "Eliminar";
            btnEliminar.className = "btn-action-delete";
            btnEliminar.addEventListener("click", () => eliminarRegistroTipo(item.idGasto));

            celdaAcciones.appendChild(btnEditar);
            celdaAcciones.appendChild(btnEliminar);
            fila.appendChild(celdaAcciones);

            tablaGastos.appendChild(fila);
        });
    }

    function guardarRegistroTipo() {
        const nombre = inputNombre.value.trim().toUpperCase();
        const id = inputIdOculto.value;

        if (!nombre) {
            alert("Por favor, ingrese un tipo de gasto válido.");
            return;
        }

        let payload = { 
            target: "gasto", 
            action: "create", 
            nombreGasto: nombre 
        };
        
        if (id) { 
            payload.action = "update"; 
            payload.idGasto = id; 
        }

        btnGuardar.disabled = true;
        fetch(window.API_URL, { 
            method: "POST", 
            mode: "cors", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload) 
        })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") { 
                restablecerFormularioTipo(); 
                cargarDatosCentral(); 
            } else {
                alert("Error de procesamiento: " + result.message);
            }
        })
        .catch(err => console.error("Error en la operation del tipo de gasto:", err))
        .finally(() => btnGuardar.disabled = false);
    }

    function eliminarRegistroTipo(id) {
        if (!confirm(`¿Está seguro de eliminar permanentemente el tipo de gasto ${id}?`)) return;
        
        fetch(window.API_URL, { 
            method: "POST", 
            mode: "cors", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target: "gasto", action: "delete", id: id }) 
        })
        .then(res => res.json())
        .then(res => {
            if (res.status === "success") {
                cargarDatosCentral();
            } else {
                alert("No se pudo eliminar el elemento: " + res.message);
            }
        });
    }

    function prepararEdicionTipo(id, nombre) {
        if (inputIdOculto) inputIdOculto.value = id;
        if (inputNombre) {
            inputNombre.value = nombre;
            inputNombre.focus();
        }
        if (btnGuardar) {
            btnGuardar.textContent = "Actualizar Tipo";
            btnGuardar.className = "btn-edit-mode";
        }
    }

    function restablecerFormularioTipo() {
        if (inputIdOculto) inputIdOculto.value = "";
        if (inputNombre) inputNombre.value = "";
        if (btnGuardar) {
            btnGuardar.textContent = "Guardar Tipo";
            btnGuardar.className = "btn-add";
        }
    }

    window.calcularAhorroHasta = calcularAhorroHasta;
})();