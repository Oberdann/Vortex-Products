import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { ConfirmChannel } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/database/prisma.service';
import {
  PRODUCT_CREATED_EVENT,
  PRODUCT_DELETED_EVENT,
  RABBITMQ_EVENTS_EXCHANGE,
  RETRY_DELAY_MS,
  STOCK_PRODUCT_CREATED_DLX,
  STOCK_PRODUCT_CREATED_FAILED_ROUTE,
  STOCK_PRODUCT_CREATED_QUEUE,
  STOCK_PRODUCT_CREATED_RETRY_QUEUE,
  STOCK_PRODUCT_DELETED_DLQ,
  STOCK_PRODUCT_DELETED_FAILED_ROUTE,
  STOCK_PRODUCT_DELETED_QUEUE,
  STOCK_PRODUCT_DELETED_RETRY_QUEUE,
} from 'src/common/messaging/rabbitmq-topology';

const POLL_INTERVAL_MS = 3000;
const BATCH_SIZE = 25;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1000;

@Injectable()
export class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
  private pollingTimer?: NodeJS.Timeout;
  private publishing = false;
  private shuttingDown = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {}

  onModuleInit() {
    if (!process.env.RABBITMQ_URL) {
      this.logger.error('RABBITMQ_URL nao foi configurada.');
    }

    this.pollingTimer = setInterval(
      () => void this.publishPendingEvents(),
      POLL_INTERVAL_MS,
    );

    this.pollingTimer.unref();
    void this.publishPendingEvents();
  }

  async onModuleDestroy() {
    this.shuttingDown = true;
    if (this.pollingTimer) clearInterval(this.pollingTimer);
  }

  private async publishPendingEvents() {
    if (this.publishing || this.shuttingDown || !process.env.RABBITMQ_URL) {
      return;
    }

    this.publishing = true;
    let connection: amqp.ChannelModel | undefined;
    let channel: ConfirmChannel | undefined;

    try {
      connection = await amqp.connect(process.env.RABBITMQ_URL);

      channel = await connection.createConfirmChannel();

      await this.declareTopology(channel);

      const events = await this.prisma.outboxEvent.findMany({
        where: {
          publishedAt: null,
          nextAttemptAt: { lte: new Date() },
        },
        orderBy: { createdAt: 'asc' },
        take: BATCH_SIZE,
      });

      for (const event of events) {
        await this.publishEvent(channel, event);
      }
    } catch (error) {
      this.logger.error(
        { errorType: error instanceof Error ? error.name : 'UnknownError' },
        'Falha ao conectar ao RabbitMQ ou consultar a Outbox.',
      );
    } finally {
      await channel?.close().catch(() => undefined);

      await connection?.close().catch(() => undefined);

      this.publishing = false;
    }
  }

  private async declareTopology(channel: ConfirmChannel) {
    await channel.assertExchange(RABBITMQ_EVENTS_EXCHANGE, 'topic', {
      durable: true,
    });

    await channel.assertExchange(STOCK_PRODUCT_CREATED_DLX, 'topic', {
      durable: true,
    });

    await channel.assertQueue(STOCK_PRODUCT_CREATED_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': STOCK_PRODUCT_CREATED_DLX,
        'x-dead-letter-routing-key': STOCK_PRODUCT_CREATED_FAILED_ROUTE,
      },
    });

    await channel.assertQueue(STOCK_PRODUCT_CREATED_RETRY_QUEUE, {
      durable: true,
      arguments: {
        'x-message-ttl': RETRY_DELAY_MS,
        'x-dead-letter-exchange': RABBITMQ_EVENTS_EXCHANGE,
        'x-dead-letter-routing-key': PRODUCT_CREATED_EVENT,
      },
    });

    await channel.assertQueue(STOCK_PRODUCT_DELETED_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': STOCK_PRODUCT_CREATED_DLX,
        'x-dead-letter-routing-key': STOCK_PRODUCT_DELETED_FAILED_ROUTE,
      },
    });

    await channel.assertQueue(STOCK_PRODUCT_DELETED_RETRY_QUEUE, {
      durable: true,
      arguments: {
        'x-message-ttl': RETRY_DELAY_MS,
        'x-dead-letter-exchange': RABBITMQ_EVENTS_EXCHANGE,
        'x-dead-letter-routing-key': PRODUCT_DELETED_EVENT,
      },
    });

    await channel.assertQueue(STOCK_PRODUCT_DELETED_DLQ, { durable: true });

    await channel.bindQueue(
      STOCK_PRODUCT_CREATED_QUEUE,
      RABBITMQ_EVENTS_EXCHANGE,
      PRODUCT_CREATED_EVENT,
    );

    await channel.bindQueue(
      STOCK_PRODUCT_DELETED_QUEUE,
      RABBITMQ_EVENTS_EXCHANGE,
      PRODUCT_DELETED_EVENT,
    );

    await channel.bindQueue(
      STOCK_PRODUCT_DELETED_DLQ,
      STOCK_PRODUCT_CREATED_DLX,
      STOCK_PRODUCT_DELETED_FAILED_ROUTE,
    );
  }

  private async publishEvent(
    channel: ConfirmChannel,
    event: {
      id: string;
      aggregateId: string;
      eventType: string;
      payload: unknown;
      createdAt: Date;
      attempts: number;
    },
  ) {
    try {
      const envelope = {
        eventId: event.id,
        eventType: event.eventType,
        occurredAt: event.createdAt.toISOString(),
        data: event.payload,
      };

      channel.publish(
        RABBITMQ_EVENTS_EXCHANGE,
        event.eventType,
        Buffer.from(JSON.stringify(envelope)),
        {
          persistent: true,
          mandatory: true,
          contentType: 'application/json',
          messageId: event.id,
          timestamp: event.createdAt.getTime(),
          headers: { aggregateId: event.aggregateId },
        },
      );
      await channel.waitForConfirms();

      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: { publishedAt: new Date(), lastError: null },
      });
    } catch (error) {
      const attempts = event.attempts + 1;
      const delay = Math.min(1000 * 2 ** event.attempts, MAX_RETRY_DELAY_MS);

      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          attempts,
          nextAttemptAt: new Date(Date.now() + delay),
          lastError: error instanceof Error ? error.name : 'UnknownError',
        },
      });

      this.logger.warn(
        { outboxEventId: event.id, attempts },
        'Falha ao publicar evento; nova tentativa agendada.',
      );
    }
  }
}
