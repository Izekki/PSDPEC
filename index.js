const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

const mysql = require('mysql');

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
  



// Ruta POST para procesar el login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Consulta a la base de datos para validar las credenciales
    const query = 'SELECT * FROM usuarios WHERE username = ? AND password = ?';
    connection.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error ejecutando la consulta:', err);
            res.send('Hubo un error al procesar tu solicitud.');
        }

        // Si encuentra un resultado, las credenciales son correctas
        if (results.length > 0) {
            res.redirect('/formulario'); // Redirige al formulario si el login es exitoso
        } else {
            res.send('Usuario o contraseña incorrectos');
        }
    });
});


// Inicia el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
