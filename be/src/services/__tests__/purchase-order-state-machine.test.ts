import { describe, expect, it } from 'vitest';
import { PurchaseOrderStatus } from '../../constants/workflow-status';
import {
  canTransition,
  getRequiredRoles,
  getValidTransitions,
  isTerminalStatus,
  validateTransition,
} from '../purchase-order-state-machine';

const STATUSES = [
  PurchaseOrderStatus.PURCHASE_PLAN_CREATED,
  PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING,
  PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
  PurchaseOrderStatus.PLAN_APPROVED,
  PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
  PurchaseOrderStatus.SUPPLIER_CONFIRMED,
  PurchaseOrderStatus.SUPPLIER_REJECTED,
  PurchaseOrderStatus.ORDER_CANCELLED,
  PurchaseOrderStatus.ORDER_COMPLETED,
] as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  [PurchaseOrderStatus.PURCHASE_PLAN_CREATED]: [
    PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING,
    PurchaseOrderStatus.ORDER_CANCELLED,
  ],
  [PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING]: [
    PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
    PurchaseOrderStatus.ORDER_CANCELLED,
  ],
  [PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR]: [
    PurchaseOrderStatus.PLAN_APPROVED,
    PurchaseOrderStatus.ORDER_CANCELLED,
  ],
  [PurchaseOrderStatus.PLAN_APPROVED]: [PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER],
  [PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER]: [
    PurchaseOrderStatus.SUPPLIER_CONFIRMED,
    PurchaseOrderStatus.SUPPLIER_REJECTED,
    PurchaseOrderStatus.ORDER_CANCELLED,
  ],
  [PurchaseOrderStatus.SUPPLIER_CONFIRMED]: [PurchaseOrderStatus.ORDER_COMPLETED],
  [PurchaseOrderStatus.SUPPLIER_REJECTED]: [],
  [PurchaseOrderStatus.ORDER_CANCELLED]: [],
  [PurchaseOrderStatus.ORDER_COMPLETED]: [],
};

describe('purchase-order-state-machine', () => {
  describe('valid transitions', () => {
    it('should allow every valid transition with a required role', () => {
      const transitionCases = [
        {
          from: PurchaseOrderStatus.PURCHASE_PLAN_CREATED,
          to: PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING,
          role: 'QUALITY',
        },
        {
          from: PurchaseOrderStatus.PURCHASE_PLAN_CREATED,
          to: PurchaseOrderStatus.ORDER_CANCELLED,
          role: 'QUALITY',
        },
        {
          from: PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING,
          to: PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
          role: 'ACCOUNTING',
        },
        {
          from: PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING,
          to: PurchaseOrderStatus.ORDER_CANCELLED,
          role: 'QUALITY',
        },
        {
          from: PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
          to: PurchaseOrderStatus.PLAN_APPROVED,
          role: 'WAREHOUSE_DIRECTOR',
        },
        {
          from: PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
          to: PurchaseOrderStatus.ORDER_CANCELLED,
          role: 'WAREHOUSE_DIRECTOR',
        },
        {
          from: PurchaseOrderStatus.PLAN_APPROVED,
          to: PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
          role: 'ADMIN',
        },
        {
          from: PurchaseOrderStatus.PLAN_APPROVED,
          to: PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
          role: 'WAREHOUSE_DIRECTOR',
        },
        {
          from: PurchaseOrderStatus.PLAN_APPROVED,
          to: PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
          role: 'ACCOUNTING',
        },
        {
          from: PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
          to: PurchaseOrderStatus.SUPPLIER_CONFIRMED,
          role: 'ADMIN',
        },
        {
          from: PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
          to: PurchaseOrderStatus.SUPPLIER_REJECTED,
          role: 'ADMIN',
        },
        {
          from: PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
          to: PurchaseOrderStatus.ORDER_CANCELLED,
          role: 'ACCOUNTING',
        },
        {
          from: PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
          to: PurchaseOrderStatus.ORDER_CANCELLED,
          role: 'WAREHOUSE_DIRECTOR',
        },
        {
          from: PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
          to: PurchaseOrderStatus.ORDER_CANCELLED,
          role: 'ADMIN',
        },
        {
          from: PurchaseOrderStatus.SUPPLIER_CONFIRMED,
          to: PurchaseOrderStatus.ORDER_COMPLETED,
          role: 'ACCOUNTING',
        },
      ] as const;

      for (const testCase of transitionCases) {
        expect(canTransition(testCase.from, testCase.to, testCase.role)).toBe(true);
        expect(() =>
          validateTransition(testCase.from, testCase.to, testCase.role)
        ).not.toThrow();
      }
    });
  });

  describe('invalid transitions', () => {
    it('should reject every invalid status transition', () => {
      for (const from of STATUSES) {
        for (const to of STATUSES) {
          if (from === to) {
            continue;
          }

          const isValid = VALID_TRANSITIONS[from].includes(to);
          if (!isValid) {
            expect(canTransition(from, to, 'ADMIN')).toBe(false);
            expect(() => validateTransition(from, to, 'ADMIN')).toThrow();
          }
        }
      }
    });
  });

  describe('role guards', () => {
    it('should enforce role requirements for each transition', () => {
      const roleCases = [
        {
          from: PurchaseOrderStatus.PURCHASE_PLAN_CREATED,
          to: PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING,
          allowed: ['QUALITY', 'ADMIN'],
          denied: ['ACCOUNTING', 'WAREHOUSE_DIRECTOR', 'STAFF'],
        },
        {
          from: PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING,
          to: PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
          allowed: ['ACCOUNTING', 'ADMIN'],
          denied: ['QUALITY', 'WAREHOUSE_DIRECTOR', 'STAFF'],
        },
        {
          from: PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
          to: PurchaseOrderStatus.PLAN_APPROVED,
          allowed: ['WAREHOUSE_DIRECTOR', 'ADMIN'],
          denied: ['QUALITY', 'ACCOUNTING', 'STAFF'],
        },
        {
          from: PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
          to: PurchaseOrderStatus.ORDER_CANCELLED,
          allowed: ['QUALITY', 'WAREHOUSE_DIRECTOR', 'ADMIN'],
          denied: ['ACCOUNTING', 'STAFF'],
        },
        {
          from: PurchaseOrderStatus.PLAN_APPROVED,
          to: PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
          allowed: ['ADMIN', 'WAREHOUSE_DIRECTOR', 'ACCOUNTING'],
          denied: ['QUALITY', 'STAFF'],
        },
        {
          from: PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
          to: PurchaseOrderStatus.SUPPLIER_CONFIRMED,
          allowed: ['ADMIN'],
          denied: ['QUALITY', 'ACCOUNTING', 'WAREHOUSE_DIRECTOR', 'STAFF'],
        },
        {
          from: PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
          to: PurchaseOrderStatus.SUPPLIER_REJECTED,
          allowed: ['ADMIN'],
          denied: ['QUALITY', 'ACCOUNTING', 'WAREHOUSE_DIRECTOR', 'STAFF'],
        },
        {
          from: PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER,
          to: PurchaseOrderStatus.ORDER_CANCELLED,
          allowed: ['ACCOUNTING', 'WAREHOUSE_DIRECTOR', 'ADMIN'],
          denied: ['QUALITY', 'STAFF'],
        },
        {
          from: PurchaseOrderStatus.SUPPLIER_CONFIRMED,
          to: PurchaseOrderStatus.ORDER_COMPLETED,
          allowed: ['ADMIN', 'ACCOUNTING'],
          denied: ['QUALITY', 'WAREHOUSE_DIRECTOR', 'STAFF'],
        },
      ] as const;

      for (const testCase of roleCases) {
        for (const role of testCase.allowed) {
          expect(canTransition(testCase.from, testCase.to, role)).toBe(true);
          expect(() =>
            validateTransition(testCase.from, testCase.to, role)
          ).not.toThrow();
        }

        for (const role of testCase.denied) {
          expect(canTransition(testCase.from, testCase.to, role)).toBe(false);
          expect(() => validateTransition(testCase.from, testCase.to, role)).toThrow();
        }
      }
    });
  });

  describe('terminal states', () => {
    it('should mark COMPLETED, CANCELLED, SUPPLIER_REJECTED as terminal', () => {
      expect(isTerminalStatus(PurchaseOrderStatus.ORDER_COMPLETED)).toBe(true);
      expect(isTerminalStatus(PurchaseOrderStatus.ORDER_CANCELLED)).toBe(true);
      expect(isTerminalStatus(PurchaseOrderStatus.SUPPLIER_REJECTED)).toBe(true);
    });

    it('should reject transitions from terminal states', () => {
      const terminalStates = [
        PurchaseOrderStatus.ORDER_COMPLETED,
        PurchaseOrderStatus.ORDER_CANCELLED,
        PurchaseOrderStatus.SUPPLIER_REJECTED,
      ];

      for (const from of terminalStates) {
        for (const to of STATUSES) {
          if (from === to) {
            continue;
          }
          expect(canTransition(from, to, 'ADMIN')).toBe(false);
          expect(() => validateTransition(from, to, 'ADMIN')).toThrow();
        }
      }
    });
  });

  describe('helper functions', () => {
    it('should return valid transitions for each status', () => {
      expect(getValidTransitions(PurchaseOrderStatus.PURCHASE_PLAN_CREATED)).toEqual([
        PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING,
        PurchaseOrderStatus.ORDER_CANCELLED,
      ]);

      expect(getValidTransitions(PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER)).toEqual([
        PurchaseOrderStatus.SUPPLIER_CONFIRMED,
        PurchaseOrderStatus.SUPPLIER_REJECTED,
        PurchaseOrderStatus.ORDER_CANCELLED,
      ]);

      expect(getValidTransitions(PurchaseOrderStatus.ORDER_COMPLETED)).toEqual([]);
    });

    it('should return required roles for transition', () => {
      expect(
        getRequiredRoles(
          PurchaseOrderStatus.PURCHASE_PLAN_CREATED,
          PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING
        )
      ).toEqual(['QUALITY', 'ADMIN']);

      expect(
        getRequiredRoles(
          PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR,
          PurchaseOrderStatus.PLAN_APPROVED
        )
      ).toEqual(['WAREHOUSE_DIRECTOR', 'ADMIN']);

      expect(
        getRequiredRoles(
          PurchaseOrderStatus.SUPPLIER_REJECTED,
          PurchaseOrderStatus.ORDER_CANCELLED
        )
      ).toEqual([]);
    });

    it('should identify non-terminal statuses correctly', () => {
      expect(isTerminalStatus(PurchaseOrderStatus.PURCHASE_PLAN_CREATED)).toBe(false);
      expect(isTerminalStatus(PurchaseOrderStatus.PLAN_CONFIRMED_BY_ACCOUNTING)).toBe(false);
      expect(isTerminalStatus(PurchaseOrderStatus.PLAN_SENT_TO_DIRECTOR)).toBe(false);
      expect(isTerminalStatus(PurchaseOrderStatus.PLAN_APPROVED)).toBe(false);
      expect(isTerminalStatus(PurchaseOrderStatus.ORDER_SENT_TO_SUPPLIER)).toBe(false);
      expect(isTerminalStatus(PurchaseOrderStatus.SUPPLIER_CONFIRMED)).toBe(false);
    });
  });
});
