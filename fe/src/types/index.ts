// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'QUALITY' | 'ACCOUNTING' | 'WAREHOUSE_DIRECTOR' | 'STAFF' | 'DRIVER';
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Product types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  weight?: number;
  dimensions?: string;
  price: number;
  minStock: number;
  image?: string;
  inventory?: Inventory;
}

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  available: number;
  reserved: number;
  costPrice: number;
}

export interface WarehouseLocation {
  id: string;
  zone: string;
  row: number;
  shelf: number;
  position?: number;
  capacity: number;
}

// P01: Purchase Order types
export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier: Supplier;
  status: PurchaseOrderStatus;
  expectedDate?: string;
  notes?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
  approvals?: PurchaseOrderApproval[];
}

export type PurchaseOrderStatus = 
  | 'DRAFT' 
  | 'PENDING_ACCOUNTING' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED'
  | 'SENT_TO_SUPPLIER' 
  | 'SUPPLIER_CONFIRMED' 
  | 'SUPPLIER_REJECTED' 
  | 'CANCELLED' 
  | 'COMPLETED';

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQty: number;
}

export interface PurchaseOrderApproval {
  id: string;
  approverId: string;
  approver: { name: string };
  role: 'ACCOUNTING' | 'WAREHOUSE_DIRECTOR';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  approvedAt?: string;
}

// Supplier
export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

// P02: Inbound types
export interface Inbound {
  id: string;
  inboundNumber: string;
  purchaseOrderId?: string;
  purchaseOrder?: PurchaseOrder;
  staffId: string;
  staff: { id: string; name: string };
  status: InboundStatus;
  receivedDate?: string;
  qcPassedDate?: string;
  completedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: InboundItem[];
}

export type InboundStatus =
  | 'P02_INBOUND_CREATED'
  | 'P02_ITEMS_RECEIVED'
  | 'P02_QUALITY_CHECKING'
  | 'P02_QC_PASSED'
  | 'P02_QC_FAILED'
  | 'P02_BARCODE_CREATED'
  | 'P02_LOCATION_ASSIGNED'
  | 'P02_STAFF_RECEIVED'
  | 'P02_NEW_PRODUCT_CREATED'
  | 'P02_INVENTORY_UPDATED'
  | 'P02_INBOUND_COMPLETED'
  | 'P02_INBOUND_CANCELLED';

export interface InboundItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  receivedQty: number;
  damageQty: number;
  barcode?: string;
  locationId?: string;
  location?: WarehouseLocation;
  notes?: string;
}

// P03: Outbound types
export interface Outbound {
  id: string;
  outboundNumber: string;
  orderRef?: string;
  status: OutboundStatus;
  pickerId: string;
  picker: { id: string; name: string };
  pickedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OutboundItem[];
  packing?: Packing;
}

export type OutboundStatus =
  | 'P03_ORDER_RECEIVED'
  | 'P03_INVENTORY_CHECKED'
  | 'P03_INVENTORY_SUFFICIENT'
  | 'P03_INVENTORY_INSUFFICIENT'
  | 'P03_PICKING_ASSIGNED'
  | 'P03_PICKER_ASSIGNED'
  | 'P03_ITEM_SCANNED'
  | 'P03_PICKED_CORRECT'
  | 'P03_PICKED_WRONG'
  | 'P03_PUT_IN_CART'
  | 'P03_SLIP_PRINTED'
  | 'P03_MOVED_TO_PACKING';

export interface OutboundItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  pickedQty: number;
  locationId?: string;
  location?: WarehouseLocation;
}

// P04: Packing types
export interface Packing {
  id: string;
  packingNumber: string;
  outboundId: string;
  outbound: Outbound;
  packerId: string;
  packer: { id: string; name: string };
  status: PackingStatus;
  packedDate?: string;
  sealedDate?: string;
  weight?: number;
  dimension?: string;
}

export type PackingStatus = 
  | 'PENDING' 
  | 'PACKING' 
  | 'PACKED' 
  | 'SEALED' 
  | 'ON_CONVEYOR' 
  | 'CANCELLED';

// P05: Sorting types
export interface Sorting {
  id: string;
  sortingNumber: string;
  packingId: string;
  packing: Packing;
  sorterId: string;
  sorter: { id: string; name: string };
  status: SortingStatus;
  sortedDate?: string;
  completedDate?: string;
}

export type SortingStatus = 'PENDING' | 'SORTING' | 'SORTED' | 'COMPLETED';

// P06: Shipping types
export interface Shipment {
  id: string;
  shipmentNumber: string;
  sortingId: string;
  sorting: Sorting;
  shipperId: string;
  shipper: { id: string; name: string };
  carrier: string;
  trackingNumber?: string;
  status: ShipmentStatus;
  shippedDate?: string;
  deliveredDate?: string;
}

export type ShipmentStatus = 
  | 'CREATED' 
  | 'PICKED_UP' 
  | 'IN_TRANSIT' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'FAILED' 
  | 'RETURNED';

// P07: Inventory Check types
export interface InventoryCheck {
  id: string;
  checkNumber: string;
  checkerId: string;
  checker: { id: string; name: string };
  type: 'ROUTINE' | 'SPOT_CHECK' | 'ANNUAL';
  startDate?: string;
  endDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  items: InventoryCheckItem[];
}

export interface InventoryCheckItem {
  id: string;
  productId: string;
  product: Product;
  systemQty: number;
  actualQty: number;
  discrepancy: number;
}

// Event Log
export interface EventLog {
  id: string;
  eventType: string;
  process: string;
  entityType: string;
  entityId: string;
  userId?: string;
  payload?: Record<string, unknown>;
  status: string;
  createdAt: string;
}
