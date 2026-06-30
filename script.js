(() => {
    // REEMPLAZA CON LA URL OBTENIDA AL IMPLEMENTAR EN GOOGLE APPS SCRIPT
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwjpL9sc5LArWMyC8yMprHmfjdhOPnanlKS5hy26WzWsuSOfdcnpGS6ZE4KCCvYe5wx/exec";

    // Elementos del DOM capturados globalmente
    const tablaGastos = document.getElementById("tablaGastos");
    const inputNombre = document.getElementById("nombreGasto");
    const inputIdOculto = document.getElementById("editIdGasto");
    const btnGuardar = document.getElementById("btnGuardar");

    // Escuchar la carga del documento para renderizar los datos iniciales
    document.addEventListener("DOMContentLoaded", cargarDatos);
    btnGuardar.addEventListener("click", guardarRegistro);

  function cargarDatos() {
        fetch(WEB_APP_URL)
            .then(response => {
                if (!response.ok) throw new Error("Error de red.");
                return response.json();
            })
            .then(data => {
                tablaGastos.innerHTML = "";
                const lista = data.gasto;

                if (!lista || lista.length === 0) {
                    tablaGastos.innerHTML = `<tr><td colspan="3" style="text-align:center;">No hay nombres de gastos registrados.</td></tr>`;
                    // Si no hay gastos, igualmente pintamos la matriz e inicializamos su formulario dinámico
                    renderizarMatrizDinamica(data.matrizGastos);
                    inicializarFormularioMatriz(data.matrizGastos, data.detalleGasto);
                    return;
                }

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

                // Buscar esta línea dentro de cargarDatos() en tu script.js y reemplazarla por estas dos:
                renderizarMatrizDinamica(data.matrizGastos);
                inicializarFormularioMatriz(data.matrizGastos, data.detalleGasto);

            })
            .catch(error => {
                console.error("Error al cargar:", error);
                tablaGastos.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Error de comunicación con la base de datos.</td></tr>`;
            });
    }

    // Nueva función interna auxiliar que reconstruye las columnas en el DOM
function renderizarMatrizDinamica(matrizData) {
        const thead = document.getElementById("encabezadoMatriz");
        const tbody = document.getElementById("cuerpoMatriz");
        
        if (!thead || !tbody || !matrizData) return;

        thead.innerHTML = "";
        tbody.innerHTML = "";

        const principales = matrizData.headersPrincipales || [];
        const subCabeceras = matrizData.subCabeceras || [];
        const datos = matrizData.datos || [];

        if (principales.length === 0) return;

        // ----------------------------------------------------
        // RENDER DE ENCABEZADOS (FILA 1 Y FILA 2 COMBINADAS)
        // ----------------------------------------------------
        const fila1 = document.createElement("tr");
        const fila2 = document.createElement("tr");

        for (let i = 0; i < principales.length; i++) {
            if (principales[i] === "ID_REGISTRO" || principales[i] === "FECHA") {
                if (principales[i] === subCabeceras[i]) { 
                    const th = document.createElement("th");
                    th.textContent = principales[i];
                    th.setAttribute("rowspan", "2");
                    th.style.backgroundColor = "#2c3e50";
                    th.style.color = "#fff";
                    fila1.appendChild(th);
                }
            } else if (principales[i] !== "" && principales[i] !== undefined) {
                const thGasto = document.createElement("th");
                thGasto.textContent = principales[i];
                // El colspan se calcula dinámicamente contando cuántas subcolumnas
                // (DETALLE, MONTO, etc.) pertenecen a este tipo de gasto, en lugar de
                // asumir un número fijo. Esto permite que cada tipo de gasto tenga
                // exactamente 2 columnas (DETALLE + MONTO) o las que el Sheets defina.
                const colspanGasto = contarSubcolumnasDelGasto(principales, i);
                thGasto.setAttribute("colspan", String(colspanGasto));
                thGasto.style.textAlign = "center";
                thGasto.style.backgroundColor = "#2c3e50";
                thGasto.style.color = "#fff";
                fila1.appendChild(thGasto);
            }
            
            if (principales[i] !== "ID_REGISTRO" && principales[i] !== "FECHA" && principales[i] !== undefined) {
                const thSub = document.createElement("th");
                // Validación para evitar celdas vacías/indefinidas en los encabezados
                thSub.textContent = subCabeceras[i] || "";
                
                if (subCabeceras[i] && subCabeceras[i].toString().includes("TOTAL")) {
                    thSub.style.backgroundColor = "#16a085";
                    thSub.style.color = "#fff";
                } else {
                    thSub.style.backgroundColor = "#34495e";
                    thSub.style.color = "#fff";
                }
                fila2.appendChild(thSub);
            }
        }
        
        thead.appendChild(fila1);
        thead.appendChild(fila2);

        // ----------------------------------------------------
        // RENDER DE CUERPO DE DATOS CON CALCULADOR FLOAT
        // ----------------------------------------------------
        if (datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${subCabeceras.length}" style="text-align:center; color:#7f8c8d; padding:25px; font-style:italic;">Estructura matricial lista en Google Sheets. Ingrese registros operacionales para listar celdas numéricas.</td></tr>`;
            return;
        }

        datos.forEach((lineaFila) => {
            const tr = document.createElement("tr");
            let sumaGastoActual = 0.00;

            for (let idx = 0; idx < lineaFila.length; idx++) {
                const td = document.createElement("td");
                
                // CONTROL CRUCIAL: Si la subcabecera es indefinida, la tratamos como texto vacío plano
                const tipoColumna = subCabeceras[idx] ? subCabeceras[idx].toString() : "";

                if (idx < 2) {
                    td.innerHTML = `<strong>${lineaFila[idx]}</strong>`;
                    tr.appendChild(td);
                } else {
                    if (tipoColumna === "DETALLE") {
                        td.textContent = lineaFila[idx] || "-";
                        tr.appendChild(td);
                    } 
                    else if (tipoColumna === "MONTO (FLOAT)") {
                        let valorFloat = parseFloat(lineaFila[idx]) || 0.00;
                        sumaGastoActual += valorFloat; 
                        td.textContent = valorFloat.toFixed(2);
                        td.style.textAlign = "right";
                        td.style.fontWeight = "600";
                        tr.appendChild(td);
                    } 
                    else if (tipoColumna.includes("TOTAL")) {
                        td.textContent = sumaGastoActual.toFixed(2);
                        td.style.textAlign = "right";
                        td.style.backgroundColor = "#e8f8f5";
                        td.style.color = "#117a65";
                        td.style.fontWeight = "bold";
                        
                        tr.appendChild(td);
                        sumaGastoActual = 0.00; // Reset para el próximo bloque de gasto
                    } else {
                        // Respaldo por si hay columnas huérfanas en el Sheets sin cabecera clara
                        td.textContent = lineaFila[idx] || "";
                        tr.appendChild(td);
                    }
                }
            }
            tbody.appendChild(tr);
        });
    }

    // NUEVO: Variables de control de la matriz que se integran al flujo del script.js existente
    let cacheColumnasMatriz = [];
    let cacheDetallesCatalogo = [];

    // Esta función se encarga de interceptar la carga de datos para construir el formulario dinámico
    function inicializarFormularioMatriz(matrizData, catalogoDetalles) {
        const contenedor = document.getElementById("contenedorFormMatriz");
        const panelCampos = document.getElementById("camposDinamicosMatriz");
        const btnEnviarMatriz = document.getElementById("btnGuardarFilaMatriz");

        if (!contenedor || !panelCampos || !matrizData) return;

        panelCampos.innerHTML = "";
        cacheColumnasMatriz = matrizData.columnas || matrizData.subCabeceras || [];
        
        // Almacenamos el catálogo de detalles (filtrando los del GET del backend)
        cacheDetallesCatalogo = catalogoDetalles || [];

        if (cacheColumnasMatriz.length === 0) {
            contenedor.style.display = "none";
            return;
        }

        contenedor.style.display = "block";

        // Clonamos el botón para remover listeners antiguos residuales de renders previos
        const nuevoBtn = btnEnviarMatriz.cloneNode(true);
        btnEnviarMatriz.parentNode.replaceChild(nuevoBtn, btnEnviarMatriz);
        nuevoBtn.addEventListener("click", enviarFilaMatriz);

        const principales = matrizData.headersPrincipales || [];

        // Construcción de inputs basados en la distribución de las cabeceras del Sheets
        for (let i = 2; i < cacheColumnasMatriz.length; i++) {
            const tipoCol = cacheColumnasMatriz[i];
            const nombreGastoPadre = obtenerGastoPadre(principales, i);

            if (tipoCol === "DETALLE") {
                const box = document.createElement("div");
                box.style.display = "flex";
                box.style.flexDirection = "column";

                if (nombreGastoPadre === "GASTOS FIJOS") {
                    // Requerimiento: Si es GASTOS FIJOS, se auto-rellena con un selector (Select) del catálogo de detalles creados
                    box.innerHTML = `
                        <label style="font-size:12px; font-weight:bold; color:#4a5568; margin-bottom:4px;">${nombreGastoPadre} (${tipoCol})</label>
                        <select class="input-matriz-celda" data-idx="${i}" style="padding:10px; border-radius:6px; border:1px solid #cbd5e0; background:white;">
                            <option value="">-- Seleccione Detalle --</option>
                            ${cacheDetallesCatalogo.map(d => `<option value="${d.nombreGasto}">${d.nombreGasto}</option>`).join('')}
                        </select>
                    `;
                } else {
                    // Requerimiento: Las demás columnas permiten texto de celda libre (Input text)
                    box.innerHTML = `
                        <label style="font-size:12px; font-weight:bold; color:#4a5568; margin-bottom:4px;">${nombreGastoPadre} (${tipoCol})</label>
                        <input type="text" class="input-matriz-celda" data-idx="${i}" placeholder="Nombre de celda..." style="padding:8px; border-radius:6px; border:1px solid #cbd5e0;">
                    `;
                }
                panelCampos.appendChild(box);
            } 
            else if (tipoCol === "MONTO (FLOAT)") {
                const box = document.createElement("div");
                box.style.display = "flex";
                box.style.flexDirection = "column";
                box.innerHTML = `
                    <label style="font-size:12px; font-weight:bold; color:#4a5568; margin-bottom:4px;">${nombreGastoPadre} (${tipoCol})</label>
                    <input type="number" step="0.01" class="input-matriz-celda" data-idx="${i}" placeholder="0.00" style="padding:8px; border-radius:6px; border:1px solid #cbd5e0;">
                `;
                panelCampos.appendChild(box);
            }
        }
    }

    // Cuenta cuántas subcolumnas (DETALLE, MONTO, etc.) pertenecen a un tipo de gasto,
    // buscando hacia adelante hasta encontrar el siguiente encabezado principal definido
    // o el final del arreglo. Así el colspan siempre coincide con la cantidad real de
    // columnas (en este proyecto: 2 -> DETALLE + MONTO), sin importar cómo esté armado el Sheets.
    function contarSubcolumnasDelGasto(principales, indiceInicio) {
        let cantidad = 1; // La propia columna donde está el nombre del gasto cuenta como 1
        for (let j = indiceInicio + 1; j < principales.length; j++) {
            if (principales[j] !== "" && principales[j] !== undefined) {
                break; // Llegamos al siguiente tipo de gasto (o ID_REGISTRO/FECHA), terminamos el conteo
            }
            cantidad++;
        }
        return cantidad;
    }

    // Busca hacia atrás en la fila superior combinada para saber a qué gasto pertenece la columna actual
    function obtenerGastoPadre(principales, indice) {
        for (let i = indice; i >= 0; i--) {
            if (principales[i] && principales[i] !== "") return principales[i];
        }
        return "";
    }

    // Recolecta los valores de los inputs respetando las posiciones relativas de las celdas del Sheets
    function enviarFilaMatriz() {
        const inputs = document.querySelectorAll(".input-matriz-celda");
        // Inicializamos la fila con los dos primeros campos vacíos (ID y Fecha los autogenera el backend)
        let filaValores = ["", ""]; 

        // Rellenar el array de la fila con valores vacíos por defecto.
        // Las columnas TOTAL se dejan vacías intencionalmente: el cálculo del total
        // lo realiza el backend (Apps Script / fórmula nativa de Sheets), no el cliente.
        for (let idx = 2; idx < cacheColumnasMatriz.length; idx++) {
            filaValores[idx] = "";
        }

        // Mapear los datos de los inputs del DOM dentro de nuestro array de la fila
        inputs.forEach(input => {
            const posicionColumna = parseInt(input.dataset.idx);
            let valor = input.value.trim();

            if (input.type === "number") {
                valor = parseFloat(valor) || 0.00;
            }
            filaValores[posicionColumna] = valor;
        });

        // Construir el paquete JSON unificado
        const payload = {
            target: "matriz_gastos",
            action: "create_row",
            fila: filaValores
        };

        const btn = document.getElementById("btnGuardarFilaMatriz");
        btn.disabled = true;
        btn.textContent = "Guardando Fila...";

        fetch(WEB_APP_URL, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                alert("Fila operacional registrada correctamente.");
                inputs.forEach(i => i.value = ""); // Limpiar formulario
                cargarDatos(); // Recargar tablas en cascada
            } else {
                alert("Error al guardar en la matriz: " + result.message);
            }
        })
        .catch(err => console.error("Error:", err))
        .finally(() => {
            btn.disabled = false;
            btn.textContent = "Guardar Fila Operacional";
        });
    }
    function guardarRegistro() {
        const nombre = inputNombre.value.trim();
        const id = inputIdOculto.value;

        if (!nombre) {
            alert("Por favor, ingrese un nombre de gasto válido.");
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
        btnGuardar.textContent = "Procesando...";

        fetch(WEB_APP_URL, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                alert(result.message);
                restablecerFormulario();
                cargarDatos();
            } else {
                alert("Error del sistema: " + result.message);
            }
        })
        .catch(err => {
            console.error("Error de envío:", err);
            alert("Fallo la conexión de red.");
        })
        .finally(() => {
            btnGuardar.disabled = false;
        });
    }

    function eliminarRegistro(id) {
        if (!confirm(`¿Está seguro de eliminar de forma permanente el registro con ID: ${id}?`)) return;

        const payload = {
            target: "gasto",
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
                alert(result.message);
                cargarDatos();
            } else {
                alert("Error al intentar eliminar: " + result.message);
            }
        })
        .catch(err => console.error("Error:", err));
    }

    function prepararEdicion(id, nombre) {
        inputIdOculto.value = id;
        inputNombre.value = nombre;
        
        btnGuardar.textContent = "Actualizar Nombre";
        btnGuardar.className = "btn-edit-mode";
        inputNombre.focus();
    }

    function restablecerFormulario() {
        inputIdOculto.value = "";
        inputNombre.value = "";
        btnGuardar.textContent = "Crear Campo";
        btnGuardar.className = "btn-add";
    }
})();