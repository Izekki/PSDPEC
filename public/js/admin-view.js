document.addEventListener('DOMContentLoaded', () => {
    loadRequests();
    loadStatistics();
});

function loadRequests() {
    console.log('Cargando solicitudes...');
    fetch('/solicitudes/listar')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('request-table-body');
            tableBody.innerHTML = '';

            data.forEach(request => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${request.id_solicitud}</td>
                    <td>${request.tipo_usuario}</td>
                    <td>${request.correo || 'No especificado'}</td>
                    <td>${request.ubicacion_actual || 'No especificado'}</td>
                    <td>${request.fecha_inicio}</td>
                    <td>${request.fecha_entrega}</td>
                    <td>${request.estado}</td>
                    <td>${request.nombre_equipo || 'No especificado'}</td>
                    <td>
                        <button onclick="approveRequest(${request.id_solicitud})">Aceptar</button>
                        <button onclick="rejectRequest(${request.id_solicitud})">Rechazar</button>
                        <button onclick="deleteRequest(${request.id_solicitud})">Eliminar</button>
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
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            alert(data.message); // Muestra el mensaje de éxito
            loadRequests(); // Vuelve a cargar las solicitudes para mostrar los cambios
        })
        .catch(error => {
            console.error('Error al aprobar solicitud:', error);
            alert('Ocurrió un error al aprobar la solicitud. Inténtalo de nuevo.'); // Notifica al usuario del error
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
