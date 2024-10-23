// Función para redirigir a la URL del formulario correspondiente
function redirectToForm(formType) {
    let url = '';

    switch (formType) {
        case 'profesor':
            url = '/form-teacher';  // URL para el formulario del profesor
            break;
        case 'estudiante':
            url = '/form-student';  // URL para el formulario del estudiante
            break;
        case 'admin':
            url = '/login';  // URL para el login (puedes cambiarla si deseas otro formulario para admin)
            break;
        default:
            console.error('Tipo de formulario no válido');
            return;
    }

    // Redirigir a la URL del formulario
    window.location.href = url;
}

// Agregar eventos de clic a los botones
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('profesor-button').onclick = () => redirectToForm('profesor');
    document.getElementById('student-button').onclick = () => redirectToForm('estudiante');
    document.getElementById('admin-button').onclick = () => redirectToForm('admin');
});