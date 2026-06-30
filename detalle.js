(() => {
    // REEMPLAZA CON TU URL SI ES DIFERENTE
    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwjpL9sc5LArWMyC8yMprHmfjdhOPnanlKS5hy26WzWsuSOfdcnpGS6ZE4KCCvYe5wx/exec";

    const tablaDetalles = document.getElementById("tablaDetalles");
    const inputNombre = document.getElementById("nombreGastoDetalle");
    const inputIdOculto = document.getElementById("editIdDetalleGasto");
    const btnGuardar = document.getElementById("btnGuardarDetalle");

    document.addEventListener("DOMContentLoaded", cargarDetalles);
    btnGuardar.addEventListener("click", guardarDetail);

    function cargarDetalles() {
        fetch(WEB_APP_URL)
            .then(response => {
                if (!response.ok) throw new Error("Error de red al intentar conectar.");
                return response.json();
            })
            .then(data => {
                tablaDetalles.innerHTML = "";
                
                // Forzamos la captura verificando la estructura exacta del objeto devuelto
                const lista = data.detalleGasto || data.detalle; 

                if (!lista || lista.length === 0) {
                    tablaDetalles.innerHTML = `<tr><td colspan="3" style="text-align:center;">No hay detalles de gastos registrados.</td></tr>`;
                    return;
                }

                lista.forEach(item => {
                    const fila = document.createElement("tr");
                    
                    // Verificamos que las propiedades internas existan antes de pintar la celda
                    const idGastoDetalle = item.idDetalleGasto || item.idGasto;
                    const nombreGastoText = item.nombreGasto;

                    fila.innerHTML = `
                        <td><strong>${idGastoDetalle}</strong></td>
                        <td>${nombreGastoText}</td>
                        <td style="text-align: center;">
                            <button class="btn-action-edit btn-editar-detalle">Editar</button>
                            <button class="btn-action-delete btn-borrar-detalle">Borrar</button>
                        </td>
                    `;
                    
                    // Asignación de eventos segura
                    fila.querySelector(".btn-editar-detalle").addEventListener("click", () => prepararEdicion(idGastoDetalle, nombreGastoText));
                    fila.querySelector(".btn-borrar-detalle").addEventListener("click", () => eliminarDetalle(idGastoDetalle));
                    
                    tablaDetalles.appendChild(fila);
                });
            })
            .catch(error => {
                console.error("Error detallado de renderizado:", error);
                tablaDetalles.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Error al procesar o renderizar los datos.</td></tr>`;
            });
    }

    function guardarDetail() {
        const nombre = inputNombre.value.trim();
        const id = inputIdOculto.value;

        if (!nombre) {
            alert("Por favor, ingrese un nombre de detalle válido.");
            return;
        }

        let payload = {
            target: "detalle_gasto",
            action: "create",
            nombreGasto: nombre
        };

        if (id) {
            payload.action = "update";
            payload.idDetalleGasto = id;
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
                cargarDetalles();
            } else {
                alert("Error: " + result.message);
            }
        })
        .catch(err => {
            console.error("Error:", err);
            alert("Error de red.");
        })
        .finally(() => {
            btnGuardar.disabled = false;
        });
    }

    function eliminarDetalle(id) {
        if (!confirm(`¿Está seguro de eliminar permanentemente el detalle con ID: ${id}?`)) return;

        const payload = {
            target: "detalle_gasto",
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
                cargarDetalles();
            } else {
                alert("Error al eliminar: " + result.message);
            }
        })
        .catch(err => console.error("Error:", err));
    }

    function prepararEdicion(id, nombre) {
        inputIdOculto.value = id;
        inputNombre.value = nombre;
        
        btnGuardar.textContent = "Actualizar Detalle";
        btnGuardar.style.backgroundColor = "#d69e2e";
        inputNombre.focus();
    }

    function restablecerFormulario() {
        inputIdOculto.value = "";
        inputNombre.value = "";
        btnGuardar.textContent = "Crear Detalle";
        btnGuardar.style.backgroundColor = "#1abc9c";
    }
})();