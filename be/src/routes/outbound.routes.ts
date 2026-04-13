import { Router, Response } from 'express';
import prisma from '../config/db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware.js';
import { outboundService, transformOutbound, transformOutbounds, toDbStatus } from '../services/outbound-service.js';

const router = Router();

router.get('/outbounds', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = toDbStatus(status as string);

    const outbounds = await prisma.outbound.findMany({
      where,
      include: {
        picker: { select: { id: true, name: true } },
        items: { include: { product: true, location: true } },
        packing: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    const total = await prisma.outbound.count({ where });
    res.json({ outbounds: transformOutbounds(outbounds), total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const outbound = await prisma.outbound.findUnique({
      where: { id: req.params.id },
      include: {
        picker: { select: { id: true, name: true } },
        items: { include: { product: true, location: true } },
        packing: true,
      },
    });
    if (!outbound) {
      res.status(404).json({ error: 'Outbound not found' });
      return;
    }
    res.json({ outbound: transformOutbound(outbound) });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/outbounds', authenticate, authorize('ADMIN', 'STAFF'), async (req: AuthRequest, res: Response) => {
  try {
    const { orderRef, notes, items } = req.body;
    const outbound = await outboundService.createOutbound({
      orderRef,
      notes,
      items,
      userId: req.user!.id,
    });
    res.status(201).json({ outbound: transformOutbound(outbound) });
  } catch (error) {
    console.error('[OUTBOUND] Create error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/check-inventory', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await outboundService.checkInventory(req.params.id, req.user!.role, req.user!.id);
    res.json({ outbound: transformOutbound(result) });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/confirm-sufficient', authenticate, authorize('WAREHOUSE_DIRECTOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await outboundService.confirmInventorySufficient(req.params.id, req.user!.role, req.user!.id);
    res.json({ outbound: transformOutbound(result) });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/mark-insufficient', authenticate, authorize('WAREHOUSE_DIRECTOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await outboundService.markInventoryInsufficient(req.params.id, req.user!.role, req.user!.id);
    res.json({ outbound: transformOutbound(result) });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/assign-picking', authenticate, authorize('WAREHOUSE_DIRECTOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await outboundService.assignPicking(req.params.id, req.user!.role, req.user!.id);
    res.json({ outbound: transformOutbound(result) });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/assign-picker', authenticate, authorize('WAREHOUSE_DIRECTOR', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { pickerId } = req.body;
    const result = await outboundService.assignPicker(req.params.id, pickerId, req.user!.role, req.user!.id);
    res.json({ outbound: transformOutbound(result) });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/scan-item', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { productId, barcode } = req.body;
    const result = await outboundService.scanItem(req.params.id, productId, barcode, req.user!.role, req.user!.id);
    res.json({ outbound: transformOutbound(result) });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/pick-correct', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, pickedQty } = req.body;
    const result = await outboundService.confirmPickedCorrect(req.params.id, itemId, pickedQty, req.user!.role, req.user!.id);
    res.json({ outbound: transformOutbound(result) });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/pick-wrong', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.body;
    const result = await outboundService.markPickedWrong(req.params.id, itemId, req.user!.role, req.user!.id);
    res.json({ outbound: transformOutbound(result), message: 'Item picked wrong, please rescan' });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/rescan', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await outboundService.rescanItem(req.params.id, req.user!.role, req.user!.id);
    res.json({ outbound: transformOutbound(result) });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/put-in-cart', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await outboundService.putInCart(req.params.id, req.user!.role, req.user!.id);
    res.json({ outbound: transformOutbound(result) });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/print-slip', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await outboundService.printSlip(req.params.id, req.user!.role, req.user!.id);
    res.json({ outbound: transformOutbound(result) });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/move-to-packing', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await outboundService.moveToPacking(req.params.id, req.user!.role, req.user!.id);
    res.json({ outbound: transformOutbound(result.outbound), packing: result.packing });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
