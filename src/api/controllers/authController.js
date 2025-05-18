const messageBroker = require('../../core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '24h';

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
              const token = jwt.sign(
                { 
                  user_id: response.id, 
                  role: response.role.roles 
                }, 
                JWT_SECRET, 
                { expiresIn: JWT_EXPIRY }
              );
  
              res.status(200).json({
                message: "OK",
                token,
                user: { 
                  user_id: response.id, 
                  role: response.role.roles 
                }
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
      console.error(err);
      res.status(500).send("Server Error");
    }
  }
}

module.exports = AuthController;
