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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="card p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <h3 className="text-2xl font-display font-bold text-navy">Danh sách đơn đặt hàng P01</h3>
            <p className="text-slate-400 text-sm mt-1">Quản lý và theo dõi các đơn đặt hàng từ nhà cung cấp.</p>
          </div>

          {canCreate && (
            <button
              onClick={() => {
                setActionError('');
                setIsCreateModalOpen(true);
              }}
              className="btn btn-accent px-6 py-2.5 shadow-lg shadow-cobalt/20 tactile"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo đơn hàng mới
            </button>
          )}
        </div>

        {actionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-ruby text-sm flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-ruby"></div>
             {actionError}
          </div>
        )}

        {pendingActionCount > 0 && (
          <div className="mb-8 p-5 bg-cobalt/5 border border-cobalt/10 rounded-2xl flex items-center gap-4 text-cobalt text-sm shadow-sm">
            <div className="w-10 h-10 bg-cobalt/10 rounded-xl flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-navy">Bạn có {pendingActionCount} đơn hàng cần xử lý.</p>
              <p className="text-slate-500">Vui lòng kiểm tra và phê duyệt các yêu cầu đang chờ.</p>
            </div>
            {statusFilter === 'ALL' && roleInitialFilter !== 'ALL' && (
              <button
                onClick={() => setStatusFilter(roleInitialFilter)}
                className="btn bg-white text-cobalt border border-cobalt/20 hover:bg-cobalt hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-wider tactile"
              >
                Xem ngay
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-cobalt transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã đơn hoặc nhà cung cấp..."
              className="input pl-12 py-3 bg-slate-50/50 border-transparent focus:bg-white focus:border-cobalt transition-all"
            />
          </div>

          <div className="w-full md:w-64">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | PurchaseOrderStatus)}
              className="input py-3 bg-slate-50/50 border-transparent focus:bg-white focus:border-cobalt transition-all"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-cobalt rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Đang tải danh sách...</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-3xl border border-red-100 bg-red-50 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-ruby" />
            <div>
              <p className="font-bold text-ruby">Lỗi hệ thống</p>
              <p className="text-sm text-red-900/60">{error}</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-xl font-display font-bold text-navy">Không tìm thấy đơn hàng</p>
            <p className="text-slate-400 mt-2">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm khác.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-8">
              <table className="table min-w-[1000px]">
                <thead>
                  <tr>
                    <th className="pl-8">Mã đơn</th>
                    <th>Nhà cung cấp</th>
                    <th>Trạng thái</th>
                    <th>Ngày dự kiến</th>
                    <th>Tổng tiền</th>
                    <th>Ngày tạo</th>
                    <th className="pr-8 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <td className="pl-8 font-mono font-bold text-cobalt tracking-tighter text-sm group-hover:underline">
                        {order.orderNumber}
                      </td>
                      <td className="font-medium text-navy">{order.supplier?.name ?? '-'}</td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="text-slate-500 font-medium">{formatDate(order.expectedDate)}</td>
                      <td className="font-display font-bold text-navy">
                        {calculateTotal(order).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="text-slate-400 text-xs">{formatDate(order.createdAt)}</td>
                      <td className="pr-8 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-2">
                          {getPrimaryActionLabel(order.status, user?.role) && (
                            <button
                              onClick={() => navigate(`/orders/${order.id}`)}
                              className="btn btn-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider tactile"
                            >
                              {getPrimaryActionLabel(order.status, user?.role)}
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="btn btn-secondary px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all tactile"
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

            <div className="flex flex-col md:flex-row items-center justify-between mt-8 pt-8 border-t border-slate-50 gap-4">
              <p className="text-sm font-medium text-slate-400">
                Hiển thị <span className="text-navy font-bold">{paginatedOrders.length}</span> / <span className="text-navy font-bold">{filteredOrders.length}</span> đơn hàng
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary px-4 py-2 disabled:opacity-20 tactile"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Trước
                </button>

                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === i + 1 
                          ? 'bg-navy text-white shadow-lg' 
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-secondary px-4 py-2 disabled:opacity-20 tactile"
                >
                  Sau
                  <ChevronRight className="w-4 h-4 ml-1" />
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
