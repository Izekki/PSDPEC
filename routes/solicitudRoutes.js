const express = require('express');
const router = express.Router();
const connection = require('../db/connection');
const session = require('express-session');

// Configura express-session
router.use(session({
    secret: 'tu_clave_secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Ruta de inicio de sesión
router.post('/login', (req, res) => {
    const { correo, contrasenia } = req.body;
    const query = 'SELECT * FROM administradores WHERE correo = ? AND contrasenia = ?';

    connection.query(query, [correo, contrasenia], (err, results) => {
        if (err) {
            console.error('Error al verificar las credenciales:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }

        if (results.length > 0) {
            req.session.userId = results[0].id; // Guarda el ID del usuario en la sesión
            return res.json({ success: true, redirectUrl: '/formularios/admin' });
        } else {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }
    });
});

// Ruta para cerrar sesión (logout)
router.post('/logout', (req, res) => {
    console.log(req)
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
        }
        res.json({ success: true, message: 'Sesión cerrada exitosamente' });
    });
});


// Ruta para enviar solicitudes
router.post('/enviar-solicitud', (req, res) => {
    //console.log(req.body)
    const { matricula, equipo, ubicacion, 'fecha_inicio': fechaInicio, 'fecha_fin': fechaFin, tipo_usuario } = req.body;

    // Validar el tipo de usuario
    if (!['profesor', 'estudiante',].includes(tipo_usuario)) {
        return res.status(400).json({ error: 'Tipo de usuario inválido' });
    }

    // Buscar el ID del equipo según el tipo
    const queryEquipo = 'SELECT id_equipo FROM equipos WHERE tipo_equipo = ? AND estado = "Disponible" LIMIT 1';
    connection.query(queryEquipo, [equipo], (err, results) => {
        if (err) {
            console.error('Error al buscar el equipo:', err);
            res.status(500).send('Error al buscar el equipo.');
            return;
        }

        if (results.length === 0) {
            res.status(400).send('El equipo solicitado no está disponible.');
            return;
        }

        const idEquipo = results[0].id_equipo;
       // console.log('Id del equipo encontrado:',idEquipo)
       // console.log('Fecha de inicio antes del query:',fechaInicio)
        
        // Insertar la solicitud en la tabla "solicitudes"
        const querySolicitud = 'INSERT INTO solicitudes (tipo_usuario, estado, fecha_inicio, fecha_entrega, ubicacion_actual, id_equipo) VALUES (?, ?, ?, ?, ?, ?)';
        connection.query(querySolicitud, [tipo_usuario, 'Pendiente', fechaInicio, fechaFin, ubicacion, idEquipo], (err, result) => {
            if (err) {
                //console.log('Query insert solicitudes valor de fecha Inicio:',fechaInicio)
                console.error('Error al registrar la solicitud:', err);
                res.status(500).send('Hubo un error al registrar la solicitud.');
            } else {
                res.json({ message: 'Solicitud enviada correctamente.' });
                
            }
        });
    });
});




// Listar todas las solicitudes de préstamo con el nombre del equipo
router.get('/listar', (req, res) => {
    const query = `
        SELECT s.id_solicitud, s.tipo_usuario, s.correo, s.estado, 
               s.fecha_inicio, s.fecha_entrega, s.ubicacion_actual,
               (SELECT e.tipo_equipo FROM equipos e WHERE e.id_equipo = s.id_equipo) AS nombre_equipo
        FROM solicitudes s
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al listar solicitudes:', err);
            res.status(500).json({ error: 'Error al obtener las solicitudes' });
        } else {
            console.log('Resultados de la consulta:', results); // Para depuración
            res.json(results);
        }
    });
});

// Aprobar una solicitud de préstamo
router.post('/aprobar/:id', (req, res) => {
    const { id } = req.params;

    // Actualizamos el estado a "Aprobada"
    const query = 'UPDATE solicitudes SET estado = "Aprobada" WHERE id_solicitud = ?';
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al aprobar la solicitud:', err);
            return res.status(500).json({ error: 'Error al aprobar la solicitud' });
        }

        // Comprobamos si se actualizó alguna fila
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        // Mensaje de éxito
        res.json({ message: 'Solicitud aprobada correctamente' });
    });
});

// Rechazar una solicitud de préstamo
router.post('/rechazar/:id', (req, res) => {
    const { id } = req.params;
    const query = 'UPDATE solicitudes SET estado = "Rechazada" WHERE id_solicitud = ?';
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
    const query = 'DELETE FROM solicitudes WHERE id_solicitud = ?';
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
