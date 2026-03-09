import { Buffer } from 'buffer';
import { getFirestoreInstance } from '@/server/adapters/firestore';
import type { ChannelType } from '@/lib/types/page';
import { getObjectStorageService } from '@/server/services/object-storage.service';

type SenderType = 'contact' | 'agent_human';
export type MessageBodyFormat = 'text' | 'html';

export interface MessageAttachmentInput {
  id?: string;
  filename: string;
  mimeType: string;
  size?: number;
  data?: string;
  storageKey?: string;
  contentId?: string | null;
}

export interface SaveConversationMessageInput {
  channel: ChannelType;
  threadId: string;
  messageId: string;
  subject?: string | null;
  snippet?: string | null;
  body: string;
  bodyHtml?: string | null;
  bodyFormat?: MessageBodyFormat;
  senderType: SenderType;
  contact: {
    email?: string | null;
    phone?: string | null;
    name?: string | null;
  };
  sentAt?: Date | string | null;
  metadata?: Record<string, unknown>;
  participants?: string[];
  attachments?: MessageAttachmentInput[];
}

export class ConversationSyncService {
  private db = getFirestoreInstance();
  private businessRef: FirebaseFirestore.DocumentReference;

  constructor(private tenantId: string) {
    this.businessRef = this.db.collection('businesses').doc(tenantId);
  }

  async saveMessage(input: SaveConversationMessageInput): Promise<boolean> {
    const now = new Date();
    const sentAt = input.sentAt ? new Date(input.sentAt) : now;
    const contactId = await this.ensureContact(input.contact, sentAt);
    if (input.senderType === 'contact' && !contactId) {
      throw new Error('Unable to resolve contact for message');
    }

    const conversationId = `${input.channel}_${input.threadId}`;
    const conversationRef = this.businessRef.collection('conversations').doc(conversationId);
    const conversationDoc = await conversationRef.get();
    const existingData = conversationDoc.data() ?? {};
    const existingParticipants: string[] = existingData.participantEmails ?? [];
    const participantEmails = this.mergeParticipants(existingParticipants, input.participants ?? []);
    const existingLastMessageAt = coerceDate(existingData.lastMessageAt);
    const shouldUpdateLastMessage = !existingLastMessageAt || sentAt >= existingLastMessageAt;

    const conversationData = {
      channel: input.channel,
      channelThreadId: input.threadId,
      contactId: existingData.contactId ?? contactId ?? null,
      subject: existingData.subject ?? input.subject ?? null,
      lastMessageSnippet: shouldUpdateLastMessage
        ? input.snippet ?? null
        : (existingData.lastMessageSnippet as string | null | undefined) ?? null,
      lastMessageAt: shouldUpdateLastMessage ? sentAt : existingLastMessageAt ?? sentAt,
      updatedAt: now,
      participantEmails,
    };

    if (!conversationDoc.exists) {
      await conversationRef.set({
        ...conversationData,
        createdAt: sentAt,
        tags: [],
        notes: [],
      });
    } else {
      await conversationRef.set(
        {
          ...conversationData,
          tags: existingData.tags ?? [],
          notes: existingData.notes ?? [],
        },
        { merge: true }
      );
    }

    if (contactId && !existingData.contactId) {
      await conversationRef.set({ contactId }, { merge: true });
    }

    const messageRef = conversationRef.collection('messages').doc(input.messageId);
    const messageDoc = await messageRef.get();
    if (messageDoc.exists) {
      return false;
    }

    const normalizedBodyFormat: MessageBodyFormat =
      input.bodyFormat ?? (input.bodyHtml && input.bodyHtml.trim().length ? 'html' : 'text');

    await messageRef.set({
      senderType: input.senderType,
      content: input.body,
      contentHtml: input.bodyHtml ?? null,
      bodyFormat: normalizedBodyFormat,
      sentAt,
      createdAt: now,
      updatedAt: now,
      metadata: {
        messageId: input.metadata?.messageId ?? input.messageId,
        ...input.metadata,
      },
      hasAttachments: Boolean(input.attachments?.length),
    });

    if (input.attachments?.length) {
      const attachmentCount = await this.saveAttachments(
        conversationId,
        messageRef,
        input.attachments ?? []
      );
      if (attachmentCount === 0) {
        await messageRef.set({ hasAttachments: false }, { merge: true });
      }
    }

    return true;
  }

  private async ensureContact(
    contact: SaveConversationMessageInput['contact'],
    lastInteractionAt: Date
  ): Promise<string | null> {
    const contactsRef = this.businessRef.collection('contacts');
    if (contact.email) {
      const match = await contactsRef.where('email', '==', contact.email).limit(1).get();
      if (!match.empty) {
        const id = match.docs[0].id;
        await contactsRef.doc(id).set(
          { lastContactedAt: lastInteractionAt, updatedAt: new Date() },
          { merge: true }
        );
        const existing = match.docs[0].data() ?? {};
        if ((!existing.name || existing.name === 'New Contact') && contact.name) {
          await contactsRef.doc(id).set({ name: contact.name }, { merge: true });
        }
        return id;
      }
      const id = contactsRef.doc().id;
      await contactsRef.doc(id).set({
        email: contact.email,
        name: contact.name ?? 'New Contact',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastContactedAt: lastInteractionAt,
        tags: [],
      });
      return id;
    }

    if (contact.phone) {
      const match = await contactsRef.where('phone', '==', contact.phone).limit(1).get();
      if (!match.empty) {
        const id = match.docs[0].id;
        await contactsRef.doc(id).set(
          { lastContactedAt: lastInteractionAt, updatedAt: new Date() },
          { merge: true }
        );
        return id;
      }
      const id = contactsRef.doc().id;
      await contactsRef.doc(id).set({
        phone: contact.phone,
        name: contact.name ?? 'New Contact',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastContactedAt: lastInteractionAt,
        tags: [],
      });
      return id;
    }

    return null;
  }

  private mergeParticipants(existing: string[], incoming: string[]): string[] {
    const unique = new Set(
      existing
        .concat(incoming)
        .map((value) => (typeof value === 'string' ? value.toLowerCase() : null))
        .filter(Boolean) as string[]
    );
    return Array.from(unique);
  }

  private async saveAttachments(
    conversationId: string,
    messageRef: FirebaseFirestore.DocumentReference,
    attachments: MessageAttachmentInput[]
  ): Promise<number> {
    if (!attachments.length) {
      return 0;
    }

    const storage = getObjectStorageService();
    const attachmentsCol = messageRef.collection('attachments');
    let saved = 0;

    for (const attachment of attachments) {
      if (!attachment.data && !attachment.storageKey) {
        console.warn('[conversation-sync] Skipping attachment. Missing data and storage key', {
          tenantId: this.tenantId,
          conversationId,
          messageId: messageRef.id,
          attachmentId: attachment.id,
        });
        continue;
      }
      const attachmentId = attachment.id ?? attachmentsCol.doc().id;
      const storageKey =
        attachment.storageKey ??
        this.buildAttachmentStorageKey(conversationId, messageRef.id, attachmentId, attachment.filename);
      let size = attachment.size ?? 0;

      if (!attachment.storageKey && attachment.data) {
        const buffer = Buffer.from(attachment.data, 'base64');
        size = buffer.byteLength;
        await storage.uploadObject({
          key: storageKey,
          body: buffer,
          contentType: attachment.mimeType ?? 'application/octet-stream',
        });
      }

      await attachmentsCol.doc(attachmentId).set({
        filename: attachment.filename ?? 'Attachment',
        mimeType: attachment.mimeType ?? 'application/octet-stream',
        size,
        storageKey,
        storageBucket: storage.bucket,
        contentId: attachment.contentId ?? null,
        createdAt: new Date(),
      });
      console.debug('[conversation-sync] Attachment stored', {
        tenantId: this.tenantId,
        conversationId,
        messageId: messageRef.id,
        attachmentId,
        storageKey,
        size,
      });
      saved += 1;
    }

    return saved;
  }

  private buildAttachmentStorageKey(
    conversationId: string,
    messageId: string,
    attachmentId: string,
    filename: string
  ): string {
    const safeName = filename?.trim().replace(/[^a-zA-Z0-9._-]/g, '-') || 'attachment';
    return `tenants/${this.tenantId}/conversations/${conversationId}/messages/${messageId}/${attachmentId}-${safeName}`;
  }
}

function coerceDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'object' && typeof (value as FirebaseFirestore.Timestamp).toDate === 'function') {
    try {
      const asDate = (value as FirebaseFirestore.Timestamp).toDate();
      return Number.isNaN(asDate.getTime()) ? null : asDate;
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}
