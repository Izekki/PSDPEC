document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role'); 

    document.querySelector('.form-teacher').addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(this);
        const data = {
            matricula: formData.get('matricula'),
            equipo: formData.get('equipo'),
            ubicacion: formData.get('ubicacion'),
            fecha_inicio: formData.get('fecha-inicio'),
            fecha_fin: formData.get('fecha-fin'),
            tipo_usuario: role
        };

        fetch('/solicitudes/enviar-solicitud', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                document.getElementById('error-message').textContent = `Error: ${result.error}`;
            } else {
                alert(result.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('error-message').textContent = 'Hubo un error al enviar la solicitud.';
        });
    });
});