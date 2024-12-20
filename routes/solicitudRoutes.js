const express = require('express');
const router = express.Router();
const connection = require('../db/connection');
const session = require('express-session');
const nodemailer = require("nodemailer");
const MySQLStore = require('express-mysql-session')(session);
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const width = 800; // ancho de las gráficas 
const height = 600; // alto de las gráficas 
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });


require('dotenv').config();



// Configurar express-session
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
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
            req.session.userId = results[0].id;
            req.session.userEmail = correo;
            req.session.userPass = contrasenia;
            req.session.save((saveErr) => {
                if (saveErr) {
                    console.error('Error al guardar la sesión:', saveErr);
                    return res.status(500).json({ success: false, message: 'Error al guardar la sesión' });
                }
                return res.json({ success: true, redirectUrl: '/formularios/admin' });
            });
        } else {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }
    });
});

//Ruta para cerrar sesión (logout)
router.post('/logout', (req, res) => {
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

// Ruta Aprobar una solicitud de préstamo y crear préstamo automáticamente
router.post('/aprobar/:id', (req, res) => {
    const { id } = req.params;

    const querySolicitud = `
        SELECT s.id_solicitud, s.id_equipo, s.fecha_inicio, s.fecha_entrega, s.tipo_usuario
        FROM solicitudes s
        WHERE s.id_solicitud = ? AND s.estado = 'Pendiente'
    `;

    connection.query(querySolicitud, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener la solicitud:', err);
            return res.status(500).json({ error: 'Error al obtener la solicitud' });
        }

        if (results.length === 0) {
            console.log('No se encontró la solicitud o no está pendiente');
            return res.status(404).json({ error: 'Solicitud no encontrada o no está pendiente' });
        }

        const solicitud = results[0];
        const idSolicitud = solicitud.id_solicitud;
        const idEquipo = solicitud.id_equipo;
        const fechaInicio = solicitud.fecha_inicio;
        const fechaEntrega = solicitud.fecha_entrega;
        const tipoUsuario = solicitud.tipo_usuario;

        const updateSolicitudQuery = 'UPDATE solicitudes SET estado = "Aprobada" WHERE id_solicitud = ?';
        
        connection.query(updateSolicitudQuery, [id], (err, updateResult) => {
            if (err) {
                console.error('Error al actualizar la solicitud:', err);
                return res.status(500).json({ error: 'Error al actualizar la solicitud' });
            }

            if (updateResult.affectedRows === 0) {
                console.log('No se actualizó la solicitud');
                return res.status(404).json({ error: 'Solicitud no encontrada' });
            }

            console.log('Solicitud actualizada correctamente');

            let fechaDevolucion;
            let fechaEntregaCorrecta = fechaEntrega;

            if (tipoUsuario === 'estudiante') {
                fechaEntregaCorrecta = fechaInicio;
                fechaDevolucion = fechaEntrega; 
            } else {

                fechaDevolucion = fechaEntrega;
            }

            const horaInicio = '00:00:00';
            const horaFin = '02:00:00';

            const insertPrestamoQuery = `
                INSERT INTO prestamos (id_solicitud, fecha_entrega, fecha_devolucion, hora_inicio, hora_fin, estado_prestamo)
                VALUES (?, ?, ?, ?, ?, 'No entregado')
            `;
            
            connection.query(insertPrestamoQuery, [idSolicitud, fechaEntregaCorrecta, fechaDevolucion, horaInicio, horaFin], (err, insertResult) => {
                if (err) {
                    console.error('Error al crear el préstamo:', err);
                    return res.status(500).json({ error: 'Error al crear el préstamo' });
                }

                console.log('Préstamo creado correctamente');
                res.json({ message: 'Solicitud aprobada y préstamo creado correctamente' });
            });
        });
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
router.get('/estadisticas/descargar', async (req, res) => {
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
        ORDER BY cantidad_solicitudes DESC;
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

    connection.query(solicitudesStatsQuery, async (err, solicitudesResults) => {
        if (err) {
            console.error('Error al obtener las estadísticas de solicitudes: ' + err.stack);
            return res.status(500).send('Error al obtener las estadísticas de solicitudes');
        }

        connection.query(prestamosStatsQuery, async (err, prestamosResults) => {
            if (err) {
                console.error('Error al obtener las estadísticas de préstamos: ' + err.stack);
                return res.status(500).send('Error al obtener las estadísticas de préstamos');
            }

            connection.query(equipoMasSolicitadoQuery, async (err, equipoMasSolicitadoResults) => {
                if (err) {
                    console.error('Error al obtener el equipo más solicitado: ' + err.stack);
                    return res.status(500).send('Error al obtener el equipo más solicitado');
                }

                connection.query(equipoMenosSolicitadoQuery, async (err, equipoMenosSolicitadoResults) => {
                    if (err) {
                        console.error('Error al obtener el equipo menos solicitado: ' + err.stack);
                        return res.status(500).send('Error al obtener el equipo menos solicitado');
                    }

                    // Generación de las gráficas
                    const barChartData = {
                        labels: ['Aprobadas', 'Rechazadas', 'Pendientes'],
                        datasets: [{
                            label: 'Solicitudes',
                            data: [
                                solicitudesResults[0].aprobadas,
                                solicitudesResults[0].rechazadas,
                                solicitudesResults[0].pendientes
                            ],
                            backgroundColor: ['#36a2eb', '#ff6384', '#ffcd56']
                        }]
                    };

                    const barChartConfig = {
                        type: 'bar',
                        data: barChartData,
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }
                    };

                    const barChartImage = await chartJSNodeCanvas.renderToBuffer(barChartConfig);
                    fs.writeFileSync(path.join('downloadsSR', 'bar_chart.png'), barChartImage);

                    // Gráfica de pastel con todos los equipos solicitados
                    const pieChartData = {
                        labels: equipoMasSolicitadoResults.map(item => `${item.tipo_equipo}: ${item.cantidad_solicitudes}`), // Mostrar equipo y cantidad
                        datasets: [{
                            label: 'Equipos Más Solicitados',
                            data: equipoMasSolicitadoResults.map(item => item.cantidad_solicitudes), // Cantidad de solicitudes por equipo
                            backgroundColor: ['#36a2eb', '#ff6384', '#ffcd56', '#4bc0c0', '#9966ff', '#ff9f40', '#c9c9c9'],
                        }]
                    };

                    const pieChartConfig = {
                        type: 'pie',
                        data: pieChartData,
                        options: {
                            responsive: true,
                        }
                    };

                    const pieChartImage = await chartJSNodeCanvas.renderToBuffer(pieChartConfig);
                    fs.writeFileSync(path.join('downloadsSR', 'pie_chart.png'), pieChartImage);

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

                            const wb = new ExcelJS.Workbook();
                            const ws = wb.addWorksheet('Estadísticas');

                            // Agregar datos al Excel
                            statsData.forEach((row, index) => {
                                ws.addRow(row);
                            });

                            // Insertar imágenes
                            const barImageId = wb.addImage({
                                filename: path.join('downloadsSR', 'bar_chart.png'),
                                extension: 'png',
                            });
                            ws.addImage(barImageId, 'E1:J17'); // Ajusta las celdas según sea necesario

                            const pieImageId = wb.addImage({
                                filename: path.join('downloadsSR', 'pie_chart.png'),
                                extension: 'png',
                            });
                            ws.addImage(pieImageId, 'E20:J32'); // Ajusta las celdas según sea necesario

                             // Agregar historial de solicitudes
                            const historialSolicitudesSheet = wb.addWorksheet('Historial de Solicitudes');
                            historialSolicitudesSheet.columns = [
                                { header: 'ID Solicitud', key: 'id_solicitud' },
                                { header: 'Tipo Usuario', key: 'tipo_usuario' },
                                { header: 'Correo', key: 'correo' },
                                { header: 'Estado', key: 'estado' },
                                { header: 'Fecha Inicio', key: 'fecha_inicio' },
                                { header: 'Fecha Entrega', key: 'fecha_entrega' },
                                { header: 'Ubicación Actual', key: 'ubicacion_actual' },
                                { header: 'Equipo', key: 'nombre_equipo' }
                            ];
                            historialSolicitudesSheet.addRows(solicitudesHistorialResults);

                            // Agregar historial de préstamos
                            const historialPrestamosSheet = wb.addWorksheet('Historial de Préstamos');
                            historialPrestamosSheet.columns = [
                                { header: 'ID Préstamo', key: 'id_prestamo' },
                                { header: 'Equipo', key: 'tipo_equipo' },
                                { header: 'ID Solicitud', key: 'id_solicitud' },
                                { header: 'Fecha Entrega', key: 'fecha_entrega' },
                                { header: 'Fecha Devolución', key: 'fecha_devolucion' },
                                { header: 'Estado', key: 'estado_prestamo' }
                            ];
                            historialPrestamosSheet.addRows(prestamosHistorialResults);

                            wb.xlsx.writeBuffer().then((buffer) => {
                                const filePath = path.join('downloadsSR', 'estadisticas.xlsx');
                                fs.writeFileSync(filePath, buffer);

                                res.download(filePath, 'estadisticas.xlsx', () => {
                                    // Eliminar archivos temporales
                                    fs.unlinkSync(path.join('downloadsSR', 'bar_chart.png'));
                                    fs.unlinkSync(path.join('downloadsSR', 'pie_chart.png'));
                                    fs.unlinkSync(filePath);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});


router.post('/recordar/:id', (req, res) => {
    if (!req.session.userEmail || !req.session.userPass) {
        return res.status(401).json({ error: 'No estás autenticado para enviar correos.' });
    }
    const idPrestamo = req.params.id;

    const query = `
        SELECT s.correo, s.tipo_usuario, s.fecha_entrega,e.tipo_equipo AS nombre_equipo
        FROM prestamos AS p
        INNER JOIN solicitudes AS s ON p.id_solicitud = s.id_solicitud
        LEFT JOIN equipos e ON s.id_equipo = e.id_equipo
        WHERE p.id_prestamo = ?
    `;

    connection.query(query, [idPrestamo], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            return res.status(500).send('Error en el servidor');
        }
    
        if (results.length > 0) {
            const correoDestino = results[0].correo;
            const tipoUsuarioCorreo = results[0].tipo_usuario;
            const fechaEntregaEquipo = results[0].fecha_entrega;
            const nombreEquipoEntrega = results[0].nombre_equipo;
    
            const transporter = nodemailer.createTransport({
                //Cambiar cuando se use un servicio SMTP
                host: 'sandbox.smtp.mailtrap.io',
                port: '2525',
                auth: {
                    user: process.env.MP_USER, //req.session.userEmail,
                    pass: process.env.MP_PASS//req.session.userPass
                }
            });
    
            let mailOptions;
    
            if (tipoUsuarioCorreo === 'estudiante') {
                mailOptions = {
                    from: `${req.session.userEmail}`,
                    to: correoDestino,
                    subject: 'Recordatorio: Fecha próxima de Devolución del equipo asignado',
                    text: `Hola ${correoDestino},
    
    Espero que te encuentres bien.
    Queremos recordarte que la fecha de devolución del equipo asignado se encuentra próxima.
    Aquí están los detalles de tu préstamo:
    
    - Equipo asignado: ${nombreEquipoEntrega}
    - Fecha de devolución: ${fechaEntregaEquipo}
    - Ubicación de devolución: Centro de Cómputo
    
    Te pedimos que asegures el buen estado del equipo antes de la devolución y que te presentes en el lugar indicado a tiempo. Si tienes algún problema o necesitas extender tu préstamo, por favor acude al Centro de Cómputo.
    
    Gracias por tu colaboración.
    
    Saludos cordiales,
    Centro de Cómputo, Universidad Veracruzana.
    ${req.session.userEmail}`
                };
            } else if (tipoUsuarioCorreo === 'profesor') {
                mailOptions = {
                    from: `${req.session.userEmail}`,
                    to: correoDestino,
                    subject: 'Recordatorio: Fecha próxima de Devolución del equipo asignado',
                    text: `Estimado(a) Docente ${correoDestino},
    
    Le escribimos para recordarle que la fecha de devolución del equipo asignado está próxima.
    A continuación, encontrará los detalles de su préstamo:
    
    - Equipo asignado: ${nombreEquipoEntrega}
    - Fecha de devolución: ${fechaEntregaEquipo}
    - Ubicación de devolución: Centro de Cómputo
    
    Si por algún motivo necesita extender su préstamo o tiene algún inconveniente,
    no dude en ponerse en contacto con nosotros para gestionar los cambios necesarios.
    
    Agradecemos mucho su atención y comprensión.
    
    Saludos cordiales,
    Centro de Cómputo, Universidad Veracruzana.
    ${req.session.userEmail}`
                };
            } else {
                return res.status(400).json({ error: 'Tipo de usuario desconocido' });
            }
    
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error al enviar correo:', error);
                    return res.status(500).json({ error: 'Error al enviar el correo' });
                }
    
                console.log('Correo enviado:', info.response);
                res.json({ message: 'Recordatorio enviado correctamente' });
            });
        } else {
            res.status(404).send('No se encontró un correo asociado al préstamo');
        }
    });
});

module.exports = router;