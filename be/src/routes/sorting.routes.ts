import { Router, Response } from 'express';
import prisma from '../config/db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware.js';
import { eventEmitter } from '../events/emitter.js';

const router = Router();

// GET /p05/sortings
router.get('/sortings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const sortings = await prisma.sorting.findMany({
      where,
      include: {
        packing: { include: { outbound: { include: { items: true } } } },
        sorter: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    const total = await prisma.sorting.count({ where });
    res.json({ sortings, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /p05/sortings/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const sorting = await prisma.sorting.findUnique({
      where: { id: req.params.id },
      include: {
        packing: { include: { outbound: { include: { items: true } } } },
        sorter: { select: { id: true, name: true } },
      },
    });
    if (!sorting) {
      res.status(404).json({ error: 'Sorting not found' });
      return;
    }
    res.json({ sorting });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p05/sortings/:id/start - Start sorting
router.post('/:id/start', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const sorting = await prisma.sorting.findUnique({
      where: { id: req.params.id },
    });

    if (!sorting || sorting.status !== 'PENDING') {
      res.status(400).json({ error: 'Sorting not found or already started' });
      return;
    }

    const updated = await prisma.sorting.update({
      where: { id: req.params.id },
      data: { status: 'SORTING' },
    });

    await eventEmitter.emit('SORTING_RECEIVED', 'Sorting', sorting.id, {
      sortingNumber: sorting.sortingNumber,
    }, req.user!.id);

    res.json({ sorting: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p05/sortings/:id/qc-check - Quality check
router.post('/:id/qc-check', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { passed, notes } = req.body;
    const sorting = await prisma.sorting.findUnique({
      where: { id: req.params.id },
    });

    if (!sorting || !['PENDING', 'SORTING'].includes(sorting.status)) {
      res.status(400).json({ error: 'Sorting not found or in wrong status' });
      return;
    }

    const eventType = passed ? 'SORTING_QUALITY_OK' : 'SORTING_QUALITY_NOT_OK';
    await eventEmitter.emit(eventType, 'Sorting', sorting.id, {
      sortingNumber: sorting.sortingNumber,
      passed,
    }, req.user!.id);

    if (!passed) {
      // Return to packing for repack
      await prisma.packing.update({
        where: { id: sorting.packingId },
        data: { status: 'PENDING' },
      });
    }

    res.json({ message: passed ? 'QC passed' : 'Returned to packing', passed });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p05/sortings/:id/classify - Classify package
router.post('/:id/classify', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { sizeCategory, zone, notes } = req.body;
    const sorting = await prisma.sorting.findUnique({
      where: { id: req.params.id },
    });

    if (!sorting || sorting.status !== 'SORTING') {
      res.status(400).json({ error: 'Sorting not found or not in sorting status' });
      return;
    }

    // Update with classification
    const updated = await prisma.sorting.update({
      where: { id: req.params.id },
      data: { 
        status: 'SORTED',
        notes: notes || sorting.notes,
      },
    });

    if (sizeCategory) {
      await eventEmitter.emit('SORTING_SORTED_BY_SIZE', 'Sorting', sorting.id, {
        sortingNumber: sorting.sortingNumber,
        sizeCategory,
      }, req.user!.id);
    }

    if (zone) {
      await eventEmitter.emit('SORTING_SORTED_BY_ZONE', 'Sorting', sorting.id, {
        sortingNumber: sorting.sortingNumber,
        zone,
      }, req.user!.id);
    }

    res.json({ sorting: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p05/sortings/:id/complete - Complete sorting
router.post('/:id/complete', authenticate, authorize('STAFF', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const sorting = await prisma.sorting.findUnique({
      where: { id: req.params.id },
    });

    if (!sorting || sorting.status !== 'SORTED') {
      res.status(400).json({ error: 'Sorting not found or not sorted' });
      return;
    }

    const updated = await prisma.sorting.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedDate: new Date() },
    });

    // Create shipment
    const shipmentNumber = `SH${new Date().getFullYear()}${Date.now().toString().slice(-5)}`;
    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        sortingId: sorting.id,
        shipperId: req.user!.id,
        carrier: 'PENDING',
        status: 'CREATED',
      },
    });

    await eventEmitter.emit('SORTING_COMPLETED', 'Sorting', sorting.id, {
      sortingNumber: sorting.sortingNumber,
      shipmentNumber: shipment.shipmentNumber,
    }, req.user!.id);

    res.json({ sorting: updated, shipment });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
