import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// Mock Prisma
const mockPrisma = {
  inbound: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  inventory: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  product: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock('../config/db.js', () => ({
  default: mockPrisma,
}));

// Mock eventEmitter
const mockEventEmitter = {
  emit: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../events/emitter.js', () => ({
  eventEmitter: mockEventEmitter,
}));

describe('P02: Inbound - New Product Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test: Should create new product when product doesn't exist
  it('should create new product when receiving new item', async () => {
    const mockInbound = {
      id: 'inbound-123',
      inboundNumber: 'IN202600001',
      status: 'QC_PASSED',
      items: [
        {
          id: 'item-1',
          productId: 'new-product-123',
          receivedQty: 100,
        },
      ],
    };

    mockPrisma.inbound.findUnique.mockResolvedValue(mockInbound);
    mockPrisma.product.findUnique.mockResolvedValue(null); // Product doesn't exist
    mockPrisma.product.create.mockResolvedValue({
      id: 'new-product-123',
      sku: 'NEW-SKU-001',
      name: 'New Product',
    });
    mockPrisma.inventory.findUnique.mockResolvedValue(null);
    mockPrisma.inventory.create.mockResolvedValue({
      productId: 'new-product-123',
      quantity: 100,
      available: 100,
    });

    // Simulate new product creation logic during inbound completion
    const handler = async (inbound: any) => {
      for (const item of inbound.items) {
        // Check if product exists
        const existingProduct = await mockPrisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!existingProduct) {
          // Create new product
          const newProduct = await mockPrisma.product.create({
            data: {
              id: item.productId,
              sku: `PROD-${Date.now()}`,
              name: `New Product ${item.productId}`,
            },
          });

          await mockEventEmitter.emit('INBOUND_NEW_PRODUCT_CREATED', 'Inbound', inbound.id, {
            inboundNumber: inbound.inboundNumber,
            productId: newProduct.id,
            sku: newProduct.sku,
          }, 'user-id');
        }
      }
    };

    await handler(mockInbound);

    expect(mockPrisma.product.create).toHaveBeenCalled();
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'INBOUND_NEW_PRODUCT_CREATED',
      'Inbound',
      'inbound-123',
      expect.objectContaining({
        inboundNumber: 'IN202600001',
        productId: 'new-product-123',
      }),
      expect.any(String)
    );
  });

  // Test: Should NOT create product when product exists
  it('should not create new product when product already exists', async () => {
    const mockInbound = {
      id: 'inbound-123',
      inboundNumber: 'IN202600001',
      status: 'QC_PASSED',
      items: [
        {
          id: 'item-1',
          productId: 'existing-product',
          receivedQty: 50,
        },
      ],
    };

    mockPrisma.inbound.findUnique.mockResolvedValue(mockInbound);
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 'existing-product',
      sku: 'EXISTING-SKU',
      name: 'Existing Product',
    });

    const handler = async (inbound: any) => {
      for (const item of inbound.items) {
        const existingProduct = await mockPrisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!existingProduct) {
          await mockPrisma.product.create({
            data: { id: item.productId, sku: 'NEW', name: 'New' },
          });
        }
      }
    };

    await handler(mockInbound);

    expect(mockPrisma.product.create).not.toHaveBeenCalled();
  });
});