import type { PurchaseOrderStatus } from '../types';

export function canSendToSupplier(status: PurchaseOrderStatus, role?: string): boolean {
  return !!role && status === 'APPROVED' && ['ADMIN', 'WAREHOUSE_DIRECTOR', 'ACCOUNTING'].includes(role);
}

export function canSupplierResponse(status: PurchaseOrderStatus, role?: string): boolean {
  return !!role && status === 'SENT_TO_SUPPLIER' && ['ADMIN', 'WAREHOUSE_DIRECTOR', 'ACCOUNTING'].includes(role);
}

export function canCancelFromApproved(status: PurchaseOrderStatus, role?: string): boolean {
  return !!role && status === 'APPROVED' && ['ACCOUNTING', 'WAREHOUSE_DIRECTOR', 'ADMIN'].includes(role);
}

export function getPrimaryActionLabel(status: PurchaseOrderStatus, role?: string): string | null {
  if (!role) {
    return null;
  }

  if (status === 'DRAFT' && (role === 'QUALITY' || role === 'ADMIN')) {
    return 'Gửi kế toán';
  }
  if (status === 'PENDING_ACCOUNTING' && (role === 'ACCOUNTING' || role === 'ADMIN')) {
    return 'Xác nhận';
  }
  if (status === 'PENDING_APPROVAL' && (role === 'WAREHOUSE_DIRECTOR' || role === 'ADMIN')) {
    return 'Duyệt';
  }
  if (canSendToSupplier(status, role)) {
    return 'Gửi NCC';
  }
  if (canSupplierResponse(status, role)) {
    return 'Xác nhận NCC';
  }
  if (status === 'SUPPLIER_CONFIRMED' && (role === 'ADMIN' || role === 'ACCOUNTING')) {
    return 'Hoàn tất đơn';
  }
  if (status === 'SUPPLIER_REJECTED' && (role === 'ACCOUNTING' || role === 'ADMIN')) {
    return 'Hủy đơn';
  }

  return null;
}