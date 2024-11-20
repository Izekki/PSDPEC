const express = require('express');
const router = express.Router();
const connection = require('../db/connection');
const session = require('express-session');
const XLSX = require('xlsx');

// Configura express-session
router.use(session({
    secret: 'tu_clave_secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

//Ruta de inicio de sesión
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

//Ruta para cerrar sesión (logout)
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
    const { correo, equipo, ubicacion, fecha_inicio: fechaInicio, fecha_fin: fechaFin, tipo_usuario } = req.body;

    if (!['profesor', 'estudiante'].includes(tipo_usuario)) {
        return res.status(400).json({ error: 'Tipo de usuario inválido' });
    }

    const queryEquipo = 'SELECT id_equipo FROM equipos WHERE tipo_equipo = ? AND estado = "Disponible" LIMIT 1';
    connection.query(queryEquipo, [equipo], (err, results) => {
        if (err) {
            console.error('Error al buscar el equipo:', err);
            return res.status(500).send('Error al buscar el equipo.');
        }

        if (results.length === 0) {
            return res.status(400).send('El equipo solicitado no está disponible.');
        }

        const idEquipo = results[0].id_equipo;

        const querySolicitud = `
            INSERT INTO solicitudes 
            (tipo_usuario, correo, estado, fecha_inicio, fecha_entrega, ubicacion_actual, id_equipo) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        connection.query(
            querySolicitud,
            [tipo_usuario, correo, 'Pendiente', fechaInicio, fechaFin, ubicacion, idEquipo],
            (err, result) => {
                if (err) {
                    console.error('Error al registrar la solicitud:', err);
                    return res.status(500).send('Hubo un error al registrar la solicitud.');
                }

                res.json({ message: 'Solicitud enviada correctamente.' });
            }
        );
    });
});


//Ruta para listar solicitudes con historial opcional
router.get('/listar-solicitudes', (req, res) => {
    const estado = req.query.estado;
    let query = `
        SELECT s.id_solicitud, s.tipo_usuario, s.correo, s.estado, 
               s.fecha_inicio, s.fecha_entrega, s.ubicacion_actual,
               (SELECT e.tipo_equipo FROM equipos e WHERE e.id_equipo = s.id_equipo) AS nombre_equipo
        FROM solicitudes s
    `;

    if (estado) {
        query += ` WHERE s.estado = ?`;
    }

    connection.query(query, estado ? [estado] : [], (err, results) => {
        if (err) {
            console.error('Error al listar solicitudes:', err);
            res.status(500).json({ error: 'Error al obtener las solicitudes' });
        } else {
            res.json(results);
        }
    });
});

//Ruta para listar préstamos con historial opcional
router.get('/listar-prestamos', (req, res) => {
    const estado = req.query.estado_prestamo;
    let query = `
        SELECT p.id_prestamo, e.tipo_equipo, p.id_solicitud, p.fecha_entrega, p.fecha_devolucion, p.estado_prestamo 
        FROM prestamos AS p
        INNER JOIN solicitudes AS s ON p.id_solicitud = s.id_solicitud
        INNER JOIN equipos AS e ON s.id_equipo = e.id_equipo
    `;

    if (estado) {
        query += ` WHERE p.estado_prestamo = ?`;
    }

    connection.query(query, estado ? [estado] : [], (err, results) => {
        if (err) {
            console.error('Error al listar préstamos:', err);
            res.status(500).json({ error: 'Error al obtener los préstamos' });
        } else {
            res.json(results);
        }
    });
});

//Ruta para obtener solicitudes filtradas
router.get('/solicitudes-filtradas', (req, res) => {
    const { tipo_usuario, estado, fecha_inicio } = req.query;
    let query = `
        SELECT s.id_solicitud, s.tipo_usuario, s.correo, s.estado, 
               s.fecha_inicio, s.fecha_entrega, s.ubicacion_actual,
               (SELECT e.tipo_equipo FROM equipos e WHERE e.id_equipo = s.id_equipo) AS nombre_equipo
        FROM solicitudes s
        WHERE 1=1
    `;
    
    const params = [];

    if (tipo_usuario) {
        query += ` AND s.tipo_usuario = ?`;
        params.push(tipo_usuario);
    }
    if (estado) {
        query += ` AND s.estado = ?`;
        params.push(estado);
    }
    if (fecha_inicio) {
        query += ` AND s.fecha_inicio = ?`;
        params.push(fecha_inicio);
    }

    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Error al obtener solicitudes filtradas:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        res.json(results);
    });
});

//Ruta para obtener prestamos filtrados
router.get('/prestamos-filtrados', (req, res) => {
    const { tipo_equipo, estado_prestamo, fecha_entrega } = req.query;
    let query = `
        SELECT p.id_prestamo, e.tipo_equipo, p.id_solicitud, p.fecha_entrega, p.fecha_devolucion, p.estado_prestamo 
        FROM prestamos AS p
        INNER JOIN solicitudes AS s ON p.id_solicitud = s.id_solicitud
        INNER JOIN equipos AS e ON s.id_equipo = e.id_equipo
        WHERE 1=1
    `;

    const params = [];

    if (tipo_equipo) {
        query += ` AND e.tipo_equipo = ?`;
        params.push(tipo_equipo);
    }
    if (estado_prestamo) {
        query += ` AND p.estado_prestamo = ?`;
        params.push(estado_prestamo);
    }
    
    if (fecha_entrega) {
        query += ` AND DATE(p.fecha_entrega) = ?`;
        params.push(fecha_entrega);
    }

    connection.query(query, params, (err, results) => {
        if (err) {
            console.error('Error al obtener préstamos filtrados:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        res.json(results);
    });
});

//Ruta Aprobar una solicitud de préstamo
router.post('/aprobar/:id', (req, res) => {
    const { id } = req.params;

    const query = 'UPDATE solicitudes SET estado = "Aprobada" WHERE id_solicitud = ?';
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al aprobar la solicitud:', err);
            return res.status(500).json({ error: 'Error al aprobar la solicitud' });
        }if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        res.json({ message: 'Solicitud aprobada correctamente' });
    });
});

//Ruta Rechazar una solicitud de préstamo
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

//Ruta Eliminar una solicitud de préstamo
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

//Ruta Aprobar Entrega
router.post('/entregado/:id', (req, res) => {
    const { id } = req.params;

    const query = 'UPDATE prestamos SET estado_prestamo = "Entregado" WHERE id_prestamo = ?';
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al aprobar entrega del equipo:', err);
            return res.status(500).json({ error: 'Error al aprobar entregar equipo' });
        }if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }
        res.json({ message: 'Equipo Entregado' });
    });
});

// Ruta para cargar estadísticas
router.get('/estadisticas', (req, res) => {
    const solicitudesStatsQuery = `
      SELECT 
        COUNT(*) AS total_solicitudes,
        SUM(CASE WHEN estado = 'Aprobada' THEN 1 ELSE 0 END) AS aprobadas,
        SUM(CASE WHEN estado = 'Rechazada' THEN 1 ELSE 0 END) AS rechazadas,
        SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendientes
      FROM solicitudes;
    `;
  
    const prestamosStatsQuery = `
      SELECT 
        SUM(CASE WHEN estado_prestamo = 'Entregado' THEN 1 ELSE 0 END) AS entregados,
        SUM(CASE WHEN estado_prestamo = 'No entregado' THEN 1 ELSE 0 END) AS no_entregados
      FROM prestamos;
    `;
  
    const equipoMasSolicitadoQuery = `
      SELECT e.tipo_equipo, COUNT(s.id_solicitud) AS cantidad_solicitudes
      FROM solicitudes s
      INNER JOIN equipos e ON s.id_equipo = e.id_equipo
      GROUP BY e.tipo_equipo
      ORDER BY cantidad_solicitudes DESC
      LIMIT 1;
    `;
  
    const equipoMenosSolicitadoQuery = `
      SELECT e.tipo_equipo, COUNT(s.id_solicitud) AS cantidad_solicitudes
      FROM solicitudes s
      INNER JOIN equipos e ON s.id_equipo = e.id_equipo
      GROUP BY e.tipo_equipo
      ORDER BY cantidad_solicitudes ASC
      LIMIT 1;
    `;
  
    connection.query(solicitudesStatsQuery, (err, solicitudesResults) => {
      if (err) {
        console.error('Error al obtener las estadísticas de solicitudes: ' + err.stack);
        return res.status(500).send('Error al obtener las estadísticas de solicitudes');
      }
  
      connection.query(prestamosStatsQuery, (err, prestamosResults) => {
        if (err) {
          console.error('Error al obtener las estadísticas de préstamos: ' + err.stack);
          return res.status(500).send('Error al obtener las estadísticas de préstamos');
        }
  
        connection.query(equipoMasSolicitadoQuery, (err, equipoMasSolicitadoResults) => {
          if (err) {
            console.error('Error al obtener el equipo más solicitado: ' + err.stack);
            return res.status(500).send('Error al obtener el equipo más solicitado');
          }
  
          connection.query(equipoMenosSolicitadoQuery, (err, equipoMenosSolicitadoResults) => {
            if (err) {
              console.error('Error al obtener el equipo menos solicitado: ' + err.stack);
              return res.status(500).send('Error al obtener el equipo menos solicitado');
            }
  
            res.status(200).json({
              totalSolicitudes: solicitudesResults[0].total_solicitudes,
              aprobadas: solicitudesResults[0].aprobadas,
              rechazadas: solicitudesResults[0].rechazadas,
              pendientes: solicitudesResults[0].pendientes,
              entregados: prestamosResults[0].entregados,
              noEntregados: prestamosResults[0].no_entregados,
              equipoMasSolicitado: equipoMasSolicitadoResults[0],
              equipoMenosSolicitado: equipoMenosSolicitadoResults[0]
            });
          });
        });
      });
    });
  });

// Ruta para cargar estadísticas y generar archivo Excel
router.get('/estadisticas/descargar', (req, res) => {
    const solicitudesStatsQuery = `
        SELECT 
            COUNT(*) AS total_solicitudes,
            SUM(CASE WHEN estado = 'Aprobada' THEN 1 ELSE 0 END) AS aprobadas,
            SUM(CASE WHEN estado = 'Rechazada' THEN 1 ELSE 0 END) AS rechazadas,
            SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendientes
        FROM solicitudes;
    `;

    const prestamosStatsQuery = `
        SELECT 
            SUM(CASE WHEN estado_prestamo = 'Entregado' THEN 1 ELSE 0 END) AS entregados,
            SUM(CASE WHEN estado_prestamo = 'No entregado' THEN 1 ELSE 0 END) AS no_entregados
        FROM prestamos;
    `;

    const equipoMasSolicitadoQuery = `
        SELECT e.tipo_equipo, COUNT(s.id_solicitud) AS cantidad_solicitudes
        FROM solicitudes s
        INNER JOIN equipos e ON s.id_equipo = e.id_equipo
        GROUP BY e.tipo_equipo
        ORDER BY cantidad_solicitudes DESC
        LIMIT 1;
    `;

    const equipoMenosSolicitadoQuery = `
        SELECT e.tipo_equipo, COUNT(s.id_solicitud) AS cantidad_solicitudes
        FROM solicitudes s
        INNER JOIN equipos e ON s.id_equipo = e.id_equipo
        GROUP BY e.tipo_equipo
        ORDER BY cantidad_solicitudes ASC
        LIMIT 1;
    `;

    const solicitudesQuery = `
        SELECT s.id_solicitud, s.tipo_usuario, s.correo, s.estado, 
               s.fecha_inicio, s.fecha_entrega, s.ubicacion_actual,
               (SELECT e.tipo_equipo FROM equipos e WHERE e.id_equipo = s.id_equipo) AS nombre_equipo
        FROM solicitudes s;
    `;

    const prestamosQuery = `
        SELECT p.id_prestamo, e.tipo_equipo, p.id_solicitud, p.fecha_entrega, p.fecha_devolucion, p.estado_prestamo 
        FROM prestamos AS p
        INNER JOIN solicitudes AS s ON p.id_solicitud = s.id_solicitud
        INNER JOIN equipos AS e ON s.id_equipo = e.id_equipo;
    `;

    connection.query(solicitudesStatsQuery, (err, solicitudesResults) => {
        if (err) {
            console.error('Error al obtener las estadísticas de solicitudes: ' + err.stack);
            return res.status(500).send('Error al obtener las estadísticas de solicitudes');
        }

        connection.query(prestamosStatsQuery, (err, prestamosResults) => {
            if (err) {
                console.error('Error al obtener las estadísticas de préstamos: ' + err.stack);
                return res.status(500).send('Error al obtener las estadísticas de préstamos');
            }

            connection.query(equipoMasSolicitadoQuery, (err, equipoMasSolicitadoResults) => {
                if (err) {
                    console.error('Error al obtener el equipo más solicitado: ' + err.stack);
                    return res.status(500).send('Error al obtener el equipo más solicitado');
                }

                connection.query(equipoMenosSolicitadoQuery, (err, equipoMenosSolicitadoResults) => {
                    if (err) {
                        console.error('Error al obtener el equipo menos solicitado: ' + err.stack);
                        return res.status(500).send('Error al obtener el equipo menos solicitado');
                    }

                    connection.query(solicitudesQuery, (err, solicitudesHistorialResults) => {
                        if (err) {
                            console.error('Error al obtener historial de solicitudes: ' + err.stack);
                            return res.status(500).send('Error al obtener historial de solicitudes');
                        }

                        connection.query(prestamosQuery, (err, prestamosHistorialResults) => {
                            if (err) {
                                console.error('Error al obtener historial de préstamos: ' + err.stack);
                                return res.status(500).send('Error al obtener historial de préstamos');
                            }

                            const statsData = [
                                ['Total de Solicitudes', solicitudesResults[0].total_solicitudes],
                                ['Aprobadas', solicitudesResults[0].aprobadas],
                                ['Rechazadas', solicitudesResults[0].rechazadas],
                                ['Pendientes', solicitudesResults[0].pendientes],
                                ['Entregados', prestamosResults[0].entregados],
                                ['No Entregados', prestamosResults[0].no_entregados],
                                ['Equipo Más Solicitado', equipoMasSolicitadoResults[0].tipo_equipo, 'Solicitudes: ' + equipoMasSolicitadoResults[0].cantidad_solicitudes],
                                ['Equipo Menos Solicitado', equipoMenosSolicitadoResults[0].tipo_equipo, 'Solicitudes: ' + equipoMenosSolicitadoResults[0].cantidad_solicitudes]
                            ];

                            const wb = XLSX.utils.book_new();
                            const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
                            XLSX.utils.book_append_sheet(wb, statsSheet, 'Estadísticas');

                            const solicitudesHistorialSheet = XLSX.utils.json_to_sheet(solicitudesHistorialResults);
                            XLSX.utils.book_append_sheet(wb, solicitudesHistorialSheet, 'Historial de Solicitudes');

                            const prestamosHistorialSheet = XLSX.utils.json_to_sheet(prestamosHistorialResults);
                            XLSX.utils.book_append_sheet(wb, prestamosHistorialSheet, 'Historial de Préstamos');

                            const excelFile = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

                            res.setHeader('Content-Disposition', 'attachment; filename=estadisticas_y_historiales.xlsx');
                            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

                            res.send(excelFile);
                        });
                    });
                });
            });
        });
    });
});


module.exports = router;
