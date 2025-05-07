const amqp = require('amqplib');

class MessageBroker {

  constructor() {
    this.connection = null;
    this.channel = null;
    this.requestQueueA = 'user_operations'; // Cola de solicitudes para usuarios
    this.responseQueueA = 'user_responses'; // Cola para respuestas para usuarios
    this.requestQueueB = 'building_operations'; // Cola de solicitudes para edificios
    this.responseQueueB = 'building_responses'; // Cola para respuestas para edificios
    this.requestQueueC = 'space_operations'; // Cola de solicitudes para espacios
    this.responseQueueC = 'space_responses'; // Cola para respuestas para espacios
    this.requestQueueD = 'reservation_operations'; // Cola de solicitudes para espacios
    this.responseQueueD = 'reservation_responses'; // Cola para respuestas para espacios
    this.amqpUrl = 'amqps://xvrhrdqc:WoZh4rUov7sSoTNqbRssm1YbgRpc647a@kebnekaise.lmq.cloudamqp.com/xvrhrdqc';
    this.consumerTags = {};
  }

  async connect() {
    this.connection = await amqp.connect(this.amqpUrl);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.requestQueueA, { durable: true });
    await this.channel.assertQueue(this.responseQueueA, { durable: true }); 
    await this.channel.assertQueue(this.requestQueueB, { durable: true });
    await this.channel.assertQueue(this.responseQueueB, { durable: true }); 
    await this.channel.assertQueue(this.requestQueueC, { durable: true });
    await this.channel.assertQueue(this.responseQueueC, { durable: true }); 
    await this.channel.assertQueue(this.requestQueueD, { durable: true });
    await this.channel.assertQueue(this.responseQueueD, { durable: true }); 
    console.log('[RabbitMQ] Conectado a CloudAMQP');
  }

  async publish(message, correlationId, replyToQueue, requestQueue) {
    await this.channel.sendToQueue(
      requestQueue,
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
  
  async waitForConsumerTag(queue, retries = 5, delay = 100) {
    while (!this.consumerTags[queue] && retries > 0) {
      await new Promise(res => setTimeout(res, delay));
      retries--;
    }
  }

  async removeConsumer(queue) {
    console.log(`[RabbitMQ] ConsumerTag`,queue);
    console.log(`[RabbitMQ] ConsumerTag`,this.consumerTags);
    await this.waitForConsumerTag(queue);
    if (this.consumerTags[queue]) {
      await this.channel.cancel(this.consumerTags[queue]); 
      delete this.consumerTags[queue];
      console.log(`[RabbitMQ] Consumidor en ${queue} eliminado`);
    }
  }
  

}

module.exports = new MessageBroker();
