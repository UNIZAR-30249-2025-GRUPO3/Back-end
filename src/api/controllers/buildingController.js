const messageBroker = require('../../core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');

class BuildingController {
  constructor() {
    messageBroker.connect().catch(console.error);
    this.requestQueue = 'building_operations';
    this.responseQueue = 'building_responses';
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
    const correlationId = uuidv4();

    try {
      await messageBroker.channel.assertQueue(this.responseQueue, { durable: true });

      await messageBroker.publish(
        { operation, data },
        correlationId,
        this.responseQueue,
        this.requestQueue
      );

      const consumer = async (response, respCorrelationId) => {
        if (respCorrelationId === correlationId) {
          if (response.error) {
            res.status(400).json({ error: response.error });
          } else {
            res.status(200).json(response);
          }
          await messageBroker.removeConsumer(this.responseQueue);
        }
      };

      messageBroker.consume(this.responseQueue, consumer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = BuildingController;
