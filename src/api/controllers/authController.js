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

      const responsePromise = new Promise((resolve, reject) => {
        messageBroker.addResponseHandler(correlationId, resolve);

        setTimeout(() => {
          messageBroker.removeResponseHandler(correlationId);
          reject(new Error("Timeout esperando respuesta del login"));
        }, 8000);
      });

     await messageBroker.consumeReplies(replyToQueue);
      await messageBroker.publish(
        { operation: 'login', data: { email, password } },
        correlationId,
        replyToQueue,
        requestQueue
      );

      const response = await responsePromise;

      if (response.error) {
        return res.status(400).json({ error: response.error });
      }

      const token = jwt.sign(
        {
          user_id: response.id,
          role: response.role.roles
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      return res.status(200).json({
        message: "OK",
        token,
        user: {
          user_id: response.id,
          role: response.role.roles
        }
      });
    } catch (err) {
      console.error('[AuthController] Error en login:', err);
      return res.status(500).send("Server Error");
    }
  }
}

module.exports = AuthController;
