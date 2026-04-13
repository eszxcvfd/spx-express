import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Clock3, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { p01Api } from '../../services/api';
import { PurchaseOrder, PurchaseOrderStatus } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import WorkflowSteps from '../../components/WorkflowSteps';
import { canSendToSupplier, canSupplierResponse, canCancelFromApproved } from '../../utils/purchase-order-workflow';

function formatDateTime(value?: string) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('vi-VN');
}

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleDateString('vi-VN');
}

function orderTotal(order: PurchaseOrder) {
  return order.items.reduce((sum, item) => sum + item.totalPrice, 0);
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const role = user?.role;
  const status = order?.status;

  const fetchOrder = async () => {
    if (!id) {
      setError('Không tìm thấy mã đơn hàng.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await p01Api.getOrder(id);
      const currentOrder = ((response as { order?: PurchaseOrder })?.order ?? response) as PurchaseOrder;
      setOrder(currentOrder);
    } catch (err) {
      console.error('Error fetching order detail:', err);
      setError('Không thể tải chi tiết đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const canSendToAccounting = useMemo(
    () => !!order && order.status === 'DRAFT' && (role === 'QUALITY' || role === 'ADMIN'),
    [order, role]
  );

  const canConfirmAccounting = useMemo(
    () => !!order && order.status === 'PENDING_ACCOUNTING' && (role === 'ACCOUNTING' || role === 'ADMIN'),
    [order, role]
  );

  const canSendToDirector = useMemo(
    () => !!order && order.status === 'PENDING_APPROVAL' && (role === 'ACCOUNTING' || role === 'ADMIN'),
    [order, role]
  );

  const canApproveOrReject = useMemo(
    () => !!order && order.status === 'PENDING_APPROVAL' && (role === 'WAREHOUSE_DIRECTOR' || role === 'ADMIN'),
    [order, role]
  );

  const canSendToSupplierAction = useMemo(
    () => !!order && !!role && canSendToSupplier(order.status, role),
    [order, role]
  );

  const canSupplierRespond = useMemo(
    () => !!order && !!role && canSupplierResponse(order.status, role),
    [order, role]
  );

  const canComplete = useMemo(
    () => !!order && order.status === 'SUPPLIER_CONFIRMED' && (role === 'ADMIN' || role === 'ACCOUNTING'),
    [order, role]
  );

  const canCancel = useMemo(
    () =>
      !!order &&
      !!role &&
      (order.status === 'DRAFT' || order.status === 'PENDING_ACCOUNTING' || order.status === 'PENDING_APPROVAL' || order.status === 'SENT_TO_SUPPLIER' || canCancelFromApproved(order.status, role)) &&
      (role === 'QUALITY' || role === 'ACCOUNTING' || role === 'WAREHOUSE_DIRECTOR' || role === 'ADMIN'),
    [order, role]
  );

  const canRejectAtSentToSupplier = useMemo(
    () => !!order && order.status === 'SENT_TO_SUPPLIER' && (role === 'WAREHOUSE_DIRECTOR' || role === 'ADMIN' || role === 'ACCOUNTING'),
    [order, role]
  );

  const runAction = async (action: () => Promise<unknown>) => {
    if (!order) {
      return;
    }

    try {
      setActionError('');
      setIsSubmitting(true);
      await action();
      await fetchOrder();
    } catch (err) {
      console.error('Order workflow action error:', err);
      setActionError('Thao tác thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusActions: Array<{ key: string; label: string; onClick: () => void; variant?: 'danger' | 'success' | 'secondary' }> = [];

  if (order) {
    if (canSendToAccounting) {
      statusActions.push({
        key: 'send-accounting',
        label: 'Gửi kế toán',
        onClick: () => runAction(() => p01Api.sendToAccounting(order.id)),
      });
    }

    if (canConfirmAccounting) {
      statusActions.push({
        key: 'confirm-accounting',
        label: 'Xác nhận',
        onClick: () => runAction(() => p01Api.confirmAccounting(order.id)),
      });
    }

    if (canSendToDirector) {
      statusActions.push({
        key: 'send-director',
        label: 'Gửi GĐ kho',
        onClick: () => runAction(() => p01Api.sendToDirector(order.id)),
        variant: 'secondary',
      });
    }

    if (canApproveOrReject) {
      statusActions.push({
        key: 'approve',
        label: 'Duyệt',
        onClick: () => runAction(() => p01Api.approve(order.id)),
        variant: 'success',
      });
      statusActions.push({
        key: 'reject',
        label: 'Từ chối',
        onClick: () => {
          setRejectNotes('');
          setRejectModalOpen(true);
        },
        variant: 'danger',
      });
    }

    if (canSendToSupplierAction) {
      statusActions.push({
        key: 'send-supplier',
        label: 'Gửi NCC',
        onClick: () => runAction(() => p01Api.sendToSupplier(order.id)),
        variant: 'secondary',
      });
    }

    if (canSupplierRespond) {
      statusActions.push({
        key: 'supplier-confirm',
        label: 'Xác nhận NCC',
        onClick: () => runAction(() => p01Api.supplierResponse(order.id, true)),
        variant: 'success',
      });
      statusActions.push({
        key: 'supplier-reject',
        label: 'NCC từ chối',
        onClick: () => runAction(() => p01Api.supplierResponse(order.id, false)),
        variant: 'danger',
      });
    }

    if (canRejectAtSentToSupplier) {
      statusActions.push({
        key: 'reject-sent',
        label: 'Từ chối đơn',
        onClick: () => {
          setRejectNotes('');
          setRejectModalOpen(true);
        },
        variant: 'danger',
      });
    }

    if (canComplete) {
      statusActions.push({
        key: 'complete',
        label: 'Xác nhận hoàn tất đơn',
        onClick: () => runAction(() => p01Api.complete(order.id)),
        variant: 'success',
      });
    }

    if (canCancel || (order.status === 'SUPPLIER_REJECTED' && (role === 'ACCOUNTING' || role === 'ADMIN'))) {
      statusActions.push({
        key: 'cancel',
        label: 'Hủy đơn',
        onClick: () => setCancelModalOpen(true),
        variant: 'danger',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error || 'Không tìm thấy đơn hàng.'}</p>
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 px-4 py-2 rounded-lg border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-50 transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/orders')}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách đơn
            </button>
            <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>Tạo lúc: {formatDateTime(order.createdAt)}</span>
              <span>Cập nhật: {formatDateTime(order.updatedAt)}</span>
            </div>
          </div>

          <StatusBadge status={order.status} />
        </div>
      </div>

      <WorkflowSteps status={order.status} />

      {actionError && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{actionError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin đơn hàng</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nhà cung cấp</p>
                <p className="font-medium text-gray-800 mt-1">{order.supplier?.name ?? '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Ngày dự kiến</p>
                <p className="font-medium text-gray-800 mt-1">{formatDate(order.expectedDate)}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500">Ghi chú</p>
                <p className="font-medium text-gray-800 mt-1">{order.notes || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết sản phẩm</h4>

            {order.items.length === 0 ? (
              <div className="p-6 text-center bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-sm">
                Đơn hàng chưa có sản phẩm.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="text-left px-4 py-3 font-medium">Sản phẩm</th>
                      <th className="text-left px-4 py-3 font-medium">Số lượng</th>
                      <th className="text-left px-4 py-3 font-medium">Đơn giá</th>
                      <th className="text-left px-4 py-3 font-medium">Thành tiền</th>
                      <th className="text-left px-4 py-3 font-medium">Đã nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-gray-800">
                          <p className="font-medium">{item.product?.name ?? '-'}</p>
                          <p className="text-xs text-gray-500">{item.product?.sku ?? '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                        <td className="px-4 py-3 text-gray-700">{item.unitPrice.toLocaleString('vi-VN')} đ</td>
                        <td className="px-4 py-3 text-gray-700">{item.totalPrice.toLocaleString('vi-VN')} đ</td>
                        <td className="px-4 py-3 text-gray-700">{item.receivedQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <p className="text-sm text-gray-700">
                Tổng đơn hàng: <span className="font-semibold">{orderTotal(order).toLocaleString('vi-VN')} đ</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử duyệt</h4>

            {!order.approvals || order.approvals.length === 0 ? (
              <div className="p-6 text-center bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-sm">
                Chưa có lịch sử duyệt.
              </div>
            ) : (
              <div className="space-y-3">
                {order.approvals.map((approval) => (
                  <div key={approval.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <p className="font-medium text-gray-800">
                        {approval.approver?.name ?? '-'} - {approval.role}
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          approval.status === 'APPROVED'
                            ? 'text-green-700'
                            : approval.status === 'REJECTED'
                            ? 'text-red-700'
                            : 'text-gray-600'
                        }`}
                      >
                        {approval.status}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{formatDateTime(approval.approvedAt)}</p>
                    {approval.notes && <p className="text-sm text-gray-700 mt-2">Ghi chú: {approval.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Thao tác xử lý</h4>

            {statusActions.length === 0 ? (
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-600">
                Không có thao tác nào khả dụng với vai trò hiện tại.
              </div>
            ) : (
              <div className="space-y-3">
                {statusActions.map((action) => {
                  let className =
                    'w-full px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

                  if (action.variant === 'danger') {
                    className += ' border-2 border-red-600 bg-white text-red-600 hover:bg-red-50';
                  } else if (action.variant === 'success') {
                    className += ' border-2 border-green-600 bg-white text-green-600 hover:bg-green-50';
                  } else if (action.variant === 'secondary') {
                    className += ' border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-50';
                  } else {
                    className += ' border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-50';
                  }

                  return (
                    <button
                      key={action.key}
                      onClick={action.onClick}
                      className={className}
                      disabled={isSubmitting}
                    >
                      {action.label}
                    </button>
                  );
                })}
              </div>
            )}

            {isSubmitting && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <RefreshCcw className="w-4 h-4 animate-spin" />
                Đang xử lý thao tác...
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Thông tin trạng thái</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <Clock3 className="w-4 h-4" />
                Trạng thái hiện tại: <span className="font-medium text-gray-800">{status as PurchaseOrderStatus}</span>
              </p>
              <p>Ngày tạo: {formatDate(order.createdAt)}</p>
              <p>Cập nhật gần nhất: {formatDate(order.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-900">Từ chối đơn hàng</h4>
            <p className="text-sm text-gray-600 mt-2">Vui lòng nhập lý do từ chối để lưu vào lịch sử duyệt.</p>

            <textarea
              rows={4}
              className="mt-4 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition"
              placeholder="Nhập lý do từ chối"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              disabled={isSubmitting}
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setRejectModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!order || !rejectNotes.trim()) {
                    setActionError('Vui lòng nhập lý do từ chối.');
                    return;
                  }

                  await runAction(() => p01Api.reject(order.id, rejectNotes.trim()));
                  setRejectModalOpen(false);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-900">Xác nhận hủy đơn hàng</h4>
            <p className="text-sm text-gray-600 mt-2">
              Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
            </p>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Không
              </button>
              <button
                onClick={async () => {
                  if (!order) {
                    return;
                  }

                  await runAction(() => p01Api.cancel(order.id));
                  setCancelModalOpen(false);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
