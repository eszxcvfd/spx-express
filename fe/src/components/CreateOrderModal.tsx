import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { productApi, supplierApi } from '../services/api';
import { Product, Supplier } from '../types';

interface CreateOrderItemForm {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface CreateOrderPayload {
  supplierId: string;
  expectedDate?: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateOrderPayload) => Promise<void>;
}

const initialItem: CreateOrderItemForm = {
  productId: '',
  quantity: 1,
  unitPrice: 0,
};

export default function CreateOrderModal({ isOpen, isSubmitting, onClose, onSubmit }: CreateOrderModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState('');

  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CreateOrderItemForm[]>([initialItem]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fetchOptions = async () => {
      setLoadingOptions(true);
      setOptionsError('');
      try {
        const [suppliersRes, productsRes] = await Promise.all([supplierApi.getAll(), productApi.getAll()]);

        const supplierList = ((suppliersRes as { suppliers?: Supplier[] })?.suppliers ??
          (Array.isArray(suppliersRes) ? (suppliersRes as Supplier[]) : [])) as Supplier[];

        const productList = ((productsRes as { products?: Product[] })?.products ??
          (Array.isArray(productsRes) ? (productsRes as Product[]) : [])) as Product[];

        setSuppliers(supplierList);
        setProducts(productList);
      } catch (error) {
        console.error('Error fetching modal options:', error);
        setOptionsError('Không thể tải danh sách nhà cung cấp hoặc sản phẩm.');
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSupplierId('');
      setExpectedDate('');
      setNotes('');
      setItems([initialItem]);
      setFormError('');
      setOptionsError('');
    }
  }, [isOpen]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items]
  );

  const handleAddItem = () => {
    setItems((prev) => [...prev, { ...initialItem }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => {
      if (prev.length === 1) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleItemChange = (index: number, field: keyof CreateOrderItemForm, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) {
          return item;
        }

        if (field === 'quantity' || field === 'unitPrice') {
          const parsed = Number(value);
          return {
            ...item,
            [field]: Number.isNaN(parsed) ? 0 : parsed,
          };
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  };

  const validateForm = () => {
    if (!supplierId) {
      setFormError('Vui lòng chọn nhà cung cấp.');
      return false;
    }

    if (items.length === 0) {
      setFormError('Vui lòng thêm ít nhất 1 dòng sản phẩm.');
      return false;
    }

    if (items.some((item) => !item.productId || item.quantity <= 0 || item.unitPrice <= 0)) {
      setFormError('Mỗi dòng sản phẩm cần chọn sản phẩm, số lượng > 0 và đơn giá > 0.');
      return false;
    }

    setFormError('');
    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit({
      supplierId,
      expectedDate: expectedDate || undefined,
      notes: notes.trim() || undefined,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-sm border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tạo đơn đặt hàng P01</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {optionsError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {optionsError}
            </div>
          )}

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{formError}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp *</label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                disabled={loadingOptions || isSubmitting}
              >
                <option value="">Chọn nhà cung cấp</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày dự kiến</label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú nếu có"
              disabled={isSubmitting}
            />
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
                      <th className="text-left px-4 py-3 font-medium">Số lượng</th>
                      <th className="text-left px-4 py-3 font-medium">Đơn giá</th>
                      <th className="text-left px-4 py-3 font-medium">Thành tiền</th>
                      <th className="text-right px-4 py-3 font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
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
                                {product.sku} - {product.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={1}
                            className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            step="1000"
                            className="w-36 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {(item.quantity * item.unitPrice).toLocaleString('vi-VN')} đ
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-sm text-gray-600">Tổng đơn hàng</p>
            <p className="text-lg font-semibold text-gray-900">{totalAmount.toLocaleString('vi-VN')} đ</p>
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
              {isSubmitting ? 'Đang tạo...' : 'Tạo đơn hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
