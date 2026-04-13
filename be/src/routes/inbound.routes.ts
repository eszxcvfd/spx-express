import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware.js';
import { inboundService, toWorkflowStatus } from '../services/inbound-service.js';
import { InboundStatus } from '../constants/workflow-status.js';

const router = Router();

const dbStatusMap: Record<string, string> = {
  [InboundStatus.INBOUND_CREATED]: 'INBOUND_CREATED',
  [InboundStatus.ITEMS_RECEIVED]: 'ITEMS_RECEIVED',
  [InboundStatus.QUALITY_CHECKING]: 'QUALITY_CHECKING',
  [InboundStatus.QC_PASSED]: 'QC_PASSED',
  [InboundStatus.QC_FAILED]: 'QC_FAILED',
  [InboundStatus.BARCODE_CREATED]: 'BARCODE_CREATED',
  [InboundStatus.LOCATION_ASSIGNED]: 'LOCATION_ASSIGNED',
  [InboundStatus.STAFF_RECEIVED]: 'STAFF_RECEIVED',
  [InboundStatus.NEW_PRODUCT_CREATED]: 'NEW_PRODUCT_CREATED',
  [InboundStatus.INVENTORY_UPDATED]: 'INVENTORY_UPDATED',
  [InboundStatus.INBOUND_COMPLETED]: 'INBOUND_COMPLETED',
  [InboundStatus.INBOUND_CANCELLED]: 'INBOUND_CANCELLED',
};

function toDbStatus(prefixedStatus: string): string {
  return dbStatusMap[prefixedStatus] ?? prefixedStatus;
}

function mapInboundStatus(inbound: Record<string, unknown> & { status?: string }) {
  if (inbound.status) {
    inbound.status = toWorkflowStatus(inbound.status as string);
  }
  return inbound;
}

const createInboundSchema = z.object({
  purchaseOrderId: z.string().min(1).optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID là bắt buộc. Product ID is required.'),
    quantity: z.number().int().positive(),
    notes: z.string().optional(),
  })).min(1, 'Phải có ít nhất 1 sản phẩm. At least 1 item is required.'),
});

const qcSchema = z.object({
  passed: z.boolean(),
  reason: z.string().optional(),
  itemUpdates: z.array(z.object({
    id: z.string(),
    receivedQty: z.number().int().min(0).optional(),
    damageQty: z.number().int().min(0).optional(),
  })).optional(),
});

const assignLocationSchema = z.object({
  itemId: z.string(),
  locationId: z.string(),
});

function handleWorkflowError(error: unknown, res: Response): void {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: error.errors });
    return;
  }

  if (error instanceof Error && error.message === 'Inbound not found') {
    res.status(404).json({ error: 'Inbound not found' });
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

  // Prisma foreign key constraint violation (P2003)
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2003'
  ) {
    res.status(400).json({
      error: 'Tham chiếu không hợp lệ. Invalid reference: the specified related record does not exist.',
    });
    return;
  }

  // Prisma unique constraint violation (P2002)
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  ) {
    res.status(409).json({
      error: 'Bản ghi đã tồn tại. Record already exists.',
    });
    return;
  }

  // Prisma record not found (P2025) — for update/delete operations
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2025'
  ) {
    res.status(404).json({ error: 'Không tìm thấy bản ghi. Record not found.' });
    return;
  }

  // Known business logic errors from inbound service
  if (error instanceof Error) {
    const msg = error.message;
    if (
      msg.includes('không tồn tại') ||
      msg.includes('not found') ||
      msg.includes('not exist') ||
      msg.includes('chỉ có thể') ||
      msg.includes('Only')
    ) {
      res.status(400).json({ error: msg });
      return;
    }
  }

  console.error('Inbound workflow error:', error);
  res.status(500).json({ error: 'Internal server error' });
}

// GET /p02/inbounds
router.get('/inbounds', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = toDbStatus(status as string);

    const inbounds = await prisma.inbound.findMany({
      where,
      include: {
        purchaseOrder: { include: { supplier: true } },
        staff: { select: { id: true, name: true } },
        items: { include: { product: true, location: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    const total = await prisma.inbound.count({ where });
    res.json({
      inbounds: inbounds.map(mapInboundStatus),
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  } catch (error) {
    console.error('GET /inbounds error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /p02/inbounds/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const inbound = await prisma.inbound.findUnique({
      where: { id: req.params.id },
      include: {
        purchaseOrder: { include: { supplier: true } },
        staff: { select: { id: true, name: true } },
        items: { include: { product: true, location: true } },
      },
    });
    if (!inbound) {
      res.status(404).json({ error: 'Inbound not found' });
      return;
    }
    res.json({ inbound: mapInboundStatus(inbound) });
  } catch (error) {
    console.error('GET /inbounds/:id error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p02/inbounds - Create inbound order
router.post('/inbounds', authenticate, authorize('QUALITY', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createInboundSchema.parse(req.body);
    const inbound = await inboundService.createInbound({
      purchaseOrderId: data.purchaseOrderId,
      notes: data.notes,
      items: data.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes,
      })),
      userId: req.user!.id,
    });
    res.status(201).json({ inbound: mapInboundStatus(inbound) });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p02/inbounds/:id/receive - Receive items
router.post('/:id/receive', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await inboundService.receiveItems(
      req.params.id,
      req.user!.role as never,
      req.user!.id
    );
    res.json({ inbound: mapInboundStatus(result) });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p02/inbounds/:id/quality-check - Start quality check
router.post('/:id/quality-check', authenticate, authorize('QUALITY', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await inboundService.startQualityCheck(
      req.params.id,
      req.user!.role as never,
      req.user!.id
    );
    res.json({ inbound: mapInboundStatus(result) });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p02/inbounds/:id/qc - Quality check pass/fail
router.post('/:id/qc', authenticate, authorize('QUALITY', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { passed, reason, itemUpdates } = qcSchema.parse(req.body);

    if (passed) {
      if (itemUpdates && Array.isArray(itemUpdates)) {
        for (const update of itemUpdates) {
          await prisma.inboundItem.update({
            where: { id: update.id },
            data: { receivedQty: update.receivedQty, damageQty: update.damageQty || 0 },
          });
        }
      }
      const result = await inboundService.passQC(req.params.id, req.user!.role as never, req.user!.id);
      res.json({ inbound: mapInboundStatus(result) });
    } else {
      const result = await inboundService.failQC(req.params.id, req.user!.role as never, req.user!.id, reason);
      res.json({ inbound: mapInboundStatus(result) });
    }
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p02/inbounds/:id/recheck - Recheck after QC failure
router.post('/:id/recheck', authenticate, authorize('QUALITY', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await inboundService.recheckAfterFailure(
      req.params.id,
      req.user!.role as never,
      req.user!.id
    );
    res.json({ inbound: mapInboundStatus(result) });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p02/inbounds/:id/create-barcodes - Create barcodes for items
router.post('/:id/create-barcodes', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await inboundService.createBarcodes(
      req.params.id,
      req.user!.role as never,
      req.user!.id
    );
    res.json({ inbound: mapInboundStatus(result) });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p02/inbounds/:id/assign-location - Assign warehouse location
router.post('/:id/assign-location', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, locationId } = assignLocationSchema.parse(req.body);
    const result = await inboundService.assignLocation(
      req.params.id,
      req.user!.role as never,
      req.user!.id,
      itemId,
      locationId
    );
    res.json({ inbound: mapInboundStatus(result) });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p02/inbounds/:id/auto-assign-location - Auto-assign locations for all items
router.post('/:id/auto-assign-location', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await inboundService.autoAssignLocations(
      req.params.id,
      req.user!.role as never,
      req.user!.id
    );
    res.json({ inbound: mapInboundStatus(result) });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p02/inbounds/:id/confirm-receipt - Staff confirms receipt
router.post('/:id/confirm-receipt', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await inboundService.confirmReceipt(
      req.params.id,
      req.user!.role as never,
      req.user!.id
    );
    res.json({ inbound: mapInboundStatus(result) });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p02/inbounds/:id/complete - Complete inbound (updates inventory, creates products)
router.post('/:id/complete', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await inboundService.completeInbound(
      req.params.id,
      req.user!.role as never,
      req.user!.id
    );
    res.json({ inbound: mapInboundStatus(result) });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

// POST /p02/inbounds/:id/cancel - Cancel inbound
router.post('/:id/cancel', authenticate, authorize('QUALITY', 'WAREHOUSE_DIRECTOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const result = await inboundService.cancelInbound(
      req.params.id,
      req.user!.role as never,
      req.user!.id,
      reason
    );
    res.json({ inbound: mapInboundStatus(result) });
  } catch (error) {
    handleWorkflowError(error, res);
  }
});

export default router;