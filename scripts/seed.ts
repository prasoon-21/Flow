/**
 * Seed Script
 * Seeds minimal tenant and page stubs
 */

if (!process.env.TMPDIR) {
  process.env.TMPDIR = '/tmp';
}

import 'dotenv/config';
import { getFirestoreInstance } from '@/server/adapters/firestore';
import { getConfig } from '@/lib/config/env';
import { ModuleKey } from '@/lib/types/tenant';
import { FieldValue } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';

async function seed() {
  const config = getConfig();
  console.log(`🌱 Seeding ${config.env} environment...`);

  const db = getFirestoreInstance();
  const defaultTenantId = config.defaultTenant;
  const projectKey = config.projectKey;
  const saltRounds = 10;

  async function ensureUser(
    userId: string,
    options: {
      email: string;
      name: string;
      role: 'admin' | 'agent' | 'viewer';
      password: string;
      modules?: ModuleKey[];
      capabilities?: string[];
    }
  ) {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      const passwordHash = await bcrypt.hash(options.password, saltRounds);
      await userRef.set({
        email: options.email,
        name: options.name,
        role: options.role,
        tenantId: defaultTenantId,
        modules: options.modules ?? [],
        capabilities: options.capabilities ?? [],
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Created user: ${userId}`);
      return;
    }

    const currentData = userDoc.data() ?? {};
    const updates: Record<string, unknown> = {};

    if (!currentData.passwordHash) {
      updates.passwordHash = await bcrypt.hash(options.password, saltRounds);
    }

    const shouldUpdateModules = options.modules && JSON.stringify(options.modules) !== JSON.stringify(currentData.modules ?? []);
    if (shouldUpdateModules) {
      updates.modules = options.modules;
    }

    const shouldUpdateCapabilities =
      options.capabilities && JSON.stringify(options.capabilities) !== JSON.stringify(currentData.capabilities ?? []);
    if (shouldUpdateCapabilities) {
      updates.capabilities = options.capabilities;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await userRef.update(updates);
      console.log(`🔁 Updated user: ${userId}`);
    } else {
      console.log(`ℹ️  User already up to date: ${userId}`);
    }
  }

  try {
    // Seed default tenant
    const tenantRef = db.collection('tenants').doc(defaultTenantId);
    const tenantDoc = await tenantRef.get();

    if (!tenantDoc.exists) {
      await tenantRef.set({
        name: 'DrMorePen',
        slug: defaultTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Created tenant: ${defaultTenantId}`);
    } else {
      console.log(`ℹ️  Tenant already exists: ${defaultTenantId}`);
    }

    await ensureUser('drmorepen_manisha', {
      email: 'manisha@drmorepen.com',
      name: 'Manisha (IVR Ops)',
      role: 'viewer',
      password: 'M@nish@25',
      modules: ['dashboard', 'ivr', 'email'],
    });

    await ensureUser('drmorepen_admin', {
      email: 'admin@drmorepen.com',
      name: 'Aurika Admin',
      role: 'admin',
      password: '@dmin@2025',
      modules: ['dashboard', 'email', 'whatsapp', 'chatbot', 'ivr'],
      capabilities: ['settings.manage'],
    });

    // Seed shared pages (dashboard)
    const sharedPages = [
      {
        name: 'Dashboard',
        path: '/',
        projectKey,
        tenantId: null,
        moduleKey: 'dashboard',
      },
    ];

    async function upsertPage(
      baseQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
      pageData: Record<string, unknown>
    ) {
      const snapshot = await baseQuery.limit(1).get();
      if (snapshot.empty) {
        await db.collection('pages').add({
          ...pageData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ Created page: ${pageData.path}`);
        return;
      }

      const doc = snapshot.docs[0];
      const current = doc.data();
      const updates: Record<string, unknown> = {};

      for (const key of ['projectKey', 'tenantId', 'moduleKey', 'requiredModules', 'requiredCapabilities'] as const) {
        const desired = pageData[key];
        const existing = current[key];
        if (Array.isArray(desired)) {
          const arraysEqual =
            Array.isArray(existing) &&
            desired.length === existing.length &&
            desired.every((value, index) => value === existing[index]);
          if (!arraysEqual) {
            updates[key] = desired;
          }
        } else if (desired !== undefined && desired !== existing) {
          updates[key] = desired;
        }
      }

      if (current.requiredRole !== undefined) {
        updates.requiredRole = FieldValue.delete();
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date();
        await doc.ref.update(updates);
        console.log(`🔁 Updated page metadata: ${pageData.path}`);
      } else {
        console.log(`ℹ️  Page already up to date: ${pageData.path}`);
      }
    }

    for (const pageData of sharedPages) {
      const baseQuery = db
        .collection('pages')
        .where('path', '==', pageData.path)
        .where('projectKey', '==', projectKey);
      await upsertPage(baseQuery, pageData);
    }

    // Seed tenant-specific pages
    const tenantPages = [
      { name: 'Email', path: '/email', moduleKey: 'email' },
      { name: 'WhatsApp', path: '/whatsapp', moduleKey: 'whatsapp' },
      { name: 'Chatbot', path: '/chatbot', moduleKey: 'chatbot' },
      { name: 'IVR', path: '/ivr', moduleKey: 'ivr' },
      { name: 'Contacts', path: '/contacts', moduleKey: 'dashboard' },
      { name: 'Tickets', path: '/tickets', moduleKey: 'dashboard' },
      { name: 'Tags', path: '/settings/tags', moduleKey: 'dashboard' },
    ];

    for (const pageData of tenantPages) {
      const baseQuery = db
        .collection('pages')
        .where('path', '==', pageData.path)
        .where('projectKey', '==', projectKey);

      await upsertPage(baseQuery, { ...pageData, projectKey, tenantId: null });
    }

    // Seed channels
    const channels = [
      { type: 'email', name: 'Email Channel', isActive: true },
      { type: 'whatsapp', name: 'WhatsApp Channel', isActive: true },
      { type: 'chatbot', name: 'Website Chatbot', isActive: true },
      { type: 'ivr', name: 'IVR Channel', isActive: true },
    ];

    for (const channelData of channels) {
      const channelQuery = await db
        .collection('channels')
        .where('type', '==', channelData.type)
        .where('tenantId', '==', defaultTenantId)
        .limit(1)
        .get();

      if (channelQuery.empty) {
        await db.collection('channels').add({
          ...channelData,
          tenantId: defaultTenantId,
          config: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ Created channel: ${channelData.type}`);
      } else {
        console.log(`ℹ️  Channel already exists: ${channelData.type}`);
      }
    }

    // Seed businesses structure
    const businessId = defaultTenantId;
    const businessRef = db.collection('businesses').doc(businessId);
    const businessDoc = await businessRef.get();

    if (!businessDoc.exists) {
      await businessRef.set({
        name: 'Dr. Morepen',
        industry: 'Healthcare & Wellness',
        createdAt: new Date(),
        updatedAt: new Date(),
        timezone: 'Asia/Kolkata',
      });
      console.log(`✅ Created business root: ${businessId}`);
    } else {
      console.log(`ℹ️  Business root already exists: ${businessId}`);
    }

    // Contacts
    const contacts = [
      {
        id: 'contact_sarah_johnson',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        phone: '+1 555-123-4567',
        tags: ['Premium', 'Returning'],
        notes: 'Prefers email communication. Frequent buyer of wellness products.',
      },
      {
        id: 'contact_michael_chen',
        name: 'Michael Chen',
        email: 'm.chen@techcorp.io',
        phone: '+1 555-987-6543',
        tags: ['Enterprise'],
        notes: 'Integration lead at TechCorp. Handles invoicing and API conversations.',
      },
      {
        id: 'contact_emma_wilson',
        name: 'Emma Wilson',
        email: 'emma.w@design.studio',
        phone: '+1 555-246-8101',
        tags: ['Premium'],
        notes: null,
      },
    ];

    for (const contact of contacts) {
      const contactRef = businessRef.collection('contacts').doc(contact.id);
      const contactDoc = await contactRef.get();
      if (!contactDoc.exists) {
        await contactRef.set({
          ...contact,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ Seeded contact: ${contact.id}`);
      }
    }

    // Conversations with messages (per new schema)
    const conversationSeed = [
      {
        id: 'conv_email_order_12345',
        channel: 'email',
        channelThreadId: 'email_thread_12345',
        subject: 'Order #12345 - Delivery Update',
        contactId: 'contact_sarah_johnson',
        lastMessageAt: new Date('2024-03-01T10:05:00Z'),
        lastMessageSnippet: 'Great, thank you! Could you also confirm the warranty details?',
        createdAt: new Date('2024-03-01T09:12:00Z'),
        updatedAt: new Date('2024-03-01T10:05:00Z'),
        messages: [
          {
            id: 'msg_1',
            senderType: 'contact',
            content:
              'Hi team, I wanted to check the status of my recent order. Could you confirm the expected delivery date?',
            createdAt: new Date('2024-03-01T09:12:00Z'),
          },
          {
            id: 'msg_2',
            senderType: 'agent_human',
            content:
              'Hi Sarah, thanks for reaching out. Your order is on the way and should arrive by Thursday. I will share the tracking link shortly.',
            createdAt: new Date('2024-03-01T09:30:00Z'),
          },
          {
            id: 'msg_3',
            senderType: 'contact',
            content: 'Great, thank you! Could you also confirm the warranty details?',
            createdAt: new Date('2024-03-01T10:05:00Z'),
          },
        ],
      },
      {
        id: 'conv_whatsapp_followup',
        channel: 'whatsapp',
        channelThreadId: 'wa_thread_5566',
        subject: null,
        contactId: 'contact_michael_chen',
        lastMessageAt: new Date('2024-02-28T15:30:00Z'),
        lastMessageSnippet: 'Sure thing! Sending the invoice across shortly.',
        createdAt: new Date('2024-02-28T15:05:00Z'),
        updatedAt: new Date('2024-02-28T15:30:00Z'),
        messages: [
          {
            id: 'msg_1',
            senderType: 'contact',
            content: 'Hi team, could you resend the monthly invoice for Feb?',
            createdAt: new Date('2024-02-28T15:05:00Z'),
          },
          {
            id: 'msg_2',
            senderType: 'agent_human',
            content: 'Sure thing! Sending the invoice across shortly.',
            createdAt: new Date('2024-02-28T15:30:00Z'),
          },
        ],
      },
      {
        id: 'conv_chatbot_supplement',
        channel: 'webchat',
        channelThreadId: 'chat_session_7788',
        subject: null,
        contactId: 'contact_emma_wilson',
        lastMessageAt: new Date('2024-02-27T18:47:00Z'),
        lastMessageSnippet: 'Thanks! I will review the dosage chart.',
        createdAt: new Date('2024-02-27T18:40:00Z'),
        updatedAt: new Date('2024-02-27T18:47:00Z'),
        messages: [
          {
            id: 'msg_1',
            senderType: 'contact',
            content: 'Hello! Could you help me understand the dosage for the new supplement?',
            createdAt: new Date('2024-02-27T18:40:00Z'),
          },
          {
            id: 'msg_2',
            senderType: 'agent_ai',
            content: 'Sure Emma! The recommended dosage is one capsule twice a day after meals.',
            createdAt: new Date('2024-02-27T18:42:00Z'),
          },
          {
            id: 'msg_3',
            senderType: 'contact',
            content: 'Thanks! I will review the dosage chart.',
            createdAt: new Date('2024-02-27T18:47:00Z'),
          },
        ],
      },
    ];

    for (const conversation of conversationSeed) {
      const convRef = businessRef.collection('conversations').doc(conversation.id);
      const convDoc = await convRef.get();
      if (!convDoc.exists) {
        await convRef.set({
          contactId: conversation.contactId,
          channel: conversation.channel,
          channelThreadId: conversation.channelThreadId,
          subject: conversation.subject,
          lastMessageAt: conversation.lastMessageAt,
          lastMessageSnippet: conversation.lastMessageSnippet,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        });
        for (const message of conversation.messages) {
          const msgRef = convRef.collection('messages').doc(message.id);
          await msgRef.set({
            createdAt: message.createdAt,
            senderType: message.senderType,
            content: message.content,
          });
        }
        console.log(`✅ Seeded conversation: ${conversation.id}`);
      }
    }

    // Tickets
    const tickets = [
      {
        id: 'ticket_warranty_followup',
        ticketNumber: 'T-0001',
        title: 'Warranty confirmation for order #12345',
        description: 'Customer asked for warranty details after delivery update.',
        contactId: 'contact_sarah_johnson',
        conversationId: 'conv_email_12345',
        status: 'Open',
        statusKey: 'open',
        priority: 'high',
        source: 'email',
        assignees: ['Aurika Admin'],
        tags: ['Warranty'],
        createdBy: 'drmorepen_admin',
        lastUpdatedBy: 'drmorepen_admin',
        createdAt: new Date('2024-03-01T10:10:00Z'),
        updatedAt: new Date('2024-03-01T10:10:00Z'),
        lastActivityAt: new Date('2024-03-01T10:10:00Z'),
        resolvedAt: null,
        closedAt: null,
      },
      {
        id: 'ticket_billing_invoice',
        ticketNumber: 'T-0002',
        title: 'Invoice resend request - February',
        description: 'Follow up with finance to resend February invoice.',
        contactId: 'contact_michael_chen',
        conversationId: 'conv_whatsapp_support',
        status: 'Pending',
        statusKey: 'pending',
        priority: 'medium',
        source: 'call',
        assignees: ['Operations'],
        tags: ['Billing'],
        createdBy: 'drmorepen_admin',
        lastUpdatedBy: 'drmorepen_admin',
        createdAt: new Date('2024-02-28T15:32:00Z'),
        updatedAt: new Date('2024-02-28T15:32:00Z'),
        lastActivityAt: new Date('2024-02-28T15:32:00Z'),
        resolvedAt: null,
        closedAt: null,
      },
    ];

    for (const ticket of tickets) {
      const ticketRef = businessRef.collection('tickets').doc(ticket.id);
      const ticketDoc = await ticketRef.get();
      if (!ticketDoc.exists) {
        await ticketRef.set(ticket);
        console.log(`✅ Seeded ticket: ${ticket.id}`);
      }
    }

    const orders = [
      {
        id: 'order_12345',
        contactId: 'contact_sarah_johnson',
        source: 'shopify',
        totalAmount: 129.99,
        currency: 'USD',
        status: 'fulfilled',
        placedAt: new Date('2024-02-26T08:30:00Z'),
        items: [
          { sku: 'BP-MON-001', name: 'Digital Blood Pressure Monitor', quantity: 1, price: 89.99 },
          { sku: 'VIT-C-500', name: 'Vitamin C 500mg Tablets', quantity: 2, price: 20 },
        ],
      },
      {
        id: 'order_56789',
        contactId: 'contact_emma_wilson',
        source: 'internal',
        totalAmount: 79.0,
        currency: 'USD',
        status: 'processing',
        placedAt: new Date('2024-02-27T11:15:00Z'),
        items: [{ sku: 'NEB-200', name: 'Compressor Nebulizer', quantity: 1, price: 79 }],
      },
    ];

    for (const order of orders) {
      const orderRef = businessRef.collection('orders').doc(order.id);
      const orderDoc = await orderRef.get();
      if (!orderDoc.exists) {
        await orderRef.set({
          ...order,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`✅ Seeded order: ${order.id}`);
      }
    }

    const calls = [
      {
        call_id: '9f46a7f3c7b048dbc3e05f66a7a419b7',
        from: '09599527191',
        to: '01414938005',
        direction: 'incoming',
        start_time: '2025-11-07T11:57:00Z',
        end_time: '2025-11-07T11:58:23Z',
        duration: 83,
        status: 'completed',
        recording_url: 'https://recordings.exotel.com/exotelrecordings/aurika1/9f46a7f3c7b048dbc3e05f66a7a419b7.mp3',
        dialed_number: '09311336212',
        flow_id: '1113030',
        agent_number: '09311336212',
        disconnected_by: 'Caller',
        cause: 'NORMAL_CLEARING',
        created_at: '2025-11-07T11:57:00Z',
        updated_at: '2025-11-07T11:58:34Z',
        call_type: 'completed',
      },
      {
        call_id: 'a23f78b2c7b048dbc3e05f66a7a41888',
        from: '09098112233',
        to: '01414938005',
        direction: 'incoming',
        start_time: '2025-11-07T09:15:10Z',
        end_time: '2025-11-07T09:15:45Z',
        duration: 35,
        status: 'missed',
        recording_url: null,
        dialed_number: null,
        flow_id: '1113030',
        agent_number: null,
        disconnected_by: 'System',
        cause: 'NO_ANSWER',
        created_at: '2025-11-07T09:15:10Z',
        updated_at: '2025-11-07T09:15:45Z',
        call_type: 'call-attempt',
      },
      {
        call_id: 'b56e8a9d77b048dbc3e05f66a7a41456',
        from: '09877665544',
        to: '01414938005',
        direction: 'outgoing',
        start_time: '2025-11-07T10:30:00Z',
        end_time: '2025-11-07T10:32:10Z',
        duration: 130,
        status: 'completed',
        recording_url: 'https://recordings.exotel.com/exotelrecordings/aurika1/b56e8a9d77b048dbc3e05f66a7a41456.mp3',
        dialed_number: '09877665544',
        flow_id: '1113030',
        agent_number: '01414938005',
        disconnected_by: 'Agent',
        cause: 'NORMAL_CLEARING',
        created_at: '2025-11-07T10:30:00Z',
        updated_at: '2025-11-07T10:32:10Z',
        call_type: 'completed',
      },
      {
        call_id: 'f123b7f3c7b048dbc3e05f66a7a41977',
        from: '09122334455',
        to: '01414938005',
        direction: 'incoming',
        start_time: '2025-11-07T13:25:00Z',
        end_time: '2025-11-07T13:26:12Z',
        duration: 72,
        status: 'completed',
        recording_url: 'https://recordings.exotel.com/exotelrecordings/aurika1/f123b7f3c7b048dbc3e05f66a7a41977.mp3',
        dialed_number: '09311336212',
        flow_id: '1113030',
        agent_number: '09311336212',
        disconnected_by: 'Caller',
        cause: 'NORMAL_CLEARING',
        created_at: '2025-11-07T13:25:00Z',
        updated_at: '2025-11-07T13:26:12Z',
        call_type: 'client-hangup',
      },
      {
        call_id: 'd98f7b6c9b048dbc3e05f66a7a41699',
        from: '09711002233',
        to: '01414938005',
        direction: 'outgoing',
        start_time: '2025-11-07T14:10:00Z',
        end_time: '2025-11-07T14:12:00Z',
        duration: 120,
        status: 'busy',
        recording_url: null,
        dialed_number: '09711002233',
        flow_id: '1113030',
        agent_number: '01414938005',
        disconnected_by: 'System',
        cause: 'USER_BUSY',
        created_at: '2025-11-07T14:10:00Z',
        updated_at: '2025-11-07T14:12:00Z',
        call_type: 'incomplete',
      },
      {
        call_id: 'c12bb8aa90b048dbc3e05f66a7a419aa',
        from: '09988776655',
        to: '01414938005',
        direction: 'incoming',
        start_time: '2025-11-07T15:40:00Z',
        end_time: '2025-11-07T15:42:10Z',
        duration: 130,
        status: 'voicemail',
        recording_url: null,
        dialed_number: null,
        flow_id: '1113030',
        agent_number: null,
        disconnected_by: 'System',
        cause: 'VOICEMAIL',
        created_at: '2025-11-07T15:40:00Z',
        updated_at: '2025-11-07T15:42:10Z',
        call_type: 'voicemail',
      },
    ];

    for (const call of calls) {
      const callRef = businessRef.collection('calls').doc(call.call_id);
      const callDoc = await callRef.get();
      if (!callDoc.exists) {
        await callRef.set({
          from: call.from,
          to: call.to,
          direction: call.direction,
          start_time: new Date(call.start_time),
          end_time: new Date(call.end_time),
          duration: call.duration,
          status: call.status,
          recording_url: call.recording_url,
          dialed_number: call.dialed_number,
          flow_id: call.flow_id,
          agent_number: call.agent_number,
          disconnected_by: call.disconnected_by,
          cause: call.cause,
          created_at: new Date(call.created_at),
          updated_at: new Date(call.updated_at),
          call_type: call.call_type,
        });
        console.log(`✅ Seeded call record: ${call.call_id}`);
      }
    }

    console.log(`🎉 Seed completed successfully!`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();
