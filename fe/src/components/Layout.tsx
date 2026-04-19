import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Warehouse,
  Package,
  Truck,
  ClipboardList,
  FileText,
  LogOut,
  ArrowLeftRight,
  BarChart3,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Đặt hàng', icon: ShoppingCart },
  { path: '/inbounds', label: 'Nhập kho', icon: Warehouse },
  { path: '/outbounds', label: 'Xuất kho', icon: Package },
  { path: '/packings', label: 'Đóng gói', icon: ClipboardList },
  { path: '/sortings', label: 'Phân loại', icon: FileText },
  { path: '/shipments', label: 'Vận chuyển', icon: Truck },
  { path: '/inventory-checks', label: 'Kiểm kê', icon: ClipboardList },
  { path: '/transfers', label: 'Chuyển kho', icon: ArrowLeftRight },
  { path: '/reports', label: 'Báo cáo', icon: BarChart3 },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-canvas font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-navy text-white flex flex-col shadow-2xl z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-cobalt rounded-xl flex items-center justify-center shadow-lg shadow-cobalt/20">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight">SPX Express</h1>
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold ml-13">Warehouse OS</p>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4 mb-4">Danh mục chính</p>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-cobalt text-white shadow-lg shadow-cobalt/20' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className={`font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-2xl border border-white/5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center font-bold text-white shadow-inner">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-100 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 font-semibold text-sm group tactile"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

        <header className="h-20 bg-white/80 backdrop-blur-md flex items-center justify-between px-10 z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span>Hệ thống</span>
              <span>/</span>
              <span className="text-cobalt">
                {menuItems.find(item => {
                  const isRoot = item.path === '/';
                  const isActive = location.pathname === item.path || 
                    (item.path !== '/' && location.pathname.startsWith(item.path));
                  return isRoot && location.pathname === '/' ? true : isActive;
                })?.label || 'Tổng quan'}
              </span>
            </div>
            <h2 className="text-2xl font-display font-bold text-navy">
              {menuItems.find(item => {
                const isRoot = item.path === '/';
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return isRoot && location.pathname === '/' ? true : isActive;
              })?.label || 'SPX Express'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
               <div className="w-2 h-2 rounded-full bg-emerald animate-pulse"></div>
               <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Hệ thống ổn định</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 relative custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
