(() => {
    const tipoGastoRegistro = document.getElementById("tipoGastoRegistro");
    const detalleRegistro = document.getElementById("detalleRegistro");
    const buscarDetalleTransaccion = document.getElementById("buscarDetalleTransaccion");
    const fechaRegistro = document.getElementById("fechaRegistro");
    const montoRegistro = document.getElementById("montoRegistro");
    const btnRegistrarGasto = document.getElementById("btnRegistrarGasto");

    const tablaRegistroGastos = document.getElementById("tablaRegistroGastos");
    const resumenGlobal = document.getElementById("resumenGlobal");
    const resumenPorTipo = document.getElementById("resumenPorTipo");

    // NUEVOS ELEMENTOS COMPONENTES (CRUD rápido en línea)
    const btnRapidoAdd = document.getElementById("btnRapidoAdd");
    const btnRapidoEdit = document.getElementById("btnRapidoEdit");
    const btnRapidoDelete = document.getElementById("btnRapidoDelete");
    const subFormCategoriaRapida = document.getElementById("subFormCategoriaRapida");
    const rapidoIdDetalle = document.getElementById("rapidoIdDetalle");
    const rapidoInputNombre = document.getElementById("rapidoInputNombre");
    const btnRapidoCancelar = document.getElementById("btnRapidoCancelar");
    const btnRapidoGuardar = document.getElementById("btnRapidoGuardar");

    // Listeners operacionales
    btnRegistrarGasto.addEventListener("click", crearTransaccion);
    tipoGastoRegistro.addEventListener("change", filtrarCategoriasSegunTipo);
    buscarDetalleTransaccion.addEventListener("input", filtrarPorBusquedaText);
    detalleRegistro.addEventListener("change", gestionarVisibilidadBotonesEdicion);

    // Listeners del CRUD rápido en línea
    btnRapidoAdd.addEventListener("click", () => abrirSubForm(false));
    btnRapidoEdit.addEventListener("click", () => abrirSubForm(true));
    btnRapidoDelete.addEventListener("click", ejecutarEliminacionRapida);
    btnRapidoCancelar.addEventListener("click", cerrarSubForm);
    btnRapidoGuardar.addEventListener("click", ejecutarGuardadoRapido);

window.renderizarModuloRegistro = function() {
        const data = window.apiCache;

        // Rellenar selector de Tipos de Gasto transaccionales
        const valorSeleccionado = tipoGastoRegistro.value;
        tipoGastoRegistro.innerHTML = `<option value="">-- Seleccione --</option>`;
        (data.gasto || []).forEach(g => {
            tipoGastoRegistro.innerHTML += `<option value="${g.idGasto}">${g.nombreGasto}</option>`;
        });
        tipoGastoRegistro.value = valorSeleccionado;

        // Renderizar Historial de Movimientos
        tablaRegistroGastos.innerHTML = "";
        let totalAcumulado = 0;
        let totalesPorTipo = {};

        const registros = data.registroGasto || [];
        if (registros.length === 0) {
            tablaRegistroGastos.innerHTML = `<tr><td colspan="5" style="text-align:center;">Sin movimientos registrados.</td></tr>`;
        } else {
            registros.forEach(r => {
                totalAcumulado += r.monto;
                totalesPorTipo[r.nombreGasto] = (totalesPorTipo[r.nombreGasto] || 0) + r.monto;

                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${r.fecha}</td>
                    <td><span class="badge-tipo" style="background:#e8f8f5; padding:4px 8px; border-radius:4px; font-weight:bold;">${r.nombreGasto}</span></td>
                    <td>${r.detalleGasto}</td>
                    <td style="text-align:right; font-weight:bold;">$${r.monto.toFixed(2)}</td>
                    <td style="text-align:center;"><button class="btn-action-delete btn-borrar-reg" data-id="${r.idRegistro}">Eliminar</button></td>
                `;
                fila.querySelector(".btn-borrar-reg").addEventListener("click", () => eliminarTransaccion(r.idRegistro));
                tablaRegistroGastos.appendChild(fila);
            });
        }

        // Renderizar Cuadros Analíticos
        resumenGlobal.textContent = `$${totalAcumulado.toFixed(2)}`;
        resumenPorTipo.innerHTML = "";
        if (Object.keys(totalesPorTipo).length === 0) {
            resumenPorTipo.innerHTML = `<tr><td colspan="2" style="text-align:center;">Sin cómputos acumulados.</td></tr>`;
        } else {
            for (let t in totalesPorTipo) {
                resumenPorTipo.innerHTML += `<tr><td><strong>${t}</strong></td><td style="text-align:right; color:#2c3e50; font-weight:bold;">$${totalesPorTipo[t].toFixed(2)}</td></tr>`;
            }
        }
    };

function filtrarCategoriasSegunTipo() {
        const idGastoBuscado = tipoGastoRegistro.value;
        detalleRegistro.innerHTML = "";
        buscarDetalleTransaccion.value = "";
        cerrarSubForm();

        if (!idGastoBuscado) {
            detalleRegistro.disabled = true;
            detalleRegistro.style.background = "#edf2f7";
            buscarDetalleTransaccion.style.display = "none";
            detalleRegistro.innerHTML = `<option value="">-- Seleccione un Tipo de Gasto primero --</option>`;
            ocultarBotonesCrudRapido();
            return;
        }

        const tipoObjeto = window.apiCache.gasto.find(g => g.idGasto === idGastoBuscado);
        const textoNombreGasto = tipoObjeto ? tipoObjeto.nombreGasto.toUpperCase().trim() : "";

        // Filtrado unificado por ID y por Nombre
        const categoriasFiltradas = (window.apiCache.detalleGasto || []).filter(d => {
            const coincideId = d.idGasto.toUpperCase().trim() === idGastoBuscado.toUpperCase().trim();
            const coincideNombre = d.idGasto.toUpperCase().trim() === textoNombreGasto; 
            return (coincideId || coincideNombre) && d.estado !== "INACTIVO";
        });

        // Activación del campo de detalle
        detalleRegistro.disabled = false;
        detalleRegistro.style.background = "white";
        buscarDetalleTransaccion.style.display = "block"; 

        // Mostrar el botón '+' para agregar subcategorías en cualquier tipo de gasto
        btnRapidoAdd.style.display = "block";
        gestionarVisibilidadBotonesEdicion();

        detalleRegistro.innerHTML = `<option value="">-- Seleccione Categoría --</option>`;
        categoriasFiltradas.forEach(c => {
            // Guardamos el ID_DETALLE_GASTO en el 'value' del option para poder editar/borrar con precisión
            detalleRegistro.innerHTML += `<option value="${c.idDetalleGasto}">${c.nombreGasto}</option>`;
        });
    }

  function gestionarVisibilidadBotonesEdicion() {
        const idDetalleSeleccionado = detalleRegistro.value;
        // Solo mostramos editar y eliminar si hay una categoría real seleccionada (no la por defecto vacía)
        if (idDetalleSeleccionado && idDetalleSeleccionado !== "") {
            btnRapidoEdit.style.display = "block";
            btnRapidoDelete.style.display = "block";
        } else {
            btnRapidoEdit.style.display = "none";
            btnRapidoDelete.style.display = "none";
        }
    }

    function ocultarBotonesCrudRapido() {
        btnRapidoAdd.style.display = "none";
        btnRapidoEdit.style.display = "none";
        btnRapidoDelete.style.display = "none";
    }

    // --- ACCIONES INTERNAS DEL CRUD RÁPIDO ---
    function abrirSubForm(esEdicion) {
        if (esEdicion) {
            const idDetalle = detalleRegistro.value;
            const textoNombre = detalleRegistro.options[detalleRegistro.selectedIndex].text;
            rapidoIdDetalle.value = idDetalle;
            rapidoInputNombre.value = textoNombre;
            btnRapidoGuardar.textContent = "Actualizar";
        } else {
            rapidoIdDetalle.value = "";
            rapidoInputNombre.value = "";
            btnRapidoGuardar.textContent = "Crear";
        }
        subFormCategoriaRapida.style.display = "block";
        rapidoInputNombre.focus();
    }

    function cerrarSubForm() {
        subFormCategoriaRapida.style.display = "none";
        rapidoIdDetalle.value = "";
        rapidoInputNombre.value = "";
    }  

    function ejecutarGuardadoRapido() {
        const nombre = rapidoInputNombre.value.trim();
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
                cerrarSubForm();
                // Forzar recarga de datos en cascada simulando el evento inicial del DOM
                location.reload();
            } else {
                alert("Error: " + result.message);
            }
        })
        .finally(() => btnRapidoGuardar.disabled = false);
    }

    function ejecutarEliminacionRapida() {
        const idDetalle = detalleRegistro.value;
        const textoNombre = detalleRegistro.options[detalleRegistro.selectedIndex].text;
        if (!idDetalle) return;

        if (!confirm(`¿Desea eliminar permanentemente la categoría: "${textoNombre}" de la base de datos?`)) return;

        fetch(window.WEB_APP_URL, { 
            method: "POST", 
            body: JSON.stringify({ target: "detalle_gasto", action: "delete", id: idDetalle }) 
        })
        .then(res => res.json())
        .then(r => {
            if (r.status === "success") {
                location.reload();
            } else {
                alert("Aviso: " + r.message);
            }
        });
    }

function filtrarPorBusquedaText() {
        const textoInput = buscarDetalleTransaccion.value.toLowerCase();
        const opciones = detalleRegistro.options;

        for (let i = 1; i < opciones.length; i++) {
            const textoOpcion = opciones[i].text.toLowerCase();
            opciones[i].style.display = textoOpcion.includes(textoInput) ? "" : "none";
        }
    }

function crearTransaccion() {
        const fecha = fechaRegistro.value;
        const tipoGasto = tipoGastoRegistro.value;
        const detalleId = detalleRegistro.value;
        
        // Obtenemos el texto literal de la categoría para mandarlo al registro
        const detalleTexto = detalleRegistro.options[detalleRegistro.selectedIndex] ? 
                             detalleRegistro.options[detalleRegistro.selectedIndex].text : "";
                             
        const monto = parseFloat(montoRegistro.value);

        if (!fecha || !tipoGasto || !detalleId || isNaN(monto) || monto <= 0) {
            return alert("Por favor complete todos los campos transaccionales con valores lógicos.");
        }

        const tipoObjeto = window.apiCache.gasto.find(g => g.idGasto === tipoGasto);
        const payload = {
            target: "registro_gasto",
            action: "create",
            fecha: fecha,
            idGasto: tipoGasto,
            nombreGasto: tipoObjeto ? tipoObjeto.nombreGasto : "",
            detalleGasto: detalleTexto, // Enviamos el nombre de la subcategoría
            monto: monto
        };

        btnRegistrarGasto.disabled = true;
        fetch(window.WEB_APP_URL, { method: "POST", mode: "cors", body: JSON.stringify(payload) })
        .then(res => res.json())
        .then(res => {
            if (res.status === "success") {
                fechaRegistro.value = ""; montoRegistro.value = "";
                tipoGastoRegistro.value = ""; filtrarCategoriasSegunTipo();
                location.reload(); 
            } else alert(res.message);
        })
        .finally(() => btnRegistrarGasto.disabled = false);
    }

function eliminarTransaccion(id) {
        if (!confirm("¿Desea dar de baja este movimiento financiero?")) return;
        fetch(window.WEB_APP_URL, { method: "POST", body: JSON.stringify({ target: "registro_gasto", action: "delete", id: id }) })
        .then(res => res.json()).then(() => location.reload());
    }

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