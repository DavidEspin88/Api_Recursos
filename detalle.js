(() => {
    const tablaDetalles = document.getElementById("tablaDetalles");
    const selectTipoGastoDetalle = document.getElementById("selectTipoGastoDetalle");
    const inputNombre = document.getElementById("nombreGastoDetalle");
    const inputIdOculto = document.getElementById("editIdDetalleGasto");
    const btnGuardar = document.getElementById("btnGuardarDetalle");

    if (btnGuardar) {
        btnGuardar.addEventListener("click", guardarCategoriaDetalle);
    }

    window.renderizarModuloDetalles = function() {
        const data = window.apiCache;
        if (!selectTipoGastoDetalle || !tablaDetalles) return;
        
        const valorDetalleSelectActual = selectTipoGastoDetalle.value;
        selectTipoGastoDetalle.innerHTML = `<option value="">-- Seleccionar Tipo --</option>`;
        (data.gasto || []).forEach(g => {
            selectTipoGastoDetalle.innerHTML += `<option value="${g.idGasto}">${g.nombreGasto}</option>`;
        });
        selectTipoGastoDetalle.value = valorDetalleSelectActual;

        tablaDetalles.innerHTML = "";
        const listaCategorias = data.detalleGasto || [];

        if (listaCategorias.length === 0) {
            tablaDetalles.innerHTML = `<tr><td colspan="5" class="text-center">No hay categorías configuradas.</td></tr>`;
            return;
        }

        listaCategorias.forEach(item => {
            const fila = document.createElement("tr");

            const celdaId = document.createElement("td");
            celdaId.textContent = item.idDetalleGasto;
            fila.appendChild(celdaId);

            const celdaTipo = document.createElement("td");
            celdaTipo.innerHTML = `<strong>${item.nombreGastoPadre || "No asignado"}</strong>`;
            fila.appendChild(celdaTipo);

            const celdaNombre = document.createElement("td");
            celdaNombre.textContent = item.nombreGasto;
            fila.appendChild(celdaNombre);

            const celdaEstado = document.createElement("td");
            celdaEstado.textContent = item.estado || "ACTIVO";
            fila.appendChild(celdaEstado);

            const celdaAcciones = document.createElement("td");
            celdaAcciones.className = "text-center";

            const btnEditar = document.createElement("button");
            btnEditar.textContent = "Editar";
            btnEditar.className = "btn-action-edit";
            btnEditar.addEventListener("click", () => prepararEdicionCategoria(item));

            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "Eliminar";
            btnEliminar.className = "btn-action-delete";
            btnEliminar.addEventListener("click", () => eliminarCategoriaDetalle(item.idDetalleGasto));

            celdaAcciones.appendChild(btnEditar);
            celdaAcciones.appendChild(btnEliminar);
            fila.appendChild(celdaAcciones);

            tablaDetalles.appendChild(fila);
        });
    };

    function guardarCategoriaDetalle() {
        const idGastoPadre = selectTipoGastoDetalle.value;
        const nombreCategoria = inputNombre.value.trim().toUpperCase();
        const idDetalle = inputIdOculto.value;

        if (!idGastoPadre || !nombreCategoria) {
            alert("Por favor, seleccione el Tipo de Gasto e ingrese el Nombre de la Categoría.");
            return;
        }

        let payload = {
            target: "detalle_gasto",
            action: "create",
            idGasto: idGastoPadre,
            nombreGasto: nombreCategoria
        };

        if (idDetalle) {
            payload.action = "update";
            payload.idDetalleGasto = idDetalle;
        }

        btnGuardar.disabled = true;
        fetch(window.API_URL, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                restablecerFormularioCategoria();
                if (typeof window.cargarDatosCentral === "function") {
                    window.cargarDatosCentral();
                }
            } else {
                alert("Error: " + result.message);
            }
        })
        .catch(() => alert("Error de comunicación con la red remota."))
        .finally(() => btnGuardar.disabled = false);
    }

    function eliminarCategoriaDetalle(id) {
        if (!confirm(`¿Desea eliminar de forma permanente la categoría ${id}?`)) return;
        
        fetch(window.API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                target: "detalle_gasto",
                action: "delete",
                id: id
            })
        })
        .then(res => res.json())
        .then(r => {
            if (r.status === "success") {
                if (typeof window.cargarDatosCentral === "function") {
                    window.cargarDatosCentral();
                }
            } else {
                alert(r.message);
            }
        });
    }

    function prepararEdicionCategoria(item) {
        inputIdOculto.value = item.idDetalleGasto;
        inputNombre.value = item.nombreGasto;
        selectTipoGastoDetalle.value = item.idGasto; 
        
        btnGuardar.textContent = "Actualizar Categoría";
        btnGuardar.className = "btn-edit-mode";
        inputNombre.focus();
    }

    function restablecerFormularioCategoria() {
        inputIdOculto.value = "";
        inputNombre.value = "";
        selectTipoGastoDetalle.value = "";
        btnGuardar.textContent = "Crear Categoría";
        btnGuardar.className = "btn-add btn-w-full";
    }
})();