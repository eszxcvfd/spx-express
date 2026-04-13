import { Router, Response } from 'express';
import prisma from '../config/db.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware.js';
import { eventEmitter } from '../events/emitter.js';

const router = Router();

// GET /p06/shipments
router.get('/shipments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, carrier, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (carrier) where.carrier = carrier;

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        sorting: { include: { packing: { include: { outbound: true } } } },
        shipper: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    const total = await prisma.shipment.count({ where });
    res.json({ shipments, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /p06/shipments/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
      include: {
        sorting: { include: { packing: { include: { outbound: true } } } },
        shipper: { select: { id: true, name: true } },
      },
    });
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }
    res.json({ shipment });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p06/shipments - Create shipment (auto from sorting)
router.post('/shipments', authenticate, authorize('ADMIN', 'STAFF'), async (req: AuthRequest, res: Response) => {
  try {
    const { sortingId, carrier } = req.body;
    const sorting = await prisma.sorting.findUnique({
      where: { id: sortingId },
    });

    if (!sorting || sorting.status !== 'COMPLETED') {
      res.status(400).json({ error: 'Sorting not found or not completed' });
      return;
    }

    const shipmentNumber = `SH${new Date().getFullYear()}${Date.now().toString().slice(-5)}`;
    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        sortingId,
        shipperId: req.user!.id,
        carrier: carrier || 'PENDING',
        status: 'CREATED',
      },
      include: {
        sorting: true,
        shipper: { select: { id: true, name: true } },
      },
    });

    await eventEmitter.emit('SHIPPING_CREATED', 'Shipment', shipment.id, {
      shipmentNumber: shipment.shipmentNumber,
    }, req.user!.id);

    res.status(201).json({ shipment });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p06/shipments/:id/select-carrier - Select carrier
router.post('/p06/shipments/:id/select-carrier', authenticate, authorize('ADMIN', 'STAFF'), async (req: AuthRequest, res: Response) => {
  try {
    const { carrier } = req.body;
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
    });

    if (!shipment || shipment.status !== 'CREATED') {
      res.status(400).json({ error: 'Shipment not found or not ready' });
      return;
    }

    const updated = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { carrier },
    });

    await eventEmitter.emit('SHIPPING_CARRIER_SELECTED', 'Shipment', shipment.id, {
      shipmentNumber: shipment.shipmentNumber,
      carrier,
    }, req.user!.id);

    res.json({ shipment: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p06/shipments/:id/create-tracking - Create tracking number
router.post('/p06/shipments/:id/create-tracking', authenticate, authorize('ADMIN', 'STAFF'), async (req: AuthRequest, res: Response) => {
  try {
    const { trackingNumber } = req.body;
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
    });

    if (!shipment || !['CREATED', 'PICKED_UP'].includes(shipment.status)) {
      res.status(400).json({ error: 'Shipment not found or carrier not assigned' });
      return;
    }

    const generatedTracking = trackingNumber || `TRK${Date.now()}`;
    const updated = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { trackingNumber: generatedTracking },
    });

    await eventEmitter.emit('SHIPPING_TRACKING_CREATED', 'Shipment', shipment.id, {
      shipmentNumber: shipment.shipmentNumber,
      trackingNumber: generatedTracking,
    }, req.user!.id);

    res.json({ shipment: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p06/shipments/:id/pickup - Mark as picked up
router.post('/p06/shipments/:id/pickup', authenticate, authorize('DRIVER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
    });

    if (!shipment || shipment.status !== 'PICKED_UP') {
      res.status(400).json({ error: 'Shipment not found or status wrong' });
      return;
    }

    const updated = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status: 'PICKED_UP' },
    });

    await eventEmitter.emit('SHIPPING_PICKED_UP', 'Shipment', shipment.id, {
      shipmentNumber: shipment.shipmentNumber,
    }, req.user!.id);

    res.json({ shipment: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p06/shipments/:id/in-transit - Mark as in transit
router.post('/p06/shipments/:id/in-transit', authenticate, authorize('DRIVER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
    });

    if (!shipment || shipment.status !== 'PICKED_UP') {
      res.status(400).json({ error: 'Shipment not found or not picked up' });
      return;
    }

    const updated = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status: 'IN_TRANSIT' },
    });

    await eventEmitter.emit('SHIPPING_IN_TRANSIT', 'Shipment', shipment.id, {
      shipmentNumber: shipment.shipmentNumber,
    }, req.user!.id);

    res.json({ shipment: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p06/shipments/:id/out-for-delivery - Out for delivery
router.post('/p06/shipments/:id/out-for-delivery', authenticate, authorize('DRIVER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
    });

    if (!shipment || shipment.status !== 'IN_TRANSIT') {
      res.status(400).json({ error: 'Shipment not found or not in transit' });
      return;
    }

    const updated = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status: 'OUT_FOR_DELIVERY' },
    });

    res.json({ shipment: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p06/shipments/:id/deliver - Mark as delivered
router.post('/p06/shipments/:id/deliver', authenticate, authorize('DRIVER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { notes } = req.body;
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
    });

    if (!shipment || !['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(shipment.status)) {
      res.status(400).json({ error: 'Shipment not found or cannot deliver' });
      return;
    }

    // Release reserved inventory
    const sorting = await prisma.sorting.findUnique({
      where: { id: shipment.sortingId },
      include: { packing: { include: { outbound: { include: { items: true } } } } },
    });

    if (sorting?.packing?.outbound) {
      for (const item of sorting.packing.outbound.items) {
        await prisma.inventory.update({
          where: { productId: item.productId },
          data: { reserved: { decrement: item.quantity } },
        });
      }
    }

    const updated = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status: 'DELIVERED', deliveredDate: new Date(), deliveryNotes: notes },
    });

    await eventEmitter.emit('SHIPPING_DELIVERED', 'Shipment', shipment.id, {
      shipmentNumber: shipment.shipmentNumber,
    }, req.user!.id);

    res.json({ shipment: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p06/shipments/:id/failed - Delivery failed
router.post('/p06/shipments/:id/failed', authenticate, authorize('DRIVER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
    });

    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }

    const updated = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status: 'FAILED', deliveryNotes: reason },
    });

    await eventEmitter.emit('SHIPPING_DELIVERY_FAILED', 'Shipment', shipment.id, {
      shipmentNumber: shipment.shipmentNumber,
      reason,
    }, req.user!.id);

    res.json({ shipment: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /p06/shipments/:id/return - Return shipment
router.post('/p06/shipments/:id/return', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id: req.params.id },
    });

    if (!shipment || shipment.status !== 'FAILED') {
      res.status(400).json({ error: 'Shipment not found or not failed' });
      return;
    }

    const updated = await prisma.shipment.update({
      where: { id: req.params.id },
      data: { status: 'RETURNED' },
    });

    await eventEmitter.emit('SHIPPING_RETURNED', 'Shipment', shipment.id, {
      shipmentNumber: shipment.shipmentNumber,
    }, req.user!.id);

    res.json({ shipment: updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
