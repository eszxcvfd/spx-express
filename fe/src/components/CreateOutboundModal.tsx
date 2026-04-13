import { FormEvent, MouseEvent, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Plus, Trash2, X } from 'lucide-react';
import { productApi } from '../services/api';
import { Product } from '../types';

interface CreateOutboundItemForm {
  productId: string;
  quantity: number;
}

interface CreateOutboundPayload {
  orderRef?: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number }>;
}

interface CreateOutboundModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateOutboundPayload) => Promise<void>;
}

const initialItem: CreateOutboundItemForm = {
  productId: '',
  quantity: 1,
};

export default function CreateOutboundModal({ isOpen, isSubmitting, onClose, onSubmit }: CreateOutboundModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState('');

  const [orderRef, setOrderRef] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CreateOutboundItemForm[]>([initialItem]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      setLoadingOptions(true);
      setOptionsError('');
      try {
        const productsRes = await productApi.getAll();
        const productList = ((productsRes as { products?: Product[] })?.products ??
          (Array.isArray(productsRes) ? (productsRes as Product[]) : [])) as Product[];
        setProducts(productList);
      } catch (error) {
        console.error('Error fetching outbound modal options:', error);
        setOptionsError('Không thể tải danh sách sản phẩm.');
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setOrderRef('');
      setNotes('');
      setItems([initialItem]);
      setFormError('');
      setOptionsError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  const handleAddItem = () => setItems((prev) => [...prev, { ...initialItem }]);

  const handleRemoveItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleItemChange = (index: number, field: keyof CreateOutboundItemForm, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === 'quantity') {
          const parsed = Number(value);
          return { ...item, [field]: Number.isNaN(parsed) ? 0 : parsed };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const getProductInventory = (productId: string): { available: number; quantity: number } | null => {
    const product = products.find((p) => p.id === productId);
    if (!product?.inventory) return null;
    return { available: product.inventory.available, quantity: product.inventory.quantity };
  };

  const inventoryWarnings = useMemo(() => {
    const warnings: Record<string, string> = {};
    for (const item of items) {
      if (!item.productId || item.quantity <= 0) continue;
      const inv = getProductInventory(item.productId);
      if (inv && item.quantity > inv.available) {
        warnings[item.productId] = `Chỉ còn ${inv.available}/${inv.quantity} sản phẩm khả dụng trong kho`;
      }
    }
    return warnings;
  }, [items, products]);

  const validateForm = () => {
    if (items.length === 0) {
      setFormError('Vui lòng thêm ít nhất 1 dòng sản phẩm.');
      return false;
    }
    if (items.some((item) => !item.productId || item.quantity <= 0)) {
      setFormError('Mỗi dòng cần chọn sản phẩm và số lượng > 0.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;
    await onSubmit({
      orderRef: orderRef.trim() || undefined,
      notes: notes.trim() || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleOverlayClick}>
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tạo phiếu xuất kho P03</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" disabled={isSubmitting}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {optionsError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{optionsError}</div>
          )}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{formError}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng sàn TMĐT</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition"
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                placeholder="VD: SPX-ORD-001"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea
                rows={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h4 className="font-medium text-gray-800">Danh sách sản phẩm</h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                disabled={isSubmitting}
              >
                <Plus className="w-4 h-4" />
                Thêm dòng
              </button>
            </div>

            {loadingOptions ? (
              <div className="flex items-center justify-center h-28">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600">
                      <th className="text-left px-4 py-3 font-medium">Sản phẩm</th>
                      <th className="text-left px-4 py-3 font-medium">Tồn kho</th>
                      <th className="text-left px-4 py-3 font-medium">Số lượng xuất</th>
                      <th className="text-right px-4 py-3 font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const inv = getProductInventory(item.productId);
                      const warning = item.productId ? inventoryWarnings[item.productId] : undefined;
                      return (
                      <tr key={`${index}-${item.productId}`} className="border-t border-gray-100">
                        <td className="px-4 py-3 min-w-64">
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition"
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            disabled={isSubmitting}
                          >
                            <option value="">Chọn sản phẩm</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.sku} - {product.name} (Tồn kho: {product.inventory?.available ?? 0}/{product.inventory?.quantity ?? 0})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 min-w-32">
                          {item.productId && inv ? (
                            <div className="flex flex-col">
                              <span className={`font-medium ${inv.available < item.quantity ? 'text-red-600' : 'text-green-700'}`}>
                                {inv.available} khả dụng
                              </span>
                              <span className="text-xs text-gray-500">trên {inv.quantity} tổng</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <input
                              type="number"
                              min={1}
                              className={`w-28 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition ${warning ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              disabled={isSubmitting}
                            />
                            {warning && (
                              <span className="flex items-center gap-1 text-xs text-red-600">
                                <AlertTriangle className="w-3 h-3" />
                                {warning}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length === 1 || isSubmitting}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || loadingOptions}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo phiếu xuất kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
