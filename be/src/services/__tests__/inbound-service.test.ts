import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InboundStatus } from '../../constants/workflow-status';

const { mockPrisma, mockEventEmitter, mockStateMachine } = vi.hoisted(() => ({
  mockPrisma: {
    inbound: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    inboundItem: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    inventory: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
  mockEventEmitter: {
    emit: vi.fn().mockResolvedValue(undefined),
  },
  mockStateMachine: {
    validateTransition: vi.fn(),
  },
}));

vi.mock('../../config/db.js', () => ({
  default: mockPrisma,
}));

vi.mock('../../events/emitter.js', () => ({
  eventEmitter: mockEventEmitter,
}));

vi.mock('../inbound-state-machine', () => mockStateMachine);

import { inboundService } from '../inbound-service';

describe('inbound-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInbound', () => {
    it('should create an inbound order in INBOUND_CREATED status and emit event', async () => {
      mockPrisma.inbound.count.mockResolvedValue(0);
      mockPrisma.inbound.create.mockResolvedValue({
        id: 'ib-1',
        inboundNumber: 'IN202600001',
        status: 'INBOUND_CREATED',
        items: [{ productId: 'p1', quantity: 10 }],
      });

      const result = await inboundService.createInbound({
        purchaseOrderId: 'po-1',
        notes: 'test inbound',
        items: [{ productId: 'p1', quantity: 10 }],
        userId: 'u1',
      });

      expect(mockPrisma.inbound.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'INBOUND_CREATED',
            purchaseOrderId: 'po-1',
            staffId: 'u1',
            notes: 'test inbound',
          }),
        })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'INBOUND_CREATED',
        'Inbound',
        'ib-1',
        expect.objectContaining({ inboundNumber: 'IN202600001' }),
        'u1'
      );
      expect(result.status).toBe('INBOUND_CREATED');
    });
  });

  describe('receiveItems', () => {
    it('should transition from INBOUND_CREATED to ITEMS_RECEIVED with STAFF role', async () => {
      mockPrisma.inbound.findUnique.mockResolvedValue({
        id: 'ib-1',
        inboundNumber: 'IN202600001',
        status: 'INBOUND_CREATED',
      });
      mockPrisma.inbound.update.mockResolvedValue({
        id: 'ib-1',
        status: 'ITEMS_RECEIVED',
        receivedDate: expect.any(Date),
      });

      const result = await inboundService.receiveItems('ib-1', 'STAFF', 'u1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        InboundStatus.INBOUND_CREATED,
        InboundStatus.ITEMS_RECEIVED,
        'STAFF'
      );
      expect(mockPrisma.inbound.update).toHaveBeenCalledWith({
        where: { id: 'ib-1' },
        data: { status: 'ITEMS_RECEIVED', receivedDate: expect.any(Date) },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'INBOUND_ITEMS_RECEIVED',
        'Inbound',
        'ib-1',
        expect.any(Object),
        'u1'
      );
    });
  });

  describe('startQualityCheck', () => {
    it('should transition from ITEMS_RECEIVED to QUALITY_CHECKING with QUALITY role', async () => {
      mockPrisma.inbound.findUnique.mockResolvedValue({
        id: 'ib-1',
        inboundNumber: 'IN202600001',
        status: 'ITEMS_RECEIVED',
      });
      mockPrisma.inbound.update.mockResolvedValue({
        id: 'ib-1',
        status: 'QUALITY_CHECKING',
      });

      await inboundService.startQualityCheck('ib-1', 'QUALITY', 'u2');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        InboundStatus.ITEMS_RECEIVED,
        InboundStatus.QUALITY_CHECKING,
        'QUALITY'
      );
      expect(mockPrisma.inbound.update).toHaveBeenCalledWith({
        where: { id: 'ib-1' },
        data: { status: 'QUALITY_CHECKING' },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'INBOUND_QUALITY_CHECKING',
        'Inbound',
        'ib-1',
        expect.any(Object),
        'u2'
      );
    });
  });

  describe('passQC', () => {
    it('should transition from QUALITY_CHECKING to QC_PASSED with QUALITY role', async () => {
      mockPrisma.inbound.findUnique.mockResolvedValue({
        id: 'ib-1',
        inboundNumber: 'IN202600001',
        status: 'QUALITY_CHECKING',
      });
      mockPrisma.inbound.update.mockResolvedValue({
        id: 'ib-1',
        status: 'QC_PASSED',
      });

      await inboundService.passQC('ib-1', 'QUALITY', 'u2');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        InboundStatus.QUALITY_CHECKING,
        InboundStatus.QC_PASSED,
        'QUALITY'
      );
      expect(mockPrisma.inbound.update).toHaveBeenCalledWith({
        where: { id: 'ib-1' },
        data: { status: 'QC_PASSED', qcPassedDate: expect.any(Date) },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'INBOUND_QC_PASSED',
        'Inbound',
        'ib-1',
        expect.any(Object),
        'u2'
      );
    });
  });

  describe('failQC', () => {
    it('should transition from QUALITY_CHECKING to QC_FAILED with QUALITY role', async () => {
      mockPrisma.inbound.findUnique.mockResolvedValue({
        id: 'ib-1',
        inboundNumber: 'IN202600001',
        status: 'QUALITY_CHECKING',
      });
      mockPrisma.inbound.update.mockResolvedValue({
        id: 'ib-1',
        status: 'QC_FAILED',
      });

      await inboundService.failQC('ib-1', 'QUALITY', 'u2', 'Damaged packaging');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        InboundStatus.QUALITY_CHECKING,
        InboundStatus.QC_FAILED,
        'QUALITY'
      );
      expect(mockPrisma.inbound.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ib-1' },
          data: expect.objectContaining({ status: 'QC_FAILED' }),
        })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'INBOUND_QC_FAILED',
        'Inbound',
        'ib-1',
        expect.objectContaining({ reason: 'Damaged packaging' }),
        'u2'
      );
    });
  });

  describe('recheckAfterFailure', () => {
    it('should transition from QC_FAILED back to QUALITY_CHECKING with QUALITY role', async () => {
      mockPrisma.inbound.findUnique.mockResolvedValue({
        id: 'ib-1',
        inboundNumber: 'IN202600001',
        status: 'QC_FAILED',
      });
      mockPrisma.inbound.update.mockResolvedValue({
        id: 'ib-1',
        status: 'QUALITY_CHECKING',
      });

      await inboundService.recheckAfterFailure('ib-1', 'QUALITY', 'u2');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        InboundStatus.QC_FAILED,
        InboundStatus.QUALITY_CHECKING,
        'QUALITY'
      );
      expect(mockPrisma.inbound.update).toHaveBeenCalledWith({
        where: { id: 'ib-1' },
        data: { status: 'QUALITY_CHECKING' },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'INBOUND_QUALITY_CHECKING',
        'Inbound',
        'ib-1',
        expect.any(Object),
        'u2'
      );
    });
  });

  describe('createBarcodes', () => {
    it('should transition from QC_PASSED to BARCODE_CREATED with STAFF role', async () => {
      mockPrisma.inbound.findUnique.mockResolvedValue({
        id: 'ib-1',
        inboundNumber: 'IN202600001',
        status: 'QC_PASSED',
        items: [{ id: 'item-1' }, { id: 'item-2' }],
      });
      mockPrisma.inboundItem.update.mockResolvedValue({ id: 'item-1' });

      await inboundService.createBarcodes('ib-1', 'STAFF', 'u3');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        InboundStatus.QC_PASSED,
        InboundStatus.BARCODE_CREATED,
        'STAFF'
      );
      expect(mockPrisma.inbound.update).toHaveBeenCalledWith({
        where: { id: 'ib-1' },
        data: { status: 'BARCODE_CREATED' },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'INBOUND_BARCODE_CREATED',
        'Inbound',
        'ib-1',
        expect.any(Object),
        'u3'
      );
    });
  });

  describe('assignLocation', () => {
    it('should transition from BARCODE_CREATED to LOCATION_ASSIGNED with STAFF role', async () => {
      mockPrisma.inbound.findUnique.mockResolvedValue({
        id: 'ib-1',
        inboundNumber: 'IN202600001',
        status: 'BARCODE_CREATED',
      });
      mockPrisma.inbound.update.mockResolvedValue({
        id: 'ib-1',
        status: 'LOCATION_ASSIGNED',
      });

      await inboundService.assignLocation('ib-1', 'STAFF', 'u3', 'item-1', 'loc-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        InboundStatus.BARCODE_CREATED,
        InboundStatus.LOCATION_ASSIGNED,
        'STAFF'
      );
      expect(mockPrisma.inboundItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { locationId: 'loc-1' },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'INBOUND_LOCATION_ASSIGNED',
        'Inbound',
        'ib-1',
        expect.objectContaining({ locationId: 'loc-1' }),
        'u3'
      );
    });
  });

  describe('confirmReceipt', () => {
    it('should transition from LOCATION_ASSIGNED to STAFF_RECEIVED with STAFF role', async () => {
      mockPrisma.inbound.findUnique.mockResolvedValue({
        id: 'ib-1',
        inboundNumber: 'IN202600001',
        status: 'LOCATION_ASSIGNED',
      });
      mockPrisma.inbound.update.mockResolvedValue({
        id: 'ib-1',
        status: 'STAFF_RECEIVED',
      });

      await inboundService.confirmReceipt('ib-1', 'STAFF', 'u3');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        InboundStatus.LOCATION_ASSIGNED,
        InboundStatus.STAFF_RECEIVED,
        'STAFF'
      );
      expect(mockPrisma.inbound.update).toHaveBeenCalledWith({
        where: { id: 'ib-1' },
        data: { status: 'STAFF_RECEIVED' },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'INBOUND_STAFF_RECEIVED',
        'Inbound',
        'ib-1',
        expect.any(Object),
        'u3'
      );
    });
  });

  describe('cancelInbound', () => {
    it('should cancel from INBOUND_CREATED with QUALITY role', async () => {
      mockPrisma.inbound.findUnique.mockResolvedValue({
        id: 'ib-1',
        inboundNumber: 'IN202600001',
        status: 'INBOUND_CREATED',
        notes: null,
      });
      mockPrisma.inbound.update.mockResolvedValue({
        id: 'ib-1',
        status: 'INBOUND_CANCELLED',
      });

      await inboundService.cancelInbound('ib-1', 'QUALITY', 'u2', 'Supplier issue');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        InboundStatus.INBOUND_CREATED,
        InboundStatus.INBOUND_CANCELLED,
        'QUALITY'
      );
      expect(mockPrisma.inbound.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ib-1' },
          data: expect.objectContaining({ status: 'INBOUND_CANCELLED' }),
        })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'INBOUND_CANCELLED',
        'Inbound',
        'ib-1',
        expect.objectContaining({ reason: 'Supplier issue' }),
        'u2'
      );
    });

    it('should cancel from QC_FAILED with WAREHOUSE_DIRECTOR role', async () => {
      mockPrisma.inbound.findUnique.mockResolvedValue({
        id: 'ib-1',
        inboundNumber: 'IN202600001',
        status: 'QC_FAILED',
        notes: null,
      });
      mockPrisma.inbound.update.mockResolvedValue({
        id: 'ib-1',
        status: 'INBOUND_CANCELLED',
      });

      await inboundService.cancelInbound('ib-1', 'WAREHOUSE_DIRECTOR', 'u4', 'QC failure - supplier notified');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        InboundStatus.QC_FAILED,
        InboundStatus.INBOUND_CANCELLED,
        'WAREHOUSE_DIRECTOR'
      );
    });
  });

  describe('completeInbound', () => {
    it('should complete inbound from STAFF_RECEIVED, creating new products and updating inventory', async () => {
      const mockItems = [
        { id: 'item-1', productId: 'existing-product', receivedQty: 5, quantity: 5 },
        { id: 'item-2', productId: 'new-product', receivedQty: 3, quantity: 3 },
      ];
      mockPrisma.inbound.findUnique.mockResolvedValue({
        id: 'ib-1',
        inboundNumber: 'IN202600001',
        status: 'STAFF_RECEIVED',
        items: mockItems,
      });
      mockPrisma.product.findUnique
        .mockResolvedValueOnce({ id: 'existing-product' })
        .mockResolvedValueOnce(null);
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.product.create.mockResolvedValue({ id: 'new-product', sku: 'PROD-2026-0001' });
      mockPrisma.inventory.findUnique
        .mockResolvedValueOnce({ productId: 'existing-product', quantity: 10, available: 10 })
        .mockResolvedValueOnce(null);
      mockPrisma.inventory.update.mockResolvedValue({ quantity: 15 });
      mockPrisma.inventory.create.mockResolvedValue({ productId: 'new-product', quantity: 3 });
      mockPrisma.inbound.update.mockResolvedValue({
        id: 'ib-1',
        status: 'INBOUND_COMPLETED',
        completedDate: expect.any(Date),
      });

      const result = await inboundService.completeInbound('ib-1', 'STAFF', 'u3');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        InboundStatus.STAFF_RECEIVED,
        InboundStatus.INBOUND_COMPLETED,
        'STAFF'
      );
      expect(mockPrisma.product.create).toHaveBeenCalled();
      expect(mockPrisma.inbound.update).toHaveBeenCalledWith({
        where: { id: 'ib-1' },
        data: { status: 'INBOUND_COMPLETED', completedDate: expect.any(Date) },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'INBOUND_COMPLETED',
        'Inbound',
        'ib-1',
        expect.any(Object),
        'u3'
      );
    });
  });

  describe('error handling', () => {
    it('should throw when inbound not found', async () => {
      mockPrisma.inbound.findUnique.mockResolvedValue(null);

      await expect(
        inboundService.receiveItems('not-found', 'STAFF', 'u1')
      ).rejects.toThrow('Inbound not found');
    });

    it('should propagate state machine validation errors', async () => {
      mockStateMachine.validateTransition.mockImplementation(() => {
        throw new Error('Invalid transition from P02_INBOUND_COMPLETED to P02_ITEMS_RECEIVED');
      });
      mockPrisma.inbound.findUnique.mockResolvedValue({
        id: 'ib-1',
        status: 'INBOUND_COMPLETED',
      });

      await expect(
        inboundService.receiveItems('ib-1', 'STAFF', 'u1')
      ).rejects.toThrow('Invalid transition');
    });
  });
});