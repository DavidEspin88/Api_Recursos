// URL ÚNICA DEL IMPLEMENTACIÓN DE GOOGLE APPS SCRIPT
window.WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyLrwDbllvjReQ50MxXaL0m_2PgFqXELa4yxr1rbvzML6uWVOQHLELwLaNjnr9S6PJ0zA/exec";

// Caché reactivo global accesible por los demás módulos del ecosistema
window.apiCache = {
    gasto: [],
    detalleGasto: [],
    registroGasto: [],
    matrizGastos: {},
    ingresos: []
};

(() => {
    // Captura de elementos del DOM de la Sección 1
    const tablaGastos = document.getElementById("tablaGastos");
    const inputNombre = document.getElementById("nombreGasto");
    const inputIdOculto = document.getElementById("editIdGasto");
    const btnGuardar = document.getElementById("btnGuardar");

    // Escuchas de eventos principales del ciclo de vida
    document.addEventListener("DOMContentLoaded", cargarDatosCentral);
    btnGuardar.addEventListener("click", guardarRegistroTipo);

    // Exponer la función de carga centralizada para que otros módulos soliciten actualizaciones
    window.cargarDatosCentral = cargarDatosCentral;

 function cargarDatosCentral() {
    // 1. Capturamos el periodo contable activo seleccionado por el usuario (Ej: "2025-01")
    const filtroMesAnioIngreso = document.getElementById("filtroMesAnioIngreso");
    let valorPeriodo = "2026-01"; // Valor por defecto por seguridad
    
    if (filtroMesAnioIngreso && filtroMesAnioIngreso.value) {
        valorPeriodo = filtroMesAnioIngreso.value;
    }

    // 2. Descomponemos el año y el mes para mapearlo al formato esperado por el Backend
    const partes = valorPeriodo.split("-"); // ["2025", "01"]
    const anioSelect = partes[0];
    
    const mesesNombres = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const indiceMes = parseInt(partes[1], 10) - 1;
    const mesSelect = mesesNombres[indiceMes] || "ENERO";
    
    // 3. Enviamos las variables dinámicas exactas a Apps Script
    const urlConFiltros = `${window.WEB_APP_URL}?anio=${anioSelect}&mes=${mesSelect}`;

    fetch(urlConFiltros)
        .then(res => res.json())
        .then(data => {
            window.apiCache = data;

            // Renderizar Tipos de Gasto en la Sección 1
            tablaGastos.innerHTML = "";
            const lista = data.gasto || [];

            if (lista.length === 0) {
                tablaGastos.innerHTML = `<tr><td colspan="3" class="text-center">No hay tipos de gastos registrados.</td></tr>`;
            } else {
                lista.forEach(item => {
                    const fila = document.createElement("tr");
                    fila.innerHTML = `
                        <td><strong>${item.idGasto}</strong></td>
                        <td>${item.nombreGasto}</td>
                        <td class="text-center">
                            <button class="btn-action-edit btn-editar-gasto"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-action-delete btn-borrar-gasto"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    `;
                    fila.querySelector(".btn-editar-gasto").addEventListener("click", () => prepararEdicion(item.idGasto, item.nombreGasto));
                    fila.querySelector(".btn-borrar-gasto").addEventListener("click", () => eliminarRegistro(item.idGasto));
                    tablaGastos.appendChild(fila);
                });
            }

            // Disparar las actualizaciones automáticas en los demás módulos con los nuevos datos del año correcto
            if (typeof window.renderizarModuloDetalles === "function") window.renderizarModuloDetalles();
            if (typeof window.renderizarModuloRegistroGastos === "function") window.renderizarModuloRegistroGastos();
            if (typeof window.renderizarModuloIngresos === "function") window.renderizarModuloIngresos();
        })
        .catch(error => {
            console.error("Error al cargar:", error);
            tablaGastos.innerHTML = `<tr><td colspan="3" class="text-center" style="color:red;">Fallo de comunicación con el servidor.</td></tr>`;
        });
}

    function renderizarTablaTipos() {
        tablaGastos.innerHTML = "";
        const listaTipos = window.apiCache.gasto || [];

        if (listaTipos.length === 0) {
            tablaGastos.innerHTML = `<tr><td colspan="3" class="text-center">No se encontraron tipos de gasto registrados.</td></tr>`;
            return;
        }

        listaTipos.forEach(item => {
            const fila = document.createElement("tr");

            const celdaId = document.createElement("td");
            celdaId.textContent = item.idGasto;
            fila.appendChild(celdaId);

            const celdaNombre = document.createElement("td");
            celdaNombre.innerHTML = `<span class="badge-tipo">${item.nombreGasto}</span>`;
            fila.appendChild(celdaNombre);

            const celdaAcciones = document.createElement("td");
            celdaAcciones.className = "text-center";

            // Botón Editar estilo modular
            const btnEditar = document.createElement("button");
            btnEditar.textContent = "Editar";
            btnEditar.className = "btn-action-edit";
            btnEditar.addEventListener("click", () => prepararEdicionTipo(item.idGasto, item.nombreGasto));

            // Botón Eliminar estilo modular
            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "Eliminar";
            btnEliminar.className = "btn-action-delete";
            btnEliminar.addEventListener("click", () => eliminarRegistroTipo(item.idGasto));

            celdaAcciones.appendChild(btnEditar);
            celdaAcciones.appendChild(btnEliminar);
            fila.appendChild(celdaAcciones);

            tablaGastos.appendChild(fila);
        });
    }

    function guardarRegistroTipo() {
        const nombre = inputNombre.value.trim().toUpperCase();
        const id = inputIdOculto.value;

        if (!nombre) {
            alert("Por favor, ingrese un tipo de gasto válido.");
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
        fetch(window.WEB_APP_URL, { 
            method: "POST", 
            mode: "cors", 
            body: JSON.stringify(payload) 
        })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") { 
                restablecerFormularioTipo(); 
                cargarDatosCentral(); 
            } else {
                alert("Error de procesamiento: " + result.message);
            }
        })
        .catch(err => console.error("Error en la operación del tipo de gasto:", err))
        .finally(() => btnGuardar.disabled = false);
    }

    function eliminarRegistroTipo(id) {
        if (!confirm(`¿Está seguro de eliminar permanentemente el tipo de gasto ${id}?`)) return;
        
        fetch(window.WEB_APP_URL, { 
            method: "POST", 
            mode: "cors", 
            body: JSON.stringify({ target: "gasto", action: "delete", id: id }) 
        })
        .then(res => res.json())
        .then(res => {
            if (res.status === "success") {
                cargarDatosCentral();
            } else {
                alert("No se pudo eliminar el elemento: " + res.message);
            }
        });
    }

    function prepararEdicionTipo(id, nombre) {
        inputIdOculto.value = id;
        inputNombre.value = nombre;
        btnGuardar.textContent = "Actualizar Tipo";
        btnGuardar.className = "btn-edit-mode";
        inputNombre.focus();
    }

    function restablecerFormularioTipo() {
        inputIdOculto.value = "";
        inputNombre.value = "";
        btnGuardar.textContent = "Guardar Tipo";
        btnGuardar.className = "btn-add";
    }
})();