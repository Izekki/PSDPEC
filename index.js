const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

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
    res.sendFile(path.join(__dirname, 'public', 'htmls', 'index-teacher.html'));
  });
  



// Ruta POST para procesar el login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Aquí validas contra tu base de datos o un objeto de prueba
  if (username === 'usuario' && password === '12345') {
    res.redirect('/formulario');  // Redirige al formulario si es correcto
  } else {
    res.send('Usuario o contraseña incorrectos');  // Muestra mensaje si es incorrecto
  }
});

// Inicia el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
