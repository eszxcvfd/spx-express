import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Warehouse } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Login failed');
      } else {
        setError('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-0 overflow-hidden">
      <div className="flex w-full h-screen">
        {/* Branding Side (Left 60%) */}
        <div className="hidden lg:flex lg:w-3/5 bg-navy relative items-center justify-center p-12 overflow-hidden">
          {/* Abstract Background Element */}
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-cobalt/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-900/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 w-full max-w-2xl glass rounded-3xl p-12 text-white">
            <div className="flex items-center gap-6 mb-12">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                <Warehouse className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-display font-bold tracking-tight">SPX Express</h1>
                <p className="text-xl text-blue-200/80 font-light">Warehouse Management System</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="h-px w-24 bg-gradient-to-r from-cobalt to-transparent"></div>
              <h2 className="text-3xl font-display font-medium leading-tight">
                Hệ thống quản lý kho vận <br />
                <span className="text-blue-400">thế hệ mới</span> tối ưu và hiện đại.
              </h2>
              <p className="text-slate-400 max-w-md leading-relaxed">
                Giải pháp quản lý kho thông minh giúp tối ưu hóa quy trình nhập xuất, 
                kiểm kê và vận chuyển với độ chính xác tuyệt đối.
              </p>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-12 left-12 text-slate-500 text-sm font-mono tracking-widest uppercase">
            System // v1.0.0
          </div>
        </div>

        {/* Login Area (Right 40%) */}
        <div className="w-full lg:w-2/5 flex items-center justify-center bg-canvas p-8">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden flex items-center gap-3">
              <Warehouse className="w-8 h-8 text-navy" />
              <h1 className="text-2xl font-display font-bold">SPX Express</h1>
            </div>

            <div className="mb-10">
              <h2 className="text-3xl font-display font-bold text-navy mb-2">Chào mừng trở lại</h2>
              <p className="text-slate-500">Vui lòng đăng nhập để quản trị hệ thống.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-ruby text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-1.5 h-1.5 rounded-full bg-ruby"></div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                  Email công việc
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="admin@spx.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-accent w-full py-3.5 text-lg font-semibold tactile"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xử lý...
                  </span>
                ) : 'Đăng nhập ngay'}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-100">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center mb-6">
                Truy cập nhanh (Demo)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@spx.com'); setPassword('123456'); }}
                  className="group p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all text-left tactile"
                >
                  <span className="block font-bold text-navy text-sm group-hover:text-cobalt transition-colors">Admin Portal</span>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-tighter">Full Permissions</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('quality@spx.com'); setPassword('123456'); }}
                  className="group p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all text-left tactile"
                >
                  <span className="block font-bold text-navy text-sm group-hover:text-cobalt transition-colors">Quality Control</span>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-tighter">Limited Access</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
