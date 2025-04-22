const messageBroker = require('../../core/infraestructura/messageBroker');
const { v4: uuidv4 } = require('uuid');

class ReservationController {
  constructor() {
    this.requestQueue = 'reservation_operations';
    this.replyToQueue = 'reservation_responses';
    messageBroker.connect().catch(console.error);
  }

  async createReservation(req, res) {
    await this.sendMessage('createReservation', req.body, res);
  }

  async getAllReservation(req, res) {
    await this.sendMessage('getAllReservation', {}, res);
  }

  async getReservationById(req, res) {
    await this.sendMessage('getReservationById', { id: req.params.id }, res);
  }

  async deleteReservation(req, res) {
    await this.sendMessage('deleteReservation', { id: req.params.id }, res);
  }

  async validateReservation(req, res) {
    await this.sendMessage('validateReservation', { ...req.body, id: req.params.id }, res);
  }

  async invalidateReservation(req, res) {
    await this.sendMessage('invalidReservation', { id: req.params.id }, res);
  }

  async getReservationsByUser(req, res) {
    await this.sendMessage('getReservationsByUser', { userId: req.params.userId }, res);
  }

  async getAliveReservations(req, res) {
    await this.sendMessage('getAliveReservations', {}, res);
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
            const status = operation === 'createReservation' ? 201 : 200;
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

module.exports = ReservationController;
