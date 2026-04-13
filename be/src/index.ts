import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import inboundRoutes from './routes/inbound.routes.js';
import outboundRoutes from './routes/outbound.routes.js';
import packingRoutes from './routes/packing.routes.js';
import sortingRoutes from './routes/sorting.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import prisma from './config/db.js';
import { eventEmitter } from './events/emitter.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/orders', orderRoutes);
app.use('/inbounds', inboundRoutes);
app.use('/outbounds', outboundRoutes);
app.use('/packings', packingRoutes);
app.use('/sortings', sortingRoutes);
app.use('/shipments', shippingRoutes);
app.use('/inventory-checks', inventoryRoutes);

// Events endpoint
app.get('/events', async (req, res) => {
  try {
    const { process, limit = '100' } = req.query;
    const events = await eventEmitter.getEvents(process as string, parseInt(limit as string));
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Products endpoint (shared)
app.get('/products', async (req, res) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const where: Record<string, unknown> = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: { inventory: true },
      orderBy: { name: 'asc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    });

    const total = await prisma.product.count({ where });
    res.json({ products, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/products', async (req, res) => {
  try {
    const { name, sku, description, category, unit, weight, dimensions, price, minStock, image } = req.body;
    
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        category,
        unit: unit || 'piece',
        weight,
        dimensions,
        price: price || 0,
        minStock: minStock || 10,
        image,
      },
    });

    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Suppliers endpoint
app.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({ suppliers });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/suppliers', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const supplier = await prisma.supplier.create({
      data: { name, email, phone, address },
    });
    res.status(201).json({ supplier });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Warehouse locations
app.get('/locations', async (req, res) => {
  try {
    const locations = await prisma.warehouseLocation.findMany({
      where: { isActive: true },
      orderBy: [{ zone: 'asc' }, { row: 'asc' }, { shelf: 'asc' }],
    });
    res.json({ locations });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/locations', async (req, res) => {
  try {
    const { zone, row, shelf, position, capacity } = req.body;
    const location = await prisma.warehouseLocation.create({
      data: { zone, row, shelf, position, capacity: capacity || 100 },
    });
    res.status(201).json({ location });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inventory
app.get('/inventory', async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { product: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SPX Express Backend running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/health`);
});

export default app;
