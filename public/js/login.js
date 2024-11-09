document.getElementById('login-button').addEventListener('click', async () => {
    const correo = document.getElementById('email').value;
    const contrasenia = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch('/solicitudes/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasenia })
        });

        const data = await response.json();

        if (data.success) {
            // Redirigir a la URL proporcionada
            window.location.href = data.redirectUrl;
        } else {
            // Mostrar mensaje de error
            errorMessage.textContent = data.message;
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error en la solicitud de inicio de sesión:', error);
        errorMessage.textContent = 'Error en la conexión';
        errorMessage.style.display = 'block';
    }
});


function userBack(){
    window.location.href = '/formularios/selectUser';
}
