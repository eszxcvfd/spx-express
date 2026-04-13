import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }).then(res => res.data),
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post('/auth/register', data).then(res => res.data),
  me: () => api.get('/auth/me').then(res => res.data),
  getUsers: () => api.get('/auth/users').then(res => res.data),
};

// Products
export const productApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/products', { params }).then(res => res.data),
  create: (data: Record<string, unknown>) => api.post('/products', data).then(res => res.data),
};

// Suppliers
export const supplierApi = {
  getAll: () => api.get('/suppliers').then(res => res.data),
  create: (data: Record<string, unknown>) => api.post('/suppliers', data).then(res => res.data),
};

// Inventory
export const inventoryApi = {
  getAll: () => api.get('/inventory').then(res => res.data),
};

// Locations
export const locationApi = {
  getAll: () => api.get('/locations').then(res => res.data),
  create: (data: Record<string, unknown>) => api.post('/locations', data).then(res => res.data),
};

// P01: Purchase Orders
export const p01Api = {
  getOrders: (params?: Record<string, unknown>) => api.get('/orders/orders', { params }).then(res => res.data),
  getOrder: (id: string) => api.get(`/orders/orders/${id}`).then(res => res.data),
  createOrder: (data: Record<string, unknown>) => api.post('/orders/orders', data).then(res => res.data),
  sendToAccounting: (id: string) => api.post(`/orders/orders/${id}/send-to-accounting`).then(res => res.data),
  confirmAccounting: (id: string, notes?: string) => api.post(`/orders/orders/${id}/confirm-accounting`, { notes }).then(res => res.data),
  sendToDirector: (id: string) => api.post(`/orders/orders/${id}/send-to-director`).then(res => res.data),
  approve: (id: string, notes?: string) => api.post(`/orders/orders/${id}/approve`, { notes }).then(res => res.data),
  reject: (id: string, notes: string) => api.post(`/orders/orders/${id}/reject`, { notes }).then(res => res.data),
  sendToSupplier: (id: string) => api.post(`/orders/orders/${id}/send-to-supplier`).then(res => res.data),
  supplierResponse: (id: string, confirmed: boolean) => api.post(`/orders/orders/${id}/supplier-response`, { confirmed }).then(res => res.data),
  complete: (id: string) => api.post(`/orders/orders/${id}/complete`).then(res => res.data),
  cancel: (id: string) => api.delete(`/orders/orders/${id}`).then(res => res.data),
};

// P02: Inbound
export const p02Api = {
  getInbounds: (params?: Record<string, unknown>) => api.get('/inbounds/inbounds', { params }).then(res => res.data),
  getInbound: (id: string) => api.get(`/inbounds/${id}`).then(res => res.data),
  createInbound: (data: Record<string, unknown>) => api.post('/inbounds/inbounds', data).then(res => res.data),
  receive: (id: string) => api.post(`/inbounds/${id}/receive`).then(res => res.data),
  startQualityCheck: (id: string) => api.post(`/inbounds/${id}/quality-check`).then(res => res.data),
  qc: (id: string, passed: boolean, itemUpdates?: Record<string, unknown>[]) =>  
    api.post(`/inbounds/${id}/qc`, { passed, itemUpdates }).then(res => res.data),
  createBarcodes: (id: string) => api.post(`/inbounds/${id}/create-barcodes`).then(res => res.data),
  assignLocation: (id: string, locationId: string, itemId: string) => 
    api.post(`/inbounds/${id}/assign-location`, { locationId, itemId }).then(res => res.data),
  autoAssignLocation: (id: string) => 
    api.post(`/inbounds/${id}/auto-assign-location`).then(res => res.data),
  complete: (id: string) => api.post(`/inbounds/${id}/complete`).then(res => res.data),
  confirmReceipt: (id: string) => api.post(`/inbounds/${id}/confirm-receipt`).then(res => res.data),
  cancel: (id: string, reason?: string) => api.post(`/inbounds/${id}/cancel`, { reason }).then(res => res.data),
};

// P03: Outbound
export const p03Api = {
  getOutbounds: (params?: Record<string, unknown>) => api.get('/outbounds/outbounds', { params }).then(res => res.data),
  getOutbound: (id: string) => api.get(`/outbounds/${id}`).then(res => res.data),
  createOutbound: (data: Record<string, unknown>) => api.post('/outbounds/outbounds', data).then(res => res.data),
  checkInventory: (id: string) => api.post(`/outbounds/${id}/check-inventory`).then(res => res.data),
  confirmSufficient: (id: string) => api.post(`/outbounds/${id}/confirm-sufficient`).then(res => res.data),
  markInsufficient: (id: string) => api.post(`/outbounds/${id}/mark-insufficient`).then(res => res.data),
  assignPicking: (id: string) => api.post(`/outbounds/${id}/assign-picking`).then(res => res.data),
  assignPicker: (id: string, pickerId: string) => api.post(`/outbounds/${id}/assign-picker`, { pickerId }).then(res => res.data),
  scanItem: (id: string, productId: string, barcode: string) => api.post(`/outbounds/${id}/scan-item`, { productId, barcode }).then(res => res.data),
  pickCorrect: (id: string, itemId: string, pickedQty: number) => api.post(`/outbounds/${id}/pick-correct`, { itemId, pickedQty }).then(res => res.data),
  pickWrong: (id: string, itemId: string) => api.post(`/outbounds/${id}/pick-wrong`, { itemId }).then(res => res.data),
  rescan: (id: string) => api.post(`/outbounds/${id}/rescan`).then(res => res.data),
  putInCart: (id: string) => api.post(`/outbounds/${id}/put-in-cart`).then(res => res.data),
  printSlip: (id: string) => api.post(`/outbounds/${id}/print-slip`).then(res => res.data),
  moveToPacking: (id: string) => api.post(`/outbounds/${id}/move-to-packing`).then(res => res.data),
  recheckInventory: (id: string) => api.post(`/outbounds/${id}/check-inventory`).then(res => res.data),
};

// P04: Packing
export const p04Api = {
  getPackings: (params?: Record<string, unknown>) => api.get('/packings/packings', { params }).then(res => res.data),
  getPacking: (id: string) => api.get(`/packings/${id}`).then(res => res.data),
  start: (id: string) => api.post(`/packings/${id}/start`).then(res => res.data),
  itemPacked: (id: string, itemId: string) => api.post(`/packings/${id}/item-packed`, { itemId }).then(res => res.data),
  seal: (id: string, weight?: number, dimension?: string) => 
    api.post(`/packings/${id}/seal`, { weight, dimension }).then(res => res.data),
  onConveyor: (id: string) => api.post(`/packings/${id}/on-conveyor`).then(res => res.data),
  moveToSorting: (id: string) => api.post(`/packings/${id}/move-to-sorting`).then(res => res.data),
};

// P05: Sorting
export const p05Api = {
  getSortings: (params?: Record<string, unknown>) => api.get('/sortings/sortings', { params }).then(res => res.data),
  getSorting: (id: string) => api.get(`/sortings/${id}`).then(res => res.data),
  start: (id: string) => api.post(`/sortings/${id}/start`).then(res => res.data),
  qcCheck: (id: string, passed: boolean, notes?: string) => 
    api.post(`/sortings/${id}/qc-check`, { passed, notes }).then(res => res.data),
  classify: (id: string, sizeCategory?: string, zone?: string, notes?: string) => 
    api.post(`/sortings/${id}/classify`, { sizeCategory, zone, notes }).then(res => res.data),
  complete: (id: string) => api.post(`/sortings/${id}/complete`).then(res => res.data),
};

// P06: Shipping
export const p06Api = {
  getShipments: (params?: Record<string, unknown>) => api.get('/shipments/shipments', { params }).then(res => res.data),
  getShipment: (id: string) => api.get(`/shipments/${id}`).then(res => res.data),
  createShipment: (data: Record<string, unknown>) => api.post('/shipments/shipments', data).then(res => res.data),
  selectCarrier: (id: string, carrier: string) => api.post(`/shipments/${id}/select-carrier`, { carrier }).then(res => res.data),
  createTracking: (id: string, trackingNumber?: string) => 
    api.post(`/shipments/${id}/create-tracking`, { trackingNumber }).then(res => res.data),
  pickup: (id: string) => api.post(`/shipments/${id}/pickup`).then(res => res.data),
  inTransit: (id: string) => api.post(`/shipments/${id}/in-transit`).then(res => res.data),
  outForDelivery: (id: string) => api.post(`/shipments/${id}/out-for-delivery`).then(res => res.data),
  deliver: (id: string, notes?: string) => api.post(`/shipments/${id}/deliver`, { notes }).then(res => res.data),
  fail: (id: string, reason: string) => api.post(`/shipments/${id}/failed`, { reason }).then(res => res.data),
};

// P07: Inventory Check
export const inventoryCheckApi = {
  getChecks: (params?: Record<string, unknown>) => api.get('/inventory-checks/checks', { params }).then(res => res.data),
  getCheck: (id: string) => api.get(`/inventory-checks/${id}`).then(res => res.data),
  createCheck: (data: Record<string, unknown>) => api.post('/inventory-checks/checks', data).then(res => res.data),
  start: (id: string) => api.post(`/inventory-checks/${id}/start`).then(res => res.data),
  count: (id: string, itemId: string, actualQty: number, notes?: string) => 
    api.post(`/inventory-checks/${id}/count`, { itemId, actualQty, notes }).then(res => res.data),
  comparison: (id: string) => api.post(`/inventory-checks/${id}/comparison`).then(res => res.data),
  adjust: (id: string) => api.post(`/inventory-checks/${id}/adjust`).then(res => res.data),
  complete: (id: string, notes?: string) => api.post(`/inventory-checks/${id}/complete`, { notes }).then(res => res.data),
};

// Events
export const eventApi = {
  getAll: (params?: { process?: string; limit?: number }) => 
    api.get('/events', { params }).then(res => res.data),
};

export default api;
