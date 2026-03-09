/**
 * Contact Service
 * Business logic for contact management including tag auto-creation
 */

import { ContactRepository, Contact, ContactAddress } from '@/server/adapters/repositories/contact.repository';
import { tags as tagStore, TagRecord } from '@/data/tags';

export interface CreateContactInput {
  name: string;
  email?: string;
  phone?: string;
  type?: 'customer' | 'supplier';
  country_code?: string | null;
  whatsApp_name?: string | null;
  notes?: string;
  tags?: string[];
  address?: ContactAddress | null;
  shopifyCustomerId?: string | null;
}

export interface ContactLookupInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface UpdateContactInput {
  name?: string;
  email?: string;
  phone?: string;
  country_code?: string | null;
  whatsApp_name?: string | null;
  notes?: string;
  tags?: string[];
  address?: ContactAddress | null;
  shopifyCustomerId?: string | null;
}

export interface ActivityItem {
  id: string;
  type: 'email' | 'whatsapp' | 'call' | 'ticket' | 'order';
  timestamp: Date;
  title: string;
  snippet: string;
  metadata: {
    conversationId?: string;
    callId?: string;
    channel?: string;
    orderId?: string;
    orderNumericId?: number;
    ticketId?: string;
    status?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    total?: string;
    duration?: string;
    direction?: string;
    tags?: string[];
    recordUrl?: string;
  };
}

export class ContactService {
  private contactRepo = new ContactRepository();

  async list(tenantId: string, searchTerm?: string): Promise<Contact[]> {
    if (searchTerm) {
      return this.contactRepo.search(tenantId, searchTerm);
    }
    return this.contactRepo.findAll(tenantId);
  }

  async getById(tenantId: string, contactId: string): Promise<Contact | null> {
    return this.contactRepo.findById(tenantId, contactId);
  }

  async resolveForTicket(
    tenantId: string,
    input: ContactLookupInput,
    userId: string,
  ): Promise<Contact | null> {
    const normalized = normalizeLookupInput(input);
    if (!normalized) {
      return null;
    }

    const [emailMatch, phoneMatch] = await Promise.all([
      normalized.email ? this.contactRepo.findByEmail(tenantId, normalized.email) : Promise.resolve(null),
      normalized.phone ? this.contactRepo.findByPhone(tenantId, normalized.phone) : Promise.resolve(null),
    ]);
    const existing = emailMatch ?? phoneMatch;

    if (existing) {
      const updates: UpdateContactInput = {};
      if (normalized.name && !existing.name) {
        updates.name = normalized.name;
      }
      if (normalized.email && !existing.email) {
        updates.email = normalized.email;
      }
      if (normalized.phone && !existing.phone) {
        updates.phone = normalized.phone;
      }
      if (Object.keys(updates).length > 0) {
        return this.update(tenantId, existing.id, updates, userId);
      }
      return existing;
    }

    const enriched = await this.enrichContactFromShopify(tenantId, normalized);
    const finalName = (normalized.name || enriched.name || normalized.email || normalized.phone || 'Unknown Contact').trim();
    const createInput: CreateContactInput = {
      name: finalName,
      email: (enriched.email || normalized.email || '').trim(),
      phone: (enriched.phone || normalized.phone || '').trim(),
      address: enriched.address ?? null,
      shopifyCustomerId: enriched.shopifyCustomerId ?? null,
    };
    return this.create(tenantId, createInput, userId);
  }

  async create(tenantId: string, input: CreateContactInput, userId: string): Promise<Contact> {
    // Auto-create tags if they don't exist
    if (input.tags && input.tags.length > 0) {
      await this.ensureTagsExist(tenantId, input.tags);
    }

    const contactData = {
      name: input.name.trim(),
      email: (input.email || '').trim(),
      phone: (input.phone || '').trim(),
      country_code: input.country_code || null,
      whatsApp_name: input.whatsApp_name?.trim() || null,
      notes: (input.notes || '').trim(),
      tags: input.tags || [],
      address: input.address ?? null,
      shopifyCustomerId: input.shopifyCustomerId?.trim() || null,
      lastContactedAt: null,
      type: input.type || 'customer',
    };

    return this.contactRepo.create(tenantId, contactData);
  }

  private async enrichContactFromShopify(
    _tenantId: string,
    _input: { name?: string; email?: string; phone?: string },
  ): Promise<{
    name?: string;
    email?: string;
    phone?: string;
    address?: ContactAddress | null;
    shopifyCustomerId?: string | null;
  }> {
    // Shopify integration disabled in demo mode
    return {};
  }

  async update(
    tenantId: string,
    contactId: string,
    input: UpdateContactInput,
    userId: string,
  ): Promise<Contact> {
    // Auto-create tags if they don't exist
    if (input.tags && input.tags.length > 0) {
      await this.ensureTagsExist(tenantId, input.tags);
    }

    const updateData: Partial<Contact> = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.email !== undefined) updateData.email = input.email.trim();
    if (input.phone !== undefined) updateData.phone = input.phone.trim();
    if (input.country_code !== undefined) updateData.country_code = input.country_code;
    if (input.whatsApp_name !== undefined)
      updateData.whatsApp_name = input.whatsApp_name?.trim() || null;
    if (input.notes !== undefined) updateData.notes = input.notes.trim();
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.address !== undefined) updateData.address = input.address ?? null;
    if (input.shopifyCustomerId !== undefined) {
      updateData.shopifyCustomerId = input.shopifyCustomerId?.trim() || null;
    }

    return this.contactRepo.update(tenantId, contactId, updateData);
  }

  async syncWithShopify(
    tenantId: string,
    contactId: string,
    _userId: string,
  ): Promise<{ contact: Contact; matched: boolean }> {
    const contact = await this.contactRepo.findById(tenantId, contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }
    // Shopify integration disabled in demo mode
    return { contact, matched: false };
  }

  async delete(tenantId: string, contactId: string): Promise<void> {
    return this.contactRepo.delete(tenantId, contactId);
  }

  async getActivityTimeline(
    _tenantId: string,
    _contactId: string,
    _options?: { excludeTicketId?: string | null },
  ): Promise<ActivityItem[]> {
    // Activity timeline disabled in demo mode (requires Firestore conversations/calls collections)
    return [];
  }

  private async ensureTagsExist(_tenantId: string, tagNames: string[]): Promise<void> {
    const now = new Date();
    for (const tagName of tagNames) {
      const normalized = tagName.trim();
      if (!normalized) continue;
      const slug = this.slugify(normalized);
      const exists = tagStore.some((t) => t.slug === slug);
      if (!exists) {
        tagStore.push({
          id: `t${Date.now()}`,
          name: normalized,
          slug,
          scopes: ['contact'],
          category: null,
          color: null,
          archived: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

function normalizeLookupInput(input: ContactLookupInput): ContactLookupInput | null {
  const name = input.name?.trim() ?? '';
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  if (!name && !email && !phone) {
    return null;
  }
  return {
    name: name || undefined,
    email: email || undefined,
    phone: phone || undefined,
  };
}

function normalizeEmail(value: string | undefined): string {
  const trimmed = value?.trim().toLowerCase() ?? '';
  return trimmed;
}

function normalizePhone(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? '';
  return trimmed;
}
