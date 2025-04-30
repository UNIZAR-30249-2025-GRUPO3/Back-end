const messageBroker = require('../../core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');

class AuthController {
  constructor() {
    messageBroker.connect().catch(console.error);
  }

  async login(req, res) {
    const { email, password } = req.body;

    try {
      const correlationId = uuidv4();
      const replyToQueue = 'user_responses';
      const requestQueue = 'user_operations';

      await messageBroker.publish({
        operation: 'login',
        data: { email, password }
      }, correlationId, replyToQueue,requestQueue);

      const consumer = async (response, respCorrelationId) => {
        if (respCorrelationId === correlationId) {
          try {
            if (response.error) {
              res.status(400).json({ error: response.error });
            } else {
              req.session.user = { user_id: response.id, role: response.role.roles };
  
              res.status(200).json({
                message: "OK",
                user: { user_id: req.session.user.user_id, role: req.session.user.role }
              });
            }
          } finally {
            // Always remove the consumer regardless of success or error
            await messageBroker.removeConsumer(replyToQueue);
          }
        }
      };

      messageBroker.consume(replyToQueue, consumer);

    } catch (err) {
      res.status(500).send("Server Error");
    }
  }

  async logout(req, res) {
    req.session.reset();
    return res.json({
      message: 'Closed session'
    });
  }
}

module.exports = AuthController;
