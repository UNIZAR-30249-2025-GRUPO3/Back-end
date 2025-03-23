var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const BD_UserRepository = require('./src/core/infraestructura/Persistencia/BD_UserRepository');
const UserService = require('./src/core/aplicacion/Servicios/UserService');
const UserController = require('./src/api/controllers/userController');
const setupUserRoutes = require('./src/api/routes/userRoutes');


// Inicializar dependencias
const userRepository = new BD_UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', setupUserRoutes(userController));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource could not be found',
    path: req.path
  });
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
