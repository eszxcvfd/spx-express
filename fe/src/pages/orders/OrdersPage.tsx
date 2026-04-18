import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { p01Api, type CreateOrderRequest } from '../../services/api';
import { PurchaseOrder } from '../../types';
import { PurchaseOrderStatus } from '../../types/canonical';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import CreateOrderModal from '../../components/CreateOrderModal';
import { getPrimaryActionLabel } from '../../utils/purchase-order-workflow';

const PAGE_SIZE = 10;

const statusOptions: Array<{ value: 'ALL' | PurchaseOrderStatus; label: string }> = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp - Chờ gửi' },
  { value: 'PENDING_ACCOUNTING', label: 'Chờ kế toán duyệt' },
  { value: 'PENDING_APPROVAL', label: 'Chờ GĐ kho duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt - Chờ gửi NCC' },
  { value: 'SENT_TO_SUPPLIER', label: 'Đã gửi NCC' },
  { value: 'SUPPLIER_CONFIRMED', label: 'NCC xác nhận' },
  { value: 'SUPPLIER_REJECTED', label: 'NCC từ chối' },
  { value: 'CANCELLED', label: 'Đã hủy' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
];

const roleDefaultFilter: Record<string, PurchaseOrderStatus> = {
  ACCOUNTING: 'PENDING_ACCOUNTING',
  WAREHOUSE_DIRECTOR: 'PENDING_APPROVAL',
  ADMIN: 'APPROVED',
};

function formatDate(dateString?: string) {
  if (!dateString) {
    return '-';
  }
  return new Date(dateString).toLocaleDateString('vi-VN');
}

function calculateTotal(order: PurchaseOrder) {
  return order.items.reduce((sum, item) => sum + item.totalPrice, 0);
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const roleInitialFilter = user?.role && roleDefaultFilter[user.role] ? roleDefaultFilter[user.role] : 'ALL';
  const [statusFilter, setStatusFilter] = useState<'ALL' | PurchaseOrderStatus>(roleInitialFilter);
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState('');

  const canCreate = user?.role === 'ADMIN' || user?.role === 'QUALITY';

  const pendingActionCount = useMemo(() => {
    if (!user?.role) return 0;
    return orders.filter((order) => getPrimaryActionLabel(order.status, user.role) !== null).length;
  }, [orders, user?.role]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await p01Api.getOrders();
      const list = ((response as { orders?: PurchaseOrder[] })?.orders ??
        (Array.isArray(response) ? (response as PurchaseOrder[]) : [])) as PurchaseOrder[];
      setOrders(list);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Không thể tải danh sách đơn đặt hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchStatus = statusFilter === 'ALL' ? true : order.status === statusFilter;
      const keyword = search.trim().toLowerCase();
      const matchSearch = keyword
        ? order.orderNumber.toLowerCase().includes(keyword) || order.supplier.name.toLowerCase().includes(keyword)
        : true;
      return matchStatus && matchSearch;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCreateOrder = async (payload: {
    supplierId: string;
    expectedDate?: string;
    notes?: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  }) => {
    try {
      setActionError('');
      setIsCreating(true);
      await p01Api.createOrder(payload as CreateOrderRequest);
      setIsCreateModalOpen(false);
      await fetchOrders();
    } catch (err) {
      console.error('Error creating order:', err);
      setActionError('Tạo đơn hàng thất bại. Vui lòng kiểm tra dữ liệu và thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Danh sách đơn đặt hàng P01</h3>

          {canCreate && (
            <button
              onClick={() => {
                setActionError('');
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo đơn hàng
            </button>
          )}
        </div>

        {actionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{actionError}</div>
        )}

        {pendingActionCount > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-sm">
            <Bell className="w-4 h-4 shrink-0" />
            <span>Bạn có <strong>{pendingActionCount}</strong> đơn hàng cần xử lý.</span>
            {statusFilter === 'ALL' && roleInitialFilter !== 'ALL' && (
              <button
                onClick={() => setStatusFilter(roleInitialFilter)}
                className="ml-auto text-amber-700 underline hover:text-amber-900 font-medium"
              >
                Xem đơn chờ xử lý
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã đơn hoặc nhà cung cấp"
              className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | PurchaseOrderStatus)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200">
            <p className="font-medium text-gray-700">Không có đơn hàng phù hợp</p>
            <p className="text-sm text-gray-500 mt-1">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="px-4 py-3 text-left font-medium">Mã đơn</th>
                    <th className="px-4 py-3 text-left font-medium">Nhà cung cấp</th>
                    <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-left font-medium">Ngày dự kiến</th>
                    <th className="px-4 py-3 text-left font-medium">Tổng tiền</th>
                    <th className="px-4 py-3 text-left font-medium">Ngày tạo</th>
                    <th className="px-4 py-3 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-700">{order.supplier?.name ?? '-'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(order.expectedDate)}</td>
                      <td className="px-4 py-3 text-gray-700">{calculateTotal(order).toLocaleString('vi-VN')} đ</td>
                      <td className="px-4 py-3 text-gray-700">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-2">
                          {getPrimaryActionLabel(order.status, user?.role) && (
                            <button
                              onClick={() => navigate(`/orders/${order.id}`)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                            >
                              {getPrimaryActionLabel(order.status, user?.role)}
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="px-3 py-1.5 rounded-lg border border-gray-900 bg-white text-gray-900 hover:bg-gray-50 transition-colors"
                          >
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Hiển thị {paginatedOrders.length} / {filteredOrders.length} đơn hàng
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </button>

                <span className="text-sm text-gray-600">
                  Trang {currentPage}/{totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {canCreate && (
        <CreateOrderModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateOrder}
          isSubmitting={isCreating}
        />
      )}
    </div>
  );
}
