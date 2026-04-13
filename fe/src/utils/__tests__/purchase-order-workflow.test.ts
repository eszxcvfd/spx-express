import { describe, expect, it } from 'vitest';
import {
  getPrimaryActionLabel,
  canSendToSupplier,
  canSupplierResponse,
  canCancelFromApproved,
} from '../purchase-order-workflow';

describe('getPrimaryActionLabel', () => {
  it('returns "Gửi NCC" for APPROVED status with ADMIN role', () => {
    expect(getPrimaryActionLabel('APPROVED', 'ADMIN')).toBe('Gửi NCC');
  });

  it('returns "Gửi NCC" for APPROVED status with WAREHOUSE_DIRECTOR role', () => {
    expect(getPrimaryActionLabel('APPROVED', 'WAREHOUSE_DIRECTOR')).toBe('Gửi NCC');
  });

  it('returns "Gửi NCC" for APPROVED status with ACCOUNTING role', () => {
    expect(getPrimaryActionLabel('APPROVED', 'ACCOUNTING')).toBe('Gửi NCC');
  });

  it('returns null for APPROVED status with unauthorized roles', () => {
    expect(getPrimaryActionLabel('APPROVED', 'QUALITY')).toBeNull();
    expect(getPrimaryActionLabel('APPROVED', 'STAFF')).toBeNull();
    expect(getPrimaryActionLabel('APPROVED', 'DRIVER')).toBeNull();
  });

  it('returns "Xác nhận NCC" for SENT_TO_SUPPLIER with ADMIN', () => {
    expect(getPrimaryActionLabel('SENT_TO_SUPPLIER', 'ADMIN')).toBe('Xác nhận NCC');
  });

  it('returns "Xác nhận NCC" for SENT_TO_SUPPLIER with WAREHOUSE_DIRECTOR', () => {
    expect(getPrimaryActionLabel('SENT_TO_SUPPLIER', 'WAREHOUSE_DIRECTOR')).toBe('Xác nhận NCC');
  });

  it('returns "Xác nhận NCC" for SENT_TO_SUPPLIER with ACCOUNTING', () => {
    expect(getPrimaryActionLabel('SENT_TO_SUPPLIER', 'ACCOUNTING')).toBe('Xác nhận NCC');
  });

  it('returns null for SENT_TO_SUPPLIER with unauthorized roles', () => {
    expect(getPrimaryActionLabel('SENT_TO_SUPPLIER', 'QUALITY')).toBeNull();
    expect(getPrimaryActionLabel('SENT_TO_SUPPLIER', 'STAFF')).toBeNull();
  });

  it('returns "Gửi kế toán" for DRAFT with QUALITY or ADMIN', () => {
    expect(getPrimaryActionLabel('DRAFT', 'QUALITY')).toBe('Gửi kế toán');
    expect(getPrimaryActionLabel('DRAFT', 'ADMIN')).toBe('Gửi kế toán');
    expect(getPrimaryActionLabel('DRAFT', 'ACCOUNTING')).toBeNull();
  });

  it('returns "Xác nhận" for PENDING_ACCOUNTING with ACCOUNTING or ADMIN', () => {
    expect(getPrimaryActionLabel('PENDING_ACCOUNTING', 'ACCOUNTING')).toBe('Xác nhận');
    expect(getPrimaryActionLabel('PENDING_ACCOUNTING', 'ADMIN')).toBe('Xác nhận');
    expect(getPrimaryActionLabel('PENDING_ACCOUNTING', 'QUALITY')).toBeNull();
  });

  it('returns "Duyệt" for PENDING_APPROVAL with WAREHOUSE_DIRECTOR or ADMIN', () => {
    expect(getPrimaryActionLabel('PENDING_APPROVAL', 'WAREHOUSE_DIRECTOR')).toBe('Duyệt');
    expect(getPrimaryActionLabel('PENDING_APPROVAL', 'ADMIN')).toBe('Duyệt');
    expect(getPrimaryActionLabel('PENDING_APPROVAL', 'ACCOUNTING')).toBeNull();
  });

  it('returns "Hoàn tất đơn" for SUPPLIER_CONFIRMED with ADMIN or ACCOUNTING', () => {
    expect(getPrimaryActionLabel('SUPPLIER_CONFIRMED', 'ADMIN')).toBe('Hoàn tất đơn');
    expect(getPrimaryActionLabel('SUPPLIER_CONFIRMED', 'ACCOUNTING')).toBe('Hoàn tất đơn');
  });

  it('returns "Hủy đơn" for SUPPLIER_REJECTED with ACCOUNTING or ADMIN', () => {
    expect(getPrimaryActionLabel('SUPPLIER_REJECTED', 'ACCOUNTING')).toBe('Hủy đơn');
    expect(getPrimaryActionLabel('SUPPLIER_REJECTED', 'ADMIN')).toBe('Hủy đơn');
  });

  it('returns null for terminal or irrelevant statuses', () => {
    expect(getPrimaryActionLabel('COMPLETED', 'ADMIN')).toBeNull();
    expect(getPrimaryActionLabel('CANCELLED', 'ADMIN')).toBeNull();
  });
});

describe('canSendToSupplier', () => {
  it('allows ADMIN at APPROVED status', () => {
    expect(canSendToSupplier('APPROVED', 'ADMIN')).toBe(true);
  });

  it('allows WAREHOUSE_DIRECTOR at APPROVED status', () => {
    expect(canSendToSupplier('APPROVED', 'WAREHOUSE_DIRECTOR')).toBe(true);
  });

  it('allows ACCOUNTING at APPROVED status', () => {
    expect(canSendToSupplier('APPROVED', 'ACCOUNTING')).toBe(true);
  });

  it('denies OTHER roles at APPROVED status', () => {
    expect(canSendToSupplier('APPROVED', 'QUALITY')).toBe(false);
    expect(canSendToSupplier('APPROVED', 'STAFF')).toBe(false);
    expect(canSendToSupplier('APPROVED', 'DRIVER')).toBe(false);
  });

  it('denies all roles at non-APPROVED status', () => {
    expect(canSendToSupplier('DRAFT', 'ADMIN')).toBe(false);
    expect(canSendToSupplier('PENDING_APPROVAL', 'ADMIN')).toBe(false);
    expect(canSendToSupplier('SENT_TO_SUPPLIER', 'ADMIN')).toBe(false);
  });
});

describe('canSupplierResponse', () => {
  it('allows ADMIN at SENT_TO_SUPPLIER', () => {
    expect(canSupplierResponse('SENT_TO_SUPPLIER', 'ADMIN')).toBe(true);
  });

  it('allows WAREHOUSE_DIRECTOR at SENT_TO_SUPPLIER', () => {
    expect(canSupplierResponse('SENT_TO_SUPPLIER', 'WAREHOUSE_DIRECTOR')).toBe(true);
  });

  it('allows ACCOUNTING at SENT_TO_SUPPLIER', () => {
    expect(canSupplierResponse('SENT_TO_SUPPLIER', 'ACCOUNTING')).toBe(true);
  });

  it('denies other roles at SENT_TO_SUPPLIER', () => {
    expect(canSupplierResponse('SENT_TO_SUPPLIER', 'QUALITY')).toBe(false);
    expect(canSupplierResponse('SENT_TO_SUPPLIER', 'STAFF')).toBe(false);
  });

  it('denies all roles at non-SENT_TO_SUPPLIER status', () => {
    expect(canSupplierResponse('APPROVED', 'ADMIN')).toBe(false);
    expect(canSupplierResponse('SUPPLIER_CONFIRMED', 'ADMIN')).toBe(false);
  });
});

describe('canCancelFromApproved', () => {
  it('allows ACCOUNTING to cancel from APPROVED', () => {
    expect(canCancelFromApproved('APPROVED', 'ACCOUNTING')).toBe(true);
  });

  it('allows ADMIN to cancel from APPROVED', () => {
    expect(canCancelFromApproved('APPROVED', 'ADMIN')).toBe(true);
  });

  it('allows WAREHOUSE_DIRECTOR to cancel from APPROVED', () => {
    expect(canCancelFromApproved('APPROVED', 'WAREHOUSE_DIRECTOR')).toBe(true);
  });

  it('denies QUALITY and STAFF from canceling APPROVED', () => {
    expect(canCancelFromApproved('APPROVED', 'QUALITY')).toBe(false);
    expect(canCancelFromApproved('APPROVED', 'STAFF')).toBe(false);
  });

  it('denies for non-APPROVED status', () => {
    expect(canCancelFromApproved('DRAFT', 'ADMIN')).toBe(false);
  });
});