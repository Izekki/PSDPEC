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


// Ruta para validar credenciales de inicio de sesión
router.post('/login', (req, res) => {
    const { correo, contrasenia } = req.body;
    
    // Consulta para verificar las credenciales en la tabla 'administradores'
    const query = 'SELECT * FROM administradores WHERE correo = ? AND contrasenia = ?';

    connection.query(query, [correo, contrasenia], (err, results) => {
        if (err) {
            console.error('Error al verificar las credenciales:', err);
            res.status(500).send('Error en el servidor');
            return;
        }

        if (results.length > 0) {
            // Redirigir al usuario a una página de éxito (reemplaza 'pagina-de-exito.html' con la página final)
            res.redirect('/formularios/admin');
        } else {
            // Credenciales incorrectas
            res.status(401).send('Credenciales incorrectas');
        }
    });
});

// Listar todas las solicitudes de préstamo
router.get('/listar', (req, res) => {
    const query = 'SELECT * FROM solicitudes';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al listar solicitudes:', err);
            res.status(500).json({ error: 'Error al obtener las solicitudes' });
        } else {
            res.json(results);
        }
    });
});

// Aprobar una solicitud de préstamo
router.post('/aprobar/:id', (req, res) => {
    const { id } = req.params;
    const query = 'UPDATE solicitudes SET estado = "Aprobada" WHERE id = ?';
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al aprobar la solicitud:', err);
            res.status(500).json({ error: 'Error al aprobar la solicitud' });
        } else {
            res.json({ message: 'Solicitud aprobada correctamente' });
        }
    });
});

// Rechazar una solicitud de préstamo
router.post('/rechazar/:id', (req, res) => {
    const { id } = req.params;
    const query = 'UPDATE solicitudes SET estado = "Rechazada" WHERE id = ?';
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al rechazar la solicitud:', err);
            res.status(500).json({ error: 'Error al rechazar la solicitud' });
        } else {
            res.json({ message: 'Solicitud rechazada correctamente' });
        }
    });
});

// Eliminar una solicitud de préstamo
router.delete('/eliminar/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM solicitudes WHERE id = ?';
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar la solicitud:', err);
            res.status(500).json({ error: 'Error al eliminar la solicitud' });
        } else {
            res.json({ message: 'Solicitud eliminada correctamente' });
        }
    });
});

// Obtener estadísticas de solicitudes
router.get('/estadisticas', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN estado = 'Aprobada' THEN 1 ELSE 0 END) AS aprobadas,
            SUM(CASE WHEN estado = 'Rechazada' THEN 1 ELSE 0 END) AS rechazadas,
            SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendientes
        FROM solicitudes
    `;
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener estadísticas:', err);
            res.status(500).json({ error: 'Error al obtener estadísticas' });
        } else {
            res.json(results[0]);
        }
    });
});


module.exports = router;
