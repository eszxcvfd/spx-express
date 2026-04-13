import { InboundStatus } from '../types';

interface InboundStatusBadgeProps {
  status: InboundStatus;
}

const statusMap: Record<InboundStatus, { label: string; className: string }> = {
  P02_INBOUND_CREATED: {
    label: 'Tạo phiếu nhập kho',
    className: 'bg-gray-100 text-gray-700',
  },
  P02_ITEMS_RECEIVED: {
    label: 'Hàng đến, bắt đầu kiểm tra',
    className: 'bg-blue-100 text-blue-700',
  },
  P02_QUALITY_CHECKING: {
    label: 'QC đang kiểm tra',
    className: 'bg-yellow-100 text-yellow-700',
  },
  P02_QC_PASSED: {
    label: 'QC đạt',
    className: 'bg-green-100 text-green-700',
  },
  P02_QC_FAILED: {
    label: 'QC không đạt',
    className: 'bg-red-100 text-red-700',
  },
  P02_BARCODE_CREATED: {
    label: 'Tạo barcode',
    className: 'bg-purple-100 text-purple-700',
  },
  P02_LOCATION_ASSIGNED: {
    label: 'Gán vị trí lưu kho',
    className: 'bg-indigo-100 text-indigo-700',
  },
  P02_STAFF_RECEIVED: {
    label: 'Staff xác nhận nhận hàng',
    className: 'bg-cyan-100 text-cyan-700',
  },
  P02_NEW_PRODUCT_CREATED: {
    label: 'Tạo sản phẩm mới',
    className: 'bg-teal-100 text-teal-700',
  },
  P02_INVENTORY_UPDATED: {
    label: 'Cập nhật tồn kho',
    className: 'bg-emerald-100 text-emerald-700',
  },
  P02_INBOUND_COMPLETED: {
    label: 'Hoàn tất nhập kho',
    className: 'bg-emerald-200 text-emerald-900',
  },
  P02_INBOUND_CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-red-200 text-red-900',
  },
};

export default function InboundStatusBadge({ status }: InboundStatusBadgeProps) {
  const config = statusMap[status];

  if (!config) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}