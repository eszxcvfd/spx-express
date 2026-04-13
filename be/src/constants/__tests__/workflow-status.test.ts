import { describe, it, expect } from 'vitest';
import {
  WorkflowStatus,
  PurchaseOrderStatus,
  InboundStatus,
  OutboundStatus,
  PackingStatus,
  SortingStatus,
  ShippingStatus,
  InventoryCheckStatus,
  isValidWorkflowStatus,
  getWorkflowStatusCategory,
  getStatusDescription,
} from '../workflow-status';

describe('WorkflowStatus Constants', () => {
  describe('P01: Purchase Order Status', () => {
    it('should have all required purchase order statuses', () => {
      expect(PurchaseOrderStatus.PURCHASE_PLAN_CREATED).toBe('P01_PURCHASE_PLAN_CREATED');
      expect(PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING).toBe('P01_PLAN_CONFIRMED_BY_ACCOUNTING');
      expect(PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR).toBe('P01_PLAN_SENT_TO_DIRECTOR');
      expect(PurchaseOrderStatus.PLAN_APPROVED).toBe('P01_PLAN_APPROVED');
      expect(PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER).toBe('P01_ORDER_SENT_TO_SUPPLIER');
      expect(PurchaseOrderStatus.SUPPLIER_CONFIRMED).toBe('P01_SUPPLIER_CONFIRMED');
      expect(PurchaseOrderStatus.SUPPLIER_REJECTED).toBe('P01_SUPPLIER_REJECTED');
      expect(PurchaseOrderStatus.ORDER_CANCELLED).toBe('P01_ORDER_CANCELLED');
      expect(PurchaseOrderStatus.ORDER_COMPLETED).toBe('P01_ORDER_COMPLETED');
    });

    it('should have correct count of purchase order statuses', () => {
      const purchaseOrderStatuses = Object.values(PurchaseOrderStatus);
      expect(purchaseOrderStatuses).toHaveLength(9);
    });
  });

  describe('P02: Inbound Status', () => {
    it('should have all required inbound statuses', () => {
      expect(InboundStatus.INBOUND_CREATED).toBe('P02_INBOUND_CREATED');
      expect(InboundStatus.ITEMS_RECEIVED).toBe('P02_ITEMS_RECEIVED');
      expect(InboundStatus.QUALITY_CHECKING).toBe('P02_QUALITY_CHECKING');
      expect(InboundStatus.QC_PASSED).toBe('P02_QC_PASSED');
      expect(InboundStatus.QC_FAILED).toBe('P02_QC_FAILED');
      expect(InboundStatus.BARCODE_CREATED).toBe('P02_BARCODE_CREATED');
      expect(InboundStatus.LOCATION_ASSIGNED).toBe('P02_LOCATION_ASSIGNED');
      expect(InboundStatus.STAFF_RECEIVED).toBe('P02_STAFF_RECEIVED');
      expect(InboundStatus.NEW_PRODUCT_CREATED).toBe('P02_NEW_PRODUCT_CREATED');
      expect(InboundStatus.INVENTORY_UPDATED).toBe('P02_INVENTORY_UPDATED');
      expect(InboundStatus.INBOUND_COMPLETED).toBe('P02_INBOUND_COMPLETED');
      expect(InboundStatus.INBOUND_CANCELLED).toBe('P02_INBOUND_CANCELLED');
    });

    it('should have correct count of inbound statuses', () => {
      const inboundStatuses = Object.values(InboundStatus);
      expect(inboundStatuses).toHaveLength(12);
    });
  });

  describe('P03: Outbound Status', () => {
    it('should have all required outbound statuses', () => {
      expect(OutboundStatus.ORDER_RECEIVED).toBe('P03_ORDER_RECEIVED');
      expect(OutboundStatus.INVENTORY_CHECKED).toBe('P03_INVENTORY_CHECKED');
      expect(OutboundStatus.INVENTORY_SUFFICIENT).toBe('P03_INVENTORY_SUFFICIENT');
      expect(OutboundStatus.INVENTORY_INSUFFICIENT).toBe('P03_INVENTORY_INSUFFICIENT');
      expect(OutboundStatus.PICKING_ASSIGNED).toBe('P03_PICKING_ASSIGNED');
      expect(OutboundStatus.PICKER_ASSIGNED).toBe('P03_PICKER_ASSIGNED');
      expect(OutboundStatus.ITEM_SCANNED).toBe('P03_ITEM_SCANNED');
      expect(OutboundStatus.PICKED_CORRECT).toBe('P03_PICKED_CORRECT');
      expect(OutboundStatus.PICKED_WRONG).toBe('P03_PICKED_WRONG');
      expect(OutboundStatus.PUT_IN_CART).toBe('P03_PUT_IN_CART');
      expect(OutboundStatus.SLIP_PRINTED).toBe('P03_SLIP_PRINTED');
      expect(OutboundStatus.MOVED_TO_PACKING).toBe('P03_MOVED_TO_PACKING');
    });

    it('should have correct count of outbound statuses', () => {
      const outboundStatuses = Object.values(OutboundStatus);
      expect(outboundStatuses).toHaveLength(12);
    });
  });

  describe('P04: Packing Status', () => {
    it('should have all required packing statuses', () => {
      expect(PackingStatus.PACKING_RECEIVED).toBe('P04_PACKING_RECEIVED');
      expect(PackingStatus.PACKING_STARTED).toBe('P04_PACKING_STARTED');
      expect(PackingStatus.ITEM_PACKED).toBe('P04_ITEM_PACKED');
      expect(PackingStatus.DECAL_ATTACHED).toBe('P04_DECAL_ATTACHED');
      expect(PackingStatus.PACKING_SCANNED).toBe('P04_PACKING_SCANNED');
      expect(PackingStatus.ON_CONVEYOR).toBe('P04_ON_CONVEYOR');
      expect(PackingStatus.MOVED_TO_SORTING).toBe('P04_MOVED_TO_SORTING');
    });

    it('should have correct count of packing statuses', () => {
      const packingStatuses = Object.values(PackingStatus);
      expect(packingStatuses).toHaveLength(7);
    });
  });

  describe('P05: Sorting Status', () => {
    it('should have all required sorting statuses', () => {
      expect(SortingStatus.SORTING_RECEIVED).toBe('P05_SORTING_RECEIVED');
      expect(SortingStatus.QUALITY_CHECKED).toBe('P05_QUALITY_CHECKED');
      expect(SortingStatus.QUALITY_OK).toBe('P05_QUALITY_OK');
      expect(SortingStatus.QUALITY_NOT_OK).toBe('P05_QUALITY_NOT_OK');
      expect(SortingStatus.BARCODE_SCANNED).toBe('P05_BARCODE_SCANNED');
      expect(SortingStatus.SORTED_BY_SIZE).toBe('P05_SORTED_BY_SIZE');
      expect(SortingStatus.SORTED_BY_ZONE).toBe('P05_SORTED_BY_ZONE');
      expect(SortingStatus.LOCATION_ASSIGNED).toBe('P05_LOCATION_ASSIGNED');
      expect(SortingStatus.COMPLETED).toBe('P05_COMPLETED');
    });

    it('should have correct count of sorting statuses', () => {
      const sortingStatuses = Object.values(SortingStatus);
      expect(sortingStatuses).toHaveLength(9);
    });
  });

  describe('P06: Shipping Status', () => {
    it('should have all required shipping statuses', () => {
      expect(ShippingStatus.SHIPMENT_CREATED).toBe('P06_SHIPMENT_CREATED');
      expect(ShippingStatus.CARRIER_SELECTED).toBe('P06_CARRIER_SELECTED');
      expect(ShippingStatus.TRACKING_CREATED).toBe('P06_TRACKING_CREATED');
      expect(ShippingStatus.PICKED_UP).toBe('P06_PICKED_UP');
      expect(ShippingStatus.IN_TRANSIT).toBe('P06_IN_TRANSIT');
      expect(ShippingStatus.DELIVERED).toBe('P06_DELIVERED');
      expect(ShippingStatus.DELIVERY_FAILED).toBe('P06_DELIVERY_FAILED');
      expect(ShippingStatus.RETURNED).toBe('P06_RETURNED');
    });

    it('should have correct count of shipping statuses', () => {
      const shippingStatuses = Object.values(ShippingStatus);
      expect(shippingStatuses).toHaveLength(8);
    });
  });

  describe('P07: Inventory Check Status', () => {
    it('should have all required inventory check statuses', () => {
      expect(InventoryCheckStatus.CHECK_SCHEDULE_CREATED).toBe('P07_CHECK_SCHEDULE_CREATED');
      expect(InventoryCheckStatus.CHECK_FORM_CREATED).toBe('P07_CHECK_FORM_CREATED');
      expect(InventoryCheckStatus.PHYSICAL_COUNT_STARTED).toBe('P07_PHYSICAL_COUNT_STARTED');
      expect(InventoryCheckStatus.ITEM_COUNTED).toBe('P07_ITEM_COUNTED');
      expect(InventoryCheckStatus.COMPARISON_STARTED).toBe('P07_COMPARISON_STARTED');
      expect(InventoryCheckStatus.DISCREPANCY_DETECTED).toBe('P07_DISCREPANCY_DETECTED');
      expect(InventoryCheckStatus.ROOT_CAUSE_ANALYZED).toBe('P07_ROOT_CAUSE_ANALYZED');
      expect(InventoryCheckStatus.ADJUSTMENT_CREATED).toBe('P07_ADJUSTMENT_CREATED');
      expect(InventoryCheckStatus.INVENTORY_ADJUSTED).toBe('P07_INVENTORY_ADJUSTED');
      expect(InventoryCheckStatus.REPORT_GENERATED).toBe('P07_REPORT_GENERATED');
      expect(InventoryCheckStatus.CHECK_COMPLETED).toBe('P07_CHECK_COMPLETED');
    });

    it('should have correct count of inventory check statuses', () => {
      const inventoryCheckStatuses = Object.values(InventoryCheckStatus);
      expect(inventoryCheckStatuses).toHaveLength(11);
    });
  });

  describe('WorkflowStatus Union Type', () => {
    it('should have correct total count of all workflow statuses', () => {
      const allStatuses = Object.values(WorkflowStatus);
      // P01: 9 + P02: 12 + P03: 12 + P04: 7 + P05: 9 + P06: 8 + P07: 11 = 68
      expect(allStatuses).toHaveLength(68);
    });
  });

  describe('isValidWorkflowStatus', () => {
    it('should return true for valid workflow status', () => {
      expect(isValidWorkflowStatus('P01_PURCHASE_PLAN_CREATED')).toBe(true);
      expect(isValidWorkflowStatus('P02_INBOUND_CREATED')).toBe(true);
      expect(isValidWorkflowStatus('P03_ORDER_RECEIVED')).toBe(true);
      expect(isValidWorkflowStatus('P04_PACKING_RECEIVED')).toBe(true);
      expect(isValidWorkflowStatus('P05_SORTING_RECEIVED')).toBe(true);
      expect(isValidWorkflowStatus('P06_SHIPMENT_CREATED')).toBe(true);
      expect(isValidWorkflowStatus('P07_CHECK_SCHEDULE_CREATED')).toBe(true);
    });

    it('should return false for invalid workflow status', () => {
      expect(isValidWorkflowStatus('INVALID_STATUS')).toBe(false);
      expect(isValidWorkflowStatus('P00_TEST')).toBe(false);
      expect(isValidWorkflowStatus('P08_TEST')).toBe(false);
      expect(isValidWorkflowStatus('')).toBe(false);
      expect(isValidWorkflowStatus('P01')).toBe(false);
    });
  });

  describe('getWorkflowStatusCategory', () => {
    it('should return correct category for purchase order statuses', () => {
      expect(getWorkflowStatusCategory('P01_PURCHASE_PLAN_CREATED')).toBe('PURCHASE_ORDER');
      expect(getWorkflowStatusCategory('P01_PLAN_APPROVED')).toBe('PURCHASE_ORDER');
    });

    it('should return correct category for inbound statuses', () => {
      expect(getWorkflowStatusCategory('P02_INBOUND_CREATED')).toBe('INBOUND');
      expect(getWorkflowStatusCategory('P02_INBOUND_COMPLETED')).toBe('INBOUND');
    });

    it('should return correct category for outbound statuses', () => {
      expect(getWorkflowStatusCategory('P03_ORDER_RECEIVED')).toBe('OUTBOUND');
      expect(getWorkflowStatusCategory('P03_MOVED_TO_PACKING')).toBe('OUTBOUND');
    });

    it('should return correct category for packing statuses', () => {
      expect(getWorkflowStatusCategory('P04_PACKING_RECEIVED')).toBe('PACKING');
      expect(getWorkflowStatusCategory('P04_MOVED_TO_SORTING')).toBe('PACKING');
    });

    it('should return correct category for sorting statuses', () => {
      expect(getWorkflowStatusCategory('P05_SORTING_RECEIVED')).toBe('SORTING');
      expect(getWorkflowStatusCategory('P05_COMPLETED')).toBe('SORTING');
    });

    it('should return correct category for shipping statuses', () => {
      expect(getWorkflowStatusCategory('P06_SHIPMENT_CREATED')).toBe('SHIPPING');
      expect(getWorkflowStatusCategory('P06_DELIVERED')).toBe('SHIPPING');
    });

    it('should return correct category for inventory check statuses', () => {
      expect(getWorkflowStatusCategory('P07_CHECK_SCHEDULE_CREATED')).toBe('INVENTORY_CHECK');
      expect(getWorkflowStatusCategory('P07_CHECK_COMPLETED')).toBe('INVENTORY_CHECK');
    });

    it('should return null for invalid status', () => {
      expect(getWorkflowStatusCategory('INVALID_STATUS')).toBeNull();
    });
  });

  describe('P01_PLAN_APPROVED category mapping', () => {
    it('should map P01_PLAN_APPROVED to PURCHASE_ORDER category', () => {
      expect(getWorkflowStatusCategory('P01_PLAN_APPROVED')).toBe('PURCHASE_ORDER');
    });
  });

  describe('getStatusDescription', () => {
    it('should return description for purchase plan created', () => {
      expect(getStatusDescription('P01_PURCHASE_PLAN_CREATED')).toBe('Quality tạo kế hoạch nhập hàng');
    });

    it('should return description for plan confirmed by accounting', () => {
      expect(getStatusDescription('P01_PLAN_CONFIRMED_BY_ACCOUNTING')).toBe('Kế toán xác nhận');
    });

    it('should return description for plan sent to director', () => {
      expect(getStatusDescription('P01_PLAN_SENT_TO_DIRECTOR')).toBe('Gửi cho Giám đốc kho');
    });

    it('should return description for plan approved', () => {
      expect(getStatusDescription('P01_PLAN_APPROVED')).toBe('Giám đốc kho duyệt');
    });

    it('should return description for supplier confirmed', () => {
      expect(getStatusDescription('P01_SUPPLIER_CONFIRMED')).toBe('NCC xác nhận có hàng');
    });

    it('should return description for supplier rejected', () => {
      expect(getStatusDescription('P01_SUPPLIER_REJECTED')).toBe('NCC không có hàng');
    });

    it('should return description for order cancelled', () => {
      expect(getStatusDescription('P01_ORDER_CANCELLED')).toBe('Kế toán hủy đơn');
    });

    it('should return description for order completed', () => {
      expect(getStatusDescription('P01_ORDER_COMPLETED')).toBe('Hoàn tất đặt hàng');
    });

    it('should return description for QC passed', () => {
      expect(getStatusDescription('P02_QC_PASSED')).toBe('QC đạt');
    });

    it('should return description for QC failed', () => {
      expect(getStatusDescription('P02_QC_FAILED')).toBe('QC không đạt (sai số lượng, hư hỏng)');
    });

    it('should return description for inventory sufficient', () => {
      expect(getStatusDescription('P03_INVENTORY_SUFFICIENT')).toBe('Đủ hàng');
    });

    it('should return description for inventory insufficient', () => {
      expect(getStatusDescription('P03_INVENTORY_INSUFFICIENT')).toBe('Không đủ hàng -> Chờ');
    });

    it('should return description for picked correct', () => {
      expect(getStatusDescription('P03_PICKED_CORRECT')).toBe('Lấy đúng sản phẩm');
    });

    it('should return description for picked wrong', () => {
      expect(getStatusDescription('P03_PICKED_WRONG')).toBe('Lấy sai (quét lại)');
    });

    it('should return description for delivered', () => {
      expect(getStatusDescription('P06_DELIVERED')).toBe('Đã giao hàng');
    });

    it('should return description for delivery failed', () => {
      expect(getStatusDescription('P06_DELIVERY_FAILED')).toBe('Giao thất bại');
    });

    it('should return description for returned', () => {
      expect(getStatusDescription('P06_RETURNED')).toBe('Hoàn hàng');
    });

    it('should return description for discrepancy detected', () => {
      expect(getStatusDescription('P07_DISCREPANCY_DETECTED')).toBe('Phát hiện chênh lệch');
    });

    it('should return null for invalid status', () => {
      expect(getStatusDescription('INVALID_STATUS')).toBeNull();
    });
  });
});