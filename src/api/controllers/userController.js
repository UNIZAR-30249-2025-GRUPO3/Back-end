const messageBroker = require('../../core/infraestructura/messageBroker');

class UserController {
  constructor() {
    messageBroker.connect().catch(console.error);
  }

  async createUser(req, res) {
    try {
      await messageBroker.publish({
        operation: 'createUser',
        data: req.body
      });
      res.status(202).json({ message: 'Solicitud recibida crear usuario, procesando...' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


  async getUserById(req, res) {
    try {
      await messageBroker.publish({
        operation: 'getUserById',
        data: { id: req.params.id,
                email: req.params.email
              }
      });
      res.status(202).json({ message: 'Solicitud recibida obtener usuario por id, procesando...' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


  async updateUser(req, res) {
      try {
        await messageBroker.publish({
          operation: 'updateUser',
          data: { id: req.params.id }
        });
        res.status(202).json({ message: 'Solicitud recibida, procesando...' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }


  async deleteUser(req, res) {
      try {
        await messageBroker.publish({
          operation: 'deleteUser',
          data: { id: req.params.id }
        });
        res.status(202).json({ message: 'Solicitud recibida, procesando...' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }


  async getAllUsers(req, res) {
    try {
      await messageBroker.publish({
        operation: 'getAllUsers',
        data: req.body
      });
      res.status(202).json({ message: 'Solicitud recibida, procesando...' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

}

module.exports = UserController;