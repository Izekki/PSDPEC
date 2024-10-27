document.addEventListener('DOMContentLoaded', () => {
    loadRequests();
    loadStatistics();
});

function loadRequests() {
    fetch('/solicitudes/listar')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('request-table-body');
            tableBody.innerHTML = '';

            data.forEach(request => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${request.id}</td>
                    <td>${request.usuario}</td>
                    <td>${request.equipo}</td>
                    <td>${request.ubicacion}</td>
                    <td>${request.fecha_inicio}</td>
                    <td>${request.fecha_fin}</td>
                    <td>${request.estado}</td>
                    <td>
                        <button onclick="approveRequest(${request.id})">Aceptar</button>
                        <button onclick="rejectRequest(${request.id})">Rechazar</button>
                        <button onclick="deleteRequest(${request.id})">Eliminar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error al cargar solicitudes:', error));
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
        .then(response => response.json())
        .then(data => loadRequests())
        .catch(error => console.error('Error al aprobar solicitud:', error));
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
