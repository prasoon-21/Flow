export type LedgerType = 'debit' | 'credit';

export interface LedgerEntry {
  id: string;
  contactId: string;
  contactName: string;
  type: LedgerType;
  amount: number;
  reference: string;
  date: Date;
}

export const ledger: LedgerEntry[] = [
  {
    id: 'le1', contactId: 'c1', contactName: 'Rajesh Kumar',
    type: 'debit', amount: 109930, reference: 'INV-3001 — Order ORD-1001',
    date: new Date('2026-02-10'),
  },
  {
    id: 'le2', contactId: 'c1', contactName: 'Rajesh Kumar',
    type: 'credit', amount: 109930, reference: 'PAY-4001 — Bank transfer',
    date: new Date('2026-02-15'),
  },
  {
    id: 'le3', contactId: 'c2', contactName: 'Priya Sharma',
    type: 'debit', amount: 129900, reference: 'INV-3002 — Order ORD-1002',
    date: new Date('2026-02-25'),
  },
  {
    id: 'le4', contactId: 'c3', contactName: 'Global Electronics Ltd',
    type: 'credit', amount: 200000, reference: 'BILL-5001 — Purchase PO-2001',
    date: new Date('2026-01-15'),
  },
  {
    id: 'le5', contactId: 'c3', contactName: 'Global Electronics Ltd',
    type: 'debit', amount: 200000, reference: 'PAY-6001 — Wire transfer',
    date: new Date('2026-02-05'),
  },
  {
    id: 'le6', contactId: 'c1', contactName: 'Rajesh Kumar',
    type: 'debit', amount: 75930, reference: 'INV-3003 — Order ORD-1005',
    date: new Date('2026-03-07'),
  },
];
