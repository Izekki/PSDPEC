document.addEventListener('DOMContentLoaded', () => {
    loadRequests();
    loadStatistics();
    updateTableTitleAndHeader('solicitudes');
});

let tipoDeTabla = 'solicitudes';
let deleteRequestId = null;

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

function formatDateHours(dateString) {
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
    };
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', options);
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
                <p>Total de Solicitudes: ${data.totalSolicitudes}</p>
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

function listarFiltrosSolicitudes() {
    document.getElementById('filters-prestamos').style.display = 'none';
    
    document.getElementById('filters-solicitudes').style.display = 'block';

    document.getElementById('filtroTipoUsuario').value = '';  
    document.getElementById('filtroEstado').value = ''; 
    document.getElementById('filtroFechaInicio').value = '';
}

function listarFiltrosPrestamos() {
    document.getElementById('filters-solicitudes').style.display = 'none';
    
    document.getElementById('filters-prestamos').style.display = 'block';

    document.getElementById('filtroTipoEquipo').value = '';  
    document.getElementById('filtroEstadoPrestamo').value = '';  
    document.getElementById('filtroFechaEntrega').value = ''; 
}

function approveRequest(id) {
    if(tipoDeTabla === 'solicitudes'){

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
    } else if(tipoDeTabla === 'prestamos'){
        console.log(id)
        fetch(`/solicitudes/entregado/${id}`, { method: 'POST' })
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
}

function rejectRequest(id) {
    fetch(`/solicitudes/rechazar/${id}`, { method: 'POST' })
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
            console.error('Error al rechazar solicitud:', error);
            alert('Ocurrió un error al rechazar la solicitud. Inténtalo de nuevo.');
        });
}

function openDeleteModal(id) {
    deleteRequestId = id;
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'block';
}

function closeDeleteModal() {
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'none';
}

function confirmDeleteRequest() {
    if (deleteRequestId) {
        fetch(`/solicitudes/eliminar/${deleteRequestId}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                alert(data.message);
                loadRequests();
                closeDeleteModal();
            })
            .catch(error => {
                console.error('Error al eliminar solicitud:', error);
                alert('Ocurrió un error al eliminar la solicitud. Inténtalo de nuevo.');
                closeDeleteModal();
            });
    }
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
    if (tipoDeTabla === 'solicitudes' || tipoDeTabla === 'historial-solicitudes') {
        const tipoUsuario = document.getElementById('filtroTipoUsuario').value;
        const estado = document.getElementById('filtroEstado').value;
        const fechaInicio = document.getElementById('filtroFechaInicio').value;

        obtenerDatosFiltradosSolicitudes(tipoUsuario, estado, fechaInicio, tipoDeTabla);  // Usar tipoDeTabla aquí
    } else if (tipoDeTabla === 'prestamos' || tipoDeTabla === 'historial-prestamos') {
        const tipoEquipo = document.getElementById('filtroTipoEquipo').value;
        const estado = document.getElementById('filtroEstadoPrestamo').value;
        const fechaEntrega = document.getElementById('filtroFechaEntrega').value;

        obtenerDatosFiltradosPrestamos(tipoEquipo, estado, fechaEntrega, tipoDeTabla);
    }
}

function obtenerDatosFiltradosSolicitudes(tipoUsuario, estado, fechaInicio,tipoDeTabla) {
    const queryParams = new URLSearchParams({
        tipo_usuario: tipoUsuario,
        estado: estado,
        fecha_inicio: fechaInicio
    });

    let endpoint = '';
    if (tipoDeTabla === 'solicitudes' || tipoDeTabla === 'historial-solicitudes') {
        endpoint = `/solicitudes/solicitudes-filtradas?${queryParams}`;
    }
    fetch(endpoint)
        .then(response => response.json())
        .then(data => {
            mostrarDatos(data, tipoDeTabla);
        })
        .catch(error => {
            console.error('Error al obtener datos filtrados:', error);
        });
}

function obtenerDatosFiltradosPrestamos(tipoEquipo, estado, fechaEntrega, tipoDeTabla) {
    let queryParams = new URLSearchParams({
        tipo_equipo: tipoEquipo,
        estado_prestamo: estado,
        fecha_entrega: fechaEntrega ? fechaEntrega.replace('T', ' ') : ''
    });

    let endpoint = '';
    if (tipoDeTabla === 'prestamos' || tipoDeTabla === 'historial-prestamos') {
        endpoint = `/solicitudes/prestamos-filtrados?${queryParams}`;
    }

    fetch(endpoint)
        .then(response => response.json())
        .then(data => {
            mostrarDatos(data, tipoDeTabla);
        })
        .catch(error => {
            console.error('Error al obtener datos filtrados:', error);
        });
}

function mostrarDatos(data, type) {
    const tableBody = document.getElementById('request-table-body');
    tableBody.innerHTML = '';

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
                    <button class="btn-acciones btn-general btn-accion-aceptar" onclick="approveRequest(${item.id_solicitud})">Aceptar</button>
                    <button class="btn-acciones btn-general btn-accion-rechazar" onclick="rejectRequest(${item.id_solicitud})">Rechazar</button>
                    <button class="btn-acciones btn-general btn-accion-eliminar" onclick="openDeleteModal(${item.id_solicitud})">Eliminar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        const historialButton = document.createElement('button');
        historialButton.textContent = 'Ver Historial de Solicitudes';
        historialButton.classList.add('btn-acciones', 'btn-general');
        historialButton.onclick = listarSolicitudesHistorial; 
        historialButtonContainer.appendChild(historialButton);

    } else if (type === 'prestamos') {
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id_prestamo}</td>
                <td>${item.tipo_equipo}</td>
                <td>${item.id_solicitud}</td>
                <td>${formatDateHours(item.fecha_entrega)}</td>
                <td>${formatDateHours(item.fecha_devolucion)}</td>
                <td>${item.estado_prestamo}</td>
                <td>
                    <button class="btn-acciones btn-general btn-accion-acceptar" onclick="approveRequest(${item.id_prestamo})">Entregado</button>
                    <button class="btn-acciones btn-general btn-accion-recodar" onclick="enviarCorreo(${item.id_prestamo})">Recordar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        const historialButton = document.createElement('button');
        historialButton.textContent = 'Ver Historial de Préstamos';
        historialButton.classList.add('btn-acciones', 'btn-general');
        historialButton.onclick = listarPrestamosHistorial; 
        historialButtonContainer.appendChild(historialButton);

    } else if (type === 'historial-solicitudes') {
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
    } else if (type === 'historial-prestamos') {
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id_prestamo}</td>
                <td>${item.tipo_equipo}</td>
                <td>${item.id_solicitud}</td>
                <td>${formatDateHours(item.fecha_entrega)}</td>
                <td>${formatDateHours(item.fecha_devolucion)}</td>
                <td>${item.estado_prestamo}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function enviarCorreo(id) {
    fetch(`/solicitudes/recordar/${id}`, {
        method: 'POST',
        credentials: 'include',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            alert('¡Notificación enviada correctamente!');
        } 
    })
    .catch(error => {
        console.error('Error al recordar:', error);
        alert('Ocurrió un error al notificar. Inténtalo de nuevo.');
    });
}


function downloadCSV() {
    const newTab = window.open('', '_blank');

    newTab.location.href = '/solicitudes/estadisticas/descargar';

    setTimeout(() => {
        newTab.close();
    }, 1000);
}