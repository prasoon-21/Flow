/**
 * Contact Repository — in-memory stub backed by data/contacts.ts
 */

import { contacts as seedContacts } from '@/data/contacts';

export interface ContactAddress {
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  zip?: string | null;
}

export type ContactType = 'customer' | 'supplier';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: ContactType;
  country_code: string | null;
  whatsApp_name: string | null;
  notes: string;
  tags: string[];
  address: ContactAddress | null;
  shopifyCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt: Date | null;
}

// Mutable in-memory store seeded from dummy data
const store: Map<string, Contact[]> = new Map();

function getStore(tenantId: string): Contact[] {
  if (!store.has(tenantId)) {
    store.set(tenantId, seedContacts.map((c) => ({ ...c })));
  }
  return store.get(tenantId)!;
}

export class ContactRepository {
  async findAll(tenantId: string): Promise<Contact[]> {
    return getStore(tenantId);
  }

  async findById(tenantId: string, contactId: string): Promise<Contact | null> {
    return getStore(tenantId).find((c) => c.id === contactId) ?? null;
  }

  async findByEmail(tenantId: string, email: string): Promise<Contact | null> {
    return getStore(tenantId).find((c) => c.email === email) ?? null;
  }

  async findByPhone(tenantId: string, phone: string): Promise<Contact | null> {
    return getStore(tenantId).find((c) => c.phone === phone) ?? null;
  }

  async search(tenantId: string, searchTerm: string): Promise<Contact[]> {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return this.findAll(tenantId);
    return getStore(tenantId).filter((c) => {
      const name = (c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return name.includes(term) || email.includes(term) || phone.includes(term);
    });
  }

  async create(tenantId: string, data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const now = new Date();
    const contact: Contact = {
      ...data,
      id: `c${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    getStore(tenantId).push(contact);
    return contact;
  }

  async update(
    tenantId: string,
    contactId: string,
    data: Partial<Omit<Contact, 'id' | 'createdAt'>>,
  ): Promise<Contact> {
    const list = getStore(tenantId);
    const idx = list.findIndex((c) => c.id === contactId);
    if (idx === -1) throw new Error('Contact not found');
    list[idx] = { ...list[idx], ...data, updatedAt: new Date() };
    return list[idx];
  }

  async delete(tenantId: string, contactId: string): Promise<void> {
    const list = getStore(tenantId);
    const idx = list.findIndex((c) => c.id === contactId);
    if (idx !== -1) list.splice(idx, 1);
  }
}
