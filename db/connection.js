const mysql = require('mysql2');

// Crear conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',      
    user: 'root',       
    password: 'password2024', 
    database: 'prestamouv'
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos MySQL');
});

module.exports = connection;
