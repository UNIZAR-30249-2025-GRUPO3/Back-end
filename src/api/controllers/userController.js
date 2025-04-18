const messageBroker = require('../../core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');

class UserController {
  constructor() {
    this.requestQueue = 'user_operations';
    this.replyToQueue = 'user_responses';
    messageBroker.connect().catch(console.error);
  }

  async createUser(req, res) {
    await this.sendMessage('createUser', req.body, res);
  }

  async getUserById(req, res) {
    await this.sendMessage('getUserById', { id: req.params.id }, res);
  }

  async updateUser(req, res) {
    const data = {
      id: req.params.id,
      updateFields: req.body
    };
    await this.sendMessage('updateUser', data, res);
  }

  async deleteUser(req, res) {
    await this.sendMessage('deleteUser', { id: req.params.id }, res);
  }

  async getAllUsers(req, res) {
    await this.sendMessage('getAllUsers', req.body, res);
  }

  async sendMessage(operation, data, res) {
    try {
      const correlationId = uuidv4();

      await messageBroker.publish(
        { operation, data },
        correlationId,
        this.replyToQueue,
        this.requestQueue
      );

      const consumer = async (response, respCorrelationId) => {
        if (respCorrelationId === correlationId) {
          if (response.error) {
            res.status(400).json({ error: response.error });
          } else {
            const status = operation === 'createUser' ? 201 : 200;
            res.status(status).json(response);
          }
          await messageBroker.removeConsumer(this.replyToQueue);
        }
      };

      messageBroker.consume(this.replyToQueue, consumer);

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = UserController;
