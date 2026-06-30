// URL ÚNICA DE TU APP SCRIPT
window.WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwjpL9sc5LArWMyC8yMprHmfjdhOPnanlKS5hy26WzWsuSOfdcnpGS6ZE4KCCvYe5wx/exec";

// Cache reactivo global accesible por otros módulos
window.apiCache = {
    gasto: [],
    detalleGasto: [],
    registroGasto: [],
    matrizGastos: {},
    ingresos: []
};

(() => {
    // Elementos del DOM capturados
    const tablaGastos = document.getElementById("tablaGastos");
    const inputNombre = document.getElementById("nombreGasto");
    const inputIdOculto = document.getElementById("editIdGasto");
    const btnGuardar = document.getElementById("btnGuardar");

    // VARIABLES DE CONTROL ÚNICAS (Declaradas una sola vez para evitar SyntaxError)
    let cacheColumnasMatriz = [];
    let cacheDetallesCatalogo = [];

    // Escuchar la carga del documento para renderizar los datos iniciales
    document.addEventListener("DOMContentLoaded", cargarDatos);
    btnGuardar.addEventListener("click", guardarRegistro);

    function cargarDatos() {
        fetch(window.WEB_APP_URL)
            .then(res => res.json())
            .then(data => {
                // Actualizar la caché global
                window.apiCache = data;

                // Renderizar Tipos de Gasto
                tablaGastos.innerHTML = "";
                const lista = data.gasto || [];

                if (lista.length === 0) {
                    tablaGastos.innerHTML = `<tr><td colspan="3" style="text-align:center;">No hay tipos de gastos registrados.</td></tr>`;
                } else {
                    lista.forEach(item => {
                        const fila = document.createElement("tr");
                        fila.innerHTML = `
                            <td><strong>${item.idGasto}</strong></td>
                            <td>${item.nombreGasto}</td>
                            <td style="text-align: center;">
                                <button class="btn-action-edit btn-editar-gasto">Editar</button>
                                <button class="btn-action-delete btn-borrar-gasto">Borrar</button>
                            </td>
                        `;
                        fila.querySelector(".btn-editar-gasto").addEventListener("click", () => prepararEdicion(item.idGasto, item.nombreGasto));
                        fila.querySelector(".btn-borrar-gasto").addEventListener("click", () => eliminarRegistro(item.idGasto));
                        tablaGastos.appendChild(fila);
                    });
                }

                // Disparar renders de los otros scripts de manera reactiva y unificada
                if (typeof window.renderizarModuloDetalles === "function") window.renderizarModuloDetalles();
                if (typeof window.renderizarModuloRegistro === "function") window.renderizarModuloRegistro();
                if (typeof window.renderizarModuloIngresos === "function") window.renderizarModuloIngresos();
                
                renderizarMatrizDinamica(data.matrizGastos);
                inicializarFormularioMatriz(data.matrizGastos, data.detalleGasto);
            })
            .catch(error => {
                console.error("Error al cargar:", error);
                tablaGastos.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Fallo de comunicación con el servidor.</td></tr>`;
            });
    }

    function guardarRegistro() {
        const nombre = inputNombre.value.trim();
        const id = inputIdOculto.value;
        if (!nombre) return alert("Ingrese un tipo de gasto válido.");

        let payload = { target: "gasto", action: "create", nombreGasto: nombre };
        if (id) { payload.action = "update"; payload.idGasto = id; }

        btnGuardar.disabled = true;
        fetch(window.WEB_APP_URL, { method: "POST", mode: "cors", body: JSON.stringify(payload) })
            .then(res => res.json())
            .then(result => {
                if (result.status === "success") { restablecerFormulario(); cargarDatos(); } 
                else alert("Error: " + result.message);
            })
            .finally(() => btnGuardar.disabled = false);
    }

    function eliminarRegistro(id) {
        if (!confirm(`¿Eliminar tipo de gasto ${id}?`)) return;
        fetch(window.WEB_APP_URL, { method: "POST", mode: "cors", body: JSON.stringify({ target: "gasto", action: "delete", id: id }) })
            .then(res => res.json())
            .then(res => res.status === "success" ? cargarDatos() : alert(res.message));
    }

    function prepararEdicion(id, nombre) {
        inputIdOculto.value = id;
        inputNombre.value = nombre;
        btnGuardar.textContent = "Actualizar Tipo";
        btnGuardar.className = "btn-edit-mode";
        inputNombre.focus();
    }

    function restablecerFormulario() {
        inputIdOculto.value = "";
        inputNombre.value = "";
        btnGuardar.textContent = "Guardar Tipo";
        btnGuardar.className = "btn-add";
    }

// --- RENDERIZADO DE MATRIZ DE CONTROL --
    function renderizarMatrizDinamica(matrizData) {
        const thead = document.getElementById("encabezadoMatriz");
        const tbody = document.getElementById("cuerpoMatriz");
        if (!thead || !tbody || !matrizData) return;

        thead.innerHTML = ""; tbody.innerHTML = "";
        const principales = matrizData.headersPrincipales || [];
        const subCabeceras = matrizData.subCabeceras || [];
        const datos = matrizData.datos || [];
        if (principales.length === 0) return;

        const fila1 = document.createElement("tr");
        const fila2 = document.createElement("tr");

        for (let i = 0; i < principales.length; i++) {
            if (principales[i] === "ID_REGISTRO" || principales[i] === "FECHA") {
                if (principales[i] === subCabeceras[i]) { 
                    const th = document.createElement("th");
                    th.textContent = principales[i];
                    th.setAttribute("rowspan", "2");
                    th.style.backgroundColor = "#2c3e50"; th.style.color = "#fff";
                    fila1.appendChild(th);
                }
            } else if (principales[i] !== "" && principales[i] !== undefined) {
                const thGasto = document.createElement("th");
                thGasto.textContent = principales[i];
                let count = 1;
                for (let j = i + 1; j < principales.length; j++) {
                    if (principales[j] !== "" && principales[j] !== undefined) break;
                    count++;
                }
                thGasto.setAttribute("colspan", String(count));
                thGasto.style.textAlign = "center";
                thGasto.style.backgroundColor = "#2c3e50"; thGasto.style.color = "#fff";
                fila1.appendChild(thGasto);
            }
            
            if (principales[i] !== "ID_REGISTRO" && principales[i] !== "FECHA" && principales[i] !== undefined) {
                const thSub = document.createElement("th");
                // SOLUCIÓN: Asegurar que thTexto sea un String, previniendo celdas undefined o vacías en Sheets
                const thTexto = String(subCabeceras[i] || "").toUpperCase(); 
                
                thSub.textContent = subCabeceras[i] || "";
                thSub.style.backgroundColor = thTexto.includes("TOTAL") ? "#16a085" : "#34495e";
                thSub.style.color = "#fff";
                fila2.appendChild(thSub);
            }
        }
        thead.appendChild(fila1); thead.appendChild(fila2);

        if (datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${subCabeceras.length}" style="text-align:center; font-style:italic; padding:15px;">Matriz lista en espera de registros.</td></tr>`;
            return;
        }

        datos.forEach(lineaFila => {
            const tr = document.createElement("tr");
            let acum = 0;
            for (let idx = 0; idx < lineaFila.length; idx++) {
                const td = document.createElement("td");
                const tipoCol = String(subCabeceras[idx] || "").toUpperCase(); // Blindaje también en las celdas de datos
                
                if (idx < 2) {
                    td.innerHTML = `<strong>${lineaFila[idx]}</strong>`;
                } else if (tipoCol === "DETALLE") {
                    td.textContent = lineaFila[idx] || "-";
                } else if (tipoCol.includes("MONTO")) {
                    let val = parseFloat(lineaFila[idx]) || 0;
                    acum += val; td.textContent = val.toFixed(2); td.style.textAlign = "right";
                } else if (tipoCol.includes("TOTAL")) {
                    td.textContent = acum.toFixed(2); td.style.textAlign = "right";
                    td.style.backgroundColor = "#e8f8f5"; td.style.color = "#117a65"; td.style.fontWeight = "bold";
                    acum = 0;
                }
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        });
    }

    // --- FORMULARIO DINÁMICO DE LA MATRIZ ---

    function inicializarFormularioMatriz(matrizData, catalogoDetalles) {
        const contenedor = document.getElementById("contenedorFormMatriz");
        const panelCampos = document.getElementById("camposDinamicosMatriz");
        if (!contenedor || !panelCampos || !matrizData) return;

        panelCampos.innerHTML = "";
        
        cacheColumnasMatriz = matrizData.subCabeceras || [];
        cacheDetallesCatalogo = catalogoDetalles || [];

        if (cacheColumnasMatriz.length <= 2) { contenedor.style.display = "none"; return; }
        contenedor.style.display = "block";

        const principales = matrizData.headersPrincipales || [];

        for (let i = 2; i < cacheColumnasMatriz.length; i++) {
            const tipoCol = cacheColumnasMatriz[i];
            let padre = "";
            for (let k = i; k >= 0; k--) { if (principales[k]) { padre = principales[k]; break; } }

            if (tipoCol === "DETALLE") {
                const box = document.createElement("div");
                box.style.display = "flex";
                box.style.flexDirection = "column";
                
                // FILTRADO FLEXIBLE UNIFICADO PARA LA MATRIZ:
                const filtrados = cacheDetallesCatalogo.filter(d => {
                    const coincideNombreGasto = d.idGasto.toUpperCase().trim() === padre.toUpperCase().trim();
                    // O si en la caché local tenemos el ID vinculante mapeado mediante el catálogo maestro:
                    const maestroGasto = window.apiCache.gasto.find(g => g.nombreGasto.toUpperCase().trim() === padre.toUpperCase().trim());
                    const coincideIdGasto = maestroGasto ? d.idGasto.toUpperCase().trim() === maestroGasto.idGasto.toUpperCase().trim() : false;
                    
                    return (coincideNombreGasto || coincideIdGasto) && d.estado !== "INACTIVO";
                });
                
                box.innerHTML = `
                    <label style="font-size:12px; font-weight:bold; color:#4a5568; margin-bottom:4px;">${padre} (${tipoCol})</label>
                    <select class="input-matriz-celda" data-idx="${i}" style="padding:10px; border-radius:6px; border:1px solid #cbd5e0; background:white;">
                        <option value="">-- Seleccione Detalle --</option>
                        ${filtrados.map(f => `<option value="${f.nombreGasto}">${f.nombreGasto}</option>`).join('')}
                    </select>
                `;
                panelCampos.appendChild(box);
            } else if (tipoCol === "MONTO (FLOAT)") {
                const box = document.createElement("div");
                box.style.display = "flex";
                box.style.flexDirection = "column";
                box.innerHTML = `
                    <label style="font-size:12px; font-weight:bold; color:#4a5568; margin-bottom:4px;">${padre} (${tipoCol})</label>
                    <input type="number" step="0.01" class="input-matriz-celda" data-idx="${i}" placeholder="0.00" style="padding:10px; border-radius:6px; border:1px solid #cbd5e0;">
                `;
                panelCampos.appendChild(box);
            }
        }
        
        document.getElementById("btnGuardarFilaMatriz").onclick = enviarFilaMatriz;
    }

    // --- ENVÍO DE DATOS A MATRIZ_GASTOS ---
    function enviarFilaMatriz() {
        const inputs = document.querySelectorAll(".input-matriz-celda");
        const btn = document.getElementById("btnGuardarFilaMatriz");
        
        let filaValores = Array(cacheColumnasMatriz.length).fill("");
        filaValores[0] = ""; // ID_REGISTRO lo maneja el backend
        filaValores[1] = ""; // FECHA la maneja el backend

        inputs.forEach(inp => {
            let idx = parseInt(inp.dataset.idx);
            filaValores[idx] = inp.type === "number" ? (parseFloat(inp.value) || 0) : inp.value;
        });

        btn.disabled = true;
        btn.textContent = "Guardando Fila...";

        fetch(window.WEB_APP_URL, { 
            method: "POST", 
            mode: "cors",
            body: JSON.stringify({ target: "matriz_gastos", action: "create_row", fila: filaValores }) 
        })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                alert("Fila registrada en la matriz correctamente.");
                inputs.forEach(inp => inp.value = ""); // Resetear los campos del bloque
                cargarDatos(); // Recarga reactiva en cadena
            } else {
                alert("Error: " + result.message);
            }
        })
        .catch(err => console.error("Error en envío:", err))
        .finally(() => {
            btn.disabled = false;
            btn.textContent = "Guardar Fila Operacional";
        });
    }
})();