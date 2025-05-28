const messageBroker = require('../../core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');

class BuildingController {
  constructor() {
    messageBroker.connect().catch(console.error);
    this.requestQueue = 'building_operations';
    this.replyToQueue = 'building_responses';
  }

  async getBuildingInfo(req, res) {
    await this.sendMessage('getBuildingInfo', {}, res);
  }

  async getOccupancyPercentage(req, res) {
    await this.sendMessage('getOccupancyPercentage', {}, res);
  }

  async getOpeningHours(req, res) {
    await this.sendMessage('getOpeningHours', {}, res);
  }

  async updateOccupancyPercentage(req, res) {
    const { percentage } = req.body;
    if (typeof percentage !== 'number') {
      return res.status(400).json({ error: 'Se requiere un porcentaje válido' });
    }
    await this.sendMessage('updateOccupancyPercentage', { percentage }, res);
  }

  async updateOpeningHours(req, res) {
    const { day, hours } = req.body;
    if (!day || !hours) {
      return res.status(400).json({ error: 'Se requieren datos válidos para actualizar horarios' });
    }
    await this.sendMessage('updateOpeningHours', { day, hours }, res);
  }

  async sendMessage(operation, data, res) {
    try {
      const correlationId = uuidv4();

      await messageBroker.consumeReplies(this.replyToQueue);

      const responsePromise = new Promise((resolve, reject) => {
        messageBroker.responseHandlers[correlationId] = { resolve, reject };
      });

      await messageBroker.publish(
        { operation, data },
        correlationId,
        this.replyToQueue,
        this.requestQueue
      );

      const response = await responsePromise;

      if (response.error) {
        res.status(400).json({ error: response.error });
      } else {
        const status = operation === 'buildingInfo' ? 201 : 200;
        res.status(status).json(response);
      }

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = BuildingController;
