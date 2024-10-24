const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

const mysql = require('mysql2');

//Create conection to data base
const connection = mysql.createConnection({
    host: 'localhost',      
    user: 'root',       
    password: 'password2024', 
    database: 'prestamouv'
});

//Connection to data base
connection.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos MySQL');
});



// Middleware para analizar datos de formularios
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para la página de login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'htmls', 'login.html'));
});

// Ruta para la página del formulario
app.get('/index-form', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'htmls', 'index-form.html'));
});

// Ruta para la página del formulario del estudiante
app.get('/form-student', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'htmls', 'form-student.html'));
  });

  // Ruta para la página del formulario del profesor
app.get('/form-teacher', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'htmls', 'form-teacher.html'));
  });


// Ruta POST para procesar el formulario y registrar la solicitud en la tabla "solicitudes"
app.post('/enviar-solicitud', (req, res) => {
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









// Inicia el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
