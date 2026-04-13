import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  ShoppingCart, Warehouse, Package, Truck,
  ClipboardList, AlertTriangle
} from 'lucide-react';
import { p01Api, p02Api, p03Api, p04Api, p05Api, p06Api, inventoryApi } from '../services/api';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}

function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
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
    inTransit: 0,
    lowStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [orders, inbounds, outbounds, packings, _sortings, shipments, inventory] = await Promise.all([
          p01Api.getOrders({ status: 'PENDING_APPROVAL' }),
          p02Api.getInbounds({ status: 'P02_INBOUND_CREATED' }),
          p03Api.getOutbounds({ status: 'PENDING' }),
          p04Api.getPackings({ status: 'PENDING' }),
          p05Api.getSortings({ status: 'PENDING' }),
          p06Api.getShipments({ status: 'IN_TRANSIT' }),
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
    { name: 'P01 Đặt hàng', value: stats.pendingOrders, color: '#6366f1' },
    { name: 'P02 Nhập kho', value: stats.pendingInbound, color: '#8b5cf6' },
    { name: 'P03 Xuất kho', value: stats.pendingOutbound, color: '#ec4899' },
    { name: 'P04 Đóng gói', value: stats.pendingPacking, color: '#f43f5e' },
    { name: 'P05 Phân loại', value: 0, color: '#f97316' },
    { name: 'P06 Vận chuyển', value: stats.inTransit, color: '#eab308' },
    { name: 'P07 Kiểm kê', value: 0, color: '#22c55e' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Chờ duyệt đơn đặt hàng"
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Cảnh báo tồn kho thấp</p>
            <p className="text-sm text-amber-600">Có {stats.lowStock} sản phẩm có số lượng tồn kho thấp hơn mức tối thiểu</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố công việc theo quy trình</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {chartData.filter(d => d.value > 0).map((_item, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Số lượng công việc theo quy trình</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/orders" className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-center transition-colors">
            <ShoppingCart className="w-8 h-8 mx-auto text-indigo-600 mb-2" />
            <p className="font-medium text-indigo-800">Tạo đơn đặt hàng</p>
          </a>
          <a href="/inbounds" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition-colors">
            <Warehouse className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <p className="font-medium text-purple-800">Nhập kho mới</p>
          </a>
          <a href="/outbounds" className="p-4 bg-pink-50 hover:bg-pink-100 rounded-xl text-center transition-colors">
            <Package className="w-8 h-8 mx-auto text-pink-600 mb-2" />
            <p className="font-medium text-pink-800">Tạo đơn xuất kho</p>
          </a>
          <a href="/inventory-checks" className="p-4 bg-green-50 hover:bg-green-100 rounded-xl text-center transition-colors">
            <ClipboardList className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <p className="font-medium text-green-800">Kiểm kê kho</p>
          </a>
        </div>
      </div>
    </div>
  );
}
