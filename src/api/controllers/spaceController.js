const messageBroker = require('../../core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');

class SpaceController {
  constructor() {
    this.requestQueue = 'space_operations';
    this.replyToQueue = 'space_responses';
    messageBroker.connect().catch(console.error);
  }

  async createSpace(req, res) {
    await this.sendMessage('createSpace', req.body, res);
  }

  async getSpaceById(req, res) {
    await this.sendMessage('getSpaceById', { id: req.params.id }, res);
  }

  async updateSpace(req, res) {
    const allowedUpdateFields = [
      'reservationCategory',
      'assignmentTarget',
      'maxUsagePercentage',
      'customSchedule',
      'isReservable'
      ];

    const requestedFields = Object.keys(req.body);
    const invalidFields = requestedFields.filter(field => !allowedUpdateFields.includes(field));
    
    if (invalidFields.length > 0) {
      return res.status(400).json({
        error: `No se permite actualizar los siguientes campos: ${invalidFields.join(', ')}. Los campos permitidos son: ${allowedUpdateFields.join(', ')}`
      });
    }

    const filteredUpdateFields = {};
    for (const field of allowedUpdateFields) {
      if (req.body.hasOwnProperty(field)) {
        filteredUpdateFields[field] = req.body[field];
      }
    }

    if (Object.keys(filteredUpdateFields).length === 0) {
      return res.status(400).json({
        error: 'No se proporcionaron campos válidos para actualizar. Los campos permitidos son: reservationCategory, assignmentTarget, maxUsagePercentage, customSchedule, isReservable, y spaceType.'
      });
    }

    const data = {
      id: req.params.id,
      updateFields: filteredUpdateFields
    };
    
    await this.sendMessage('updateSpace', data, res);
  }

  async deleteSpace(req, res) {
    await this.sendMessage('deleteSpace', { id: req.params.id }, res);
  }

  async getAllSpaces(req, res) {
    await this.sendMessage('getAllSpaces', req.body, res);
  }

  async findSpacesByFloor(req, res) {
    await this.sendMessage('findSpacesByFloor', { floor: parseInt(req.params.floor) }, res);
  }

  async findSpacesByCategory(req, res) {
    await this.sendMessage('findSpacesByCategory', { category: req.params.category }, res);
  }

  async findSpacesByMinOccupants(req, res) {
    await this.sendMessage('findSpacesByMinOccupants', { minOccupants: parseInt(req.params.minOccupants) }, res);
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
            const status = operation === 'createSpace' ? 201 : 200;
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

module.exports = SpaceController;