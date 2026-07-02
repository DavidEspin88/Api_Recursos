(() => {
    // Componentes interactivos de la sección de ingresos
    const fechaIngreso = document.getElementById("fechaIngreso");
    const nombreIngreso = document.getElementById("nombreIngreso");
    const montoIngreso = document.getElementById("montoIngreso");
    const btnRegistrarIngreso = document.getElementById("btnRegistrarIngreso");
    const totalMontoIngresos = document.getElementById("totalMontoIngresos");
    const balanceNetoMensual = document.getElementById("balanceNetoMensual");
    const ahorroMesElement = document.getElementById("ahorroMes");
    const tablaIngresosCuerpo = document.getElementById("tablaIngresosCuerpo");
    const filtroMesAnioIngreso = document.getElementById("filtroMesAnioIngreso");

    // Subformulario rápido de fuentes de ingresos
    const btnIngRapidoAdd = document.getElementById("btnIngRapidoAdd");
    const btnIngRapidoEdit = document.getElementById("btnIngRapidoEdit");
    const btnIngRapidoDelete = document.getElementById("btnIngRapidoDelete");
    const subFormFuenteRapida = document.getElementById("subFormFuenteRapida");
    const rapidoIdFuente = document.getElementById("rapidoIdFuente");
    const rapidoInputFuente = document.getElementById("rapidoInputFuente");
    const btnFuenteCancelar = document.getElementById("btnFuenteCancelar");
    const btnFuenteGuardar = document.getElementById("btnFuenteGuardar");

    // Escuchas reactivas
    btnRegistrarIngreso.addEventListener("click", registrarNuevoIngresoMovimiento);
    nombreIngreso.addEventListener("change", gestionarBotonesFuenteVisuales);

    filtroMesAnioIngreso.addEventListener("change", () => {
        if (typeof window.cargarDatosCentral === "function") {
            window.cargarDatosCentral();
        }
    });

    btnIngRapidoAdd.addEventListener("click", () => abrirSubFormFuente(false));
    btnIngRapidoEdit.addEventListener("click", () => abrirSubFormFuente(true));
    btnIngRapidoDelete.addEventListener("click", eliminarFuenteCatalogo);
    btnFuenteCancelar.addEventListener("click", cerrarSubFormFuente);
    btnFuenteGuardar.addEventListener("click", guardarFuenteCatalogo);

    window.renderizarModuloIngresos = function () {
        const data = window.apiCache;

        // Indicador de carga
        ahorroMesElement.textContent = "...";

        const partesFiltro = filtroMesAnioIngreso.value.split("-");
        const anioFiltroNum = parseInt(partesFiltro[0], 10);
        const mesFiltroNum = parseInt(partesFiltro[1], 10);

        const fuenteSeleccionada = nombreIngreso.value;
        nombreIngreso.innerHTML = `<option value="">-- Seleccione Fuente --</option>`;

        const fuentesCatalogo = (data.detalleGasto || []).filter(d => d.idGasto === "INGRESOS_CAT" && d.estado !== "INACTIVO");
        fuentesCatalogo.forEach(f => {
            nombreIngreso.innerHTML += `<option value="${f.idDetalleGasto}">${f.nombreGasto}</option>`;
        });
        nombreIngreso.value = fuenteSeleccionada;
        gestionarBotonesFuenteVisuales();

        tablaIngresosCuerpo.innerHTML = "";
        let sumatoriaIngresos = 0;

        const listaIngresos = data.ingresos || [];
        const ingresosFiltrados = listaIngresos.filter(ing => {
            let fechaAnalizar = ing.fecha;
            if (ing.mesAnio && ing.mesAnio.includes("-")) {
                fechaAnalizar = ing.mesAnio;
            }
            if (!fechaAnalizar) return false;

            const partes = fechaAnalizar.split(/[-/]/);
            if (partes.length < 2) return false;

            let regAnio = 0;
            let regMes = 0;

            if (partes[0].length === 4) {
                regAnio = parseInt(partes[0], 10);
                regMes = parseInt(partes[1], 10);
            } else if (partes[2] && partes[2].length === 4) {
                regAnio = parseInt(partes[2], 10);
                regMes = parseInt(partes[1], 10);
            }

            return regAnio === anioFiltroNum && regMes === mesFiltroNum;
        });

        if (ingresosFiltrados.length === 0) {
            tablaIngresosCuerpo.innerHTML = `<tr><td colspan="5" class="text-center" style="font-style:italic; padding:15px;">No existen ingresos registrados en este mes (${filtroMesAnioIngreso.value}).</td></tr>`;
        } else {
            ingresosFiltrados.forEach(ing => {
                const valorMonto = parseFloat(ing.monto) || 0;
                sumatoriaIngresos += valorMonto;

                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td><strong>${ing.idIngreso}</strong></td>
                    <td>${ing.fecha}</td>
                    <td>${ing.nombre}</td>
                    <td class="text-right" style="font-weight:bold; color:#234e52;">$ ${window.formatearMoneda(valorMonto)}</td>
                    <td class="text-center"></td>
                `;

                const btnEliminar = document.createElement("button");
                btnEliminar.className = "btn-action-delete";
                btnEliminar.textContent = "Eliminar";
                btnEliminar.addEventListener("click", () => eliminarIngresoRegistroFila(ing.idIngreso));

                fila.children[4].appendChild(btnEliminar);
                tablaIngresosCuerpo.appendChild(fila);
            });
        }

        totalMontoIngresos.textContent = `$ ${window.formatearMoneda(sumatoriaIngresos)}`;

        let sumatoriaGastos = 0;
        const listaGastos = data.registroGasto || [];

        listaGastos.forEach(g => {
            if (!g.fecha) return;
            const partesGasto = g.fecha.split(/[-/]/);
            if (partesGasto.length < 2) return;

            let gastoAnio = 0;
            let gastoMes = 0;

            if (partesGasto[0].length === 4) {
                gastoAnio = parseInt(partesGasto[0], 10);
                gastoMes = parseInt(partesGasto[1], 10);
            } else if (partesGasto[2] && partesGasto[2].length === 4) {
                gastoAnio = parseInt(partesGasto[2], 10);
                gastoMes = parseInt(partesGasto[1], 10);
            }

            if (gastoAnio === anioFiltroNum && gastoMes === mesFiltroNum) {
                sumatoriaGastos += (parseFloat(g.monto) || 0);
            }
        });

        const saldoNeto = sumatoriaIngresos - sumatoriaGastos;
        balanceNetoMensual.textContent = `$ ${window.formatearMoneda(saldoNeto)}`;
        balanceNetoMensual.style.color = (saldoNeto >= 0) ? "#2f855a" : "#e53e3e";

        const ingresosTodos = data.ingresos || [];
        const gastosAnuales = data.registroGastoAnual;

        if (gastosAnuales === null) {
            ahorroMesElement.textContent = "...";
            ahorroMesElement.style.color = "var(--text-muted)";
        } else {
            let ahorroAcumulado = 0;
            for (let m = 1; m <= mesFiltroNum; m++) {
                const mesStr = String(m).padStart(2, '0');
                const inicioMes = `${anioFiltroNum}-${mesStr}-01`;
                const finMes = `${anioFiltroNum}-${mesStr}-31`;

                const ingMes = ingresosTodos.filter(ing => ing.fecha >= inicioMes && ing.fecha <= finMes);
                const gastosMes = gastosAnuales.filter(g => g.fecha >= inicioMes && g.fecha <= finMes);
                const totalIngMes = ingMes.reduce((sum, ing) => sum + (ing.monto || 0), 0);
                const totalGastosMes = gastosMes.reduce((sum, g) => sum + (g.monto || 0), 0);
                ahorroAcumulado += (totalIngMes - totalGastosMes);
            }

            ahorroMesElement.textContent = `$ ${window.formatearMoneda(ahorroAcumulado)}`;
            ahorroMesElement.style.color = (ahorroAcumulado >= 0) ? "#d69e2e" : "#e53e3e";
        }
    };

    function gestionarBotonesFuenteVisuales() {
        const container = nombreIngreso.closest('.flex-row');
        // Asegurarnos que el contenedor padre de los botones sea un flex-row
        const parentContainer = nombreIngreso.parentElement;

        if (nombreIngreso.value) {
            btnIngRapidoEdit.style.display = "block";
            btnIngRapidoDelete.style.display = "block";
            // Aplicar estilo para botones en fila encima
            container.classList.add('actions-inline-top');
        } else {
            btnIngRapidoEdit.style.display = "none";
            btnIngRapidoDelete.style.display = "none";
            // Revertir
            container.classList.remove('actions-inline-top');
        }
    }

    function abrirSubFormFuente(esEdicion) {
        // Mover el formulario antes del contenedor padre del select
        const container = nombreIngreso.closest('.flex-column');
        container.insertBefore(subFormFuenteRapida, container.firstChild);

        if (esEdicion) {
            rapidoIdFuente.value = nombreIngreso.value;
            rapidoInputFuente.value = nombreIngreso.options[nombreIngreso.selectedIndex].text;
            btnFuenteGuardar.textContent = "Actualizar";
        } else {
            rapidoIdFuente.value = "";
            rapidoInputFuente.value = "";
            btnFuenteGuardar.textContent = "Crear";
        }
        subFormFuenteRapida.style.display = "block";
        rapidoInputFuente.focus();
    }

    function cerrarSubFormFuente() {
        subFormFuenteRapida.style.display = "none";
        rapidoIdFuente.value = "";
        rapidoInputFuente.value = "";
    }

    function guardarFuenteCatalogo() {
        const nombreFuente = rapidoInputFuente.value.trim().toUpperCase();
        const idFuente = rapidoIdFuente.value;

        if (!nombreFuente) return alert("Ingrese un nombre de fuente válido.");

        let payload = {
            target: "detalle_gasto",
            action: "create",
            idGasto: "INGRESOS_CAT",
            nombreGasto: nombreFuente
        };

        if (idFuente) {
            payload.action = "update";
            payload.idDetalleGasto = idFuente;
        }

        btnFuenteGuardar.disabled = true;
        fetch(window.API_URL, { method: "POST", mode: "cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
            .then(res => res.json())
            .then(result => {
                if (result.status === "success") {
                    cerrarSubFormFuente();
                    if (typeof window.cargarDatosCentral === "function") {
                        window.cargarDatosCentral();
                    }
                } else alert(result.message);
            })
            .finally(() => btnFuenteGuardar.disabled = false);
    }

    function eliminarFuenteCatalogo() {
        const idFuente = nombreIngreso.value;
        if (!idFuente) return;
        if (!confirm("¿Desea eliminar esta fuente del catálogo?")) return;

        fetch(window.API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target: "detalle_gasto", action: "delete", id: idFuente })
        })
            .then(res => res.json())
            .then(r => {
                if (r.status === "success") {
                    if (typeof window.cargarDatosCentral === "function") {
                        window.cargarDatosCentral();
                    }
                } else alert("Aviso: " + r.message);
            });
    }

    function registrarNuevoIngresoMovimiento() {
        const fecha = fechaIngreso.value;
        const fuenteId = nombreIngreso.value;
        const fuenteTexto = nombreIngreso.selectedIndex >= 0 ? nombreIngreso.options[nombreIngreso.selectedIndex].text : "";
        const monto = parseFloat(montoIngreso.value);

        if (!fecha || !fuenteId || isNaN(monto) || monto <= 0) {
            return alert("Por favor, complete todos los campos de ingreso.");
        }

        const payload = {
            target: "ingresos",
            action: "create",
            fecha: fecha,
            nombre: fuenteTexto,
            monto: monto
        };

        btnRegistrarIngreso.disabled = true;
        fetch(window.API_URL, { method: "POST", mode: "cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
            .then(res => res.json())
            .then(result => {
                if (result.status === "success") {
                    fechaIngreso.value = "";
                    montoIngreso.value = "";
                    if (typeof window.cargarDatosCentral === "function") {
                        window.cargarDatosCentral();
                    }
                } else alert(result.message);
            })
            .finally(() => btnRegistrarIngreso.disabled = false);
    }

    function eliminarIngresoRegistroFila(id) {
        if (!confirm(`¿Desea eliminar el registro de ingreso ${id}?`)) return;
        fetch(window.API_URL, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target: "ingresos", action: "delete", id: id })
        })
            .then(res => res.json())
            .then(() => {
                if (typeof window.cargarDatosCentral === "function") {
                    window.cargarDatosCentral();
                }
            });
    }
})();