import { EventType } from './types.js';
import {
  getPendingEvents,
  lockEvent,
  markEventProcessed,
  markEventFailed,
  type OutboxEnvelope,
} from './outbox.js';
import { subscriberRegistry } from './subscribers.js';

const MAX_RETRY_ATTEMPTS = 3;

export interface ProcessingResult {
  eventId: string;
  eventType: string;
  processed: boolean;
  handlerResults: Array<{
    handlerId: string;
    success: boolean;
    error?: string;
  }>;
}

async function processEvent(envelope: OutboxEnvelope): Promise<ProcessingResult> {
  const handlers = subscriberRegistry.getHandlers(envelope.eventType as EventType);

  if (handlers.length === 0) {
    console.log(`[OUTBOX_PROCESSOR] No handlers for event ${envelope.eventType}, marking as processed`);
    await markEventProcessed(envelope.id);
    return {
      eventId: envelope.id,
      eventType: envelope.eventType,
      processed: true,
      handlerResults: [],
    };
  }

  const results: Array<{ handlerId: string; success: boolean; error?: string }> = [];

  for (const handler of handlers) {
    const idempotencyKey = `${envelope.eventType}:${envelope.entityId}:${handler.id}`;

    if (subscriberRegistry.isProcessed(envelope.eventType as EventType, envelope.entityId, handler.id)) {
      console.log(`[OUTBOX_PROCESSOR] Skipping already-processed handler ${handler.id} for ${idempotencyKey}`);
      results.push({ handlerId: handler.id, success: true });
      continue;
    }

    try {
      await handler.handler(envelope.payload);
      subscriberRegistry.markProcessed(envelope.eventType as EventType, envelope.entityId, handler.id);
      results.push({ handlerId: handler.id, success: true });
      console.log(`[OUTBOX_PROCESSOR] Handler ${handler.id} processed event ${envelope.eventType}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({ handlerId: handler.id, success: false, error: errorMessage });
      console.error(`[OUTBOX_PROCESSOR] Handler ${handler.id} failed for ${envelope.eventType}: ${errorMessage}`);
    }
  }

  const allSucceeded = results.every((r) => r.success);

  if (allSucceeded) {
    await markEventProcessed(envelope.id);
  } else {
    const failedCount = results.filter((r) => !r.success).length;
    await markEventFailed(envelope.id, `${failedCount} handler(s) failed`);

    if (envelope.attempts >= MAX_RETRY_ATTEMPTS) {
      console.log(`[OUTBOX_PROCESSOR] Event ${envelope.id} exceeded max retry attempts (${MAX_RETRY_ATTEMPTS}), leaving as FAILED`);
    }
  }

  return {
    eventId: envelope.id,
    eventType: envelope.eventType,
    processed: allSucceeded,
    handlerResults: results,
  };
}

export async function processOutboxBatch(limit = 50): Promise<ProcessingResult[]> {
  const pendingEvents = await getPendingEvents(limit);
  const results: ProcessingResult[] = [];

  for (const event of pendingEvents) {
    if (event.attempts >= MAX_RETRY_ATTEMPTS) {
      console.log(`[OUTBOX_PROCESSOR] Skipping event ${event.id} - exceeded max attempts`);
      continue;
    }

    const locked = await lockEvent(event.id);
    if (!locked) {
      console.log(`[OUTBOX_PROCESSOR] Could not lock event ${event.id} - may be processed by another worker`);
      continue;
    }

    const result = await processEvent(locked);
    results.push(result);
  }

  return results;
}

export async function retryFailedEvents(limit = 50): Promise<ProcessingResult[]> {
  const pendingEvents = await getPendingEvents(limit);
  const failedOnly = pendingEvents.filter((e) => e.status === 'FAILED');

  if (failedOnly.length === 0) {
    return [];
  }

  console.log(`[OUTBOX_PROCESSOR] Retrying ${failedOnly.length} failed events`);

  const results: ProcessingResult[] = [];

  for (const event of failedOnly) {
    if (event.attempts >= MAX_RETRY_ATTEMPTS) {
      continue;
    }

    const locked = await lockEvent(event.id);
    if (!locked) {
      continue;
    }

    const result = await processEvent(locked);
    results.push(result);
  }

  return results;
}

export class OutboxProcessor {
  private isRunning = false;
  private intervalMs: number;
  private batchSize: number;

  constructor(intervalMs = 5000, batchSize = 50) {
    this.intervalMs = intervalMs;
    this.batchSize = batchSize;
  }

  async processOnce(): Promise<ProcessingResult[]> {
    return processOutboxBatch(this.batchSize);
  }

  async retryOnce(): Promise<ProcessingResult[]> {
    return retryFailedEvents(this.batchSize);
  }

  start(): void {
    if (this.isRunning) {
      console.log('[OUTBOX_PROCESSOR] Already running');
      return;
    }

    this.isRunning = true;
    console.log(`[OUTBOX_PROCESSOR] Starting processor with ${this.intervalMs}ms interval`);

    const runLoop = async () => {
      while (this.isRunning) {
        try {
          await this.processOnce();
          await this.retryOnce();
        } catch (error) {
          console.error('[OUTBOX_PROCESSOR] Error in processing loop:', error);
        }
        await new Promise((resolve) => setTimeout(resolve, this.intervalMs));
      }
    };

    runLoop();
  }

  stop(): void {
    console.log('[OUTBOX_PROCESSOR] Stopping processor');
    this.isRunning = false;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}
