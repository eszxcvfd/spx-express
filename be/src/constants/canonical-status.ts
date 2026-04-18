/**
 * Canonical Status Contract for SPX Express Warehouse Management
 *
 * Single source of truth for all workflow entity statuses (P01-P07).
 * Uses plain semantic names - NO P01-P07 prefixes.
 *
 * Prisma schema and FE types use these same plain names.
 * State machines validate against these canonical values directly.
 */

// ============================================================================
// P01: QUY TRÌNH ĐẶT HÀNG (Purchase Order)
// ============================================================================
export const PurchaseOrderStatus = {
  DRAFT: 'DRAFT',
  PENDING_ACCOUNTING: 'PENDING_ACCOUNTING',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  SENT_TO_SUPPLIER: 'SENT_TO_SUPPLIER',
  SUPPLIER_CONFIRMED: 'SUPPLIER_CONFIRMED',
  SUPPLIER_REJECTED: 'SUPPLIER_REJECTED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export type PurchaseOrderStatus =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

// ============================================================================
// P02: QUY TRÌNH NHẬP KHO (Inbound)
// ============================================================================
export const InboundStatus = {
  INBOUND_CREATED: 'INBOUND_CREATED',
  ITEMS_RECEIVED: 'ITEMS_RECEIVED',
  QUALITY_CHECKING: 'QUALITY_CHECKING',
  QC_PASSED: 'QC_PASSED',
  QC_FAILED: 'QC_FAILED',
  BARCODE_CREATED: 'BARCODE_CREATED',
  LOCATION_ASSIGNED: 'LOCATION_ASSIGNED',
  STAFF_RECEIVED: 'STAFF_RECEIVED',
  NEW_PRODUCT_CREATED: 'NEW_PRODUCT_CREATED',
  INVENTORY_UPDATED: 'INVENTORY_UPDATED',
  INBOUND_COMPLETED: 'INBOUND_COMPLETED',
  INBOUND_CANCELLED: 'INBOUND_CANCELLED',
} as const;

export type InboundStatus = (typeof InboundStatus)[keyof typeof InboundStatus];

// ============================================================================
// P03: QUY TRÌNH XUẤT KHO (Outbound/Picking)
// ============================================================================
export const OutboundStatus = {
  ORDER_RECEIVED: 'ORDER_RECEIVED',
  INVENTORY_CHECKED: 'INVENTORY_CHECKED',
  INVENTORY_SUFFICIENT: 'INVENTORY_SUFFICIENT',
  INVENTORY_INSUFFICIENT: 'INVENTORY_INSUFFICIENT',
  PICKING_ASSIGNED: 'PICKING_ASSIGNED',
  PICKER_ASSIGNED: 'PICKER_ASSIGNED',
  ITEM_SCANNED: 'ITEM_SCANNED',
  PICKED_CORRECT: 'PICKED_CORRECT',
  PICKED_WRONG: 'PICKED_WRONG',
  PUT_IN_CART: 'PUT_IN_CART',
  SLIP_PRINTED: 'SLIP_PRINTED',
  MOVED_TO_PACKING: 'MOVED_TO_PACKING',
} as const;

export type OutboundStatus = (typeof OutboundStatus)[keyof typeof OutboundStatus];

// ============================================================================
// P04: QUY TRÌNH ĐÓNG GÓI (Packing)
// ============================================================================
export const PackingStatus = {
  PENDING: 'PENDING',
  PACKING: 'PACKING',
  PACKED: 'PACKED',
  SEALED: 'SEALED',
  ON_CONVEYOR: 'ON_CONVEYOR',
  CANCELLED: 'CANCELLED',
} as const;

export type PackingStatus = (typeof PackingStatus)[keyof typeof PackingStatus];

// ============================================================================
// P05: QUY TRÌNH PHÂN LOẠI (Sorting)
// ============================================================================
export const SortingStatus = {
  PENDING: 'PENDING',
  SORTING: 'SORTING',
  SORTED: 'SORTED',
  COMPLETED: 'COMPLETED',
} as const;

export type SortingStatus = (typeof SortingStatus)[keyof typeof SortingStatus];

// ============================================================================
// P06: QUY TRÌNH VẬN CHUYỂN (Shipping)
// ============================================================================
export const ShippingStatus = {
  CREATED: 'CREATED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  RETURNED: 'RETURNED',
} as const;

export type ShippingStatus = (typeof ShippingStatus)[keyof typeof ShippingStatus];

// ============================================================================
// P07: QUY TRÌNH KIỂM KÊ (Inventory Check)
// ============================================================================
export const InventoryCheckStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type InventoryCheckStatus =
  (typeof InventoryCheckStatus)[keyof typeof InventoryCheckStatus];

// ============================================================================
// Workflow Status Category
// ============================================================================
export type WorkflowStatusCategory =
  | 'PURCHASE_ORDER'
  | 'INBOUND'
  | 'OUTBOUND'
  | 'PACKING'
  | 'SORTING'
  | 'SHIPPING'
  | 'INVENTORY_CHECK';

// ============================================================================
// Allowed Transitions & Actor Permissions (Documented)
// ============================================================================

/**
 * Purchase Order (P01) allowed transitions:
 * DRAFT -> PENDING_ACCOUNTING (STAFF, ADMIN)
 * PENDING_ACCOUNTING -> PENDING_APPROVAL (ACCOUNTING, ADMIN)
 * PENDING_APPROVAL -> APPROVED (WAREHOUSE_DIRECTOR, ADMIN)
 * PENDING_APPROVAL -> CANCELLED (WAREHOUSE_DIRECTOR, ADMIN)
 * APPROVED -> SENT_TO_SUPPLIER (STAFF, ADMIN)
 * SENT_TO_SUPPLIER -> SUPPLIER_CONFIRMED (STAFF, ADMIN)
 * SENT_TO_SUPPLIER -> SUPPLIER_REJECTED (STAFF, ADMIN)
 * SUPPLIER_CONFIRMED -> COMPLETED (STAFF, ADMIN)
 * (any) -> CANCELLED (ACCOUNTING, ADMIN)
 */

/**
 * Inbound (P02) allowed transitions:
 * INBOUND_CREATED -> ITEMS_RECEIVED (STAFF, ADMIN)
 * ITEMS_RECEIVED -> QUALITY_CHECKING (QUALITY, ADMIN)
 * QUALITY_CHECKING -> QC_PASSED (QUALITY, ADMIN)
 * QUALITY_CHECKING -> QC_FAILED (QUALITY, ADMIN)
 * QC_FAILED -> QUALITY_CHECKING (QUALITY, ADMIN) [recheck]
 * QC_PASSED -> BARCODE_CREATED (STAFF, ADMIN)
 * BARCODE_CREATED -> LOCATION_ASSIGNED (STAFF, ADMIN)
 * LOCATION_ASSIGNED -> STAFF_RECEIVED (STAFF, ADMIN)
 * STAFF_RECEIVED -> INVENTORY_UPDATED (STAFF, ADMIN)
 * INVENTORY_UPDATED -> INBOUND_COMPLETED (STAFF, ADMIN)
 * (any) -> INBOUND_CANCELLED (ADMIN)
 */

/**
 * Outbound (P03) allowed transitions:
 * ORDER_RECEIVED -> INVENTORY_CHECKED (STAFF, ADMIN)
 * INVENTORY_CHECKED -> INVENTORY_SUFFICIENT (STAFF, ADMIN)
 * INVENTORY_CHECKED -> INVENTORY_INSUFFICIENT (STAFF, ADMIN)
 * INVENTORY_SUFFICIENT -> PICKING_ASSIGNED (ADMIN)
 * PICKING_ASSIGNED -> PICKER_ASSIGNED (ADMIN)
 * PICKER_ASSIGNED -> ITEM_SCANNED (STAFF, ADMIN)
 * ITEM_SCANNED -> PICKED_CORRECT (STAFF, ADMIN)
 * ITEM_SCANNED -> PICKED_WRONG (STAFF, ADMIN)
 * PICKED_WRONG -> ITEM_SCANNED (STAFF, ADMIN) [rescan]
 * PICKED_CORRECT -> PUT_IN_CART (STAFF, ADMIN)
 * PUT_IN_CART -> SLIP_PRINTED (STAFF, ADMIN)
 * SLIP_PRINTED -> MOVED_TO_PACKING (STAFF, ADMIN)
 * INVENTORY_INSUFFICIENT -> INVENTORY_CHECKED (STAFF, ADMIN) [recheck]
 */

/**
 * Packing (P04) allowed transitions:
 * PENDING -> PACKING (STAFF, ADMIN)
 * PACKING -> PACKED (STAFF, ADMIN)
 * PACKED -> SEALED (STAFF, ADMIN)
 * SEALED -> ON_CONVEYOR (STAFF, ADMIN)
 * ON_CONVEYOR -> (moves to SORTING)
 * (any) -> CANCELLED (ADMIN)
 */

/**
 * Sorting (P05) allowed transitions:
 * PENDING -> SORTING (STAFF, ADMIN)
 * SORTING -> SORTED (STAFF, ADMIN)
 * SORTED -> COMPLETED (STAFF, ADMIN)
 * (any terminal) -> (moves to SHIPPING)
 */

/**
 * Shipping (P06) allowed transitions:
 * CREATED -> PICKED_UP (DRIVER, ADMIN)
 * PICKED_UP -> IN_TRANSIT (DRIVER, ADMIN)
 * IN_TRANSIT -> OUT_FOR_DELIVERY (DRIVER, ADMIN)
 * OUT_FOR_DELIVERY -> DELIVERED (DRIVER, ADMIN)
 * OUT_FOR_DELIVERY -> FAILED (DRIVER, ADMIN)
 * FAILED -> RETURNED (DRIVER, ADMIN)
 * (any) -> RETURNED (ADMIN)
 */

/**
 * Inventory Check (P07) allowed transitions:
 * PENDING -> IN_PROGRESS (STAFF, ADMIN)
 * IN_PROGRESS -> COMPLETED (STAFF, ADMIN)
 */
