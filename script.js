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
                    // Si no hay gastos, pintamos la matriz limpia con cabeceras básicas
                    renderizarMatrizDinámica(data.matrizGastos);
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

                // LLAMADA CLAVE: Renderiza la tercera tabla dinámicamente usando la nueva data distribuida
                renderizarMatrizDinámica(data.matrizGastos);
            })
            .catch(error => {
                console.error("Error al cargar:", error);
                tablaGastos.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Error de comunicación con la base de datos.</td></tr>`;
            });
    }

    // Nueva función interna auxiliar que reconstruye las columnas en el DOM
    function renderizarMatrizDinámica(matrizData) {
        const thead = document.getElementById("encabezadoMatriz");
        const tbody = document.getElementById("cuerpoMatriz");
        
        if (!thead || !tbody || !matrizData) return;

        thead.innerHTML = "";
        tbody.innerHTML = "";

        const columnas = matrizData.columnas || ["ID_REGISTRO", "FECHA"];
        const datos = matrizData.datos || [];

        // 1. Crear Fila de Encabezados con las columnas mutables
        const filaHeaders = document.createElement("tr");
        columnas.forEach(colName => {
            const th = document.createElement("th");
            th.textContent = colName;
            filaHeaders.appendChild(th);
        });
        thead.appendChild(filaHeaders);

        // 2. Colocar los renglones correspondientes
        if (datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${columnas.length}" style="text-align:center; color:#888; padding: 20px;">Estructura de columnas lista. No hay filas registradas aún en MATRIZ_GASTOS.</td></tr>`;
            return;
        }

        datos.forEach(rowItem => {
            const fila = document.createElement("tr");
            columnas.forEach(colName => {
                const td = document.createElement("td");
                td.textContent = rowItem[colName] || ""; // Busca dinámicamente la propiedad coincidente
                fila.appendChild(td);
            });
            tbody.appendChild(fila);
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