const express = require('express');

const { isAuthenticated, gerenteAuthorized } = require('../middleware/authMiddleware');

function setupUserRoutes(userController) {
  const router = express.Router();

  router.post('/', isAuthenticated, gerenteAuthorized, (req, res) => userController.createUser(req, res));
  router.get('/:id', isAuthenticated, (req, res) => userController.getUserById(req, res));
  router.put('/:id', isAuthenticated, gerenteAuthorized, (req, res) => userController.updateUser(req, res));
  router.delete('/:id', isAuthenticated, gerenteAuthorized, (req, res) => userController.deleteUser(req, res));
  router.get('/', isAuthenticated, gerenteAuthorized, (req, res) => userController.getAllUsers(req, res));

  return router;
}

module.exports = setupUserRoutes;