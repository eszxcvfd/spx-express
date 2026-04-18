import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockGetPendingEvents = vi.fn();
const mockLockEvent = vi.fn();
const mockMarkEventProcessed = vi.fn();
const mockMarkEventFailed = vi.fn();

vi.mock('../outbox', () => ({
  getPendingEvents: (...args: unknown[]) => mockGetPendingEvents(...args),
  lockEvent: (...args: unknown[]) => mockLockEvent(...args),
  markEventProcessed: (...args: unknown[]) => mockMarkEventProcessed(...args),
  markEventFailed: (...args: unknown[]) => mockMarkEventFailed(...args),
}));

const mockGetHandlers = vi.fn();
const mockMarkProcessed = vi.fn();
const mockIsProcessed = vi.fn();
const mockClearProcessedEvents = vi.fn();

vi.mock('../subscribers', () => ({
  subscriberRegistry: {
    getHandlers: (...args: unknown[]) => mockGetHandlers(...args),
    markProcessed: (...args: unknown[]) => mockMarkProcessed(...args),
    isProcessed: (...args: unknown[]) => mockIsProcessed(...args),
    clearProcessedEvents: vi.fn(() => mockClearProcessedEvents()),
  },
}));

vi.mock('../types', () => ({
  EventType: 'ORDER_PURCHASE_PLAN_CREATED',
}));

import { processOutboxBatch, retryFailedEvents, OutboxProcessor } from '../outbox-processor';

describe('outbox-processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClearProcessedEvents();
  });

  describe('processOutboxBatch', () => {
    it('should process pending events and mark as processed when handlers succeed', async () => {
      const mockEvent = {
        id: 'event-1',
        eventType: 'ORDER_PURCHASE_PLAN_CREATED',
        entityType: 'PurchaseOrder',
        entityId: 'po-1',
        payload: { orderNumber: 'PO001' },
        status: 'PENDING',
        attempts: 0,
        lastError: null,
        lockedAt: null,
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetPendingEvents.mockResolvedValue([mockEvent]);
      mockLockEvent.mockResolvedValue(mockEvent);
      mockIsProcessed.mockReturnValue(false);
      mockGetHandlers.mockReturnValue([
        {
          id: 'handler-1',
          eventType: 'ORDER_PURCHASE_PLAN_CREATED',
          handler: vi.fn().mockResolvedValue(undefined),
        },
      ]);

      const results = await processOutboxBatch(50);

      expect(results).toHaveLength(1);
      expect(results[0].processed).toBe(true);
      expect(mockMarkEventProcessed).toHaveBeenCalledWith('event-1');
    });

    it('should skip events that cannot be locked (already being processed)', async () => {
      const mockEvent = {
        id: 'event-1',
        eventType: 'ORDER_PURCHASE_PLAN_CREATED',
        status: 'PENDING',
        attempts: 0,
      };

      mockGetPendingEvents.mockResolvedValue([mockEvent]);
      mockLockEvent.mockResolvedValue(null);

      const results = await processOutboxBatch(50);

      expect(results).toHaveLength(0);
    });

    it('should skip events that exceeded max retry attempts', async () => {
      const mockEvent = {
        id: 'event-1',
        eventType: 'ORDER_PURCHASE_PLAN_CREATED',
        status: 'FAILED',
        attempts: 3,
      };

      mockGetPendingEvents.mockResolvedValue([mockEvent]);

      const results = await processOutboxBatch(50);

      expect(results).toHaveLength(0);
      expect(mockLockEvent).not.toHaveBeenCalled();
    });

    it('should mark event as failed when handler throws error', async () => {
      const mockEvent = {
        id: 'event-1',
        eventType: 'ORDER_PURCHASE_PLAN_CREATED',
        entityType: 'PurchaseOrder',
        entityId: 'po-1',
        payload: {},
        status: 'PENDING',
        attempts: 0,
        lastError: null,
        lockedAt: null,
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetPendingEvents.mockResolvedValue([mockEvent]);
      mockLockEvent.mockResolvedValue(mockEvent);
      mockIsProcessed.mockReturnValue(false);
      mockGetHandlers.mockReturnValue([
        {
          id: 'handler-1',
          eventType: 'ORDER_PURCHASE_PLAN_CREATED',
          handler: vi.fn().mockRejectedValue(new Error('Handler failed')),
        },
      ]);

      const results = await processOutboxBatch(50);

      expect(results[0].processed).toBe(false);
      expect(mockMarkEventFailed).toHaveBeenCalledWith('event-1', '1 handler(s) failed');
    });

    it('should skip already-processed handlers (idempotency)', async () => {
      const mockEvent = {
        id: 'event-1',
        eventType: 'ORDER_PURCHASE_PLAN_CREATED',
        entityType: 'PurchaseOrder',
        entityId: 'po-1',
        payload: {},
        status: 'PENDING',
        attempts: 0,
        lastError: null,
        lockedAt: null,
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetPendingEvents.mockResolvedValue([mockEvent]);
      mockLockEvent.mockResolvedValue(mockEvent);
      mockIsProcessed.mockReturnValue(true);
      mockGetHandlers.mockReturnValue([
        {
          id: 'handler-1',
          eventType: 'ORDER_PURCHASE_PLAN_CREATED',
          handler: vi.fn(),
        },
      ]);

      const results = await processOutboxBatch(50);

      expect(results[0].processed).toBe(true);
      expect(results[0].handlerResults[0].success).toBe(true);
    });

    it('should mark event as processed when no handlers registered', async () => {
      const mockEvent = {
        id: 'event-1',
        eventType: 'ORDER_PURCHASE_PLAN_CREATED',
        entityType: 'PurchaseOrder',
        entityId: 'po-1',
        payload: {},
        status: 'PENDING',
        attempts: 0,
        lastError: null,
        lockedAt: null,
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetPendingEvents.mockResolvedValue([mockEvent]);
      mockLockEvent.mockResolvedValue(mockEvent);
      mockGetHandlers.mockReturnValue([]);

      const results = await processOutboxBatch(50);

      expect(results[0].processed).toBe(true);
      expect(mockMarkEventProcessed).toHaveBeenCalledWith('event-1');
    });
  });

  describe('retryFailedEvents', () => {
    it('should only retry FAILED events', async () => {
      const pendingEvent = { id: 'pending-1', status: 'PENDING', attempts: 0 };
      const failedEvent = { id: 'failed-1', status: 'FAILED', attempts: 1 };

      mockGetPendingEvents.mockResolvedValue([pendingEvent, failedEvent]);

      await retryFailedEvents(50);

      expect(mockGetPendingEvents).toHaveBeenCalledWith(50);
    });
  });

  describe('OutboxProcessor', () => {
    it('should start and stop processing loop', async () => {
      const processor = new OutboxProcessor(100, 10);

      expect(processor.getIsRunning()).toBe(false);

      vi.useFakeTimers();
      processor.start();
      expect(processor.getIsRunning()).toBe(true);

      processor.stop();
      expect(processor.getIsRunning()).toBe(false);
      vi.useRealTimers();
    });

    it('should process once without starting loop', async () => {
      const processor = new OutboxProcessor();

      mockGetPendingEvents.mockResolvedValue([]);

      const result = await processor.processOnce();

      expect(result).toEqual([]);
    });
  });
});
