import { describe, expect, it, vi, beforeEach } from 'vitest';
import { subscriberRegistry, type EventHandler } from '../subscribers';
import { EventType } from '../types';

describe('subscribers', () => {
  beforeEach(() => {
    for (const eventType of subscriberRegistry.getEventTypes()) {
      const handlers = subscriberRegistry.getHandlers(eventType as EventType);
      for (const handler of handlers) {
        subscriberRegistry.unsubscribeById(handler.id);
      }
    }
    subscriberRegistry.clearProcessedEvents();
  });

  describe('subscribe', () => {
    it('should register a handler for a specific event type', () => {
      const handler = vi.fn();
      const id = subscriberRegistry.subscribe('ORDER_PURCHASE_PLAN_CREATED', handler, 'Test handler');

      const handlers = subscriberRegistry.getHandlers('ORDER_PURCHASE_PLAN_CREATED' as EventType);

      expect(handlers).toHaveLength(1);
      expect(handlers[0].id).toBe(id);
      expect(handlers[0].handler).toBe(handler);
    });

    it('should register a handler for wildcard event type', () => {
      const handler = vi.fn();
      const id = subscriberRegistry.subscribe('*', handler);

      const handlers = subscriberRegistry.getHandlers('ORDER_PURCHASE_PLAN_CREATED' as EventType);

      expect(handlers).toHaveLength(1);
      expect(handlers[0].id).toBe(id);
    });

    it('should allow multiple handlers for same event type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      subscriberRegistry.subscribe('ORDER_PURCHASE_PLAN_CREATED', handler1);
      subscriberRegistry.subscribe('ORDER_PURCHASE_PLAN_CREATED', handler2);

      const handlers = subscriberRegistry.getHandlers('ORDER_PURCHASE_PLAN_CREATED' as EventType);

      expect(handlers).toHaveLength(2);
    });

    it('should return a subscription id', () => {
      const handler = vi.fn();
      const id = subscriberRegistry.subscribe('ORDER_PURCHASE_PLAN_CREATED', handler);

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('unsubscribe', () => {
    it('should remove a handler by event type and handler id', () => {
      const handler = vi.fn();
      const id = subscriberRegistry.subscribe('ORDER_PURCHASE_PLAN_CREATED', handler);

      const result = subscriberRegistry.unsubscribe('ORDER_PURCHASE_PLAN_CREATED' as EventType, id);

      expect(result).toBe(true);
      const handlers = subscriberRegistry.getHandlers('ORDER_PURCHASE_PLAN_CREATED' as EventType);
      expect(handlers).toHaveLength(0);
    });

    it('should return false when handler not found', () => {
      const result = subscriberRegistry.unsubscribe('ORDER_PURCHASE_PLAN_CREATED' as EventType, 'non-existent-id');

      expect(result).toBe(false);
    });

    it('should remove handler by id regardless of event type', () => {
      const handler = vi.fn();
      const id = subscriberRegistry.subscribe('ORDER_PURCHASE_PLAN_CREATED', handler);

      const result = subscriberRegistry.unsubscribeById(id);

      expect(result).toBe(true);
      expect(subscriberRegistry.getSubscriberCount()).toBe(0);
    });
  });

  describe('getHandlers', () => {
    it('should return handlers for specific event type plus wildcard handlers', () => {
      const specificFn = vi.fn();
      const wildcardFn = vi.fn();

      subscriberRegistry.subscribe('ORDER_PURCHASE_PLAN_CREATED', specificFn);
      subscriberRegistry.subscribe('*', wildcardFn);

      const handlers = subscriberRegistry.getHandlers('ORDER_PURCHASE_PLAN_CREATED' as EventType);

      expect(handlers).toHaveLength(2);
      expect(handlers[0].handler).toBe(specificFn);
      expect(handlers[1].handler).toBe(wildcardFn);
    });

    it('should return empty array when no handlers registered', () => {
      const handlers = subscriberRegistry.getHandlers('ORDER_PURCHASE_PLAN_CREATED' as EventType);

      expect(handlers).toHaveLength(0);
    });
  });

  describe('idempotency', () => {
    it('should mark event as processed', () => {
      subscriberRegistry.markProcessed('ORDER_PURCHASE_PLAN_CREATED' as EventType, 'po-1', 'handler-1');

      const isProcessed = subscriberRegistry.isProcessed('ORDER_PURCHASE_PLAN_CREATED' as EventType, 'po-1', 'handler-1');

      expect(isProcessed).toBe(true);
    });

    it('should return false for unprocessed events', () => {
      const isProcessed = subscriberRegistry.isProcessed('ORDER_PURCHASE_PLAN_CREATED' as EventType, 'po-1', 'handler-1');

      expect(isProcessed).toBe(false);
    });

    it('should track processed status per event, entity, and handler combination', () => {
      subscriberRegistry.markProcessed('ORDER_PURCHASE_PLAN_CREATED' as EventType, 'po-1', 'handler-1');

      expect(subscriberRegistry.isProcessed('ORDER_PURCHASE_PLAN_CREATED' as EventType, 'po-1', 'handler-1')).toBe(true);
      expect(subscriberRegistry.isProcessed('ORDER_PURCHASE_PLAN_CREATED' as EventType, 'po-1', 'handler-2')).toBe(false);
      expect(subscriberRegistry.isProcessed('ORDER_PURCHASE_PLAN_CREATED' as EventType, 'po-2', 'handler-1')).toBe(false);
    });

    it('should clear all processed events', () => {
      subscriberRegistry.markProcessed('ORDER_PURCHASE_PLAN_CREATED' as EventType, 'po-1', 'handler-1');
      subscriberRegistry.markProcessed('ORDER_PURCHASE_PLAN_CREATED' as EventType, 'po-2', 'handler-2');

      subscriberRegistry.clearProcessedEvents();

      expect(subscriberRegistry.isProcessed('ORDER_PURCHASE_PLAN_CREATED' as EventType, 'po-1', 'handler-1')).toBe(false);
      expect(subscriberRegistry.isProcessed('ORDER_PURCHASE_PLAN_CREATED' as EventType, 'po-2', 'handler-2')).toBe(false);
    });
  });

  describe('getSubscriberCount', () => {
    it('should return total number of subscribed handlers', () => {
      subscriberRegistry.subscribe('ORDER_PURCHASE_PLAN_CREATED', vi.fn());
      subscriberRegistry.subscribe('ORDER_PURCHASE_PLAN_CREATED', vi.fn());
      subscriberRegistry.subscribe('INBOUND_CREATED', vi.fn());
      subscriberRegistry.subscribe('*', vi.fn());

      expect(subscriberRegistry.getSubscriberCount()).toBe(4);
    });
  });

  describe('getEventTypes', () => {
    it('should return list of registered event types', () => {
      subscriberRegistry.subscribe('ORDER_PURCHASE_PLAN_CREATED', vi.fn());
      subscriberRegistry.subscribe('INBOUND_CREATED', vi.fn());
      subscriberRegistry.subscribe('*', vi.fn());

      const eventTypes = subscriberRegistry.getEventTypes();

      expect(eventTypes).toContain('ORDER_PURCHASE_PLAN_CREATED');
      expect(eventTypes).toContain('INBOUND_CREATED');
      expect(eventTypes).toContain('*');
    });
  });
});
