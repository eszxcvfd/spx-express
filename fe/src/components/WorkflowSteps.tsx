import { PurchaseOrderStatus } from '../types';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';

interface WorkflowStepsProps {
  status: PurchaseOrderStatus;
}

const linearSteps = [
  { key: 'DRAFT', label: 'Tạo kế hoạch' },
  { key: 'PENDING_ACCOUNTING', label: 'Kế toán duyệt' },
  { key: 'PENDING_APPROVAL', label: 'GĐ kho duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'SENT_TO_SUPPLIER', label: 'Gửi NCC' },
  { key: 'SUPPLIER_CONFIRMED', label: 'NCC xác nhận' },
  { key: 'COMPLETED', label: 'Hoàn tất' },
] as const;

const statusIndexMap: Record<PurchaseOrderStatus, number> = {
  DRAFT: 0,
  PENDING_ACCOUNTING: 1,
  PENDING_APPROVAL: 2,
  APPROVED: 3,
  SENT_TO_SUPPLIER: 4,
  SUPPLIER_CONFIRMED: 5,
  COMPLETED: 6,
  SUPPLIER_REJECTED: 4,
  CANCELLED: 2,
};

export default function WorkflowSteps({ status }: WorkflowStepsProps) {
  const currentIndex = statusIndexMap[status];
  const isRejected = status === 'SUPPLIER_REJECTED';
  const isCancelled = status === 'CANCELLED';

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiến trình xử lý P01</h3>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {linearSteps.map((step, index) => {
          const isDone = index < currentIndex && !isRejected && !isCancelled;
          const isCurrent = index === currentIndex && !isRejected && !isCancelled;
          const isFuture = index > currentIndex || isRejected || isCancelled;

          return (
            <div key={step.key} className="flex flex-col items-center text-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isDone
                    ? 'bg-green-100 border-green-500 text-green-600'
                    : isCurrent
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-600'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </div>
              <p className={`text-xs font-medium ${isFuture ? 'text-gray-500' : 'text-gray-800'}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {(isRejected || isCancelled) && (
        <div className="mt-5 p-4 rounded-xl border border-red-200 bg-red-50 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">
              {isRejected ? 'NCC đã từ chối đơn hàng' : 'Đơn hàng đã bị hủy'}
            </p>
            <p className="text-sm text-red-600">
              {isRejected
                ? 'Đơn dừng tại bước gửi NCC. Vui lòng kiểm tra lại thông tin để xử lý tiếp.'
                : 'Quy trình kết thúc do đơn hàng bị hủy trong bước duyệt nội bộ.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
