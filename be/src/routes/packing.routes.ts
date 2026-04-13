import { Router, Response } from 'express';
import prisma from '../config/db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware.js';
import { eventEmitter } from '../events/emitter.js';

const router = Router();

// GET /p04/packings
router.get('/packings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const packings = await prisma.packing.findMany({
      where,
      include: {
        outbound: { include: { items: { include: { product: true } } } },
        packer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    const total = await prisma.packing.count({ where });
    res.json({ packings, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /p04/packings/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const packing = await prisma.packing.findUnique({
      where: { id: req.params.id },
      include: {
        outbound: { include: { items: { include: { product: true } } } },
        packer: { select: { id: true, name: true } },
      },
    });
    if (!packing) {
      res.status(404).json({ error: 'Packing not found' });
      return;
    }
    res.json({ packing });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p04/packings/:id/start - Start packing
router.post('/:id/start', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const packing = await prisma.packing.findUnique({
      where: { id: req.params.id },
    });

    if (!packing || packing.status !== 'PENDING') {
      res.status(400).json({ error: 'Packing not found or already started' });
      return;
    }

    const updated = await prisma.packing.update({
      where: { id: req.params.id },
      data: { status: 'PACKING' },
    });

    await eventEmitter.emit('PACKING_STARTED', 'Packing', packing.id, {
      packingNumber: packing.packingNumber,
    }, req.user!.id);

    res.json({ packing: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p04/packings/:id/item-packed - Item packed
router.post('/p04/packings/:id/item-packed', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.body;
    const packing = await prisma.packing.findUnique({
      where: { id: req.params.id },
      include: { outbound: true },
    });

    if (!packing || packing.status !== 'PACKING') {
      res.status(400).json({ error: 'Packing not found or not in packing status' });
      return;
    }

    await eventEmitter.emit('PACKING_ITEM_PACKED', 'Packing', packing.id, {
      packingNumber: packing.packingNumber,
      itemId,
    }, req.user!.id);

    res.json({ message: 'Item packed' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p04/packings/:id/seal - Seal package
router.post('/p04/packings/:id/seal', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { weight, dimension } = req.body;
    const packing = await prisma.packing.findUnique({
      where: { id: req.params.id },
    });

    if (!packing || packing.status !== 'PACKING') {
      res.status(400).json({ error: 'Packing not found or not ready to seal' });
      return;
    }

    const updated = await prisma.packing.update({
      where: { id: req.params.id },
      data: { 
        status: 'SEALED',
        packedDate: new Date(),
        weight: weight || null,
        dimension: dimension || null,
      },
    });

    await eventEmitter.emit('PACKING_DECAL_ATTACHED', 'Packing', packing.id, {
      packingNumber: packing.packingNumber,
    }, req.user!.id);

    res.json({ packing: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p04/packings/:id/on-conveyor - Move to conveyor
router.post('/p04/packings/:id/on-conveyor', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const packing = await prisma.packing.findUnique({
      where: { id: req.params.id },
    });

    if (!packing || packing.status !== 'SEALED') {
      res.status(400).json({ error: 'Packing not found or not sealed' });
      return;
    }

    const updated = await prisma.packing.update({
      where: { id: req.params.id },
      data: { status: 'ON_CONVEYOR' },
    });

    await eventEmitter.emit('PACKING_ON_CONVEYOR', 'Packing', packing.id, {
      packingNumber: packing.packingNumber,
    }, req.user!.id);

    res.json({ packing: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p04/packings/:id/move-to-sorting - Move to sorting
router.post('/p04/packings/:id/move-to-sorting', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const packing = await prisma.packing.findUnique({
      where: { id: req.params.id },
    });

    if (!packing || packing.status !== 'ON_CONVEYOR') {
      res.status(400).json({ error: 'Packing not found or not on conveyor' });
      return;
    }

    // Create sorting record
    const sortingNumber = `SO${new Date().getFullYear()}${Date.now().toString().slice(-5)}`;
    const sorting = await prisma.sorting.create({
      data: {
        sortingNumber,
        packingId: packing.id,
        sorterId: req.user!.id,
        status: 'PENDING',
      },
    });

    await eventEmitter.emit('PACKING_MOVED_TO_SORTING', 'Packing', packing.id, {
      packingNumber: packing.packingNumber,
      sortingNumber: sorting.sortingNumber,
    }, req.user!.id);

    res.json({ sorting, message: 'Moved to sorting' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
