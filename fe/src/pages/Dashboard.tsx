import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  ShoppingCart, Warehouse, Package, Truck,
  ClipboardList, AlertTriangle
} from 'lucide-react';
import { p01Api, p02Api, p03Api, p04Api, p05Api, p06Api, inventoryApi, inventoryCheckApi } from '../services/api';
import {
  PurchaseOrderStatus,
  InboundStatus,
  OutboundStatus,
  PackingStatus,
  SortingStatus,
  ShippingStatus,
  InventoryCheckStatus,
} from '../types/canonical';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}

function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  return (
    <div className="card p-6 flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300 tactile">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-display font-bold text-navy tracking-tight">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    pendingOrders: 0,
    pendingInbound: 0,
    pendingOutbound: 0,
    pendingPacking: 0,
    pendingSorting: 0,
    pendingShipment: 0,
    pendingInventoryCheck: 0,
    inTransit: 0,
    lowStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [orders, inbounds, outbounds, packings, sortings, shipments, checks, inventory] = await Promise.all([
          p01Api.getOrders({ status: PurchaseOrderStatus.PENDING_APPROVAL }),
          p02Api.getInbounds({ status: InboundStatus.INBOUND_CREATED }),
          p03Api.getOutbounds({ status: OutboundStatus.ORDER_RECEIVED }),
          p04Api.getPackings({ status: PackingStatus.PENDING }),
          p05Api.getSortings({ status: SortingStatus.PENDING }),
          p06Api.getShipments({ status: ShippingStatus.IN_TRANSIT }),
          inventoryCheckApi.getChecks({ status: InventoryCheckStatus.PENDING }),
          inventoryApi.getAll(),
        ]);

        const lowStock = (inventory as { inventory: { product: { minStock: number }; quantity: number }[] })?.inventory?.filter(
          (item: { product: { minStock: number }; quantity: number }) => item.quantity < item.product.minStock
        ).length || 0;

        setStats({
          pendingOrders: (orders as { total: number }).total || 0,
          pendingInbound: (inbounds as { total: number }).total || 0,
          pendingOutbound: (outbounds as { total: number }).total || 0,
          pendingPacking: (packings as { total: number }).total || 0,
          pendingSorting: (sortings as { total: number }).total || 0,
          pendingShipment: (shipments as { total: number }).total || 0,
          pendingInventoryCheck: (checks as { total: number }).total || 0,
          inTransit: (shipments as { total: number }).total || 0,
          lowStock,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Đặt hàng', value: stats.pendingOrders, color: '#6366f1' },
    { name: 'Nhập kho', value: stats.pendingInbound, color: '#8b5cf6' },
    { name: 'Xuất kho', value: stats.pendingOutbound, color: '#ec4899' },
    { name: 'Đóng gói', value: stats.pendingPacking, color: '#f43f5e' },
    { name: 'Phân loại', value: stats.pendingSorting, color: '#f97316' },
    { name: 'Vận chuyển', value: stats.pendingShipment, color: '#eab308' },
    { name: 'Kiểm kê', value: stats.pendingInventoryCheck, color: '#22c55e' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-cobalt rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium animate-pulse">Đang tải dữ liệu vận hành...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-navy mb-2 tracking-tight">Chào mừng trở lại!</h1>
          <p className="text-slate-500 font-medium">Đây là tổng quan tình trạng vận hành kho của bạn hôm nay.</p>
        </div>
        <div className="hidden md:flex gap-4">
           <div className="card px-6 py-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald"></div>
              <span className="text-sm font-bold text-navy">Lưu lượng: Cao</span>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Chờ duyệt đơn hàng"
          value={stats.pendingOrders}
          icon={ShoppingCart}
          color="bg-indigo-500"
        />
        <StatsCard
          title="Chờ nhập kho"
          value={stats.pendingInbound}
          icon={Warehouse}
          color="bg-purple-500"
        />
        <StatsCard
          title="Chờ xuất kho"
          value={stats.pendingOutbound}
          icon={Package}
          color="bg-pink-500"
        />
        <StatsCard 
          title="Đang vận chuyển" 
          value={stats.inTransit} 
          icon={Truck} 
          color="bg-amber-500" 
        />
      </div>

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center gap-6 shadow-sm animate-in zoom-in-95">
          <div className="w-12 h-12 bg-ruby/10 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-ruby" />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-ruby text-lg">Cảnh báo tồn kho thấp</p>
            <p className="text-red-900/60 font-medium">Có <span className="font-bold text-ruby">{stats.lowStock}</span> sản phẩm có số lượng tồn kho thấp hơn mức tối thiểu. Vui lòng kiểm tra đơn đặt hàng.</p>
          </div>
          <a href="/reports" className="btn bg-white text-ruby border border-red-200 hover:bg-red-50 font-bold text-xs uppercase tracking-widest px-6 tactile">
            Kiểm tra ngay
          </a>
        </div>
      )}

      {/* Charts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pie Chart Card */}
        <div className="lg:col-span-2 card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-display font-bold text-navy">Hiệu suất Quy trình</h3>
            <select className="bg-slate-50 border-none rounded-lg text-xs font-bold text-slate-500 px-3 py-1.5 focus:ring-0">
              <option>Hôm nay</option>
              <option>7 ngày qua</option>
            </select>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.filter(d => d.value > 0).map((_item, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="card p-8 bg-navy text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cobalt/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          
          <h3 className="text-xl font-display font-bold mb-8 relative z-10">Thao tác nhanh</h3>
          
          <div className="grid grid-cols-1 gap-4 relative z-10">
            <a href="/orders" className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group tactile">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                <ShoppingCart className="w-6 h-6 text-indigo-400 group-hover:text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-100">Tạo đơn hàng</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Purchase Order</p>
              </div>
            </a>
            <a href="/inbounds" className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group tactile">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                <Warehouse className="w-6 h-6 text-purple-400 group-hover:text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-100">Nhập kho mới</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Inbound Logistics</p>
              </div>
            </a>
            <a href="/outbounds" className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group tactile">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center group-hover:bg-pink-500 transition-colors">
                <Package className="w-6 h-6 text-pink-400 group-hover:text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-100">Xuất kho</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Outbound Order</p>
              </div>
            </a>
            <a href="/inventory-checks" className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group tactile">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500 transition-colors">
                <ClipboardList className="w-6 h-6 text-green-400 group-hover:text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-100">Kiểm kê</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Stock Count</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
