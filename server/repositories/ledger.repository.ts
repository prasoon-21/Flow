import { ledger as seed, LedgerEntry } from '@/data/ledger';

const store: LedgerEntry[] = seed.map((e) => ({ ...e }));
let counter = store.length;

export function list(): LedgerEntry[] {
  return store;
}

export function getByContactId(contactId: string): LedgerEntry[] {
  return store.filter((e) => e.contactId === contactId);
}

export function addEntry(data: Omit<LedgerEntry, 'id'>): LedgerEntry {
  counter++;
  const entry: LedgerEntry = { ...data, id: `le${counter}` };
  store.push(entry);
  return entry;
}

export function balanceByContact(): Record<string, { contactName: string; balance: number }> {
  const map: Record<string, { contactName: string; balance: number }> = {};
  for (const e of store) {
    if (!map[e.contactId]) {
      map[e.contactId] = { contactName: e.contactName, balance: 0 };
    }
    map[e.contactId].balance += e.type === 'debit' ? e.amount : -e.amount;
  }
  return map;
}
