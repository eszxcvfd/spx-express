import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware.js';
import { eventEmitter } from '../events/emitter.js';

const router = Router();

const createCheckSchema = z.object({
  type: z.enum(['ROUTINE', 'SPOT_CHECK', 'ANNUAL']).optional(),
  notes: z.string().optional(),
  productIds: z.array(z.string()).optional(), // If empty, check all products
});

async function generateCheckNumber(): Promise<string> {
  const count = await prisma.inventoryCheck.count();
  const num = (count + 1).toString().padStart(5, '0');
  return `CK${new Date().getFullYear()}${num}`;
}

// GET /p07/checks
router.get('/checks', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const checks = await prisma.inventoryCheck.findMany({
      where,
      include: {
        checker: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    const total = await prisma.inventoryCheck.count({ where });
    res.json({ checks, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /p07/checks/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const check = await prisma.inventoryCheck.findUnique({
      where: { id: req.params.id },
      include: {
        checker: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
    });
    if (!check) {
      res.status(404).json({ error: 'Check not found' });
      return;
    }
    res.json({ check });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p07/checks - Create inventory check
router.post('/checks', authenticate, authorize('QUALITY', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createCheckSchema.parse(req.body);
    const checkNumber = await generateCheckNumber();

    // Get products to check
    const products = await prisma.product.findMany({
      where: data.productIds ? { id: { in: data.productIds } } : undefined,
    });

    // Get current inventory for all products
    const inventories = await prisma.inventory.findMany({
      where: data.productIds ? { productId: { in: data.productIds } } : undefined,
    });

    const inventoryMap = new Map(inventories.map(inv => [inv.productId, inv]));

    // Create check with items
    const check = await prisma.inventoryCheck.create({
      data: {
        checkNumber,
        checkerId: req.user!.id,
        type: data.type || 'ROUTINE',
        notes: data.notes,
        status: 'PENDING',
        items: {
          create: products.map(product => {
            const inv = inventoryMap.get(product.id) as { quantity: number } | undefined;
            return {
              productId: product.id,
              systemQty: inv?.quantity || 0,
              actualQty: inv?.quantity || 0,
              discrepancy: 0,
            };
          }),
        },
      },
      include: {
        checker: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
    });

    await eventEmitter.emit('INVENTORY_CHECK_FORM_CREATED', 'InventoryCheck', check.id, {
      checkNumber: check.checkNumber,
      productCount: products.length,
    }, req.user!.id);

    res.status(201).json({ check });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p07/checks/:id/start - Start physical count
router.post('/:id/start', authenticate, authorize('QUALITY', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const check = await prisma.inventoryCheck.findUnique({
      where: { id: req.params.id },
    });

    if (!check || check.status !== 'PENDING') {
      res.status(400).json({ error: 'Check not found or already started' });
      return;
    }

    const updated = await prisma.inventoryCheck.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS', startDate: new Date() },
    });

    await eventEmitter.emit('INVENTORY_CHECK_PHYSICAL_COUNT_STARTED', 'InventoryCheck', check.id, {
      checkNumber: check.checkNumber,
    }, req.user!.id);

    res.json({ check: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p07/checks/:id/count - Count item
router.post('/:id/count', authenticate, authorize('QUALITY', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, actualQty, notes } = req.body;
    const check = await prisma.inventoryCheck.findUnique({
      where: { id: req.params.id },
    });

    if (!check || check.status !== 'IN_PROGRESS') {
      res.status(400).json({ error: 'Check not found or not in progress' });
      return;
    }

    const currentItem = await prisma.inventoryCheckItem.findUnique({
      where: { id: itemId },
    });

    if (!currentItem) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const discrepancy = actualQty - currentItem.systemQty;
    const updated = await prisma.inventoryCheckItem.update({
      where: { id: itemId },
      data: { actualQty, discrepancy, notes },
    });

    await eventEmitter.emit('INVENTORY_CHECK_ITEM_COUNTED', 'InventoryCheck', check.id, {
      checkNumber: check.checkNumber,
      productId: currentItem.productId,
      systemQty: currentItem.systemQty,
      actualQty,
      discrepancy,
    }, req.user!.id);

    res.json({ item: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p07/checks/:id/comparison - Start comparison
router.post('/:id/comparison', authenticate, authorize('QUALITY', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const check = await prisma.inventoryCheck.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!check || check.status !== 'IN_PROGRESS') {
      res.status(400).json({ error: 'Check not found or not in progress' });
      return;
    }

    // Check for discrepancies
    const hasDiscrepancy = check.items.some(item => item.discrepancy !== 0);

    if (hasDiscrepancy) {
      await eventEmitter.emit('INVENTORY_CHECK_DISCREPANCY_DETECTED', 'InventoryCheck', check.id, {
        checkNumber: check.checkNumber,
        discrepancyCount: check.items.filter(i => i.discrepancy !== 0).length,
      }, req.user!.id);
    }

    res.json({ 
      message: hasDiscrepancy ? 'Discrepancies found' : 'No discrepancies',
      discrepancyCount: check.items.filter(i => i.discrepancy !== 0).length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p07/checks/:id/adjust - Adjust inventory
router.post('/:id/adjust', authenticate, authorize('QUALITY', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const check = await prisma.inventoryCheck.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!check || check.status !== 'IN_PROGRESS') {
      res.status(400).json({ error: 'Check not found or not in progress' });
      return;
    }

    // Apply adjustments to inventory
    for (const item of check.items) {
      if (item.discrepancy !== 0) {
        const inventory = await prisma.inventory.findUnique({
          where: { productId: item.productId },
        });

        if (inventory) {
          await prisma.inventory.update({
            where: { productId: item.productId },
            data: { quantity: item.actualQty },
          });
        }
      }
    }

    await eventEmitter.emit('INVENTORY_CHECK_INVENTORY_ADJUSTED', 'InventoryCheck', check.id, {
      checkNumber: check.checkNumber,
      adjustedItems: check.items.filter(i => i.discrepancy !== 0).length,
    }, req.user!.id);

    res.json({ message: 'Inventory adjusted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p07/checks/:id/complete - Complete check
router.post('/:id/complete', authenticate, authorize('QUALITY', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { notes } = req.body;
    const check = await prisma.inventoryCheck.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });

    if (!check || !['PENDING', 'IN_PROGRESS'].includes(check.status)) {
      res.status(400).json({ error: 'Check not found or already completed' });
      return;
    }

    const totalDiscrepancy = check.items.reduce((sum, item) => sum + Math.abs(item.discrepancy), 0);
    
    const updated = await prisma.inventoryCheck.update({
      where: { id: req.params.id },
      data: { 
        status: 'COMPLETED', 
        endDate: new Date(),
        notes: notes || check.notes,
      },
    });

    await eventEmitter.emit('INVENTORY_CHECK_COMPLETED', 'InventoryCheck', check.id, {
      checkNumber: check.checkNumber,
      totalDiscrepancy,
      itemsChecked: check.items.length,
    }, req.user!.id);

    res.json({ check: updated, summary: { totalDiscrepancy, itemsChecked: check.items.length } });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
