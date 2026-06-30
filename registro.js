(() => {
    // REEMPLAZA CON TU URL SI ES DIFERENTE (misma Web App de Google Apps Script)
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwjpL9sc5LArWMyC8yMprHmfjdhOPnanlKS5hy26WzWsuSOfdcnpGS6ZE4KCCvYe5wx/exec";

    // Elementos del DOM
    const inputFecha = document.getElementById("fechaRegistro");
    const selectTipoGasto = document.getElementById("tipoGastoRegistro");
    const contenedorDetalle = document.getElementById("contenedorDetalleRegistro");
    const inputMonto = document.getElementById("montoRegistro");
    const btnRegistrar = document.getElementById("btnRegistrarGasto");
    const tablaRegistros = document.getElementById("tablaRegistroGastos");
    const resumenGlobal = document.getElementById("resumenGlobal");
    const resumenPorTipo = document.getElementById("resumenPorTipo");

    // Caché en memoria de los catálogos para no repetir peticiones innecesarias
    let cacheCatalogoGastos = [];
    let cacheCatalogoDetalles = [];
    let cacheRegistros = [];

    document.addEventListener("DOMContentLoaded", inicializar);
    btnRegistrar.addEventListener("click", registrarGasto);
    selectTipoGasto.addEventListener("change", actualizarCampoDetalle);

    function inicializar() {
        fetch(WEB_APP_URL)
            .then(response => {
                if (!response.ok) throw new Error("Error de red al intentar conectar.");
                return response.json();
            })
            .then(data => {
                cacheCatalogoGastos = data.gasto || [];
                cacheCatalogoDetalles = data.detalleGasto || data.detalle || [];
                cacheRegistros = data.registroGasto || [];

                poblarSelectTipoGasto();
                actualizarCampoDetalle();
                renderizarTablaRegistros();
                renderizarResumen();
            })
            .catch(error => {
                console.error("Error al inicializar Registro de Gastos:", error);
                tablaRegistros.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error al cargar los catálogos o registros.</td></tr>`;
            });
    }

    // Llena el <select> de Tipo de Gasto con el catálogo "Estructura de Gastos"
    function poblarSelectTipoGasto() {
        selectTipoGasto.innerHTML = `<option value="">-- Seleccione Tipo de Gasto --</option>`;

        if (!cacheCatalogoGastos || cacheCatalogoGastos.length === 0) {
            return;
        }

        cacheCatalogoGastos.forEach(g => {
            const option = document.createElement("option");
            option.value = g.idGasto;
            option.textContent = g.nombreGasto;
            option.dataset.nombre = g.nombreGasto;
            selectTipoGasto.appendChild(option);
        });
    }

    // Determina si el nombre de un tipo de gasto corresponde a "Gasto Fijo"
    function esGastoFijo(nombreGasto) {
        if (!nombreGasto) return false;
        return nombreGasto.toString().toUpperCase().includes("FIJO");
    }

    // Reconstruye el campo "Detalle" según el Tipo de Gasto seleccionado:
    // - Si es Gasto Fijo: <select> con el catálogo de detalles ya creado.
    // - Si es otro tipo: <input type="text"> de texto libre.
    // - Si no hay tipo seleccionado: campo deshabilitado.
    function actualizarCampoDetalle() {
        const opcionSeleccionada = selectTipoGasto.selectedOptions[0];
        const nombreGastoSeleccionado = opcionSeleccionada ? opcionSeleccionada.dataset.nombre : "";

        if (!selectTipoGasto.value) {
            contenedorDetalle.innerHTML = `
                <label style="font-size:12px; font-weight:bold; color:#4a5568; margin-bottom:4px;">Detalle</label>
                <select id="detalleRegistro" disabled style="padding:10px; border-radius:6px; border:1px solid #cbd5e0; background:#edf2f7;">
                    <option value="">-- Seleccione un Tipo de Gasto primero --</option>
                </select>
            `;
            return;
        }

        if (esGastoFijo(nombreGastoSeleccionado)) {
            // Gasto Fijo: desplegable vinculado al catálogo de detalles ya ingresados
            const opciones = cacheCatalogoDetalles
                .map(d => `<option value="${d.nombreGasto}">${d.nombreGasto}</option>`)
                .join("");

            contenedorDetalle.innerHTML = `
                <label style="font-size:12px; font-weight:bold; color:#4a5568; margin-bottom:4px;">Detalle (catálogo Gasto Fijo)</label>
                <select id="detalleRegistro" style="padding:10px; border-radius:6px; border:1px solid #cbd5e0; background:white;">
                    <option value="">-- Seleccione Detalle --</option>
                    ${opciones}
                </select>
            `;

            if (cacheCatalogoDetalles.length === 0) {
                const select = document.getElementById("detalleRegistro");
                select.insertAdjacentHTML("beforeend", `<option value="" disabled>No hay detalles registrados aún</option>`);
            }
        } else {
            // Cualquier otro tipo de gasto: texto libre
            contenedorDetalle.innerHTML = `
                <label style="font-size:12px; font-weight:bold; color:#4a5568; margin-bottom:4px;">Detalle</label>
                <input type="text" id="detalleRegistro" placeholder="Escriba el detalle del gasto..." style="padding:10px; border-radius:6px; border:1px solid #cbd5e0;">
            `;
        }
    }

    function registrarGasto() {
        const fecha = inputFecha.value;
        const opcionTipo = selectTipoGasto.selectedOptions[0];
        const idGasto = selectTipoGasto.value;
        const nombreGasto = opcionTipo ? opcionTipo.dataset.nombre : "";
        const campoDetalle = document.getElementById("detalleRegistro");
        const detalleGasto = campoDetalle ? campoDetalle.value.trim() : "";
        const monto = parseFloat(inputMonto.value);

        if (!fecha) {
            alert("Por favor, seleccione una fecha.");
            return;
        }
        if (!idGasto) {
            alert("Por favor, seleccione un tipo de gasto.");
            return;
        }
        if (!detalleGasto) {
            alert("Por favor, complete el detalle del gasto.");
            return;
        }
        if (isNaN(monto) || monto <= 0) {
            alert("Por favor, ingrese un monto válido mayor a 0.");
            return;
        }

        const payload = {
            target: "registro_gasto",
            action: "create",
            fecha: fecha,
            idGasto: idGasto,
            nombreGasto: nombreGasto,
            detalleGasto: detalleGasto,
            monto: monto
        };

        btnRegistrar.disabled = true;
        btnRegistrar.textContent = "Guardando...";

        fetch(WEB_APP_URL, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                alert(result.message || "Registro guardado correctamente.");
                restablecerFormulario();
                inicializar(); // Recarga catálogos, tabla y resúmenes
            } else {
                alert("Error al guardar: " + result.message);
            }
        })
        .catch(err => {
            console.error("Error:", err);
            alert("Error de red al registrar el gasto.");
        })
        .finally(() => {
            btnRegistrar.disabled = false;
            btnRegistrar.textContent = "Registrar Gasto";
        });
    }

    function eliminarRegistroGasto(id) {
        if (!confirm(`¿Está seguro de eliminar permanentemente el registro con ID: ${id}?`)) return;

        const payload = {
            target: "registro_gasto",
            action: "delete",
            id: id
        };

        fetch(WEB_APP_URL, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                alert(result.message || "Registro eliminado.");
                inicializar();
            } else {
                alert("Error al eliminar: " + result.message);
            }
        })
        .catch(err => console.error("Error:", err));
    }

    function restablecerFormulario() {
        inputFecha.value = "";
        selectTipoGasto.value = "";
        inputMonto.value = "";
        actualizarCampoDetalle();
    }

    // Pinta la tabla de detalle con todos los registros ingresados
    function renderizarTablaRegistros() {
        tablaRegistros.innerHTML = "";

        if (!cacheRegistros || cacheRegistros.length === 0) {
            tablaRegistros.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay registros de gastos ingresados aún.</td></tr>`;
            return;
        }

        cacheRegistros.forEach(registro => {
            const fila = document.createElement("tr");
            const montoNumerico = parseFloat(registro.monto) || 0;

            fila.innerHTML = `
                <td>${registro.fecha || "-"}</td>
                <td><strong>${registro.nombreGasto || "-"}</strong></td>
                <td>${registro.detalleGasto || "-"}</td>
                <td style="text-align:right; font-weight:600;">${montoNumerico.toFixed(2)}</td>
                <td style="text-align:center;">
                    <button class="btn-action-delete btn-borrar-registro">Borrar</button>
                </td>
            `;

            fila.querySelector(".btn-borrar-registro").addEventListener("click", () => {
                eliminarRegistroGasto(registro.idRegistro || registro.id);
            });

            tablaRegistros.appendChild(fila);
        });
    }

    // Calcula y pinta el resumen global y el resumen agrupado por tipo de gasto
    function renderizarResumen() {
        if (!cacheRegistros || cacheRegistros.length === 0) {
            resumenGlobal.textContent = "$0.00";
            resumenPorTipo.innerHTML = `<tr><td colspan="2" style="text-align:center;">Sin registros aún.</td></tr>`;
            return;
        }

        let totalGlobal = 0;
        const totalesPorTipo = {};

        cacheRegistros.forEach(registro => {
            const monto = parseFloat(registro.monto) || 0;
            const tipo = registro.nombreGasto || "Sin tipo";

            totalGlobal += monto;
            totalesPorTipo[tipo] = (totalesPorTipo[tipo] || 0) + monto;
        });

        resumenGlobal.textContent = `$${totalGlobal.toFixed(2)}`;

        resumenPorTipo.innerHTML = "";
        Object.keys(totalesPorTipo).forEach(tipo => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td><strong>${tipo}</strong></td>
                <td style="text-align:right; font-weight:bold; color:#117a65;">$${totalesPorTipo[tipo].toFixed(2)}</td>
            `;
            resumenPorTipo.appendChild(fila);
        });
    }
})();