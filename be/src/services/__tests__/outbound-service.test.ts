import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OutboundStatus } from '../../constants/workflow-status';

const { mockPrisma, mockEventEmitter, mockStateMachine } = vi.hoisted(() => ({
  mockPrisma: {
    outbound: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    outboundItem: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
    inventory: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    packing: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
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

vi.mock('../outbound-state-machine', () => mockStateMachine);

import { outboundService, toWorkflowStatus } from '../outbound-service';

const MOCK_OUTBOUND = {
  id: 'out-1',
  outboundNumber: 'OUT202600001',
  orderRef: 'shopee-order-123',
  status: 'ORDER_RECEIVED',
  pickerId: 'user-1',
  items: [
    { id: 'item-1', productId: 'prod-1', quantity: 5, pickedQty: 0, locationId: null },
    { id: 'item-2', productId: 'prod-2', quantity: 3, pickedQty: 0, locationId: null },
  ],
};

describe('outbound-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStateMachine.validateTransition.mockImplementation(() => {});
  });

  describe('toWorkflowStatus', () => {
    it('should map DB statuses to P03 workflow statuses', () => {
      expect(toWorkflowStatus('ORDER_RECEIVED')).toBe(OutboundStatus.ORDER_RECEIVED);
      expect(toWorkflowStatus('INVENTORY_CHECKED')).toBe(OutboundStatus.INVENTORY_CHECKED);
      expect(toWorkflowStatus('INVENTORY_SUFFICIENT')).toBe(OutboundStatus.INVENTORY_SUFFICIENT);
      expect(toWorkflowStatus('INVENTORY_INSUFFICIENT')).toBe(OutboundStatus.INVENTORY_INSUFFICIENT);
      expect(toWorkflowStatus('PICKING_ASSIGNED')).toBe(OutboundStatus.PICKING_ASSIGNED);
      expect(toWorkflowStatus('PICKER_ASSIGNED')).toBe(OutboundStatus.PICKER_ASSIGNED);
      expect(toWorkflowStatus('ITEM_SCANNED')).toBe(OutboundStatus.ITEM_SCANNED);
      expect(toWorkflowStatus('PICKED_CORRECT')).toBe(OutboundStatus.PICKED_CORRECT);
      expect(toWorkflowStatus('PICKED_WRONG')).toBe(OutboundStatus.PICKED_WRONG);
      expect(toWorkflowStatus('PUT_IN_CART')).toBe(OutboundStatus.PUT_IN_CART);
      expect(toWorkflowStatus('SLIP_PRINTED')).toBe(OutboundStatus.SLIP_PRINTED);
      expect(toWorkflowStatus('MOVED_TO_PACKING')).toBe(OutboundStatus.MOVED_TO_PACKING);
    });

    it('should fallback to raw value for unknown statuses', () => {
      expect(toWorkflowStatus('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('createOutbound', () => {
    it('should create outbound and emit ORDER_RECEIVED event', async () => {
      const createdOutbound = { ...MOCK_OUTBOUND, status: 'ORDER_RECEIVED' };
      mockPrisma.outbound.count.mockResolvedValue(0);
      mockPrisma.outbound.create.mockResolvedValue(createdOutbound);

      const result = await outboundService.createOutbound({
        orderRef: 'shopee-order-123',
        notes: 'Shopee Mall order',
        items: [
          { productId: 'prod-1', quantity: 5 },
          { productId: 'prod-2', quantity: 3 },
        ],
        userId: 'user-1',
      });

      expect(result.outboundNumber).toContain('OUT');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'OUTBOUND_ORDER_RECEIVED',
        'Outbound',
        'out-1',
        expect.objectContaining({ orderRef: 'shopee-order-123' }),
        'user-1'
      );
    });
  });

  describe('checkInventory', () => {
    it('should transition to INVENTORY_CHECKED and emit event', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'ORDER_RECEIVED' });
      mockPrisma.outbound.update.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'INVENTORY_CHECKED' });

      const result = await outboundService.checkInventory('out-1', 'STAFF', 'user-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        OutboundStatus.ORDER_RECEIVED,
        OutboundStatus.INVENTORY_CHECKED,
        'STAFF'
      );
      expect(mockPrisma.outbound.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'INVENTORY_CHECKED' } })
      );
    });
  });

  describe('confirmInventorySufficient', () => {
    it('should transition to INVENTORY_SUFFICIENT', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'INVENTORY_CHECKED' });
      mockPrisma.outbound.update.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'INVENTORY_SUFFICIENT' });

      await outboundService.confirmInventorySufficient('out-1', 'WAREHOUSE_DIRECTOR', 'user-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        OutboundStatus.INVENTORY_CHECKED,
        OutboundStatus.INVENTORY_SUFFICIENT,
        'WAREHOUSE_DIRECTOR'
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'OUTBOUND_INVENTORY_SUFFICIENT',
        'Outbound',
        'out-1',
        expect.any(Object),
        'user-1'
      );
    });
  });

  describe('markInventoryInsufficient', () => {
    it('should transition to INVENTORY_INSUFFICIENT', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'INVENTORY_CHECKED' });
      mockPrisma.outbound.update.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'INVENTORY_INSUFFICIENT' });

      await outboundService.markInventoryInsufficient('out-1', 'WAREHOUSE_DIRECTOR', 'user-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        OutboundStatus.INVENTORY_CHECKED,
        OutboundStatus.INVENTORY_INSUFFICIENT,
        'WAREHOUSE_DIRECTOR'
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'OUTBOUND_INVENTORY_INSUFFICIENT',
        'Outbound',
        'out-1',
        expect.any(Object),
        'user-1'
      );
    });
  });

  describe('assignPicking', () => {
    it('should transition to PICKING_ASSIGNED when inventory is sufficient', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'INVENTORY_SUFFICIENT' });
      mockPrisma.outbound.update.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'PICKING_ASSIGNED' });

      await outboundService.assignPicking('out-1', 'WAREHOUSE_DIRECTOR', 'user-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        OutboundStatus.INVENTORY_SUFFICIENT,
        OutboundStatus.PICKING_ASSIGNED,
        'WAREHOUSE_DIRECTOR'
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'OUTBOUND_PICKING_ASSIGNED',
        'Outbound',
        'out-1',
        expect.any(Object),
        'user-1'
      );
    });
  });

  describe('assignPicker', () => {
    it('should assign picker and transition to PICKER_ASSIGNED', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'PICKING_ASSIGNED' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'picker-1', name: 'Picker Name' });
      mockPrisma.outbound.update.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'PICKER_ASSIGNED', pickerId: 'picker-1' });

      await outboundService.assignPicker('out-1', 'picker-1', 'WAREHOUSE_DIRECTOR', 'user-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        OutboundStatus.PICKING_ASSIGNED,
        OutboundStatus.PICKER_ASSIGNED,
        'WAREHOUSE_DIRECTOR'
      );
      expect(mockPrisma.outbound.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { pickerId: 'picker-1', status: 'PICKER_ASSIGNED' } })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'OUTBOUND_PICKER_ASSIGNED',
        'Outbound',
        'out-1',
        expect.objectContaining({ pickerId: 'picker-1', pickerName: 'Picker Name' }),
        'user-1'
      );
    });
  });

  describe('scanItem', () => {
    it('should transition to ITEM_SCANNED', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'PICKER_ASSIGNED' });
      mockPrisma.outbound.update.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'ITEM_SCANNED' });

      await outboundService.scanItem('out-1', 'prod-1', 'barcode-123', 'STAFF', 'user-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        OutboundStatus.PICKER_ASSIGNED,
        OutboundStatus.ITEM_SCANNED,
        'STAFF'
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'OUTBOUND_ITEM_SCANNED',
        'Outbound',
        'out-1',
        expect.objectContaining({ productId: 'prod-1', barcode: 'barcode-123' }),
        'user-1'
      );
    });
  });

  describe('confirmPickedCorrect', () => {
    it('should transition to PICKED_CORRECT and update pickedQty', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'ITEM_SCANNED' });
      mockPrisma.outboundItem.update.mockResolvedValue({ id: 'item-1', pickedQty: 5 });
      mockPrisma.outbound.update.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'PICKED_CORRECT' });

      await outboundService.confirmPickedCorrect('out-1', 'item-1', 5, 'STAFF', 'user-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        OutboundStatus.ITEM_SCANNED,
        OutboundStatus.PICKED_CORRECT,
        'STAFF'
      );
      expect(mockPrisma.outboundItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { pickedQty: 5 } })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'OUTBOUND_PICKED_CORRECT',
        'Outbound',
        'out-1',
        expect.objectContaining({ itemId: 'item-1', pickedQty: 5 }),
        'user-1'
      );
    });
  });

  describe('markPickedWrong', () => {
    it('should transition to PICKED_WRONG and emit event', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'ITEM_SCANNED' });
      mockPrisma.outbound.update.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'PICKED_WRONG' });

      await outboundService.markPickedWrong('out-1', 'item-1', 'STAFF', 'user-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        OutboundStatus.ITEM_SCANNED,
        OutboundStatus.PICKED_WRONG,
        'STAFF'
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'OUTBOUND_PICKED_WRONG',
        'Outbound',
        'out-1',
        expect.objectContaining({ itemId: 'item-1', message: expect.stringContaining('rescan') }),
        'user-1'
      );
    });
  });

  describe('rescanItem', () => {
    it('should transition from PICKED_WRONG back to ITEM_SCANNED', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'PICKED_WRONG' });
      mockPrisma.outbound.update.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'ITEM_SCANNED' });

      await outboundService.rescanItem('out-1', 'STAFF', 'user-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        OutboundStatus.PICKED_WRONG,
        OutboundStatus.ITEM_SCANNED,
        'STAFF'
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'OUTBOUND_ITEM_SCANNED',
        'Outbound',
        'out-1',
        expect.objectContaining({ rescan: true }),
        'user-1'
      );
    });
  });

  describe('putInCart', () => {
    it('should transition to PUT_IN_CART', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'PICKED_CORRECT' });
      mockPrisma.outbound.update.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'PUT_IN_CART' });

      await outboundService.putInCart('out-1', 'STAFF', 'user-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        OutboundStatus.PICKED_CORRECT,
        OutboundStatus.PUT_IN_CART,
        'STAFF'
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'OUTBOUND_PUT_IN_CART',
        'Outbound',
        'out-1',
        expect.any(Object),
        'user-1'
      );
    });
  });

  describe('printSlip', () => {
    it('should transition to SLIP_PRINTED', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'PUT_IN_CART' });
      mockPrisma.outbound.update.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'SLIP_PRINTED' });

      await outboundService.printSlip('out-1', 'STAFF', 'user-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        OutboundStatus.PUT_IN_CART,
        OutboundStatus.SLIP_PRINTED,
        'STAFF'
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'OUTBOUND_SLIP_PRINTED',
        'Outbound',
        'out-1',
        expect.any(Object),
        'user-1'
      );
    });
  });

  describe('moveToPacking', () => {
    it('should transition to MOVED_TO_PACKING and create packing record', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'SLIP_PRINTED' });
      mockPrisma.packing.create.mockResolvedValue({ id: 'pack-1', packingNumber: 'PK202600001' });
      mockPrisma.outbound.update.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'MOVED_TO_PACKING' });

      await outboundService.moveToPacking('out-1', 'STAFF', 'user-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        OutboundStatus.SLIP_PRINTED,
        OutboundStatus.MOVED_TO_PACKING,
        'STAFF'
      );
      expect(mockPrisma.packing.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'OUTBOUND_MOVED_TO_PACKING',
        'Outbound',
        'out-1',
        expect.any(Object),
        'user-1'
      );
    });
  });

  describe('recheckInventory', () => {
    it('should transition from INVENTORY_INSUFFICIENT back to INVENTORY_CHECKED', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'INVENTORY_INSUFFICIENT' });
      mockPrisma.outbound.update.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'INVENTORY_CHECKED' });

      await outboundService.recheckInventory('out-1', 'WAREHOUSE_DIRECTOR', 'user-1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        OutboundStatus.INVENTORY_INSUFFICIENT,
        OutboundStatus.INVENTORY_CHECKED,
        'WAREHOUSE_DIRECTOR'
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'OUTBOUND_INVENTORY_CHECKED',
        'Outbound',
        'out-1',
        expect.objectContaining({ recheck: true }),
        'user-1'
      );
    });
  });

  describe('error handling', () => {
    it('should throw when outbound not found', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue(null);

      await expect(outboundService.checkInventory('invalid-id', 'STAFF', 'user-1'))
        .rejects.toThrow('Outbound not found');
    });

    it('should propagate validateTransition errors as domain errors', async () => {
      mockPrisma.outbound.findUnique.mockResolvedValue({ ...MOCK_OUTBOUND, status: 'ORDER_RECEIVED' });
      mockStateMachine.validateTransition.mockImplementation(() => {
        throw new Error('Invalid transition from P03_ORDER_RECEIVED to P03_PICKER_ASSIGNED');
      });

      await expect(outboundService.assignPicker('out-1', 'picker-1', 'STAFF', 'user-1'))
        .rejects.toThrow('Invalid transition');
    });
  });
});