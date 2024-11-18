document.addEventListener('DOMContentLoaded', () => {
    loadRequests();
    loadStatistics();
    updateTableTitleAndHeader('solicitudes');
});



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
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', options);
}

function loadRequests() {
    console.log('Cargando solicitudes...');
    fetch('/solicitudes/listar-solicitudes')
        .then(response => response.json())
        .then(data => {
            mostrarDatos(data,"solicitudes");
            });
        }

function listarSolicitudes(){
    updateTableTitleAndHeader('solicitudes');
    loadRequests();
}

function loadPrestamos() {
    console.log('Cargando préstamos...');
    fetch('/solicitudes/listar-prestamos')
        .then(response => response.json())
        .then(data => {
            mostrarDatos(data, 'prestamos'); 
        })
        .catch(error => {
            console.error('Error al cargar préstamos:', error);
        });
}

function listarPrestamos(){
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

function filtrar(){
    const tipoUsuario = document.getElementById('filtroTipoUsuario').value;
    const estado = document.getElementById('filtroEstado').value;
    const fechaInicio = document.getElementById('filtroFechaInicio').value;

    obtenerSolicitudesFiltradas(tipoUsuario, estado, fechaInicio);
    console.log(tipoUsuario, estado, fechaInicio);
}

function obtenerSolicitudesFiltradas(tipoUsuario, estado, fechaInicio) {
    const queryParams = new URLSearchParams({
        tipo_usuario: tipoUsuario,
        estado: estado,
        fecha_inicio: fechaInicio
    });
    console.log(queryParams.toString())

    fetch(`/solicitudes/listar-filtradas?${queryParams}`)
        .then(response => response.json())
        .then(data => {
            mostrarDatos(data, 'solicitudes');
        })
        .catch(error => {
            console.error('Error al obtener solicitudes filtradas:', error);
        });
}

function mostrarDatos(data, type) {
    const tableBody = document.getElementById('request-table-body');
    tableBody.innerHTML = '';
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
                    <button class ="btn-acciones btn-general" onclick="approveRequest(${item.id_solicitud})">Aceptar</button>
                    <button class ="btn-acciones btn-general" onclick="rejectRequest(${item.id_solicitud})">Rechazar</button>
                    <button class ="btn-acciones btn-general" onclick="deleteRequest(${item.id_solicitud})">Eliminar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
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
                    <button class ="btn-acciones btn-general" onclick="">Entregado</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}