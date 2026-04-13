import { PurchaseOrderStatus } from '../types';

interface StatusBadgeProps {
  status: PurchaseOrderStatus;
}

const DEFAULT_CONFIG = { label: 'Không xác định', className: 'bg-gray-100 text-gray-500' };

const statusMap: Record<PurchaseOrderStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Nháp - Chờ gửi',
    className: 'bg-gray-100 text-gray-700',
  },
  PENDING_ACCOUNTING: {
    label: 'Chờ kế toán duyệt',
    className: 'bg-blue-100 text-blue-700',
  },
  PENDING_APPROVAL: {
    label: 'Chờ GĐ kho duyệt',
    className: 'bg-orange-100 text-orange-700',
  },
  APPROVED: {
    label: 'Đã duyệt',
    className: 'bg-green-100 text-green-800',
  },
  SENT_TO_SUPPLIER: {
    label: 'Đã gửi NCC',
    className: 'bg-purple-100 text-purple-700',
  },
  SUPPLIER_CONFIRMED: {
    label: 'NCC xác nhận',
    className: 'bg-green-100 text-green-700',
  },
  SUPPLIER_REJECTED: {
    label: 'NCC từ chối',
    className: 'bg-red-100 text-red-700',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-red-200 text-red-900',
  },
  COMPLETED: {
    label: 'Hoàn tất',
    className: 'bg-emerald-200 text-emerald-900',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusMap[status] ?? DEFAULT_CONFIG;

  return (
    <span
      role="status"
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
