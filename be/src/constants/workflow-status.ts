/**
 * Workflow Status Constants for SPX Express Warehouse Management
 *
 * Defines all workflow statuses for the warehouse management processes:
 * - P01: Purchase Order (Đặt hàng)
 * - P02: Inbound (Nhập kho)
 * - P03: Outbound/Picking (Xuất kho)
 * - P04: Packing (Đóng gói)
 * - P05: Sorting (Phân loại)
 * - P06: Shipping (Vận chuyển)
 * - P07: Inventory Check (Kiểm kê)
 */

// ============================================================================
// P01: QUY TRÌNH ĐẶT HÀNG (Purchase Order)
// ============================================================================
export const PurchaseOrderStatus = {
  PURCHASE_PLAN_CREATED: 'P01_PURCHASE_PLAN_CREATED',
  PLAN_CONFIRMED_BY_ACCOUNTING: 'P01_PLAN_CONFIRMED_BY_ACCOUNTING',
  PLAN_SENT_TO_DIRECTOR: 'P01_PLAN_SENT_TO_DIRECTOR',
  PLAN_APPROVED: 'P01_PLAN_APPROVED',
  ORDER_SENT_TO_SUPPLIER: 'P01_ORDER_SENT_TO_SUPPLIER',
  SUPPLIER_CONFIRMED: 'P01_SUPPLIER_CONFIRMED',
  SUPPLIER_REJECTED: 'P01_SUPPLIER_REJECTED',
  ORDER_CANCELLED: 'P01_ORDER_CANCELLED',
  ORDER_COMPLETED: 'P01_ORDER_COMPLETED',
} as const;

export type PurchaseOrderStatus =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

// ============================================================================
// P02: QUY TRÌNH NHẬP KHO (Inbound)
// ============================================================================
export const InboundStatus = {
  INBOUND_CREATED: 'P02_INBOUND_CREATED',
  ITEMS_RECEIVED: 'P02_ITEMS_RECEIVED',
  QUALITY_CHECKING: 'P02_QUALITY_CHECKING',
  QC_PASSED: 'P02_QC_PASSED',
  QC_FAILED: 'P02_QC_FAILED',
  BARCODE_CREATED: 'P02_BARCODE_CREATED',
  LOCATION_ASSIGNED: 'P02_LOCATION_ASSIGNED',
  STAFF_RECEIVED: 'P02_STAFF_RECEIVED',
  NEW_PRODUCT_CREATED: 'P02_NEW_PRODUCT_CREATED',
  INVENTORY_UPDATED: 'P02_INVENTORY_UPDATED',
  INBOUND_COMPLETED: 'P02_INBOUND_COMPLETED',
  INBOUND_CANCELLED: 'P02_INBOUND_CANCELLED',
} as const;

export type InboundStatus = (typeof InboundStatus)[keyof typeof InboundStatus];

// ============================================================================
// P03: QUY TRÌNH XUẤT KHO (Outbound/Picking)
// ============================================================================
export const OutboundStatus = {
  ORDER_RECEIVED: 'P03_ORDER_RECEIVED',
  INVENTORY_CHECKED: 'P03_INVENTORY_CHECKED',
  INVENTORY_SUFFICIENT: 'P03_INVENTORY_SUFFICIENT',
  INVENTORY_INSUFFICIENT: 'P03_INVENTORY_INSUFFICIENT',
  PICKING_ASSIGNED: 'P03_PICKING_ASSIGNED',
  PICKER_ASSIGNED: 'P03_PICKER_ASSIGNED',
  ITEM_SCANNED: 'P03_ITEM_SCANNED',
  PICKED_CORRECT: 'P03_PICKED_CORRECT',
  PICKED_WRONG: 'P03_PICKED_WRONG',
  PUT_IN_CART: 'P03_PUT_IN_CART',
  SLIP_PRINTED: 'P03_SLIP_PRINTED',
  MOVED_TO_PACKING: 'P03_MOVED_TO_PACKING',
} as const;

export type OutboundStatus = (typeof OutboundStatus)[keyof typeof OutboundStatus];

// ============================================================================
// P04: QUY TRÌNH ĐÓNG GÓI (Packing)
// ============================================================================
export const PackingStatus = {
  PACKING_RECEIVED: 'P04_PACKING_RECEIVED',
  PACKING_STARTED: 'P04_PACKING_STARTED',
  ITEM_PACKED: 'P04_ITEM_PACKED',
  DECAL_ATTACHED: 'P04_DECAL_ATTACHED',
  PACKING_SCANNED: 'P04_PACKING_SCANNED',
  ON_CONVEYOR: 'P04_ON_CONVEYOR',
  MOVED_TO_SORTING: 'P04_MOVED_TO_SORTING',
} as const;

export type PackingStatus = (typeof PackingStatus)[keyof typeof PackingStatus];

// ============================================================================
// P05: QUY TRÌNH PHÂN LOẠI (Sorting)
// ============================================================================
export const SortingStatus = {
  SORTING_RECEIVED: 'P05_SORTING_RECEIVED',
  QUALITY_CHECKED: 'P05_QUALITY_CHECKED',
  QUALITY_OK: 'P05_QUALITY_OK',
  QUALITY_NOT_OK: 'P05_QUALITY_NOT_OK',
  BARCODE_SCANNED: 'P05_BARCODE_SCANNED',
  SORTED_BY_SIZE: 'P05_SORTED_BY_SIZE',
  SORTED_BY_ZONE: 'P05_SORTED_BY_ZONE',
  LOCATION_ASSIGNED: 'P05_LOCATION_ASSIGNED',
  COMPLETED: 'P05_COMPLETED',
} as const;

export type SortingStatus = (typeof SortingStatus)[keyof typeof SortingStatus];

// ============================================================================
// P06: QUY TRÌNH VẬN CHUYỂN (Shipping)
// ============================================================================
export const ShippingStatus = {
  SHIPMENT_CREATED: 'P06_SHIPMENT_CREATED',
  CARRIER_SELECTED: 'P06_CARRIER_SELECTED',
  TRACKING_CREATED: 'P06_TRACKING_CREATED',
  PICKED_UP: 'P06_PICKED_UP',
  IN_TRANSIT: 'P06_IN_TRANSIT',
  DELIVERED: 'P06_DELIVERED',
  DELIVERY_FAILED: 'P06_DELIVERY_FAILED',
  RETURNED: 'P06_RETURNED',
} as const;

export type ShippingStatus = (typeof ShippingStatus)[keyof typeof ShippingStatus];

// ============================================================================
// P07: QUY TRÌNH KIỂM KÊ (Inventory Check)
// ============================================================================
export const InventoryCheckStatus = {
  CHECK_SCHEDULE_CREATED: 'P07_CHECK_SCHEDULE_CREATED',
  CHECK_FORM_CREATED: 'P07_CHECK_FORM_CREATED',
  PHYSICAL_COUNT_STARTED: 'P07_PHYSICAL_COUNT_STARTED',
  ITEM_COUNTED: 'P07_ITEM_COUNTED',
  COMPARISON_STARTED: 'P07_COMPARISON_STARTED',
  DISCREPANCY_DETECTED: 'P07_DISCREPANCY_DETECTED',
  ROOT_CAUSE_ANALYZED: 'P07_ROOT_CAUSE_ANALYZED',
  ADJUSTMENT_CREATED: 'P07_ADJUSTMENT_CREATED',
  INVENTORY_ADJUSTED: 'P07_INVENTORY_ADJUSTED',
  REPORT_GENERATED: 'P07_REPORT_GENERATED',
  CHECK_COMPLETED: 'P07_CHECK_COMPLETED',
} as const;

export type InventoryCheckStatus =
  (typeof InventoryCheckStatus)[keyof typeof InventoryCheckStatus];

// ============================================================================
// Union Type for all workflow statuses
// ============================================================================
// IMPORTANT: Use explicit keys to avoid key collision from spread operator
// (e.g., LOCATION_ASSIGNED appears in multiple statuses but must be unique)
export const WorkflowStatus = {
  // Purchase Order (P01) - 9 statuses
  P01_PURCHASE_PLAN_CREATED: PurchaseOrderStatus.PURCHASE_PLAN_CREATED,
  P01_PLAN_CONFIRMED_BY_ACCOUNTING: PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING,
  P01_PLAN_SENT_TO_DIRECTOR: PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
  P01_PLAN_APPROVED: PurchaseOrderStatus.PLAN_APPROVED,
  P01_ORDER_SENT_TO_SUPPLIER: PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
  P01_SUPPLIER_CONFIRMED: PurchaseOrderStatus.SUPPLIER_CONFIRMED,
  P01_SUPPLIER_REJECTED: PurchaseOrderStatus.SUPPLIER_REJECTED,
  P01_ORDER_CANCELLED: PurchaseOrderStatus.ORDER_CANCELLED,
  P01_ORDER_COMPLETED: PurchaseOrderStatus.ORDER_COMPLETED,
  // Inbound (P02) - 12 statuses
  P02_INBOUND_CREATED: InboundStatus.INBOUND_CREATED,
  P02_ITEMS_RECEIVED: InboundStatus.ITEMS_RECEIVED,
  P02_QUALITY_CHECKING: InboundStatus.QUALITY_CHECKING,
  P02_QC_PASSED: InboundStatus.QC_PASSED,
  P02_QC_FAILED: InboundStatus.QC_FAILED,
  P02_BARCODE_CREATED: InboundStatus.BARCODE_CREATED,
  P02_LOCATION_ASSIGNED: InboundStatus.LOCATION_ASSIGNED,
  P02_STAFF_RECEIVED: InboundStatus.STAFF_RECEIVED,
  P02_NEW_PRODUCT_CREATED: InboundStatus.NEW_PRODUCT_CREATED,
  P02_INVENTORY_UPDATED: InboundStatus.INVENTORY_UPDATED,
  P02_INBOUND_COMPLETED: InboundStatus.INBOUND_COMPLETED,
  P02_INBOUND_CANCELLED: InboundStatus.INBOUND_CANCELLED,
  // Outbound (P03) - 12 statuses
  P03_ORDER_RECEIVED: OutboundStatus.ORDER_RECEIVED,
  P03_INVENTORY_CHECKED: OutboundStatus.INVENTORY_CHECKED,
  P03_INVENTORY_SUFFICIENT: OutboundStatus.INVENTORY_SUFFICIENT,
  P03_INVENTORY_INSUFFICIENT: OutboundStatus.INVENTORY_INSUFFICIENT,
  P03_PICKING_ASSIGNED: OutboundStatus.PICKING_ASSIGNED,
  P03_PICKER_ASSIGNED: OutboundStatus.PICKER_ASSIGNED,
  P03_ITEM_SCANNED: OutboundStatus.ITEM_SCANNED,
  P03_PICKED_CORRECT: OutboundStatus.PICKED_CORRECT,
  P03_PICKED_WRONG: OutboundStatus.PICKED_WRONG,
  P03_PUT_IN_CART: OutboundStatus.PUT_IN_CART,
  P03_SLIP_PRINTED: OutboundStatus.SLIP_PRINTED,
  P03_MOVED_TO_PACKING: OutboundStatus.MOVED_TO_PACKING,
  // Packing (P04) - 7 statuses
  P04_PACKING_RECEIVED: PackingStatus.PACKING_RECEIVED,
  P04_PACKING_STARTED: PackingStatus.PACKING_STARTED,
  P04_ITEM_PACKED: PackingStatus.ITEM_PACKED,
  P04_DECAL_ATTACHED: PackingStatus.DECAL_ATTACHED,
  P04_PACKING_SCANNED: PackingStatus.PACKING_SCANNED,
  P04_ON_CONVEYOR: PackingStatus.ON_CONVEYOR,
  P04_MOVED_TO_SORTING: PackingStatus.MOVED_TO_SORTING,
  // Sorting (P05) - 9 statuses
  P05_SORTING_RECEIVED: SortingStatus.SORTING_RECEIVED,
  P05_QUALITY_CHECKED: SortingStatus.QUALITY_CHECKED,
  P05_QUALITY_OK: SortingStatus.QUALITY_OK,
  P05_QUALITY_NOT_OK: SortingStatus.QUALITY_NOT_OK,
  P05_BARCODE_SCANNED: SortingStatus.BARCODE_SCANNED,
  P05_SORTED_BY_SIZE: SortingStatus.SORTED_BY_SIZE,
  P05_SORTED_BY_ZONE: SortingStatus.SORTED_BY_ZONE,
  P05_LOCATION_ASSIGNED: SortingStatus.LOCATION_ASSIGNED,
  P05_COMPLETED: SortingStatus.COMPLETED,
  // Shipping (P06) - 8 statuses
  P06_SHIPMENT_CREATED: ShippingStatus.SHIPMENT_CREATED,
  P06_CARRIER_SELECTED: ShippingStatus.CARRIER_SELECTED,
  P06_TRACKING_CREATED: ShippingStatus.TRACKING_CREATED,
  P06_PICKED_UP: ShippingStatus.PICKED_UP,
  P06_IN_TRANSIT: ShippingStatus.IN_TRANSIT,
  P06_DELIVERED: ShippingStatus.DELIVERED,
  P06_DELIVERY_FAILED: ShippingStatus.DELIVERY_FAILED,
  P06_RETURNED: ShippingStatus.RETURNED,
  // Inventory Check (P07) - 11 statuses
  P07_CHECK_SCHEDULE_CREATED: InventoryCheckStatus.CHECK_SCHEDULE_CREATED,
  P07_CHECK_FORM_CREATED: InventoryCheckStatus.CHECK_FORM_CREATED,
  P07_PHYSICAL_COUNT_STARTED: InventoryCheckStatus.PHYSICAL_COUNT_STARTED,
  P07_ITEM_COUNTED: InventoryCheckStatus.ITEM_COUNTED,
  P07_COMPARISON_STARTED: InventoryCheckStatus.COMPARISON_STARTED,
  P07_DISCREPANCY_DETECTED: InventoryCheckStatus.DISCREPANCY_DETECTED,
  P07_ROOT_CAUSE_ANALYZED: InventoryCheckStatus.ROOT_CAUSE_ANALYZED,
  P07_ADJUSTMENT_CREATED: InventoryCheckStatus.ADJUSTMENT_CREATED,
  P07_INVENTORY_ADJUSTED: InventoryCheckStatus.INVENTORY_ADJUSTED,
  P07_REPORT_GENERATED: InventoryCheckStatus.REPORT_GENERATED,
  P07_CHECK_COMPLETED: InventoryCheckStatus.CHECK_COMPLETED,
} as const;

export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus];

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

const STATUS_CATEGORY_MAP: Record<string, WorkflowStatusCategory> = {
  // P01: Purchase Order
  P01_PURCHASE_PLAN_CREATED: 'PURCHASE_ORDER',
  P01_PLAN_CONFIRMED_BY_ACCOUNTING: 'PURCHASE_ORDER',
  P01_PLAN_SENT_TO_DIRECTOR: 'PURCHASE_ORDER',
  P01_PLAN_APPROVED: 'PURCHASE_ORDER',
  P01_ORDER_SENT_TO_SUPPLIER: 'PURCHASE_ORDER',
  P01_SUPPLIER_CONFIRMED: 'PURCHASE_ORDER',
  P01_SUPPLIER_REJECTED: 'PURCHASE_ORDER',
  P01_ORDER_CANCELLED: 'PURCHASE_ORDER',
  P01_ORDER_COMPLETED: 'PURCHASE_ORDER',
  // P02: Inbound
  P02_INBOUND_CREATED: 'INBOUND',
  P02_ITEMS_RECEIVED: 'INBOUND',
  P02_QUALITY_CHECKING: 'INBOUND',
  P02_QC_PASSED: 'INBOUND',
  P02_QC_FAILED: 'INBOUND',
  P02_BARCODE_CREATED: 'INBOUND',
  P02_LOCATION_ASSIGNED: 'INBOUND',
  P02_STAFF_RECEIVED: 'INBOUND',
  P02_NEW_PRODUCT_CREATED: 'INBOUND',
  P02_INVENTORY_UPDATED: 'INBOUND',
  P02_INBOUND_COMPLETED: 'INBOUND',
  P02_INBOUND_CANCELLED: 'INBOUND',
  // P03: Outbound
  P03_ORDER_RECEIVED: 'OUTBOUND',
  P03_INVENTORY_CHECKED: 'OUTBOUND',
  P03_INVENTORY_SUFFICIENT: 'OUTBOUND',
  P03_INVENTORY_INSUFFICIENT: 'OUTBOUND',
  P03_PICKING_ASSIGNED: 'OUTBOUND',
  P03_PICKER_ASSIGNED: 'OUTBOUND',
  P03_ITEM_SCANNED: 'OUTBOUND',
  P03_PICKED_CORRECT: 'OUTBOUND',
  P03_PICKED_WRONG: 'OUTBOUND',
  P03_PUT_IN_CART: 'OUTBOUND',
  P03_SLIP_PRINTED: 'OUTBOUND',
  P03_MOVED_TO_PACKING: 'OUTBOUND',
  // P04: Packing
  P04_PACKING_RECEIVED: 'PACKING',
  P04_PACKING_STARTED: 'PACKING',
  P04_ITEM_PACKED: 'PACKING',
  P04_DECAL_ATTACHED: 'PACKING',
  P04_PACKING_SCANNED: 'PACKING',
  P04_ON_CONVEYOR: 'PACKING',
  P04_MOVED_TO_SORTING: 'PACKING',
  // P05: Sorting
  P05_SORTING_RECEIVED: 'SORTING',
  P05_QUALITY_CHECKED: 'SORTING',
  P05_QUALITY_OK: 'SORTING',
  P05_QUALITY_NOT_OK: 'SORTING',
  P05_BARCODE_SCANNED: 'SORTING',
  P05_SORTED_BY_SIZE: 'SORTING',
  P05_SORTED_BY_ZONE: 'SORTING',
  P05_LOCATION_ASSIGNED: 'SORTING',
  P05_COMPLETED: 'SORTING',
  // P06: Shipping
  P06_SHIPMENT_CREATED: 'SHIPPING',
  P06_CARRIER_SELECTED: 'SHIPPING',
  P06_TRACKING_CREATED: 'SHIPPING',
  P06_PICKED_UP: 'SHIPPING',
  P06_IN_TRANSIT: 'SHIPPING',
  P06_DELIVERED: 'SHIPPING',
  P06_DELIVERY_FAILED: 'SHIPPING',
  P06_RETURNED: 'SHIPPING',
  // P07: Inventory Check
  P07_CHECK_SCHEDULE_CREATED: 'INVENTORY_CHECK',
  P07_CHECK_FORM_CREATED: 'INVENTORY_CHECK',
  P07_PHYSICAL_COUNT_STARTED: 'INVENTORY_CHECK',
  P07_ITEM_COUNTED: 'INVENTORY_CHECK',
  P07_COMPARISON_STARTED: 'INVENTORY_CHECK',
  P07_DISCREPANCY_DETECTED: 'INVENTORY_CHECK',
  P07_ROOT_CAUSE_ANALYZED: 'INVENTORY_CHECK',
  P07_ADJUSTMENT_CREATED: 'INVENTORY_CHECK',
  P07_INVENTORY_ADJUSTED: 'INVENTORY_CHECK',
  P07_REPORT_GENERATED: 'INVENTORY_CHECK',
  P07_CHECK_COMPLETED: 'INVENTORY_CHECK',
};

// ============================================================================
// Status Descriptions (Vietnamese)
// ============================================================================
const STATUS_DESCRIPTIONS: Record<string, string> = {
  // P01: Purchase Order
  P01_PURCHASE_PLAN_CREATED: 'Quality tạo kế hoạch nhập hàng',
  P01_PLAN_CONFIRMED_BY_ACCOUNTING: 'Kế toán xác nhận',
  P01_PLAN_SENT_TO_DIRECTOR: 'Gửi cho Giám đốc kho',
  P01_PLAN_APPROVED: 'Giám đốc kho duyệt',
  P01_ORDER_SENT_TO_SUPPLIER: 'Gửi đơn cho NCC',
  P01_SUPPLIER_CONFIRMED: 'NCC xác nhận có hàng',
  P01_SUPPLIER_REJECTED: 'NCC không có hàng',
  P01_ORDER_CANCELLED: 'Kế toán hủy đơn',
  P01_ORDER_COMPLETED: 'Hoàn tất đặt hàng',
  // P02: Inbound
  P02_INBOUND_CREATED: 'Tạo phiếu nhập kho',
  P02_ITEMS_RECEIVED: 'Hàng đến, bắt đầu kiểm tra',
  P02_QUALITY_CHECKING: 'QC đang kiểm tra',
  P02_QC_PASSED: 'QC đạt',
  P02_QC_FAILED: 'QC không đạt (sai số lượng, hư hỏng)',
  P02_BARCODE_CREATED: 'Tạo barcode cho kiện hàng',
  P02_LOCATION_ASSIGNED: 'Gán vị trí lưu kho',
  P02_STAFF_RECEIVED: 'Staff xác nhận nhận hàng',
  P02_NEW_PRODUCT_CREATED: 'Tạo sản phẩm mới (chưa từng có)',
  P02_INVENTORY_UPDATED: 'Cập nhật tồn kho',
  P02_INBOUND_COMPLETED: 'Hoàn tất nhập kho',
  P02_INBOUND_CANCELLED: 'Hủy phiếu nhập kho',
  // P03: Outbound
  P03_ORDER_RECEIVED: 'Nhận đơn từ Shopee/sàn TMĐT',
  P03_INVENTORY_CHECKED: 'Kiểm tra tồn kho',
  P03_INVENTORY_SUFFICIENT: 'Đủ hàng',
  P03_INVENTORY_INSUFFICIENT: 'Không đủ hàng -> Chờ',
  P03_PICKING_ASSIGNED: 'Giao cho trưởng phòng điều phối',
  P03_PICKER_ASSIGNED: 'Giao nhân viên lấy hàng',
  P03_ITEM_SCANNED: 'Quét mã sản phẩm',
  P03_PICKED_CORRECT: 'Lấy đúng sản phẩm',
  P03_PICKED_WRONG: 'Lấy sai (quét lại)',
  P03_PUT_IN_CART: 'Cho vào giỏ hàng',
  P03_SLIP_PRINTED: 'In phiếu xuất kho (MB02)',
  P03_MOVED_TO_PACKING: 'Chuyển sang đóng gói',
  // P04: Packing
  P04_PACKING_RECEIVED: 'Nhận giỏ hàng',
  P04_PACKING_STARTED: 'Bắt đầu đóng gói',
  P04_ITEM_PACKED: 'Đóng gói từng sản phẩm',
  P04_DECAL_ATTACHED: 'Dán decal vào hộp',
  P04_PACKING_SCANNED: 'Quét xác nhận đóng gói',
  P04_ON_CONVEYOR: 'Đưa lên băng chuyền',
  P04_MOVED_TO_SORTING: 'Chuyển sang phân loại',
  // P05: Sorting
  P05_SORTING_RECEIVED: 'Hàng đến kho phân loại',
  P05_QUALITY_CHECKED: 'Kiểm tra chất lượng',
  P05_QUALITY_OK: 'Chất lượng OK',
  P05_QUALITY_NOT_OK: 'Không đạt -> Trả về đóng gói lại',
  P05_BARCODE_SCANNED: 'Quét mã xác nhận',
  P05_SORTED_BY_SIZE: 'Phân loại theo kích thước',
  P05_SORTED_BY_ZONE: 'Phân loại theo khu vực',
  P05_LOCATION_ASSIGNED: 'Gán vị trí vận chuyển',
  P05_COMPLETED: 'Hoàn tất phân loại',
  // P06: Shipping
  P06_SHIPMENT_CREATED: 'Tạo lô hàng vận chuyển',
  P06_CARRIER_SELECTED: 'Chọn hãng vận chuyển',
  P06_TRACKING_CREATED: 'Tạo mã vận đơn',
  P06_PICKED_UP: 'Hãng lấy hàng',
  P06_IN_TRANSIT: 'Đang vận chuyển',
  P06_DELIVERED: 'Đã giao hàng',
  P06_DELIVERY_FAILED: 'Giao thất bại',
  P06_RETURNED: 'Hoàn hàng',
  // P07: Inventory Check
  P07_CHECK_SCHEDULE_CREATED: 'Tạo lịch kiểm kê (ngày 1 hàng tháng)',
  P07_CHECK_FORM_CREATED: 'Tạo phiếu kiểm kê (MB05-VT)',
  P07_PHYSICAL_COUNT_STARTED: 'Bắt đầu đếm thực tế',
  P07_ITEM_COUNTED: 'Đếm từng mặt hàng',
  P07_COMPARISON_STARTED: 'Bắt đầu đối chiếu',
  P07_DISCREPANCY_DETECTED: 'Phát hiện chênh lệch',
  P07_ROOT_CAUSE_ANALYZED: 'Phân tích nguyên nhân',
  P07_ADJUSTMENT_CREATED: 'Tạo phiếu điều chỉnh',
  P07_INVENTORY_ADJUSTED: 'Cập nhật tồn kho',
  P07_REPORT_GENERATED: 'Tạo báo cáo kiểm kê',
  P07_CHECK_COMPLETED: 'Hoàn tất kiểm kê',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all valid workflow status values
 */
export function getAllWorkflowStatuses(): string[] {
  return Object.values(WorkflowStatus);
}

/**
 * Check if a string is a valid workflow status
 */
export function isValidWorkflowStatus(status: string): boolean {
  return status in STATUS_CATEGORY_MAP;
}

/**
 * Get the category for a workflow status
 */
export function getWorkflowStatusCategory(
  status: string
): WorkflowStatusCategory | null {
  return STATUS_CATEGORY_MAP[status] ?? null;
}

/**
 * Get the Vietnamese description for a workflow status
 */
export function getStatusDescription(status: string): string | null {
  return STATUS_DESCRIPTIONS[status] ?? null;
}

/**
 * Get all statuses for a specific workflow category
 */
export function getStatusesByCategory(
  category: WorkflowStatusCategory
): string[] {
  return Object.entries(STATUS_CATEGORY_MAP)
    .filter(([, cat]) => cat === category)
    .map(([status]) => status);
}

/**
 * Get terminal statuses (completed, cancelled, failed, etc.)
 */
export function getTerminalStatuses(): string[] {
  return [
    // Purchase Order terminals
    PurchaseOrderStatus.ORDER_COMPLETED,
    PurchaseOrderStatus.ORDER_CANCELLED,
    PurchaseOrderStatus.SUPPLIER_REJECTED,
    // Inbound terminals
    InboundStatus.INBOUND_COMPLETED,
    InboundStatus.INBOUND_CANCELLED,
    // Outbound terminals
    OutboundStatus.MOVED_TO_PACKING,
    // Packing terminals
    PackingStatus.MOVED_TO_SORTING,
    // Sorting terminals
    SortingStatus.COMPLETED,
    // Shipping terminals
    ShippingStatus.DELIVERED,
    ShippingStatus.DELIVERY_FAILED,
    ShippingStatus.RETURNED,
    // Inventory Check terminals
    InventoryCheckStatus.CHECK_COMPLETED,
  ];
}

/**
 * Check if a status is a terminal status
 */
export function isTerminalStatus(status: string): boolean {
  return getTerminalStatuses().includes(status);
}