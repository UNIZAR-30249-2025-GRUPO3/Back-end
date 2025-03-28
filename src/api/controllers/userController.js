const messageBroker = require('../../core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');

class UserController {
  constructor() {
    messageBroker.connect().catch(console.error);
  }

  async createUser(req, res) {
    try {
      const correlationId = uuidv4(); 
      const replyToQueue = 'user_responses';
  
      await messageBroker.publish({
        operation: 'createUser',
        data: req.body
      }, correlationId, replyToQueue);
      
      const consumer = async (response, respCorrelationId) => {
        if (respCorrelationId === correlationId) { 
          console.log('[Cliente] Respuesta recibida:', response);
          if (response.error) {
            res.status(400).json({ error: response.error });
          } else {
            res.status(201).json(response);
          }
          await messageBroker.removeConsumer(replyToQueue); 
        }
      };
      messageBroker.consume('user_responses', consumer);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  async getUserById(req, res) {
    try {
      const correlationId = uuidv4(); 
      const replyToQueue = 'user_responses'; 
  
      await messageBroker.publish({
        operation: 'getUserById',
        data: { id: req.params.id,
          email: req.params.email
        }
      }, correlationId, replyToQueue);
   
      const consumer = async (response, respCorrelationId) => {
        if (respCorrelationId === correlationId) { 
          console.log('[Cliente] Respuesta recibida:', response);
          if (response.error) {
            res.status(400).json({ error: response.error });
          } else {
            res.status(201).json(response);
          }
          await messageBroker.removeConsumer('user_responses');
        }
      };
      messageBroker.consume('user_responses', consumer);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


  async updateUser(req, res) {
      try {
        const correlationId = uuidv4(); 
        const replyToQueue = 'user_responses'; 
        const updateFields = req.body;

        await messageBroker.publish({
          operation: 'updateUser',
          data: { id: req.params.id,
            updateFields
          }
        }, correlationId, replyToQueue);
     
        const consumer = async (response, respCorrelationId) => {
          if (respCorrelationId === correlationId) { 
            console.log('[Cliente] Respuesta recibida:', response);
            if (response.error) {
              res.status(400).json({ error: response.error });
            } else {
              res.status(201).json(response);
            }
            await messageBroker.removeConsumer('user_responses');
          }
        };
    
        messageBroker.consume('user_responses', consumer);
  
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }


  async deleteUser(req, res) {
      try {
        const correlationId = uuidv4(); 
        const replyToQueue = 'user_responses'; 
    
        await messageBroker.publish({
          operation: 'deleteUser',
          data: { id: req.params.id }
        }, correlationId, replyToQueue);
     
        const consumer = async (response, respCorrelationId) => {
          if (respCorrelationId === correlationId) { 
            console.log('[Cliente] Respuesta recibida:', response);
            if (response.error) {
              res.status(400).json({ error: response.error });
            } else {
              res.status(201).json(response);
            }
            await messageBroker.removeConsumer('user_responses');
          }
        };
        messageBroker.consume('user_responses', consumer);
  
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }


  async getAllUsers(req, res) {
    try {
      const correlationId = uuidv4(); 
      const replyToQueue = 'user_responses'; 
  
      await messageBroker.publish({
        operation: 'getAllUsers',
        data: req.body
      }, correlationId, replyToQueue);
   
      const consumer = async (response, respCorrelationId) => {
        if (respCorrelationId === correlationId) { 
          console.log('[Cliente] Respuesta recibida:', response);
          if (response.error) {
            res.status(400).json({ error: response.error });
          } else {
            res.status(201).json(response);
          }
          await messageBroker.removeConsumer('user_responses');
        }
      };
      messageBroker.consume('user_responses', consumer);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

}

module.exports = UserController;