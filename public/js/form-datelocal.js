document.addEventListener('DOMContentLoaded', function () {
    const fechaInicioInput = document.getElementById('fecha-inicio');
    const fechaFinInput = document.getElementById('fecha-fin');

    fechaInicioInput.addEventListener('change', function () {
        const fechaInicio = new Date(fechaInicioInput.value);

        const fechaMin = new Date(fechaInicio);
        const fechaMax = new Date(fechaInicio);
        fechaMax.setHours(fechaMax.getHours() + 2); 

        const fechaMinStr = fechaMin.toLocaleString('sv-SE').slice(0, 16);
        const fechaMaxStr = fechaMax.toLocaleString('sv-SE').slice(0, 16);

        fechaFinInput.min = fechaMinStr;
        fechaFinInput.max = fechaMaxStr;

        fechaFinInput.value = fechaMaxStr;

        fechaFinInput.disabled = true;
    });
});
