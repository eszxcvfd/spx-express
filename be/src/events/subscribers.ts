import { EventType } from './types.js';
import { randomUUID } from 'crypto';

export interface EventHandler {
  id: string;
  eventType: EventType | '*';
  handler: (payload: Record<string, unknown>) => Promise<void>;
  description?: string;
}

type HandlerMap = Map<string, Set<EventHandler>>;

class SubscriberRegistry {
  private handlers: HandlerMap = new Map();
  private processedEvents: Map<string, boolean> = new Map();

  subscribe(eventType: EventType | '*', handler: (payload: Record<string, unknown>) => Promise<void>, description?: string): string {
    const id = randomUUID();

    const subscription: EventHandler = {
      id,
      eventType,
      handler,
      description,
    };

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(subscription);

    console.log(`[SUBSCRIBER] Registered handler ${id} for event type: ${eventType}`);

    return id;
  }

  unsubscribe(eventType: EventType | '*', handlerId: string): boolean {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return false;

    for (const handler of handlers) {
      if (handler.id === handlerId) {
        handlers.delete(handler);
        console.log(`[SUBSCRIBER] Unregistered handler ${handlerId} from event type: ${eventType}`);
        return true;
      }
    }

    return false;
  }

  unsubscribeById(handlerId: string): boolean {
    for (const [eventType, handlers] of this.handlers.entries()) {
      for (const handler of handlers) {
        if (handler.id === handlerId) {
          handlers.delete(handler);
          console.log(`[SUBSCRIBER] Unregistered handler ${handlerId} from event type: ${eventType}`);
          return true;
        }
      }
    }
    return false;
  }

  getHandlers(eventType: EventType): EventHandler[] {
    const specificHandlers = this.handlers.get(eventType) || new Set();
    const wildcardHandlers = this.handlers.get('*') || new Set();

    return [...specificHandlers, ...wildcardHandlers];
  }

  markProcessed(eventType: EventType, entityId: string, handlerId: string): void {
    const key = `${eventType}:${entityId}:${handlerId}`;
    this.processedEvents.set(key, true);
  }

  isProcessed(eventType: EventType, entityId: string, handlerId: string): boolean {
    const key = `${eventType}:${entityId}:${handlerId}`;
    return this.processedEvents.get(key) === true;
  }

  clearProcessedEvents(): void {
    this.processedEvents.clear();
  }

  getSubscriberCount(): number {
    let count = 0;
    for (const handlers of this.handlers.values()) {
      count += handlers.size;
    }
    return count;
  }

  getEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export const subscriberRegistry = new SubscriberRegistry();
