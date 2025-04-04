const amqp = require('amqplib');

class MessageBroker {

  constructor() {
    this.connection = null;
    this.channel = null;
    this.requestQueue = 'user_operations'; // Cola de solicitudes
    this.responseQueue = 'user_responses'; // Cola para respuestas
    this.amqpUrl = 'amqps://xvrhrdqc:WoZh4rUov7sSoTNqbRssm1YbgRpc647a@kebnekaise.lmq.cloudamqp.com/xvrhrdqc';
    this.consumerTags = {};
  }

  async connect() {
    this.connection = await amqp.connect(this.amqpUrl);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.requestQueue, { durable: true });
    await this.channel.assertQueue(this.responseQueue, { durable: true }); 
    console.log('[RabbitMQ] Conectado a CloudAMQP');
  }

  async publish(message, correlationId, replyToQueue) {
    await this.channel.sendToQueue(
      this.requestQueue,
      Buffer.from(JSON.stringify({ ...message, replyTo: replyToQueue })), // Usamos replyTo dinámicamente
      { persistent: true, correlationId }
    );
  }
  

  async sendResponse(message, correlationId, replyToQueue) {
    await this.channel.sendToQueue(
      replyToQueue, 
      Buffer.from(JSON.stringify(message)),
      { persistent: true, correlationId }
    );
  }
  

  async consume(queue, callback) {
    const { consumerTag } = await this.channel.consume(queue, async (msg) => {
      if (!msg || !msg.content) {
        console.error(`[RabbitMQ] Mensaje inválido en ${queue}:`, msg);
        return;
      }
  
      try {
        const message = JSON.parse(msg.content.toString());
        const correlationId = msg.properties.correlationId;
  
        await callback(message, correlationId);
  
        this.channel.ack(msg); 
  
      } catch (error) {
        console.error(`[RabbitMQ] Error al procesar mensaje en ${queue}:`, error);
        this.channel.nack(msg);
      }
    });
  
    this.consumerTags[queue] = consumerTag; 
  }
  
  
  async removeConsumer(queue) {
    if (this.consumerTags[queue]) {
      await this.channel.cancel(this.consumerTags[queue]); 
      delete this.consumerTags[queue];
      console.log(`[RabbitMQ] Consumidor en ${queue} eliminado`);
    }
  }
  

}

module.exports = new MessageBroker();
