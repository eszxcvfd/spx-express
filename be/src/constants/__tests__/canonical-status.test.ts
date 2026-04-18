import { describe, it, expect } from 'vitest';
import {
  PurchaseOrderStatus,
  InboundStatus,
  OutboundStatus,
  PackingStatus,
  SortingStatus,
  ShippingStatus,
  InventoryCheckStatus,
} from '../canonical-status';

const PREFIX_PATTERN = /^P\d+_/;

describe('canonical-status', () => {
  describe('PurchaseOrderStatus (P01)', () => {
    it('should have no P01_ prefix', () => {
      const values = Object.values(PurchaseOrderStatus);
      values.forEach((v) => {
        expect(v).not.toMatch(PREFIX_PATTERN);
      });
    });

    it('should match Prisma schema values', () => {
      expect(PurchaseOrderStatus.DRAFT).toBe('DRAFT');
      expect(PurchaseOrderStatus.PENDING_ACCOUNTING).toBe('PENDING_ACCOUNTING');
      expect(PurchaseOrderStatus.PENDING_APPROVAL).toBe('PENDING_APPROVAL');
      expect(PurchaseOrderStatus.APPROVED).toBe('APPROVED');
      expect(PurchaseOrderStatus.SENT_TO_SUPPLIER).toBe('SENT_TO_SUPPLIER');
      expect(PurchaseOrderStatus.SUPPLIER_CONFIRMED).toBe('SUPPLIER_CONFIRMED');
      expect(PurchaseOrderStatus.SUPPLIER_REJECTED).toBe('SUPPLIER_REJECTED');
      expect(PurchaseOrderStatus.CANCELLED).toBe('CANCELLED');
      expect(PurchaseOrderStatus.COMPLETED).toBe('COMPLETED');
    });
  });

  describe('InboundStatus (P02)', () => {
    it('should have no P02_ prefix', () => {
      const values = Object.values(InboundStatus);
      values.forEach((v) => {
        expect(v).not.toMatch(PREFIX_PATTERN);
      });
    });

    it('should match Prisma schema values', () => {
      expect(InboundStatus.INBOUND_CREATED).toBe('INBOUND_CREATED');
      expect(InboundStatus.ITEMS_RECEIVED).toBe('ITEMS_RECEIVED');
      expect(InboundStatus.QUALITY_CHECKING).toBe('QUALITY_CHECKING');
      expect(InboundStatus.QC_PASSED).toBe('QC_PASSED');
      expect(InboundStatus.QC_FAILED).toBe('QC_FAILED');
      expect(InboundStatus.BARCODE_CREATED).toBe('BARCODE_CREATED');
      expect(InboundStatus.LOCATION_ASSIGNED).toBe('LOCATION_ASSIGNED');
      expect(InboundStatus.STAFF_RECEIVED).toBe('STAFF_RECEIVED');
      expect(InboundStatus.NEW_PRODUCT_CREATED).toBe('NEW_PRODUCT_CREATED');
      expect(InboundStatus.INVENTORY_UPDATED).toBe('INVENTORY_UPDATED');
      expect(InboundStatus.INBOUND_COMPLETED).toBe('INBOUND_COMPLETED');
      expect(InboundStatus.INBOUND_CANCELLED).toBe('INBOUND_CANCELLED');
    });
  });

  describe('OutboundStatus (P03)', () => {
    it('should have no P03_ prefix', () => {
      const values = Object.values(OutboundStatus);
      values.forEach((v) => {
        expect(v).not.toMatch(PREFIX_PATTERN);
      });
    });

    it('should match Prisma schema values', () => {
      expect(OutboundStatus.ORDER_RECEIVED).toBe('ORDER_RECEIVED');
      expect(OutboundStatus.INVENTORY_CHECKED).toBe('INVENTORY_CHECKED');
      expect(OutboundStatus.INVENTORY_SUFFICIENT).toBe('INVENTORY_SUFFICIENT');
      expect(OutboundStatus.INVENTORY_INSUFFICIENT).toBe('INVENTORY_INSUFFICIENT');
      expect(OutboundStatus.PICKING_ASSIGNED).toBe('PICKING_ASSIGNED');
      expect(OutboundStatus.PICKER_ASSIGNED).toBe('PICKER_ASSIGNED');
      expect(OutboundStatus.ITEM_SCANNED).toBe('ITEM_SCANNED');
      expect(OutboundStatus.PICKED_CORRECT).toBe('PICKED_CORRECT');
      expect(OutboundStatus.PICKED_WRONG).toBe('PICKED_WRONG');
      expect(OutboundStatus.PUT_IN_CART).toBe('PUT_IN_CART');
      expect(OutboundStatus.SLIP_PRINTED).toBe('SLIP_PRINTED');
      expect(OutboundStatus.MOVED_TO_PACKING).toBe('MOVED_TO_PACKING');
    });
  });

  describe('PackingStatus (P04)', () => {
    it('should have no P04_ prefix', () => {
      const values = Object.values(PackingStatus);
      values.forEach((v) => {
        expect(v).not.toMatch(PREFIX_PATTERN);
      });
    });

    it('should match Prisma schema values', () => {
      expect(PackingStatus.PENDING).toBe('PENDING');
      expect(PackingStatus.PACKING).toBe('PACKING');
      expect(PackingStatus.PACKED).toBe('PACKED');
      expect(PackingStatus.SEALED).toBe('SEALED');
      expect(PackingStatus.ON_CONVEYOR).toBe('ON_CONVEYOR');
      expect(PackingStatus.CANCELLED).toBe('CANCELLED');
    });
  });

  describe('SortingStatus (P05)', () => {
    it('should have no P05_ prefix', () => {
      const values = Object.values(SortingStatus);
      values.forEach((v) => {
        expect(v).not.toMatch(PREFIX_PATTERN);
      });
    });

    it('should match Prisma schema values', () => {
      expect(SortingStatus.PENDING).toBe('PENDING');
      expect(SortingStatus.SORTING).toBe('SORTING');
      expect(SortingStatus.SORTED).toBe('SORTED');
      expect(SortingStatus.COMPLETED).toBe('COMPLETED');
    });
  });

  describe('ShippingStatus (P06)', () => {
    it('should have no P06_ prefix', () => {
      const values = Object.values(ShippingStatus);
      values.forEach((v) => {
        expect(v).not.toMatch(PREFIX_PATTERN);
      });
    });

    it('should match Prisma schema values', () => {
      expect(ShippingStatus.CREATED).toBe('CREATED');
      expect(ShippingStatus.PICKED_UP).toBe('PICKED_UP');
      expect(ShippingStatus.IN_TRANSIT).toBe('IN_TRANSIT');
      expect(ShippingStatus.OUT_FOR_DELIVERY).toBe('OUT_FOR_DELIVERY');
      expect(ShippingStatus.DELIVERED).toBe('DELIVERED');
      expect(ShippingStatus.FAILED).toBe('FAILED');
      expect(ShippingStatus.RETURNED).toBe('RETURNED');
    });
  });

  describe('InventoryCheckStatus (P07)', () => {
    it('should have no P07_ prefix', () => {
      const values = Object.values(InventoryCheckStatus);
      values.forEach((v) => {
        expect(v).not.toMatch(PREFIX_PATTERN);
      });
    });

    it('should match Prisma schema values', () => {
      expect(InventoryCheckStatus.PENDING).toBe('PENDING');
      expect(InventoryCheckStatus.IN_PROGRESS).toBe('IN_PROGRESS');
      expect(InventoryCheckStatus.COMPLETED).toBe('COMPLETED');
    });
  });

  describe('no prefix leakage across all statuses', () => {
    const allStatuses = [
      ...Object.values(PurchaseOrderStatus),
      ...Object.values(InboundStatus),
      ...Object.values(OutboundStatus),
      ...Object.values(PackingStatus),
      ...Object.values(SortingStatus),
      ...Object.values(ShippingStatus),
      ...Object.values(InventoryCheckStatus),
    ];

    it('should have zero P01-P07 prefixes in canonical exports', () => {
      allStatuses.forEach((v) => {
        expect(v).not.toMatch(PREFIX_PATTERN);
      });
    });
  });
});
