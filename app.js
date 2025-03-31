var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const sessions = require('client-sessions');



const BD_UserRepository = require('./src/core/infraestructura/Persistencia/BD_UserRepository');
const UserService = require('./src/core/aplicacion/Servicios/UserService');
const UserController = require('./src/api/controllers/userController');
const setupUserRoutes = require('./src/api/routes/userRoutes');
const { swaggerUi, swaggerDocs } = require("./swagger");


// Inicializar dependencias
const userRepository = new BD_UserRepository();
const userService = new UserService();
const userController = new UserController();

var app = express();


app.use(sessions({
  cookieName: 'session',
  secret: 'secret'
}));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', setupUserRoutes(userController));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource could not be found',
    path: req.path
  });
});

// error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// Manejo de errores del servidor
server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} está en uso. Prueba con otro puerto.`);
  } else {
    console.error('Error al iniciar el servidor:', error);
  }
});

module.exports = app;
