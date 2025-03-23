const express = require('express');

function setupUserRoutes(userController) {
  const router = express.Router();

  router.post('/', (req, res) => userController.createUser(req, res));
  router.get('/:id', (req, res) => userController.getUserById(req, res));
  router.put('/:id', (req, res) => userController.updateUser(req, res));
  router.delete('/:id', (req, res) => userController.deleteUser(req, res));
  router.get('/', (req, res) => userController.getAllUsers(req, res));

  return router;
}

module.exports = setupUserRoutes;