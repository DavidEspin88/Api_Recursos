(() => {
    // Captura de elementos del DOM de la Sección 4
    const tipoGastoRegistro = document.getElementById("tipoGastoRegistro");
    const detalleRegistro = document.getElementById("detalleRegistro");
    const buscarDetalleTransaccion = document.getElementById("buscarDetalleTransaccion");
    const fechaRegistro = document.getElementById("fechaRegistro");
    const montoRegistro = document.getElementById("montoRegistro");
    const btnRegistrarGasto = document.getElementById("btnRegistrarGasto");

    const tablaRegistroGastos = document.getElementById("tablaRegistroGastos");
    const resumenGlobal = document.getElementById("resumenGlobal");
    const resumenPorTipo = document.getElementById("resumenPorTipo");

    // Subformulario rápido de categorías
    const btnRapidoAdd = document.getElementById("btnRapidoAdd");
    const btnRapidoEdit = document.getElementById("btnRapidoEdit");
    const btnRapidoDelete = document.getElementById("btnRapidoDelete");
    const subFormCategoriaRapida = document.getElementById("subFormCategoriaRapida");
    const rapidoIdDetalle = document.getElementById("rapidoIdDetalle");
    const rapidoInputNombre = document.getElementById("rapidoInputNombre");
    const btnRapidoCancelar = document.getElementById("btnRapidoCancelar");
    const btnRapidoGuardar = document.getElementById("btnRapidoGuardar");

    // Asignación de Event Listeners
    if (btnRegistrarGasto) btnRegistrarGasto.addEventListener("click", crearTransaccionGasto);
    if (tipoGastoRegistro) tipoGastoRegistro.addEventListener("change", filtrarCategoriasSegunTipo);
    if (buscarDetalleTransaccion) buscarDetalleTransaccion.addEventListener("input", filtrarPorBusquedaTexto);
    if (detalleRegistro) detalleRegistro.addEventListener("change", gestionarVisibilidadBotonesEdicion);

    if (btnRapidoAdd) btnRapidoAdd.addEventListener("click", () => abrirSubFormGastos(false));
    if (btnRapidoEdit) btnRapidoEdit.addEventListener("click", () => abrirSubFormGastos(true));
    if (btnRapidoDelete) btnRapidoDelete.addEventListener("click", ejecutarEliminacionRapidaCategoria);
    if (btnRapidoCancelar) btnRapidoCancelar.addEventListener("click", cerrarSubFormGastos);
    if (btnRapidoGuardar) btnRapidoGuardar.addEventListener("click", ejecutarGuardadoRapidoCategoria);

    // Exponer función de renderizado de forma global
    window.renderizarModuloRegistroGastos = function() {
        const data = window.apiCache;

        const filtroMesAnio = document.getElementById("filtroMesAnioIngreso").value;
        const partesFiltro = filtroMesAnio.split("-");
        const anioFiltroNum = parseInt(partesFiltro[0], 10);
        const mesFiltroNum = parseInt(partesFiltro[1], 10);

        const valorSeleccionado = tipoGastoRegistro.value;
        tipoGastoRegistro.innerHTML = `<option value="">-- Seleccione --</option>`;
        (data.gasto || []).forEach(g => {
            tipoGastoRegistro.innerHTML += `<option value="${g.idGasto}">${g.nombreGasto}</option>`;
        });
        tipoGastoRegistro.value = valorSeleccionado;
        
        filtrarCategoriasSegunTipo();

        tablaRegistroGastos.innerHTML = "";
        let totalAcumulado = 0;
        let totalesPorTipo = {};

        const todosLosRegistros = data.registroGasto || [];
        
        const registrosFiltrados = todosLosRegistros.filter(g => {
            if (!g.fecha) return false;
            const partesGasto = g.fecha.split(/[-/]/);
            if (partesGasto.length < 2) return false;

            let gastoAnio = 0;
            let gastoMes = 0;

            if (partesGasto[0].length === 4) {
                gastoAnio = parseInt(partesGasto[0], 10);
                gastoMes = parseInt(partesGasto[1], 10);
            } else if (partesGasto[2] && partesGasto[2].length === 4) {
                gastoAnio = parseInt(partesGasto[2], 10);
                gastoMes = parseInt(partesGasto[1], 10);
            }

            return gastoAnio === anioFiltroNum && gastoMes === mesFiltroNum;
        });

        if (registrosFiltrados.length === 0) {
            tablaRegistroGastos.innerHTML = `<tr><td colspan="5" class="text-center">Sin movimientos registrados en este mes (${filtroMesAnio}).</td></tr>`;
        } else {
            registrosFiltrados.forEach(r => {
                const valorMonto = parseFloat(r.monto) || 0;
                totalAcumulado += valorMonto;
                totalesPorTipo[r.nombreGasto] = (totalesPorTipo[r.nombreGasto] || 0) + valorMonto;

                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${r.fecha}</td>
                    <td><span class="badge-tipo">${r.nombreGasto}</span></td>
                    <td>${r.detalleGasto}</td>
                    <td class="text-right" style="font-weight:bold;">$ ${window.formatearMoneda(valorMonto)}</td>
                    <td class="text-center"></td>
                `;

                const btnEliminar = document.createElement("button");
                btnEliminar.className = "btn-action-delete";
                btnEliminar.textContent = "Eliminar";
                btnEliminar.addEventListener("click", () => window.eliminarTransaccionGasto(r.idRegistro));
                
                fila.children[4].appendChild(btnEliminar);
                tablaRegistroGastos.appendChild(fila);
            });
        }

        resumenGlobal.textContent = `$ ${window.formatearMoneda(totalAcumulado)}`;
        resumenPorTipo.innerHTML = "";
        
        if (Object.keys(totalesPorTipo).length === 0) {
            resumenPorTipo.innerHTML = `<tr><td colspan="2" class="text-center">Sin cómputos acumulados.</td></tr>`;
        } else {
            for (let t in totalesPorTipo) {
                resumenPorTipo.innerHTML += `<tr><td><strong>${t}</strong></td><td class="text-right" style="color:#2c3e50; font-weight:bold;">$ ${window.formatearMoneda(totalesPorTipo[t])}</td></tr>`;
            }
        }
    };

    function filtrarCategoriasSegunTipo() {
        const idGastoBuscado = tipoGastoRegistro.value;
        const valorDetallePrevio = detalleRegistro.value;
        detalleRegistro.innerHTML = "";
        buscarDetalleTransaccion.value = "";
        cerrarSubFormGastos();

        if (!idGastoBuscado) {
            detalleRegistro.disabled = true;
            detalleRegistro.classList.add("bg-disabled");
            buscarDetalleTransaccion.style.display = "none";
            detalleRegistro.innerHTML = `<option value="">-- Seleccione un Tipo de Gasto primero --</option>`;
            ocultarBotonesCrudRapido();
            return;
        }

        const tipoObjeto = window.apiCache.gasto.find(g => g.idGasto && g.idGasto.toString().toUpperCase().trim() === idGastoBuscado.toUpperCase().trim());
        const textoNombreGasto = tipoObjeto ? tipoObjeto.nombreGasto.toUpperCase().trim() : "";

        const categoriasFiltradas = (window.apiCache.detalleGasto || []).filter(d => {
            if (!d.idGasto) return false;
            const coincideId = d.idGasto.toString().toUpperCase().trim() === idGastoBuscado.toUpperCase().trim();
            const coincideNombre = d.idGasto.toString().toUpperCase().trim() === textoNombreGasto; 
            return (coincideId || coincideNombre) && d.estado !== "INACTIVO";
        });

        detalleRegistro.disabled = false;
        detalleRegistro.classList.remove("bg-disabled");
        buscarDetalleTransaccion.style.display = "block"; 

        btnRapidoAdd.style.display = "block";

        detalleRegistro.innerHTML = `<option value="">-- Seleccione Categoría --</option>`;
        categoriasFiltradas.forEach(c => {
            detalleRegistro.innerHTML += `<option value="${c.idDetalleGasto}">${c.nombreGasto}</option>`;
        });

        detalleRegistro.value = valorDetallePrevio;
        gestionarVisibilidadBotonesEdicion();
    }

    function gestionarVisibilidadBotonesEdicion() {
        if (detalleRegistro && detalleRegistro.value) {
            if (btnRapidoEdit) btnRapidoEdit.style.display = "block";
            if (btnRapidoDelete) btnRapidoDelete.style.display = "block";
        } else {
            if (btnRapidoEdit) btnRapidoEdit.style.display = "none";
            if (btnRapidoDelete) btnRapidoDelete.style.display = "none";
        }
    }

    function ocultarBotonesCrudRapido() {
        if (btnRapidoAdd) btnRapidoAdd.style.display = "none";
        if (btnRapidoEdit) btnRapidoEdit.style.display = "none";
        if (btnRapidoDelete) btnRapidoDelete.style.display = "none";
    }

    function abrirSubFormGastos(esEdicion) {
        if (esEdicion) {
            rapidoIdDetalle.value = detalleRegistro.value;
            rapidoInputNombre.value = detalleRegistro.options[detalleRegistro.selectedIndex].text;
            btnRapidoGuardar.textContent = "Actualizar";
        } else {
            rapidoIdDetalle.value = "";
            rapidoInputNombre.value = "";
            btnRapidoGuardar.textContent = "Crear";
        }
        subFormCategoriaRapida.style.display = "block";
        rapidoInputNombre.focus();
    }

    function cerrarSubFormGastos() {
        subFormCategoriaRapida.style.display = "none";
        rapidoIdDetalle.value = "";
        rapidoInputNombre.value = "";
    }  

    function ejecutarGuardadoRapidoCategoria() {
        const nombre = rapidoInputNombre.value.trim().toUpperCase();
        const idGastoSelect = tipoGastoRegistro.value;
        const idDetalle = rapidoIdDetalle.value;

        if (!nombre) return alert("Ingrese un nombre de categoría válido.");

        let payload = {
            target: "detalle_gasto",
            action: "create",
            idGasto: idGastoSelect,
            nombreGasto: nombre
        };

        if (idDetalle) {
            payload.action = "update";
            payload.idDetalleGasto = idDetalle;
        }

        btnRapidoGuardar.disabled = true;
        fetch(window.WEB_APP_URL, { method: "POST", mode: "cors", body: JSON.stringify(payload) })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                cerrarSubFormGastos();
                if (typeof window.cargarDatosCentral === "function") {
                    window.cargarDatosCentral();
                }
            } else alert(result.message);
        })
        .finally(() => btnRapidoGuardar.disabled = false);
    }

    function ejecutarEliminacionRapidaCategoria() {
        const idDetalle = detalleRegistro.value;
        if (!idDetalle) return;
        if (!confirm("¿Desea eliminar esta categoría permanentemente?")) return;

        fetch(window.WEB_APP_URL, { 
            method: "POST", 
            body: JSON.stringify({ target: "detalle_gasto", action: "delete", id: idDetalle }) 
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

    function filtrarPorBusquedaTexto() {
        const textoInput = buscarDetalleTransaccion.value.toLowerCase();
        const opciones = detalleRegistro.options;
        for (let i = 1; i < opciones.length; i++) {
            opciones[i].style.display = opciones[i].text.toLowerCase().includes(textoInput) ? "" : "none";
        }
    }

    function crearTransaccionGasto() {
        const fecha = fechaRegistro.value;
        const tipoGasto = tipoGastoRegistro.value;
        const detalleId = detalleRegistro.value;
        const detalleTexto = detalleRegistro.options[detalleRegistro.selectedIndex] ? detalleRegistro.options[detalleRegistro.selectedIndex].text : "";
        const monto = parseFloat(montoRegistro.value);

        if (!fecha || !tipoGasto || !detalleId || isNaN(monto) || monto <= 0) {
            return alert("Por favor complete todos los campos transaccionales.");
        }

        const tipoObjeto = window.apiCache.gasto.find(g => g.idGasto.toUpperCase().trim() === tipoGasto.toUpperCase().trim());
        const payload = {
            target: "registro_gasto",
            action: "create",
            fecha: fecha,
            idGasto: tipoGasto,
            nombreGasto: tipoObjeto ? tipoObjeto.nombreGasto : (tipoGastoRegistro.options[tipoGastoRegistro.selectedIndex].text || ""),
            detalleGasto: detalleTexto,
            monto: monto
        };

        btnRegistrarGasto.disabled = true;
        fetch(window.WEB_APP_URL, { method: "POST", mode: "cors", body: JSON.stringify(payload) })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                fechaRegistro.value = "";
                montoRegistro.value = "";
                if (typeof window.cargarDatosCentral === "function") {
                    window.cargarDatosCentral();
                }
            } else alert(result.message);
        })
        .finally(() => btnRegistrarGasto.disabled = false);
    }

    function eliminarTransaccionGasto(id) {
        if (!confirm("¿Desea dar de baja este movimiento financiero?")) return;
        const reg = window.apiCache.registroGasto.find(r => r.idRegistro === id);
        
        fetch(window.WEB_APP_URL, { 
            method: "POST", 
            body: JSON.stringify({ 
                target: "registro_gasto", 
                action: "delete", 
                id: id,
                fechaAsociada: reg ? reg.fecha : ""
            }) 
        })
        .then(res => res.json())
        .then(() => {
            if (typeof window.cargarDatosCentral === "function") {
                window.cargarDatosCentral();
            }
        });
    }
    
    window.eliminarTransaccionGasto = eliminarTransaccionGasto;
})();