(() => {
    const tipoInversionSelect = document.getElementById("tipoInversionSelect");
    const entidadInversionSelect = document.getElementById("entidadInversionSelect");
    const invCapital = document.getElementById("invCapital");
    const invInteresAnual = document.getElementById("invInteresAnual");
    const invInteresCompuesto = document.getElementById("invInteresCompuesto");
    const invTotalRecibir = document.getElementById("invTotalRecibir");
    const invInteresGanado = document.getElementById("invInteresGanado");
    const invFechaInicio = document.getElementById("invFechaInicio");
    const invFechaFin = document.getElementById("invFechaFin");
    const btnRegistrarInversion = document.getElementById("btnRegistrarInversion");
    const tablaInversionesCuerpo = document.getElementById("tablaInversionesCuerpo");
    const resumenInversionesCuerpo = document.getElementById("resumenInversionesCuerpo");

    // Popups CRUD rápido
    const btnInvTipoAdd = document.getElementById("btnInvTipoAdd");
    const btnInvTipoEdit = document.getElementById("btnInvTipoEdit");
    const btnInvTipoDelete = document.getElementById("btnInvTipoDelete");
    const subFormInvTipo = document.getElementById("subFormInvTipo");
    const rapidoIdInvTipo = document.getElementById("rapidoIdInvTipo");
    const rapidoInputInvTipo = document.getElementById("rapidoInputInvTipo");
    const btnInvTipoCancelar = document.getElementById("btnInvTipoCancelar");
    const btnInvTipoGuardar = document.getElementById("btnInvTipoGuardar");

    const btnInvEntidadAdd = document.getElementById("btnInvEntidadAdd");
    const btnInvEntidadEdit = document.getElementById("btnInvEntidadEdit");
    const btnInvEntidadDelete = document.getElementById("btnInvEntidadDelete");
    const subFormInvEntidad = document.getElementById("subFormInvEntidad");
    const rapidoIdInvEntidad = document.getElementById("rapidoIdInvEntidad");
    const rapidoInputInvEntidad = document.getElementById("rapidoInputInvEntidad");
    const btnInvEntidadCancelar = document.getElementById("btnInvEntidadCancelar");
    const btnInvEntidadGuardar = document.getElementById("btnInvEntidadGuardar");

    if (tipoInversionSelect) {
        tipoInversionSelect.addEventListener("change", () => { 
            const container = tipoInversionSelect.closest('.flex-row');
            if (tipoInversionSelect.value) {
                if (btnInvTipoEdit) btnInvTipoEdit.style.display = "block";
                if (btnInvTipoDelete) btnInvTipoDelete.style.display = "block";
                container.classList.add('actions-inline-top');
            } else {
                if (btnInvTipoEdit) btnInvTipoEdit.style.display = "none";
                if (btnInvTipoDelete) btnInvTipoDelete.style.display = "none";
                container.classList.remove('actions-inline-top');
            }
        });
    }
    if (entidadInversionSelect) {
        entidadInversionSelect.addEventListener("change", () => { 
            const container = entidadInversionSelect.closest('.flex-row');
            if (entidadInversionSelect.value) {
                if (btnInvEntidadEdit) btnInvEntidadEdit.style.display = "block";
                if (btnInvEntidadDelete) btnInvEntidadDelete.style.display = "block";
                container.classList.add('actions-inline-top');
            } else {
                if (btnInvEntidadEdit) btnInvEntidadEdit.style.display = "none";
                if (btnInvEntidadDelete) btnInvEntidadDelete.style.display = "none";
                container.classList.remove('actions-inline-top');
            }
        });
    }

    if (btnInvTipoAdd) btnInvTipoAdd.addEventListener("click", () => abrirPopup(subFormInvTipo, rapidoIdInvTipo, rapidoInputInvTipo, tipoInversionSelect, false));
    if (btnInvTipoEdit) btnInvTipoEdit.addEventListener("click", () => abrirPopup(subFormInvTipo, rapidoIdInvTipo, rapidoInputInvTipo, tipoInversionSelect, true));
    if (btnInvTipoCancelar) btnInvTipoCancelar.addEventListener("click", () => { subFormInvTipo.style.display = "none"; });
    if (btnInvTipoGuardar) btnInvTipoGuardar.addEventListener("click", () => guardarCatalogoRapido("TIPO_INV_CAT", rapidoIdInvTipo, rapidoInputInvTipo, subFormInvTipo));
    if (btnInvTipoDelete) btnInvTipoDelete.addEventListener("click", () => eliminarCatalogoRapido(tipoInversionSelect.value));

    if (btnInvEntidadAdd) btnInvEntidadAdd.addEventListener("click", () => abrirPopup(subFormInvEntidad, rapidoIdInvEntidad, rapidoInputInvEntidad, entidadInversionSelect, false));
    if (btnInvEntidadEdit) btnInvEntidadEdit.addEventListener("click", () => abrirPopup(subFormInvEntidad, rapidoIdInvEntidad, rapidoInputInvEntidad, entidadInversionSelect, true));
    if (btnInvEntidadCancelar) btnInvEntidadCancelar.addEventListener("click", () => { subFormInvEntidad.style.display = "none"; });
    if (btnInvEntidadGuardar) btnInvEntidadGuardar.addEventListener("click", () => guardarCatalogoRapido("ENTIDAD_INV_CAT", rapidoIdInvEntidad, rapidoInputInvEntidad, subFormInvEntidad));
    if (btnInvEntidadDelete) btnInvEntidadDelete.addEventListener("click", () => eliminarCatalogoRapido(entidadInversionSelect.value));

    if (btnRegistrarInversion) btnRegistrarInversion.addEventListener("click", registrarInversionTransaccion);

    // Event listeners para cálculo automático de intereses
    if (invCapital) invCapital.addEventListener("input", calcularInteresesAutomaticos);
    if (invInteresAnual) invInteresAnual.addEventListener("input", calcularInteresesAutomaticos);
    if (invFechaInicio) invFechaInicio.addEventListener("change", calcularInteresesAutomaticos);
    if (invFechaFin) invFechaFin.addEventListener("change", calcularInteresesAutomaticos);

    function abrirPopup(form, idInput, textInput, select, esEdicion) {
        // Mover el formulario antes del contenedor padre del select
        const container = select.closest('.flex-column');
        container.insertBefore(form, container.firstChild);

        idInput.value = esEdicion ? select.value : "";
        textInput.value = esEdicion ? select.options[select.selectedIndex].text : "";
        form.style.display = "block";
        textInput.focus();
    }

    function guardarCatalogoRapido(idGastoCat, idInput, textInput, form) {
        const n = textInput.value.trim().toUpperCase();
        if(!n) return;
        const payload = { target: "detalle_gasto", action: idInput.value ? "update" : "create", idGasto: idGastoCat, nombreGasto: n, idDetalleGasto: idInput.value || undefined };
        
        fetch(window.API_URL, { method: "POST", mode: "cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                form.style.display = "none";
                window.cargarDatosCentral();
            } else {
                alert("Error al guardar: " + result.message);
            }
        })
        .catch(err => {
            console.error("Error en operación del catálogo:", err);
            alert("Error de comunicación de red al guardar en catálogo.");
        });
    }

    function eliminarCatalogoRapido(id) {
        if(!id || !confirm("¿Eliminar del catálogo de inversiones?")) return;
        fetch(window.API_URL, { method: "POST", mode: "cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: "detalle_gasto", action: "delete", id: id }) })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                window.cargarDatosCentral();
            } else {
                alert("Error al eliminar: " + result.message);
            }
        })
        .catch(err => {
            console.error("Error al eliminar del catálogo:", err);
            alert("Error de comunicación de red al eliminar del catálogo.");
        });
    }

    // --- FUNCIÓN DE CÁLCULO AUTOMÁTICO DE INTERESES ---
    function calcularInteresesAutomaticos() {
        const capital = parseFloat(invCapital.value) || 0;
        const tasaAnual = parseFloat(invInteresAnual.value) || 0;
        const fInicioStr = invFechaInicio.value;
        const fFinStr = invFechaFin.value;

        if (capital <= 0 || tasaAnual <= 0 || !fInicioStr || !fFinStr) {
            return;
        }

        const fInicio = new Date(fInicioStr + "T00:00:00");
        const fFin = new Date(fFinStr + "T00:00:00");

        if (fFin < fInicio) {
            return;
        }

        const diferenciaMilisegundos = fFin - fInicio;
        const dias = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));

        if (dias <= 0) return;

        // Interés Simple
        const interesSimple = capital * (tasaAnual / 100) * (dias / 365);
        
        // Interés Compuesto anualizado (capitalización diaria)
        const interesCompuesto = capital * (Math.pow(1 + (tasaAnual / 100) / 365, dias) - 1);

        const totalRecibir = capital + interesSimple;

        invInteresGanado.value = interesSimple.toFixed(2);
        invInteresCompuesto.value = interesCompuesto.toFixed(2);
        invTotalRecibir.value = totalRecibir.toFixed(2);
    }

    window.renderizarModuloInversiones = function() {
        const d = window.apiCache;
        const inputPeriodo = document.getElementById("filtroMesAnioIngreso");
        const partes = inputPeriodo ? inputPeriodo.value.split("-") : ["2026", "01"];
        const anio = parseInt(partes[0], 10), mes = parseInt(partes[1], 10);

        // Actualizar selectores
        if (tipoInversionSelect) {
            const s1 = tipoInversionSelect.value;
            tipoInversionSelect.innerHTML = `<option value="">-- Seleccione Tipo --</option>`;
            (d.detalleGasto || []).filter(x => x.idGasto === "TIPO_INV_CAT" && x.estado !== "INACTIVO").forEach(x => { tipoInversionSelect.innerHTML += `<option value="${x.idDetalleGasto}">${x.nombreGasto}</option>`; });
            tipoInversionSelect.value = s1;
        }

        if (entidadInversionSelect) {
            const s2 = entidadInversionSelect.value;
            entidadInversionSelect.innerHTML = `<option value="">-- Seleccione Entidad --</option>`;
            (d.detalleGasto || []).filter(x => x.idGasto === "ENTIDAD_INV_CAT" && x.estado !== "INACTIVO").forEach(x => { entidadInversionSelect.innerHTML += `<option value="${x.idDetalleGasto}">${x.nombreGasto}</option>`; });
            entidadInversionSelect.value = s2;
        }

        // Sincronizar visualización de botones de edición/eliminación rápida
        if (tipoInversionSelect) {
            if (btnInvTipoEdit) btnInvTipoEdit.style.display = tipoInversionSelect.value ? "block" : "none";
            if (btnInvTipoDelete) btnInvTipoDelete.style.display = tipoInversionSelect.value ? "block" : "none";
        }
        if (entidadInversionSelect) {
            if (btnInvEntidadEdit) btnInvEntidadEdit.style.display = entidadInversionSelect.value ? "block" : "none";
            if (btnInvEntidadDelete) btnInvEntidadDelete.style.display = entidadInversionSelect.value ? "block" : "none";
        }

        if (tablaInversionesCuerpo) tablaInversionesCuerpo.innerHTML = "";
        let agrupado = {};

        // Filtrar y pintar historial del mes seleccionado (soporte robusto para YYYY-MM-DD y DD/MM/YYYY con - o /)
        const filtradas = (d.inversiones || []).filter(inv => {
            if(!inv.fechaInicio) return false;
            const p = inv.fechaInicio.split(/[-/]/);
            if (p.length < 2) return false;
            
            let invAnio = 0;
            let invMes = 0;
            
            if (p[0].length === 4) {
                invAnio = parseInt(p[0], 10);
                invMes = parseInt(p[1], 10);
            } else if (p[2] && p[2].length === 4) {
                invAnio = parseInt(p[2], 10);
                invMes = parseInt(p[1], 10);
            }
            return invAnio === anio && invMes === mes;
        });

        if (tablaInversionesCuerpo) {
            if(filtradas.length === 0) {
                tablaInversionesCuerpo.innerHTML = `<tr><td colspan="6" class="text-center">Sin colocaciones en este mes.</td></tr>`;
            } else {
                filtradas.forEach(inv => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td><strong>${inv.entidad}</strong></td><td><span class="badge-tipo">${inv.tipoInversion}</span></td><td class="text-right">$ ${window.formatearMoneda(inv.capital)}</td><td class="text-right" style="font-weight:bold;">$ ${window.formatearMoneda(inv.totalRecibir)}</td><td>${inv.fechaFin}</td><td class="text-center"><button class="btn-action-delete" onclick="window.eliminarInversionFila('${inv.idInversion}')">Eliminar</button></td>`;
                    tablaInversionesCuerpo.appendChild(tr);
                });
            }
        }

        // Calcular resumen agrupado completo multianual/global cargado en caché
        (d.inversiones || []).forEach(inv => {
            const t = inv.tipoInversion.toUpperCase().trim();
            if(!agrupado[t]) agrupado[t] = { capital: 0, compuesto: 0, recibir: 0 };
            agrupado[t].capital += inv.capital;
            agrupado[t].compuesto += inv.interesCompuesto;
            agrupado[t].recibir += inv.totalRecibir;
        });

        if (resumenInversionesCuerpo) {
            resumenInversionesCuerpo.innerHTML = "";
            const keys = Object.keys(agrupado);
            if(keys.length === 0) {
                resumenInversionesCuerpo.innerHTML = `<tr><td colspan="4" class="text-center data-empty-msg">Sin totales.</td></tr>`;
            } else {
                keys.forEach(k => {
                    resumenInversionesCuerpo.innerHTML += `<tr><td><strong>${k}</strong></td><td class="text-right">$ ${window.formatearMoneda(agrupado[k].capital)}</td><td class="text-right" style="color:var(--brand-warning); font-weight:600;">$ ${window.formatearMoneda(agrupado[k].compuesto)}</td><td class="text-right" style="color:var(--brand-success); font-weight:700;">$ ${window.formatearMoneda(agrupado[k].recibir)}</td></tr>`;
                });
            }
        }
    };

    function registrarInversionTransaccion() {
        if(!tipoInversionSelect.value || !entidadInversionSelect.value || !invCapital.value || !invFechaInicio.value || !invFechaFin.value) return alert("Por favor complete los campos obligatorios.");
        const payload = {
            target: "inversiones", action: "create",
            tipoInversion: tipoInversionSelect.options[tipoInversionSelect.selectedIndex].text,
            entidad: entidadInversionSelect.options[entidadInversionSelect.selectedIndex].text,
            capital: parseFloat(invCapital.value) || 0,
            interesAnual: parseFloat(invInteresAnual.value) || 0,
            interesCompuesto: parseFloat(invInteresCompuesto.value) || 0,
            totalRecibir: parseFloat(invTotalRecibir.value) || 0,
            interesGanado: parseFloat(invInteresGanado.value) || 0,
            fechaInicio: invFechaInicio.value,
            fechaFin: invFechaFin.value
        };

        fetch(window.API_URL, { method: "POST", mode: "cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                invCapital.value = ""; invInteresAnual.value = ""; invInteresCompuesto.value = ""; invTotalRecibir.value = ""; invInteresGanado.value = ""; invFechaInicio.value = ""; invFechaFin.value = "";
                window.cargarDatosCentral();
            } else {
                alert("Error al registrar la inversión: " + result.message);
            }
        })
        .catch(err => {
            console.error("Error al registrar inversión:", err);
            alert("Error de comunicación de red al registrar inversión.");
        });
    }

    window.eliminarInversionFila = function(id) {
        if(!confirm("¿Eliminar registro de inversión?")) return;
        fetch(window.API_URL, { method: "POST", mode: "cors", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: "inversiones", action: "delete", id: id }) })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                window.cargarDatosCentral();
            } else {
                alert("Error al eliminar inversión: " + result.message);
            }
        })
        .catch(err => {
            console.error("Error al eliminar inversión:", err);
            alert("Error de comunicación de red al eliminar inversión.");
        });
    };
})();