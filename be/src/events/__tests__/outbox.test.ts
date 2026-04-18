import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => {
  return {
    outbox: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };
});

vi.mock('../../config/db.js', () => ({
  default: mockPrisma,
}));

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'test-uuid-123'),
}));

import {
  enqueueEvent,
  getPendingEvents,
  lockEvent,
  markEventProcessed,
  markEventFailed,
  getOutboxStats,
} from '../outbox';

describe('outbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('enqueueEvent', () => {
    it('should create an outbox entry with PENDING status', async () => {
      const mockEnvelope = {
        id: 'test-uuid-123',
        eventType: 'ORDER_PURCHASE_PLAN_CREATED',
        entityType: 'PurchaseOrder',
        entityId: 'po-1',
        payload: { orderNumber: 'PO202600001' },
        status: 'PENDING',
        attempts: 0,
        lastError: null,
        lockedAt: null,
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.outbox.create.mockResolvedValue(mockEnvelope);

      const result = await enqueueEvent(
        'ORDER_PURCHASE_PLAN_CREATED',
        'PurchaseOrder',
        'po-1',
        { orderNumber: 'PO202600001' }
      );

      expect(mockPrisma.outbox.create).toHaveBeenCalledWith({
        data: {
          id: 'test-uuid-123',
          eventType: 'ORDER_PURCHASE_PLAN_CREATED',
          entityType: 'PurchaseOrder',
          entityId: 'po-1',
          payload: { orderNumber: 'PO202600001' },
          status: 'PENDING',
          attempts: 0,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });

      expect(result.eventType).toBe('ORDER_PURCHASE_PLAN_CREATED');
      expect(result.status).toBe('PENDING');
    });
  });

  describe('getPendingEvents', () => {
    it('should return pending and failed events ordered by createdAt', async () => {
      const mockEvents = [
        { id: '1', status: 'PENDING', eventType: 'ORDER_CREATED' },
        { id: '2', status: 'FAILED', eventType: 'INBOUND_CREATED' },
      ];

      mockPrisma.outbox.findMany.mockResolvedValue(mockEvents);

      const result = await getPendingEvents(100);

      expect(mockPrisma.outbox.findMany).toHaveBeenCalledWith({
        where: { status: { in: ['PENDING', 'FAILED'] } },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });

      expect(result).toHaveLength(2);
    });
  });

  describe('lockEvent', () => {
    it('should lock an event and increment attempts', async () => {
      const mockEvent = {
        id: 'test-id',
        status: 'PROCESSING',
        attempts: 1,
        lockedAt: new Date(),
      };

      mockPrisma.outbox.update.mockResolvedValue(mockEvent);

      const result = await lockEvent('test-id');

      expect(mockPrisma.outbox.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          status: 'PROCESSING',
          lockedAt: expect.any(Date),
          attempts: { increment: 1 },
          updatedAt: expect.any(Date),
        },
      });

      expect(result?.status).toBe('PROCESSING');
    });

    it('should return null when event not found', async () => {
      mockPrisma.outbox.update.mockRejectedValue(new Error('Not found'));

      const result = await lockEvent('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('markEventProcessed', () => {
    it('should update status to PROCESSED and set processedAt', async () => {
      mockPrisma.outbox.update.mockResolvedValue({ id: 'test-id', status: 'PROCESSED' });

      await markEventProcessed('test-id');

      expect(mockPrisma.outbox.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          status: 'PROCESSED',
          processedAt: expect.any(Date),
          lockedAt: null,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('markEventFailed', () => {
    it('should update status to FAILED and record error message', async () => {
      mockPrisma.outbox.update.mockResolvedValue({ id: 'test-id', status: 'FAILED', lastError: 'Handler failed' });

      await markEventFailed('test-id', 'Handler failed');

      expect(mockPrisma.outbox.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          status: 'FAILED',
          lastError: 'Handler failed',
          lockedAt: null,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getOutboxStats', () => {
    it('should return counts for each status', async () => {
      mockPrisma.outbox.count.mockImplementation((args: any) => {
        if (args.where.status === 'PENDING') return Promise.resolve(5);
        if (args.where.status === 'PROCESSING') return Promise.resolve(2);
        if (args.where.status === 'PROCESSED') return Promise.resolve(100);
        if (args.where.status === 'FAILED') return Promise.resolve(3);
        return Promise.resolve(0);
      });

      const stats = await getOutboxStats();

      expect(stats).toEqual({
        pending: 5,
        processing: 2,
        processed: 100,
        failed: 3,
      });
    });
  });
});
