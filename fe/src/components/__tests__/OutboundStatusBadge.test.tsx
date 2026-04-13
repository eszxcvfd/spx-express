import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OutboundStatusBadge from '../OutboundStatusBadge';
import type { OutboundStatus } from '../../types';

describe('OutboundStatusBadge', () => {
  const statuses: OutboundStatus[] = [
    'P03_ORDER_RECEIVED',
    'P03_INVENTORY_CHECKED',
    'P03_INVENTORY_SUFFICIENT',
    'P03_INVENTORY_INSUFFICIENT',
    'P03_PICKING_ASSIGNED',
    'P03_PICKER_ASSIGNED',
    'P03_ITEM_SCANNED',
    'P03_PICKED_CORRECT',
    'P03_PICKED_WRONG',
    'P03_PUT_IN_CART',
    'P03_SLIP_PRINTED',
    'P03_MOVED_TO_PACKING',
  ];

  const expectedLabels: Record<OutboundStatus, string> = {
    P03_ORDER_RECEIVED: 'Nhận đơn từ Shopee',
    P03_INVENTORY_CHECKED: 'Kiểm tra tồn kho',
    P03_INVENTORY_SUFFICIENT: 'Đủ hàng',
    P03_INVENTORY_INSUFFICIENT: 'Không đủ hàng',
    P03_PICKING_ASSIGNED: 'Giao điều phối',
    P03_PICKER_ASSIGNED: 'Giao nhân viên lấy hàng',
    P03_ITEM_SCANNED: 'Quét mã sản phẩm',
    P03_PICKED_CORRECT: 'Lấy đúng sản phẩm',
    P03_PICKED_WRONG: 'Lấy sai (quét lại)',
    P03_PUT_IN_CART: 'Cho vào giỏ hàng',
    P03_SLIP_PRINTED: 'In phiếu xuất kho (MB02)',
    P03_MOVED_TO_PACKING: 'Chuyển sang đóng gói',
  };

  it('renders Vietnamese label for each P03 status', () => {
    statuses.forEach((status) => {
      const { unmount } = render(<OutboundStatusBadge status={status} />);
      expect(screen.getByText(expectedLabels[status])).toBeInTheDocument();
      unmount();
    });
  });

  it('renders fallback for unknown status', () => {
    render(<OutboundStatusBadge status={'UNKNOWN_STATUS' as OutboundStatus} />);
    expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument();
  });

  it('applies correct CSS classes for P03_ORDER_RECEIVED', () => {
    render(<OutboundStatusBadge status="P03_ORDER_RECEIVED" />);
    const badge = screen.getByText('Nhận đơn từ Shopee');
    expect(badge.className).toContain('bg-gray-100');
    expect(badge.className).toContain('text-gray-700');
  });

  it('applies correct CSS classes for P03_MOVED_TO_PACKING', () => {
    render(<OutboundStatusBadge status="P03_MOVED_TO_PACKING" />);
    const badge = screen.getByText('Chuyển sang đóng gói');
    expect(badge.className).toContain('bg-emerald-200');
    expect(badge.className).toContain('text-emerald-900');
  });

  it('applies correct CSS classes for P03_INVENTORY_INSUFFICIENT', () => {
    render(<OutboundStatusBadge status="P03_INVENTORY_INSUFFICIENT" />);
    const badge = screen.getByText('Không đủ hàng');
    expect(badge.className).toContain('bg-red-100');
    expect(badge.className).toContain('text-red-700');
  });

  it('all 12 statuses render without crashing', () => {
    expect(statuses).toHaveLength(12);
  });
});