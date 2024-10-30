// form-handler.js
document.querySelector('.index-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const role = this.getAttribute('data-role'); 

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
            alert(`Error: ${result.error}`);
        } else {
            alert(result.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Hubo un error al enviar la solicitud.');
    });
});
