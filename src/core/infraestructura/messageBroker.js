const amqp = require('amqplib');

class MessageBroker {

  constructor() {
    this.connection = null;
    this.channel = null;
    this.queue = 'user_operations';
    this.amqpUrl = 'amqps://xvrhrdqc:WoZh4rUov7sSoTNqbRssm1YbgRpc647a@kebnekaise.lmq.cloudamqp.com/xvrhrdqc';
  }

  async connect() {
    this.connection = await amqp.connect(this.amqpUrl);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queue, { durable: true });
    console.log('[RabbitMQ] Conectado a CloudAMQP');
  }

  async publish(message) {
    await this.channel.sendToQueue(
      this.queue,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }

    consume(callback) {
        this.channel.consume(this.queue, (msg) => {
        if (!msg || !msg.content) {
            console.error('[RabbitMQ] Mensaje inválido recibido:', msg);
            return;
        }
        try {
            const message = JSON.parse(msg.content.toString());
            callback(message);
            this.channel.ack(msg); 
        } catch (error) {
            console.error('[RabbitMQ] Error al parsear mensaje:', error);
            this.channel.nack(msg); 
        }
        });
    }
}

module.exports = new MessageBroker();