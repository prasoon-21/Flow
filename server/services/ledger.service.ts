import * as ledgerRepo from '@/server/repositories/ledger.repository';
import type { LedgerEntry, LedgerType } from '@/data/ledger';

export function listEntries(): LedgerEntry[] {
  return ledgerRepo.list();
}

export function getByContact(contactId: string): LedgerEntry[] {
  return ledgerRepo.getByContactId(contactId);
}

export function addEntry(data: Omit<LedgerEntry, 'id'>): LedgerEntry {
  return ledgerRepo.addEntry(data);
}

export function balanceByContact(): { contactId: string; contactName: string; balance: number }[] {
  const map = ledgerRepo.balanceByContact();
  return Object.entries(map).map(([contactId, v]) => ({
    contactId,
    contactName: v.contactName,
    balance: v.balance,
  }));
}
