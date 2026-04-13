import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PurchaseOrderStatus } from '../../constants/workflow-status';

const { mockPrisma, mockEventEmitter, mockStateMachine } = vi.hoisted(() => ({
  mockPrisma: {
    purchaseOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    purchaseOrderApproval: {
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

vi.mock('../purchase-order-state-machine', () => mockStateMachine);

import { purchaseOrderService } from '../purchase-order-service';

describe('purchase-order-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a purchase order in DRAFT with ORDER_PURCHASE_PLAN_CREATED event', async () => {
    mockPrisma.purchaseOrder.count.mockResolvedValue(0);
    mockPrisma.purchaseOrder.create.mockResolvedValue({
      id: 'po-1',
      orderNumber: 'PO202600001',
      status: 'DRAFT',
      supplier: { name: 'ACME' },
      items: [
        { productId: 'p1', quantity: 2, unitPrice: 10, totalPrice: 20 },
        { productId: 'p2', quantity: 1, unitPrice: 5, totalPrice: 5 },
      ],
    });

    const result = await purchaseOrderService.createPurchaseOrder({
      supplierId: 's1',
      expectedDate: '2026-05-01',
      notes: 'new order',
      items: [
        { productId: 'p1', quantity: 2, unitPrice: 10 },
        { productId: 'p2', quantity: 1, unitPrice: 5 },
      ],
      userId: 'u1',
    });

    expect(mockPrisma.purchaseOrder.create).toHaveBeenCalled();
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ORDER_PURCHASE_PLAN_CREATED',
      'PurchaseOrder',
      'po-1',
      expect.objectContaining({ orderNumber: 'PO202600001' }),
      'u1'
    );
    expect(result.status).toBe('DRAFT');
  });

  it('should send order to accounting using state machine and emit ORDER_PLAN_SENT_TO_ACCOUNTING', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      orderNumber: 'PO202600001',
      status: 'DRAFT',
    });
    mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'PENDING_ACCOUNTING' });

    const updated = await purchaseOrderService.sendToAccounting('po-1', 'QUALITY', 'u1');

    expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
      PurchaseOrderStatus.PURCHASE_PLAN_CREATED,
      PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING,
      'QUALITY'
    );
    expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-1' },
      data: { status: 'PENDING_ACCOUNTING' },
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ORDER_PLAN_SENT_TO_ACCOUNTING',
      'PurchaseOrder',
      'po-1',
      expect.any(Object),
      'u1'
    );
    expect(updated.status).toBe('PENDING_ACCOUNTING');
  });

  it('should confirm accounting and create approval record', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      orderNumber: 'PO202600001',
      status: 'PENDING_ACCOUNTING',
    });
    mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'PENDING_APPROVAL' });

    await purchaseOrderService.confirmAccounting('po-1', 'ACCOUNTING', 'u2', 'looks good');

    expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
      PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING,
      PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
      'ACCOUNTING'
    );
    expect(mockPrisma.purchaseOrderApproval.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        purchaseOrderId: 'po-1',
        approverId: 'u2',
        role: 'ACCOUNTING',
        status: 'APPROVED',
        notes: 'looks good',
      }),
    });
  });

  it('should send to director without changing DB status and emit ORDER_PLAN_SENT_TO_DIRECTOR', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      orderNumber: 'PO202600001',
      status: 'PENDING_APPROVAL',
    });
    mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'PENDING_APPROVAL' });

    await purchaseOrderService.sendToDirector('po-1', 'ACCOUNTING', 'u2');

    expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
      PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
      PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
      'ACCOUNTING'
    );
    expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-1' },
      data: { status: 'PENDING_APPROVAL' },
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ORDER_PLAN_SENT_TO_DIRECTOR',
      'PurchaseOrder',
      'po-1',
      expect.any(Object),
      'u2'
    );
  });

  it('should approve by director and create director approval record', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      orderNumber: 'PO202600001',
      status: 'PENDING_APPROVAL',
    });
    mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'APPROVED' });

    await purchaseOrderService.approve('po-1', 'WAREHOUSE_DIRECTOR', 'u3', 'approved');

    expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
      PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
      PurchaseOrderStatus.PLAN_APPROVED,
      'WAREHOUSE_DIRECTOR'
    );
    expect(mockPrisma.purchaseOrderApproval.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        purchaseOrderId: 'po-1',
        approverId: 'u3',
        role: 'WAREHOUSE_DIRECTOR',
        status: 'APPROVED',
      }),
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ORDER_PLAN_APPROVED',
      'PurchaseOrder',
      'po-1',
      expect.any(Object),
      'u3'
    );
  });

  it('should reject by director as cancelled and create rejected approval record', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      orderNumber: 'PO202600001',
      status: 'PENDING_APPROVAL',
      notes: null,
    });
    mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'CANCELLED' });

    await purchaseOrderService.reject('po-1', 'WAREHOUSE_DIRECTOR', 'u3', 'budget issue');

    expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
      PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
      PurchaseOrderStatus.ORDER_CANCELLED,
      'WAREHOUSE_DIRECTOR'
    );
    expect(mockPrisma.purchaseOrderApproval.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: 'WAREHOUSE_DIRECTOR',
        status: 'REJECTED',
        notes: 'budget issue',
      }),
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ORDER_PLAN_REJECTED',
      'PurchaseOrder',
      'po-1',
      expect.objectContaining({ reason: 'budget issue' }),
      'u3'
    );
  });

  it('should send to supplier as admin from APPROVED status, update DB status, and emit ORDER_SENT_TO_SUPPLIER', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      orderNumber: 'PO202600001',
      status: 'APPROVED',
      supplier: { name: 'ACME', email: 'a@acme.com' },
    });
    mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'SENT_TO_SUPPLIER' });

    const result = await purchaseOrderService.sendToSupplier('po-1', 'ADMIN', 'u1');

    expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
      PurchaseOrderStatus.PLAN_APPROVED,
      PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
      'ADMIN'
    );
    expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-1' },
      data: { status: 'SENT_TO_SUPPLIER' },
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ORDER_SENT_TO_SUPPLIER',
      'PurchaseOrder',
      'po-1',
      expect.objectContaining({ supplier: 'ACME' }),
      'u1'
    );
    expect(result.status).toBe('SENT_TO_SUPPLIER');
  });

  it('should process supplier response: confirmed auto-completes, rejected sets SUPPLIER_REJECTED', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      orderNumber: 'PO202600001',
      status: 'SENT_TO_SUPPLIER',
    });
    mockPrisma.purchaseOrder.update
      .mockResolvedValueOnce({ id: 'po-1', status: 'COMPLETED' })
      .mockResolvedValueOnce({ id: 'po-1', status: 'SUPPLIER_REJECTED' });

    await purchaseOrderService.supplierResponse('po-1', 'ADMIN', 'u1', true);
    await purchaseOrderService.supplierResponse('po-1', 'ADMIN', 'u1', false);

    expect(mockStateMachine.validateTransition).toHaveBeenNthCalledWith(
      1,
      PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
      PurchaseOrderStatus.SUPPLIER_CONFIRMED,
      'ADMIN'
    );
    expect(mockPrisma.purchaseOrder.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ data: { status: 'COMPLETED' } })
    );
    expect(mockStateMachine.validateTransition).toHaveBeenNthCalledWith(
      2,
      PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
      PurchaseOrderStatus.SUPPLIER_REJECTED,
      'ADMIN'
    );
  });

  it('should complete order from SUPPLIER_CONFIRMED to COMPLETED', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      orderNumber: 'PO202600001',
      status: 'SUPPLIER_CONFIRMED',
    });
    mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'COMPLETED' });

    await purchaseOrderService.complete('po-1', 'ACCOUNTING', 'u2');

    expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
      PurchaseOrderStatus.SUPPLIER_CONFIRMED,
      PurchaseOrderStatus.ORDER_COMPLETED,
      'ACCOUNTING'
    );
    expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-1' },
      data: { status: 'COMPLETED' },
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ORDER_COMPLETED',
      'PurchaseOrder',
      'po-1',
      expect.any(Object),
      'u2'
    );
  });

  it('should cancel from supplier rejected with accounting role', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      orderNumber: 'PO202600001',
      status: 'SUPPLIER_REJECTED',
    });
    mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'CANCELLED' });

    await purchaseOrderService.cancel('po-1', 'ACCOUNTING', 'u2');

    expect(mockStateMachine.validateTransition).not.toHaveBeenCalled();
    expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-1' },
      data: { status: 'CANCELLED' },
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ORDER_CANCELLED',
      'PurchaseOrder',
      'po-1',
      expect.any(Object),
      'u2'
    );
  });

  it('should cancel order at SENT_TO_SUPPLIER status with ACCOUNTING role', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      orderNumber: 'PO202600001',
      status: 'SENT_TO_SUPPLIER',
      notes: null,
    });
    mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'CANCELLED' });

    await purchaseOrderService.cancel('po-1', 'ACCOUNTING', 'u2');

    expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
      PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
      PurchaseOrderStatus.ORDER_CANCELLED,
      'ACCOUNTING'
    );
    expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-1' },
      data: { status: 'CANCELLED' },
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ORDER_CANCELLED',
      'PurchaseOrder',
      'po-1',
      expect.any(Object),
      'u2'
    );
  });

  it('should cancel order at SENT_TO_SUPPLIER status with ADMIN role', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      orderNumber: 'PO202600001',
      status: 'SENT_TO_SUPPLIER',
      notes: null,
    });
    mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'CANCELLED' });

    await purchaseOrderService.cancel('po-1', 'ADMIN', 'u1');

    expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
      PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
      PurchaseOrderStatus.ORDER_CANCELLED,
      'ADMIN'
    );
    expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-1' },
      data: { status: 'CANCELLED' },
    });
  });

  it('should reject order at SENT_TO_SUPPLIER status with WAREHOUSE_DIRECTOR role', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      orderNumber: 'PO202600001',
      status: 'SENT_TO_SUPPLIER',
      notes: null,
    });
    mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'CANCELLED' });

    await purchaseOrderService.reject('po-1', 'WAREHOUSE_DIRECTOR', 'u3', 'supplier unresponsive');

    expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
      PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
      PurchaseOrderStatus.ORDER_CANCELLED,
      'WAREHOUSE_DIRECTOR'
    );
    expect(mockPrisma.purchaseOrderApproval.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        purchaseOrderId: 'po-1',
        approverId: 'u3',
        role: 'WAREHOUSE_DIRECTOR',
        status: 'REJECTED',
        notes: 'supplier unresponsive',
      }),
    });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'ORDER_PLAN_REJECTED',
      'PurchaseOrder',
      'po-1',
      expect.objectContaining({ reason: 'supplier unresponsive' }),
      'u3'
    );
  });

  it('should throw when order not found', async () => {
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue(null);

    await expect(
      purchaseOrderService.sendToAccounting('not-found', 'QUALITY', 'u1')
    ).rejects.toThrow('Order not found');
  });

  // =========================================================================
  // BUG FIX TESTS: Purchase Order workflow state transition bugs
  // =========================================================================
  describe('Bug Fixes', () => {
    // -----------------------------------------------------------------------
    // BUG FIX 1: approve() should set 'APPROVED' not 'SENT_TO_SUPPLIER'
    // Director approval should be a distinct step before sending to supplier
    // -----------------------------------------------------------------------
    it('BUG FIX: approve() should set status to APPROVED (not SENT_TO_SUPPLIER)', async () => {
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
        id: 'po-1',
        orderNumber: 'PO202600001',
        status: 'PENDING_APPROVAL',
      });
      mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'APPROVED' });

      await purchaseOrderService.approve('po-1', 'WAREHOUSE_DIRECTOR', 'u3', 'approved');

      // The critical fix: DB status must be 'APPROVED', NOT 'SENT_TO_SUPPLIER'
      expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: { status: 'APPROVED' },
      });
    });

    // -----------------------------------------------------------------------
    // BUG FIX 2: supplierResponse() should auto-complete when confirmed=true
    // Once supplier confirms, order placement is done → go to COMPLETED
    // -----------------------------------------------------------------------
    it('BUG FIX: supplierResponse(true) should set COMPLETED (auto-complete)', async () => {
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
        id: 'po-1',
        orderNumber: 'PO202600001',
        status: 'SENT_TO_SUPPLIER',
      });
      mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'COMPLETED' });

      await purchaseOrderService.supplierResponse('po-1', 'ADMIN', 'u1', true);

      // The critical fix: status must be 'COMPLETED', NOT 'SUPPLIER_CONFIRMED'
      expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: { status: 'COMPLETED' },
      });

      // Should emit SUPPLIER_CONFIRMED event for audit trail
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'SUPPLIER_CONFIRMED',
        'PurchaseOrder',
        'po-1',
        expect.objectContaining({ confirmed: true }),
        'u1'
      );

      // Should also emit ORDER_COMPLETED event
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ORDER_COMPLETED',
        'PurchaseOrder',
        'po-1',
        expect.any(Object),
        'u1'
      );
    });

    it('BUG FIX: supplierResponse(false) should still set SUPPLIER_REJECTED', async () => {
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
        id: 'po-1',
        orderNumber: 'PO202600001',
        status: 'SENT_TO_SUPPLIER',
      });
      mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'SUPPLIER_REJECTED' });

      await purchaseOrderService.supplierResponse('po-1', 'ADMIN', 'u1', false);

      expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: { status: 'SUPPLIER_REJECTED' },
      });
    });

    // -----------------------------------------------------------------------
    // BUG FIX 3: sendToSupplier() should update DB status to SENT_TO_SUPPLIER
    // -----------------------------------------------------------------------
    it('BUG FIX: sendToSupplier() should persist SENT_TO_SUPPLIER status in DB', async () => {
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
        id: 'po-1',
        orderNumber: 'PO202600001',
        status: 'APPROVED',
        supplier: { name: 'ACME', email: 'a@acme.com' },
      });
      mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'SENT_TO_SUPPLIER' });

      const result = await purchaseOrderService.sendToSupplier('po-1', 'ADMIN', 'u1');

      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        PurchaseOrderStatus.PLAN_APPROVED,
        PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
        'ADMIN'
      );
      expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: { status: 'SENT_TO_SUPPLIER' },
      });
      expect(result.status).toBe('SENT_TO_SUPPLIER');
    });

    // -----------------------------------------------------------------------
    // BUG FIX 4: sendToDirector() should validate from actual order status
    // Currently validates PLAN_SENT_TO_DIRECTOR → PLAN_SENT_TO_DIRECTOR (same!)
    // -----------------------------------------------------------------------
    it('BUG FIX: sendToDirector() should validate PENDING_ACCOUNTING → PENDING_APPROVAL transition', async () => {
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue({
        id: 'po-1',
        orderNumber: 'PO202600001',
        status: 'PENDING_ACCOUNTING',
      });
      mockPrisma.purchaseOrder.update.mockResolvedValue({ id: 'po-1', status: 'PENDING_APPROVAL' });

      await purchaseOrderService.sendToDirector('po-1', 'ACCOUNTING', 'u2');

      // Should validate from ACTUAL current status to PENDING_APPROVAL
      expect(mockStateMachine.validateTransition).toHaveBeenCalledWith(
        PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING,
        PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
        'ACCOUNTING'
      );
      expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: { status: 'PENDING_APPROVAL' },
      });
    });
  });
});
