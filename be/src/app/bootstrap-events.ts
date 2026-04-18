import { subscriberRegistry } from '../events/subscribers.js';
import { OutboxProcessor } from '../events/outbox-processor.js';
import { registerPackingMovedToSortingHandler } from '../modules/sorting/application/events/packing-moved-to-sorting-handler.js';
import { registerOutboundMovedToPackingHandler } from '../modules/packing/application/events/outbound-moved-to-packing-handler.js';
import { registerSortingCompletedHandler } from '../modules/shipping/application/events/sorting-completed-handler.js';
import { registerPurchaseOrderHandoffHandler } from '../modules/inbound/application/events/purchase-order-handoff-handler.js';

let outboxProcessor: OutboxProcessor | null = null;

export function registerEventHandlers(): void {
  console.log('[BOOTSTRAP] Registering event handlers...');

  // Event handlers will be registered here by domain modules
  registerPackingMovedToSortingHandler();
  registerOutboundMovedToPackingHandler();
  registerSortingCompletedHandler();
  registerPurchaseOrderHandoffHandler();

  const handlerCount = subscriberRegistry.getSubscriberCount();
  console.log(`[BOOTSTRAP] Registered ${handlerCount} event handlers`);
}

export function startOutboxProcessor(intervalMs = 5000, batchSize = 50): void {
  if (outboxProcessor) {
    console.log('[BOOTSTRAP] OutboxProcessor already started');
    return;
  }

  outboxProcessor = new OutboxProcessor(intervalMs, batchSize);
  outboxProcessor.start();

  console.log(`[BOOTSTRAP] OutboxProcessor started (${intervalMs}ms interval, ${batchSize} batch size)`);
}

export function stopOutboxProcessor(): void {
  if (outboxProcessor) {
    outboxProcessor.stop();
    outboxProcessor = null;
    console.log('[BOOTSTRAP] OutboxProcessor stopped');
  }
}

export function getOutboxProcessor(): OutboxProcessor | null {
  return outboxProcessor;
}
