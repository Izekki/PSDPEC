document.addEventListener('DOMContentLoaded', () => {
    loadRequests();
    loadStatistics();
    updateTableTitleAndHeader('solicitudes');
});

let tipoDeTabla = 'solicitudes';

function updateTableTitleAndHeader(type) {
    const title = document.getElementById('table-title');
    const header = document.getElementById('table-header');

    if (type === 'solicitudes') {
        title.textContent = 'Lista de Solicitudes';
        header.innerHTML = `
            <th>ID Solicitud</th>
            <th>Tipo Usuario</th>
            <th>Correo</th>
            <th>Ubicación Actual</th>
            <th>Fecha Inicio</th>
            <th>Fecha Entrega</th>
            <th>Estado</th>
            <th>Equipo</th>
            <th>Acciones</th>
        `;
    } else if (type === 'prestamos') {
        title.textContent = 'Lista de Préstamos';
        header.innerHTML = `
            <th>ID Préstamo</th>
            <th>Tipo Equipo</th>
            <th>ID Solicitud</th>
            <th>Fecha Entrega</th>
            <th>Fecha Devolución</th>
            <th>Estado</th>
            <th>Acciones</th>

        `;
    }else if (type === 'historial-solicitudes') {
        title.textContent = 'Historial de Solicitudes';
        header.innerHTML = `
            <th>ID Solicitud</th>
            <th>Tipo Usuario</th>
            <th>Correo</th>
            <th>Ubicación Actual</th>
            <th>Fecha Inicio</th>
            <th>Fecha Entrega</th>
            <th>Estado</th>
            <th>Equipo</th>
        `;
    } else if (type === 'historial-prestamos') {
        title.textContent = 'Historial de Préstamos';
        header.innerHTML = `
            <th>ID Préstamo</th>
            <th>Tipo Equipo</th>
            <th>ID Solicitud</th>
            <th>Fecha Entrega</th>
            <th>Fecha Devolución</th>
            <th>Estado</th>
        `;
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', options);
}

function loadData(endpoint, type) {
    console.log(`Cargando ${type}...`);
    fetch(endpoint)
        .then(response => {
            if (!response.ok) throw new Error(`Error ${response.status}`);
            return response.json();
        })
        .then(data => mostrarDatos(data, type))
        .catch(error => console.error(`Error al cargar ${type}:`, error));
}

function loadRequests() {
    loadData('/solicitudes/listar-solicitudes?estado=Pendiente', 'solicitudes');
}

function listarSolicitudes(){
    tipoDeTabla = 'solicitudes';
    updateTableTitleAndHeader('solicitudes');
    loadRequests();
}

function loadPrestamos() {
    const estado = 'No entregado';
    const encodedEstado = encodeURIComponent(estado);
    loadData(`/solicitudes/listar-prestamos?estado_prestamo=${encodedEstado}`, 'prestamos');
}

function listarPrestamos(){
    tipoDeTabla = 'prestamos';
    updateTableTitleAndHeader('prestamos');
    loadPrestamos();
}

function loadStatistics() {
    fetch('/solicitudes/estadisticas')
        .then(response => response.json())
        .then(data => {
            const statsContainer = document.getElementById('stats-container');
            statsContainer.innerHTML = `
                <p>Total de Solicitudes: ${data.total}</p>
                <p>Aprobadas: ${data.aprobadas}</p>
                <p>Rechazadas: ${data.rechazadas}</p>
                <p>Pendientes: ${data.pendientes}</p>
            `;
        })
        .catch(error => console.error('Error al cargar estadísticas:', error));
}

function listarSolicitudesHistorial() {
    tipoDeTabla = 'historial-solicitudes';
    updateTableTitleAndHeader('historial-solicitudes');
    fetch('/solicitudes/listar-solicitudes')
        .then(response => response.json())
        .then(data => {
            mostrarDatos(data, 'historial-solicitudes');
        })
        .catch(error => console.error('Error al cargar historial de solicitudes:', error));
}

function listarPrestamosHistorial() {
    tipoDeTabla = 'historial-prestamos';
    updateTableTitleAndHeader('historial-prestamos');
    fetch('/solicitudes/listar-prestamos')
        .then(response => response.json())
        .then(data => {
            mostrarDatos(data, 'historial-prestamos');
        })
        .catch(error => console.error('Error al cargar historial de préstamos:', error));
}


function approveRequest(id) {
    fetch(`/solicitudes/aprobar/${id}`, { method: 'POST' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            loadRequests();
        })
        .catch(error => {
            console.error('Error al aprobar solicitud:', error);
            alert('Ocurrió un error al aprobar la solicitud. Inténtalo de nuevo.');
        });
}

function rejectRequest(id) {
    fetch(`/solicitudes/rechazar/${id}`, { method: 'POST' })
        .then(response => response.json())
        .then(data => loadRequests())
        .catch(error => console.error('Error al rechazar solicitud:', error));
}

function deleteRequest(id) {
    fetch(`/solicitudes/eliminar/${id}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => loadRequests())
        .catch(error => console.error('Error al eliminar solicitud:', error));
}

function logout() {
    fetch('/solicitudes/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => {
        if (response.ok) {
            window.location.href = '/formularios/tecnico';
        } else {
            alert('Error al cerrar sesión. Inténtalo de nuevo.');
        }
    })
    .catch(error => {
        console.error('Error al cerrar sesión:', error);
        alert('Ocurrió un error al cerrar sesión.');
    });
}

function filtrar() {
    const tipoUsuario = document.getElementById('filtroTipoUsuario').value;
    const estado = document.getElementById('filtroEstado').value;
    const fechaInicio = document.getElementById('filtroFechaInicio').value;

    obtenerDatosFiltrados(tipoUsuario, estado, fechaInicio, tipoDeTabla);  // Usar tipoDeTabla aquí
    console.log(tipoUsuario, estado, fechaInicio, tipoDeTabla);
}

function obtenerDatosFiltrados(tipoUsuario, estado, fechaInicio) {
    const queryParams = new URLSearchParams({
        tipo_usuario: tipoUsuario,
        estado: estado,
        fecha_inicio: fechaInicio
    });

    let endpoint = '';
    if (tipoDeTabla === 'solicitudes') {
        endpoint = `/solicitudes/solicitudes-filtradas?${queryParams}`;
    } else if (tipoDeTabla === 'prestamos') {
        endpoint = `/solicitudes/prestamos-filtrados?${queryParams}`;
    } else if (tipoDeTabla === 'historial-solicitudes') {
        endpoint = `/solicitudes/solicitudes-filtradas?${queryParams}`;
    } else if (tipoDeTabla === 'historial-prestamos') {
        endpoint = `/solicitudes/prestamos-filtrados?${queryParams}`;
    }

    fetch(endpoint)
        .then(response => response.json())
        .then(data => {
            mostrarDatos(data, tipoDeTabla); // Aquí se pasa el tipo correcto para mostrar los datos.
        })
        .catch(error => {
            console.error('Error al obtener datos filtrados:', error);
        });
}


function mostrarDatos(data, type) {
    const tableBody = document.getElementById('request-table-body');
    tableBody.innerHTML = '';

    // Limpiar el contenedor de historial
    const historialButtonContainer = document.getElementById('historial-button-container');
    historialButtonContainer.innerHTML = '';

    if (type === 'solicitudes') {
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id_solicitud}</td>
                <td>${item.tipo_usuario}</td>
                <td>${item.correo || 'No especificado'}</td>
                <td>${item.ubicacion_actual || 'No especificado'}</td>
                <td>${formatDate(item.fecha_inicio)}</td>
                <td>${formatDate(item.fecha_entrega)}</td>
                <td>${item.estado}</td>
                <td>${item.nombre_equipo || 'No especificado'}</td>
                <td>
                    <button class="btn-acciones btn-general" onclick="approveRequest(${item.id_solicitud})">Aceptar</button>
                    <button class="btn-acciones btn-general" onclick="rejectRequest(${item.id_solicitud})">Rechazar</button>
                    <button class="btn-acciones btn-general" onclick="deleteRequest(${item.id_solicitud})">Eliminar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Crear el botón de historial dinámicamente para solicitudes
        const historialButton = document.createElement('button');
        historialButton.textContent = 'Ver Historial de Solicitudes';
        historialButton.classList.add('btn-acciones', 'btn-general');
        historialButton.onclick = listarSolicitudesHistorial; // Llamar a listarHistorial al hacer clic
        historialButtonContainer.appendChild(historialButton);

    } else if (type === 'prestamos') {
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id_prestamo}</td>
                <td>${item.tipo_equipo}</td>
                <td>${item.id_solicitud}</td>
                <td>${formatDate(item.fecha_entrega)}</td>
                <td>${formatDate(item.fecha_devolucion)}</td>
                <td>${item.estado_prestamo}</td>
                <td>
                    <button class="btn-acciones btn-general" onclick="">Entregado</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Crear el botón de historial dinámicamente para préstamos
        const historialButton = document.createElement('button');
        historialButton.textContent = 'Ver Historial de Préstamos';
        historialButton.classList.add('btn-acciones', 'btn-general');
        historialButton.onclick = listarPrestamosHistorial; // Llamar a listarPrestamosHistorial al hacer clic
        historialButtonContainer.appendChild(historialButton);

    }else if (type === 'historial-solicitudes') {
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id_solicitud}</td>
                <td>${item.tipo_usuario}</td>
                <td>${item.correo || 'No especificado'}</td>
                <td>${item.ubicacion_actual || 'No especificado'}</td>
                <td>${formatDate(item.fecha_inicio)}</td>
                <td>${formatDate(item.fecha_entrega)}</td>
                <td>${item.estado}</td>
                <td>${item.nombre_equipo || 'No especificado'}</td>
            `;
            tableBody.appendChild(row);
        });
    }else if (type === 'historial-prestamos') {
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id_prestamo}</td>
                <td>${item.tipo_equipo}</td>
                <td>${item.id_solicitud}</td>
                <td>${formatDate(item.fecha_entrega)}</td>
                <td>${formatDate(item.fecha_devolucion)}</td>
                <td>${item.estado_prestamo}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}