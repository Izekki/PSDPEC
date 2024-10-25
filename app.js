const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

// Importar rutas
const formRoutes = require('./routes/formRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');

// Middleware para analizar datos de formularios
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Servir archivos estáticos (deberías mantener la carpeta 'public' separada)
app.use(express.static(path.join(__dirname, 'public')));

// Usar las rutas importadas
app.use('/formularios', formRoutes);
app.use('/solicitudes', solicitudRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
