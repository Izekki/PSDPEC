// Seleccion de los elementos
const profesorBtn = document.getElementById('profesorBtn');
const estudianteBtn = document.getElementById('estudianteBtn');
const profesorForm = document.getElementById('profesorForm');
const estudianteForm = document.getElementById('estudianteForm');

// Mostrar formulario de profesor al hacer clic en el boton
profesorBtn.addEventListener('click', () => {
    profesorForm.classList.remove('hidden');
    estudianteForm.classList.add('hidden');
});

// Mostrar formulario de estudiante al hacer clic en el boton
estudianteBtn.addEventListener('click', () => {
    estudianteForm.classList.remove('hidden');
    profesorForm.classList.add('hidden');
});