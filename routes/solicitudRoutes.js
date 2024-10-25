const express = require('express');
const router = express.Router();
const connection = require('../db/connection');

// Ruta para enviar solicitudes
router.post('/enviar-solicitud', (req, res) => {
    const { matricula, equipo, ubicacion, 'fecha-inicio': fechaInicio, 'fecha-fin': fechaFin } = req.body;
    
    // Encontrar el ID del equipo según el tipo de equipo seleccionado
    const queryEquipo = 'SELECT id_equipo FROM equipos WHERE tipo_equipo = ? AND estado = "Disponible" LIMIT 1';
    connection.query(queryEquipo, [equipo], (err, results) => {
        if (err) {
            console.error('Error al buscar el equipo:', err);
            res.send('Error al buscar el equipo.');
            return;
        }

        if (results.length === 0) {
            res.send('El equipo solicitado no está disponible.');
            return;
        }

        const idEquipo = results[0].id_equipo;

        // Insertar la solicitud en la tabla "solicitudes"
        const querySolicitud = 'INSERT INTO solicitudes (tipo_usuario, correo, estado, fecha_inicio, fecha_entrega, ubicacion_actual, id_equipo) VALUES (?, ?, ?, ?, ?, ?, ?)';
        connection.query(querySolicitud, ['profesor', 'itez@uv.mx', 'Pendiente', fechaInicio, fechaFin, ubicacion, idEquipo], (err, result) => {
            if (err) {
                console.error('Error al registrar la solicitud:', err);
                res.send('Hubo un error al registrar la solicitud.');
            } else {
                console.log('Solicitud registrada con éxito');
                res.send('Solicitud enviada correctamente.');
            }
        });
    });
});

module.exports = router;
