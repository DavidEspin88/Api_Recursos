(() => {
 
    const tablaDetalles = document.getElementById("tablaDetalles");
    const selectTipoGastoDetalle = document.getElementById("selectTipoGastoDetalle");
    const inputNombre = document.getElementById("nombreGastoDetalle");
    const inputIdOculto = document.getElementById("editIdDetalleGasto");
    const btnGuardar = document.getElementById("btnGuardarDetalle");

  btnGuardar.addEventListener("click", guardarDetail);

  // Expuesto globalmente para ser invocado de forma reactiva
window.renderizarModuloDetalles = function() {
        const data = window.apiCache;
        
        // 1. Rellenar selectores de tipos de gasto en el formulario de categorías
        const valorDetalleSelect = selectTipoGastoDetalle.value;
        selectTipoGastoDetalle.innerHTML = `<option value="">-- Seleccionar Tipo --</option>`;
        (data.gasto || []).forEach(g => {
            selectTipoGastoDetalle.innerHTML += `<option value="${g.idGasto}">${g.nombreGasto}</option>`;
        });
        selectTipoGastoDetalle.value = valorDetalleSelect;

        // 2. Pintar la tabla del Catálogo de Categorías
        tablaDetalles.innerHTML = "";
        const lista = data.detalleGasto || [];

        if (lista.length === 0) {
            tablaDetalles.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay categorías configuradas.</td></tr>`;
            return;
        }

        lista.forEach(item => {
            const fila = document.createElement("tr");
            const esActivo = item.estado !== "INACTIVO";
            
            fila.innerHTML = `
                <td><strong>${item.idDetalleGasto}</strong></td>
                <td><span class="badge-gasto" style="background:#edf2f7; padding:4px 8px; border-radius:4px; font-weight:bold;">${item.nombreGasto}</span></td>
                <td>${item.idGasto}</td>
                <td>
                    <span style="color: ${esActivo ? '#2f855a' : '#e53e3e'}; font-weight: bold;">
                        ${item.estado || "ACTIVO"}
                    </span>
                </td>
                <td style="text-align: center;">
                    <button class="btn-action-edit btn-editar-detalle">Editar</button>
                    <button class="btn-action-edit btn-toggle-detalle" style="background-color:#4a5568; color:white;">Alternar</button>
                    <button class="btn-action-delete btn-borrar-detalle">Borrar</button>
                </td>
            `;

            fila.querySelector(".btn-editar-detalle").addEventListener("click", () => prepararEdicion(item));
            fila.querySelector(".btn-toggle-detalle").addEventListener("click", () => alternarEstado(item.idDetalleGasto));
            fila.querySelector(".btn-borrar-detalle").addEventListener("click", () => eliminarDetalle(item.idDetalleGasto));
            
            tablaDetalles.appendChild(fila);
        });
    };

  function cargarDetalles() {
    fetch(WEB_APP_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Error de red al intentar conectar.");
        return response.json();
      })
      .then((data) => {
        tablaDetalles.innerHTML = "";

        // Forzamos la captura verificando la estructura exacta del objeto devuelto
        const lista = data.detalleGasto || data.detalle;

        if (!lista || lista.length === 0) {
          tablaDetalles.innerHTML = `<tr><td colspan="3" style="text-align:center;">No hay detalles de gastos registrados.</td></tr>`;
          return;
        }

        lista.forEach((item) => {
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
          fila
            .querySelector(".btn-editar-detalle")
            .addEventListener("click", () =>
              prepararEdicion(idGastoDetalle, nombreGastoText),
            );
          fila
            .querySelector(".btn-borrar-detalle")
            .addEventListener("click", () => eliminarDetalle(idGastoDetalle));

          tablaDetalles.appendChild(fila);
        });
      })
      .catch((error) => {
        console.error("Error detallado de renderizado:", error);
        tablaDetalles.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Error al procesar o renderizar los datos.</td></tr>`;
      });
  }
function alternarEstado(id) {
        fetch(window.WEB_APP_URL, { method: "POST", body: JSON.stringify({ target: "detalle_gasto", action: "toggle_estado", id: id }) })
        .then(res => res.json()).then(() => location.reload());
    }
function guardarDetail() {
        const nombre = inputNombre.value.trim();
        const idGastoSelect = selectTipoGastoDetalle.value;
        const id = inputIdOculto.value;

        if (!idGastoSelect) return alert("Por favor, seleccione un Tipo de Gasto ejecutor.");
        if (!nombre) return alert("Por favor, ingrese un nombre de categoría válido.");

        let payload = {
            target: "detalle_gasto",
            action: "create",
            idGasto: idGastoSelect,
            nombreGasto: nombre
        };

        if (id) {
            payload.action = "update";
            payload.idDetalleGasto = id;
        }

        btnGuardar.disabled = true;
        fetch(window.WEB_APP_URL, { method: "POST", mode: "cors", body: JSON.stringify(payload) })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                restablecerFormulario();
                // Provoca una recarga limpia invocando al cargador central de script.js
                document.dispatchEvent(new Event("DOMContentLoaded"));
                location.reload(); 
            } else {
                alert("Error: " + result.message);
            }
        })
        .catch(() => alert("Error de comunicación de red."))
        .finally(() => btnGuardar.disabled = false);
    }

  function eliminarDetalle(id) {
    if (!confirm(`¿Desea eliminar de forma permanente la categoría ${id}?`))
      return;
    fetch(window.WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({
        target: "detalle_gasto",
        action: "delete",
        id: id,
      }),
    })
      .then((res) => res.json())
      .then((r) =>
        r.status === "success" ? location.reload() : alert(r.message),
      );
  }

function prepararEdicion(item) {
        inputIdOculto.value = item.idDetalleGasto;
        inputNombre.value = item.nombreGasto; // Corregido: Muestra el nombre real de la subcategoría
        selectTipoGastoDetalle.value = item.idGasto; 
        
        btnGuardar.textContent = "Actualizar Categoría";
        btnGuardar.style.backgroundColor = "#d69e2e";
        inputNombre.focus();
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
        selectTipoGastoDetalle.value = "";
        btnGuardar.textContent = "Crear Categoría";
        btnGuardar.style.backgroundColor = "#1abc9c";
    }
})();
