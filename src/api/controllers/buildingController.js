const messageBroker = require('../../core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');

class BuildingController {
  constructor() {
    messageBroker.connect().catch(console.error);
    this.buildingQueue = 'building_operations';
    this.responseQueue = 'building_responses';
  }

  async getBuildingInfo(req, res) {
    try {
      const correlationId = uuidv4();
      const replyToQueue = this.responseQueue;

      await messageBroker.channel.assertQueue(replyToQueue, { durable: true });

      await messageBroker.publish({
        operation: 'getBuildingInfo',
        data: {}
      }, correlationId, replyToQueue, this.buildingQueue);

      const consumer = async (response, respCorrelationId) => {
        if (respCorrelationId === correlationId) {
          if (response.error) {
            res.status(400).json({ error: response.error });
          } else {
            res.status(200).json(response);
          }
          await messageBroker.removeConsumer(replyToQueue);
        }
      };
      messageBroker.consume(replyToQueue, consumer);

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOccupancyPercentage(req, res) {
    try {
      const correlationId = uuidv4();
      const replyToQueue = this.responseQueue;

      await messageBroker.publish({
        operation: 'getOccupancyPercentage',
        data: {}
      }, correlationId, replyToQueue, this.buildingQueue);

      const consumer = async (response, respCorrelationId) => {
        if (respCorrelationId === correlationId) {
          if (response.error) {
            res.status(400).json({ error: response.error });
          } else {
            res.status(200).json(response);
          }
          await messageBroker.removeConsumer(replyToQueue);
        }
      };
      messageBroker.consume(replyToQueue, consumer);

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOpeningHours(req, res) {
    try {
      const correlationId = uuidv4();
      const replyToQueue = this.responseQueue;

      await messageBroker.publish({
        operation: 'getOpeningHours',
        data: {}
      }, correlationId, replyToQueue, this.buildingQueue);

      const consumer = async (response, respCorrelationId) => {
        if (respCorrelationId === correlationId) {
          if (response.error) {
            res.status(400).json({ error: response.error });
          } else {
            res.status(200).json(response);
          }
          await messageBroker.removeConsumer(replyToQueue);
        }
      };
      messageBroker.consume(replyToQueue, consumer);

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateOccupancyPercentage(req, res) {
    try {
      const correlationId = uuidv4();
      const replyToQueue = this.responseQueue;

      if (!req.body.percentage || typeof req.body.percentage !== 'number') {
        return res.status(400).json({ error: 'Se requiere un porcentaje válido' });
      }

      await messageBroker.publish({
        operation: 'updateOccupancyPercentage',
        data: {
          percentage: req.body.percentage
        }
      }, correlationId, replyToQueue, this.buildingQueue);

      const consumer = async (response, respCorrelationId) => {
        if (respCorrelationId === correlationId) {
          if (response.error) {
            res.status(400).json({ error: response.error });
          } else {
            res.status(200).json(response);
          }
          await messageBroker.removeConsumer(replyToQueue);
        }
      };
      messageBroker.consume(replyToQueue, consumer);

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateOpeningHours(req, res) {
    try {
      const correlationId = uuidv4();
      const replyToQueue = this.responseQueue;

      if (!req.body.day || !req.body.hours) {
        return res.status(400).json({ error: 'Se requieren datos válidos para actualizar horarios' });
      }

      await messageBroker.publish({
        operation: 'updateOpeningHours',
        data: {
          day: req.body.day,
          hours: req.body.hours
        }
      }, correlationId, replyToQueue, this.buildingQueue);

      const consumer = async (response, respCorrelationId) => {
        if (respCorrelationId === correlationId) {
          if (response.error) {
            res.status(400).json({ error: response.error });
          } else {
            res.status(200).json(response);
          }
          await messageBroker.removeConsumer(replyToQueue);
        }
      };
      messageBroker.consume(replyToQueue, consumer);

    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = BuildingController;