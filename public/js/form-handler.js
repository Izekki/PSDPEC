document.querySelector('.login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Evita el envío tradicional del formulario

    const formData = new FormData(this);
    const data = {
        matricula: formData.get('matricula'),
        equipo: formData.get('equipo'),
        ubicacion: formData.get('ubicacion'),
        'fecha-inicio': formData.get('fecha-inicio'),
        'fecha-fin': formData.get('fecha-fin')
    };

    fetch('/solicitudes/enviar-solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            alert(`Error: ${result.error}`);
        } else {
            alert(result.message); // Mensaje de éxito
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Hubo un error al enviar la solicitud.');
    });
});
