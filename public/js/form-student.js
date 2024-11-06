document.addEventListener('DOMContentLoaded', function () {
    const fechaInicioInput = document.getElementById('fecha-inicio');
    const fechaFinInput = document.getElementById('fecha-fin');

    fechaInicioInput.addEventListener('change', function () {
        const fechaInicio = new Date(fechaInicioInput.value);

        // Configura la fecha mínima y máxima para fechaFin
        const fechaMin = new Date(fechaInicio);
        const fechaMax = new Date(fechaInicio);
        fechaMax.setHours(fechaMax.getHours() + 2); // Agrega 2 horas

        // Formatea las fechas a 'YYYY-MM-DDTHH:mm' para el input datetime-local
        const fechaMinStr = fechaMin.toISOString().slice(0, 16); // Asegura formato correcto
        const fechaMaxStr = fechaMax.toISOString().slice(0, 16); // Asegura formato correcto

        // Aplica las restricciones en el campo fechaFin
        fechaFinInput.min = fechaMinStr;
        fechaFinInput.max = fechaMaxStr;

        // Establece el valor predeterminado en fecha-fin al mínimo permitido (2 horas después)
        fechaFinInput.value = fechaMaxStr;
    });
});
