var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const sessions = require('client-sessions');

// Repositorios
const BD_UserRepository = require('./src/core/infraestructura/BD_UserRepository');
const BD_SpaceRepository = require('./src/core/infraestructura/BD_SpaceRepository');

// Servicios de aplicación
const UserService = require('./src/core/aplicacion/UserService');
const BuildingService = require('./src/core/aplicacion/BuildingService');
const SpaceService = require('./src/core/aplicacion/SpaceService');

// Controladores
const UserController = require('./src/api/controllers/userController');
const AuthController = require('./src/api/controllers/authController');
const BuildingController = require('./src/api/controllers/buildingController');
const SpaceController = require('./src/api/controllers/spaceController');

// Configuración de rutas
const setupUserRoutes = require('./src/api/routes/userRoutes');
const setupAuthRoutes = require('./src/api/routes/authRoutes');
const setupBuildingRoutes = require('./src/api/routes/buildingRoutes');
const setupSpaceRoutes = require('./src/api/routes/spaceRoutes');

// Swagger
const { swaggerUi, swaggerDocs } = require("./swagger");

// Inicializar dependencias (userRepository y userService no se usan pero necesitamos que se inicialicen)
const userRepository = new BD_UserRepository();
const userService = new UserService();
const buildingService = new BuildingService();
const spaceRepository = new BD_SpaceRepository();
const spaceService = new SpaceService();
const userController = new UserController();
const authController = new AuthController();
const buildingController = new BuildingController();
const spaceController = new SpaceController();

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

// Rutas de API
app.use('/api/users', setupUserRoutes(userController));
app.use('/api/auth', setupAuthRoutes(authController));
app.use('/api/building', setupBuildingRoutes(buildingController));
app.use('/api/spaces', setupBuildingRoutes(spaceController));
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
