// Event types for SPX Express Warehouse Management

// ============================================================================
// ĐẶT HÀNG (Purchase Order)
// ============================================================================
export type OrderEventType = 
  | 'ORDER_PURCHASE_PLAN_CREATED'
  | 'ORDER_PLAN_SENT_TO_ACCOUNTING'
  | 'ORDER_PLAN_CONFIRMED_BY_ACCOUNTING'
  | 'ORDER_PLAN_SENT_TO_DIRECTOR'
  | 'ORDER_PLAN_APPROVED'
  | 'ORDER_PLAN_REJECTED'
  | 'ORDER_SENT_TO_SUPPLIER'
  | 'SUPPLIER_CONFIRMED'
  | 'SUPPLIER_REJECTED'
  | 'ORDER_CANCELLED'
  | 'ORDER_COMPLETED';

// ============================================================================
// NHẬP KHO (Inbound)
// ============================================================================
export type InboundEventType = 
  | 'INBOUND_CREATED'
  | 'INBOUND_ITEMS_RECEIVED'
  | 'INBOUND_QUALITY_CHECKING'
  | 'INBOUND_QC_PASSED'
  | 'INBOUND_QC_FAILED'
  | 'INBOUND_BARCODE_CREATED'
  | 'INBOUND_LOCATION_ASSIGNED'
  | 'INBOUND_STAFF_RECEIVED'
  | 'INBOUND_NEW_PRODUCT_CREATED'
  | 'INBOUND_INVENTORY_UPDATED'
  | 'INBOUND_COMPLETED'
  | 'INBOUND_CANCELLED';

// ============================================================================
// XUẤT KHO (Outbound/Picking)
// ============================================================================
export type OutboundEventType = 
  | 'OUTBOUND_ORDER_RECEIVED'
  | 'OUTBOUND_INVENTORY_CHECKED'
  | 'OUTBOUND_INVENTORY_SUFFICIENT'
  | 'OUTBOUND_INVENTORY_INSUFFICIENT'
  | 'OUTBOUND_PICKING_ASSIGNED'
  | 'OUTBOUND_PICKER_ASSIGNED'
  | 'OUTBOUND_ITEM_SCANNED'
  | 'OUTBOUND_PICKED_CORRECT'
  | 'OUTBOUND_PICKED_WRONG'
  | 'OUTBOUND_PUT_IN_CART'
  | 'OUTBOUND_SLIP_PRINTED'
  | 'OUTBOUND_MOVED_TO_PACKING';

// ============================================================================
// ĐÓNG GÓI (Packing)
// ============================================================================
export type PackingEventType = 
  | 'PACKING_RECEIVED'
  | 'PACKING_STARTED'
  | 'PACKING_ITEM_PACKED'
  | 'PACKING_DECAL_ATTACHED'
  | 'PACKING_SCANNED'
  | 'PACKING_ON_CONVEYOR'
  | 'PACKING_MOVED_TO_SORTING';

// ============================================================================
// PHÂN LOẠI (Sorting)
// ============================================================================
export type SortingEventType = 
  | 'SORTING_RECEIVED'
  | 'SORTING_QUALITY_CHECKED'
  | 'SORTING_QUALITY_OK'
  | 'SORTING_QUALITY_NOT_OK'
  | 'SORTING_BARCODE_SCANNED'
  | 'SORTING_SORTED_BY_SIZE'
  | 'SORTING_SORTED_BY_ZONE'
  | 'SORTING_LOCATION_ASSIGNED'
  | 'SORTING_COMPLETED';

// ============================================================================
// VẬN CHUYỂN (Shipping)
// ============================================================================
export type ShippingEventType = 
  | 'SHIPPING_CREATED'
  | 'SHIPPING_CARRIER_SELECTED'
  | 'SHIPPING_TRACKING_CREATED'
  | 'SHIPPING_PICKED_UP'
  | 'SHIPPING_IN_TRANSIT'
  | 'SHIPPING_OUT_FOR_DELIVERY'
  | 'SHIPPING_DELIVERED'
  | 'SHIPPING_DELIVERY_FAILED'
  | 'SHIPPING_RETURNED';

// ============================================================================
// KIỂM KÊ (Inventory Check)
// ============================================================================
export type InventoryCheckEventType = 
  | 'INVENTORY_CHECK_SCHEDULE_CREATED'
  | 'INVENTORY_CHECK_FORM_CREATED'
  | 'INVENTORY_CHECK_PHYSICAL_COUNT_STARTED'
  | 'INVENTORY_CHECK_ITEM_COUNTED'
  | 'INVENTORY_CHECK_COMPARISON_STARTED'
  | 'INVENTORY_CHECK_DISCREPANCY_DETECTED'
  | 'INVENTORY_CHECK_ROOT_CAUSE_ANALYZED'
  | 'INVENTORY_CHECK_ADJUSTMENT_CREATED'
  | 'INVENTORY_CHECK_INVENTORY_ADJUSTED'
  | 'INVENTORY_CHECK_REPORT_GENERATED'
  | 'INVENTORY_CHECK_COMPLETED';

// Union type for all events
export type EventType = 
  | OrderEventType
  | InboundEventType
  | OutboundEventType
  | PackingEventType
  | SortingEventType
  | ShippingEventType
  | InventoryCheckEventType;

export interface EventPayload {
  eventType: EventType;
  process: string;
  entityType: string;
  entityId: string;
  userId?: string;
  data: Record<string, unknown>;
  timestamp: string;
}
