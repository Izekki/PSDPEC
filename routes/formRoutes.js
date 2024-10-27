const express = require('express');
const router = express.Router();
const path = require('path');

// Rutas para las páginas de los formularios
router.get('/student', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/htmls/form-student.html'));
});

router.get('/teacher', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/htmls/form-teacher.html'));
});
 
// AGREGAR HTML INICIAR SESIONr
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/htmls/login.html'));
})

module.exports = router;
