import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware.js';
import { purchaseOrderService } from '../services/purchase-order-service.js';

const router = Router();

// Validation schemas
const createPOSchema = z.object({
  supplierId: z.string(),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })),
});

type CreatePOInput = z.infer<typeof createPOSchema>;

function handleWorkflowError(error: unknown, res: Response): void {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: error.errors });
    return;
  }

  if (error instanceof Error && error.message === 'Order not found') {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (error instanceof Error && error.message === 'Insufficient permissions') {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }

  if (
    error instanceof Error &&
    (error.message.includes('Invalid transition') ||
      error.message.includes('is not allowed to transition'))
  ) {
    res.status(400).json({ error: error.message });
    return;
  }

  console.error('Order workflow error:', error);
  res.status(500).json({ error: 'Internal server error' });
}

// GET /p01/orders - List all purchase orders
router.get('/orders', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, supplierId, page = '1', limit = '20' } = req.query;
    
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
        approvals: { include: { approver: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    const total = await prisma.purchaseOrder.count({ where });
    
    res.json({ orders, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    console.error('Error listing orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /p01/orders/:id - Get order detail
router.get('/orders/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
        approvals: { include: { approver: { select: { name: true } } } },
        inbound: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p01/orders - Create purchase order
router.post('/orders', authenticate, authorize('QUALITY', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createPOSchema.parse(req.body) as CreatePOInput;
    const payload = {
      supplierId: data.supplierId,
      expectedDate: data.expectedDate,
      notes: data.notes,
      items: data.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      userId: req.user!.id,
    };
    const order = await purchaseOrderService.createPurchaseOrder(payload);

    res.status(201).json({ order });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p01/orders/:id/send-to-accounting - Send to accounting
router.post('/orders/:id/send-to-accounting', authenticate, authorize('QUALITY', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const updated = await purchaseOrderService.sendToAccounting(
      req.params.id,
      req.user!.role as never,
      req.user!.id
    );

    res.json({ order: updated });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p01/orders/:id/confirm-accounting - Accounting confirms
router.post('/orders/:id/confirm-accounting', authenticate, authorize('ACCOUNTING', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { notes } = req.body;
    const updated = await purchaseOrderService.confirmAccounting(
      req.params.id,
      req.user!.role as never,
      req.user!.id,
      notes
    );

    res.json({ order: updated });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p01/orders/:id/send-to-director - Send to warehouse director
router.post('/orders/:id/send-to-director', authenticate, authorize('ACCOUNTING', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const updated = await purchaseOrderService.sendToDirector(
      req.params.id,
      req.user!.role as never,
      req.user!.id
    );

    res.json({ order: updated });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p01/orders/:id/approve - Warehouse director approves
router.post('/orders/:id/approve', authenticate, authorize('WAREHOUSE_DIRECTOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { notes } = req.body;
    const updated = await purchaseOrderService.approve(
      req.params.id,
      req.user!.role as never,
      req.user!.id,
      notes
    );

    res.json({ order: updated });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p01/orders/:id/reject - Reject order
router.post('/orders/:id/reject', authenticate, authorize('WAREHOUSE_DIRECTOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { notes } = req.body;
    const updated = await purchaseOrderService.reject(
      req.params.id,
      req.user!.role as never,
      req.user!.id,
      notes
    );

    res.json({ order: updated });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p01/orders/:id/send-to-supplier - Send to supplier
router.post('/orders/:id/send-to-supplier', authenticate, authorize('ADMIN', 'WAREHOUSE_DIRECTOR', 'ACCOUNTING'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await purchaseOrderService.sendToSupplier(
      req.params.id,
      req.user!.role as never,
      req.user!.id
    );

    res.json(result);
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p01/orders/:id/supplier-response - Supplier responds
router.post('/orders/:id/supplier-response', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { confirmed } = req.body;
    const updated = await purchaseOrderService.supplierResponse(
      req.params.id,
      req.user!.role as never,
      req.user!.id,
      Boolean(confirmed)
    );

    res.json({ order: updated });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// DELETE /p01/orders/:id - Cancel order
router.delete('/orders/:id', authenticate, authorize('QUALITY', 'ACCOUNTING', 'WAREHOUSE_DIRECTOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const updated = await purchaseOrderService.cancel(
      req.params.id,
      req.user!.role as never,
      req.user!.id
    );

    res.json({ order: updated });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p01/orders/:id/complete - Complete purchase order (P01_ORDER_COMPLETED)
router.post('/orders/:id/complete', authenticate, authorize('ADMIN', 'ACCOUNTING'), async (req: AuthRequest, res: Response) => {
  try {
    const updated = await purchaseOrderService.complete(
      req.params.id,
      req.user!.role as never,
      req.user!.id
    );

    res.json({ order: updated });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

export default router;
