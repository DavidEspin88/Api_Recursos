(() => {
    const filtroMesAnioIngreso = document.getElementById("filtroMesAnioIngreso");
    const fechaIngreso = document.getElementById("fechaIngreso");
    const nombreIngreso = document.getElementById("nombreIngreso");
    const montoIngreso = document.getElementById("montoIngreso");
    const btnRegistrarIngreso = document.getElementById("btnRegistrarIngreso");
    const totalMontoIngresos = document.getElementById("totalMontoIngresos");
    const balanceNetoMensual = document.getElementById("balanceNetoMensual"); // Nuevo elemento
    const tablaIngresosCuerpo = document.getElementById("tablaIngresosCuerpo");

    const btnIngRapidoAdd = document.getElementById("btnIngRapidoAdd");
    const btnIngRapidoEdit = document.getElementById("btnIngRapidoEdit");
    const btnIngRapidoDelete = document.getElementById("btnIngRapidoDelete");
    const subFormFuenteRapida = document.getElementById("subFormFuenteRapida");
    const rapidoIdFuente = document.getElementById("rapidoIdFuente");
    const rapidoInputFuente = document.getElementById("rapidoInputFuente");
    const btnFuenteCancelar = document.getElementById("btnFuenteCancelar");
    const btnFuenteGuardar = document.getElementById("btnFuenteGuardar");

    btnRegistrarIngreso.addEventListener("click", registrarNuevoIngreso);
    filtroMesAnioIngreso.addEventListener("change", () => window.renderizarModuloIngresos());
    nombreIngreso.addEventListener("change", gestionarBotonesFuente);

    btnIngRapidoAdd.addEventListener("click", () => abrirSubFormFuente(false));
    btnIngRapidoEdit.addEventListener("click", () => abrirSubFormFuente(true));
    btnIngRapidoDelete.addEventListener("click", eliminarFuenteCatalogo);
    btnFuenteCancelar.addEventListener("click", cerrarSubFormFuente);
    btnFuenteGuardar.addEventListener("click", guardarFuenteCatalogo);

    if (!filtroMesAnioIngreso.value) {
        const hoy = new Date();
        filtroMesAnioIngreso.value = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    }

    window.renderizarModuloIngresos = function() {
        const data = window.apiCache;
        const mesAnioFiltro = filtroMesAnioIngreso.value; // Ejemplo: "2026-01"

        // 1. Cargar catálogo de Fuentes
        const fuenteSeleccionadaAnterior = nombreIngreso.value;
        nombreIngreso.innerHTML = `<option value="">-- Seleccione Fuente --</option>`;
        
        const fuentesCatalogo = (data.detalleGasto || []).filter(d => d.idGasto === "INGRESOS_CAT" && d.estado !== "INACTIVO");
        fuentesCatalogo.forEach(f => {
            nombreIngreso.innerHTML += `<option value="${f.idDetalleGasto}">${f.nombreGasto}</option>`;
        });
        nombreIngreso.value = fuenteSeleccionadaAnterior;
        gestionarBotonesFuente();

        // 2. Pintar registros de Ingresos filtrados por mes
        tablaIngresosCuerpo.innerHTML = "";
        let sumatoriaIngresos = 0;

        const listaIngresos = data.ingresos || [];
        const ingresosFiltrados = listaIngresos.filter(ing => {
            const mesRegistro = ing.mesAnio ? ing.mesAnio : String(ing.fecha).substring(0, 7);
            return mesRegistro === mesAnioFiltro;
        });

        if (ingresosFiltrados.length === 0) {
            tablaIngresosCuerpo.innerHTML = `<tr><td colspan="5" style="text-align:center; font-style:italic; padding:15px;">No existen ingresos registrados en este mes (${mesAnioFiltro}).</td></tr>`;
        } else {
            ingresosFiltrados.forEach(ing => {
                sumatoriaIngresos += ing.monto;

                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td><strong>${ing.idIngreso}</strong></td>
                    <td>${ing.fecha}</td>
                    <td>${ing.nombre}</td>
                    <td style="text-align:right; font-weight:bold; color:#234e52;">$${ing.monto.toFixed(2)}</td>
                    <td style="text-align:center;">
                        <button class="btn-action-delete btn-borrar-ing" data-id="${ing.idIngreso}">Eliminar</button>
                    </td>
                `;
                fila.querySelector(".btn-borrar-ing").addEventListener("click", () => eliminarIngresoRegistro(ing.idIngreso));
                tablaIngresosCuerpo.appendChild(fila);
            });
        }

        totalMontoIngresos.textContent = `$${sumatoriaIngresos.toFixed(2)}`;

        // 3. NUEVO: CALCULO DE GASTOS DEL MISMO MES PARA EL BALANCE GLOBAL
        let sumatoriaGastos = 0;
        const listaGastos = data.registroGasto || [];
        
        listaGastos.forEach(g => {
            const mesGasto = String(g.fecha).substring(0, 7);
            if (mesGasto === mesAnioFiltro) {
                sumatoriaGastos += g.monto;
            }
        });

        // Operación Ingresos - Gastos
        const saldoNeto = sumatoriaIngresos - sumatoriaGastos;
        balanceNetoMensual.textContent = `$${saldoNeto.toFixed(2)}`;

        // Cambiar el color dinámicamente si estás en números verdes o rojos
        if (saldoNeto >= 0) {
            balanceNetoMensual.style.color = "#2f855a"; // Verde
        } else {
            balanceNetoMensual.style.color = "#e53e3e"; // Rojo
        }
    };

    function gestionarBotonesFuente() {
        if (nombreIngreso.value) {
            btnIngRapidoEdit.style.display = "block";
            btnIngRapidoDelete.style.display = "block";
        } else {
            btnIngRapidoEdit.style.display = "none";
            btnIngRapidoDelete.style.display = "none";
        }
    }

    function abrirSubFormFuente(esEdicion) {
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
        const nombreFuente = rapidoInputFuente.value.trim();
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
        fetch(window.WEB_APP_URL, { method: "POST", mode: "cors", body: JSON.stringify(payload) })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                cerrarSubFormFuente();
                location.reload();
            } else alert(result.message);
        })
        .finally(() => btnFuenteGuardar.disabled = false);
    }

    function eliminarFuenteCatalogo() {
        const idFuente = nombreIngreso.value;
        if (!idFuente) return;
        if (!confirm("¿Desea eliminar esta fuente del catálogo?")) return;

        fetch(window.WEB_APP_URL, { 
            method: "POST", 
            body: JSON.stringify({ target: "detalle_gasto", action: "delete", id: idFuente }) 
        })
        .then(res => res.json())
        .then(r => {
            if (r.status === "success") location.reload();
            else alert("Aviso: " + r.message);
        });
    }

    function registrarNuevoIngreso() {
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
        fetch(window.WEB_APP_URL, { method: "POST", mode: "cors", body: JSON.stringify(payload) })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") location.reload();
            else alert(result.message);
        })
        .finally(() => btnRegistrarIngreso.disabled = false);
    }

    function eliminarIngresoRegistro(id) {
        if (!confirm(`¿Desea eliminar el registro de ingreso ${id}?`)) return;
        fetch(window.WEB_APP_URL, { method: "POST", mode: "cors", body: JSON.stringify({ target: "ingresos", action: "delete", id: id }) })
        .then(res => res.json()).then(() => location.reload());
    }
})();