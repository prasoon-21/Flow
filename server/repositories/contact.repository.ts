import { contacts as seed } from '@/data/contacts';
import type { Contact } from '@/server/adapters/repositories/contact.repository';

const store: Contact[] = seed.map((c) => ({ ...c }));

export function list(): Contact[] {
  return store;
}

export function getById(id: string): Contact | undefined {
  return store.find((c) => c.id === id);
}

export function search(term: string): Contact[] {
  const t = term.toLowerCase();
  return store.filter(
    (c) =>
      c.name.toLowerCase().includes(t) ||
      c.email.toLowerCase().includes(t) ||
      c.phone.includes(t),
  );
}

export function create(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Contact {
  const contact: Contact = {
    ...data,
    id: `c${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.push(contact);
  return contact;
}

export function update(id: string, data: Partial<Contact>): Contact {
  const idx = store.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error('Contact not found');
  store[idx] = { ...store[idx], ...data, updatedAt: new Date() };
  return store[idx];
}
