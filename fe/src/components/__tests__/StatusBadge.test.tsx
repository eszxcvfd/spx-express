import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '../StatusBadge';
import type { PurchaseOrderStatus } from '../../types';

describe('StatusBadge', () => {
  const allStatuses: PurchaseOrderStatus[] = [
    'DRAFT',
    'PENDING_ACCOUNTING',
    'PENDING_APPROVAL',
    'APPROVED',
    'SENT_TO_SUPPLIER',
    'SUPPLIER_CONFIRMED',
    'SUPPLIER_REJECTED',
    'CANCELLED',
    'COMPLETED',
  ];

  it.each(allStatuses)('renders without crashing for status "%s"', (status) => {
    expect(() => render(<StatusBadge status={status} />)).not.toThrow();
  });

  it.each(allStatuses)('renders a visible badge for status "%s"', (status) => {
    render(<StatusBadge status={status} />);
    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toBeTruthy();
  });

  it('renders the APPROVED status with a label', () => {
    render(<StatusBadge status="APPROVED" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});