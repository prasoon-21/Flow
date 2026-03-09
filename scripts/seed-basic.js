'use strict';

/**
 * Minimal JS seed script for base tenant data.
 * Runs with: node scripts/seed-basic.js
 */

const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function toDate(value) {
  if (!value) {
    return null;
  }
  return new Date(value);
}

function getFirestoreInstance() {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase credentials in environment variables');
    }

    initializeApp({
      projectId,
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return getFirestore();
}

async function ensureTenant(db, tenantId) {
  const ref = db.collection('tenants').doc(tenantId);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      name: tenantId === 'drmorepen' ? 'DrMorePen' : tenantId,
      slug: tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Tenant created: ${tenantId}`);
  } else {
    console.log(`ℹ️  Tenant already exists: ${tenantId}`);
  }
}

async function ensureUser(db, tenantId, userId, profile) {
  const ref = db.collection('users').doc(userId);
  const snap = await ref.get();
  const base = {
    email: profile.email,
    name: profile.name,
    role: profile.role,
    tenantId,
    modules: profile.modules || [],
    capabilities: profile.capabilities || [],
    updatedAt: new Date(),
  };

  if (!snap.exists) {
    const passwordHash = await bcrypt.hash(profile.password, 10);
    await ref.set({
      ...base,
      passwordHash,
      createdAt: new Date(),
    });
    console.log(`✅ User created: ${userId}`);
    return;
  }

  const data = snap.data() ?? {};
  if (!data.passwordHash) {
    const passwordHash = await bcrypt.hash(profile.password, 10);
    await ref.update({ passwordHash, ...base });
    console.log(`🔁 Password added for existing user: ${userId}`);
  } else {
    await ref.update(base);
    console.log(`ℹ️  User up to date: ${userId}`);
  }
}

async function ensurePage(db, criteria, payload) {
  const querySnap = await db
    .collection('pages')
    .where('path', '==', criteria.path)
    .where('projectKey', '==', criteria.projectKey)
    .limit(1)
    .get();

  if (querySnap.empty) {
    await db.collection('pages').add({
      name: payload.name,
      path: payload.path,
      projectKey: payload.projectKey,
      tenantId: payload.tenantId ?? null,
      moduleKey: payload.moduleKey,
      requiredModules: payload.requiredModules || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Page created: ${payload.path} (${payload.projectKey})`);
  } else {
    const doc = querySnap.docs[0];
    await doc.ref.update({
      projectKey: payload.projectKey,
      tenantId: payload.tenantId ?? null,
      moduleKey: payload.moduleKey,
      requiredModules: payload.requiredModules || [],
      requiredRole: FieldValue.delete(),
      updatedAt: new Date(),
    });
    console.log(`🔁 Page updated: ${payload.path} (${payload.projectKey})`);
  }
}

async function ensureChannel(db, tenantId, channelData) {
  const querySnap = await db
    .collection('channels')
    .where('tenantId', '==', tenantId)
    .where('type', '==', channelData.type)
    .limit(1)
    .get();

  if (querySnap.empty) {
    await db.collection('channels').add({
      ...channelData,
      tenantId,
      config: channelData.config || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Channel created: ${channelData.type}`);
  } else {
    console.log(`ℹ️  Channel already exists: ${channelData.type}`);
  }
}

async function ensureBusiness(db, tenantId) {
  const ref = db.collection('businesses').doc(tenantId);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      name: tenantId === 'drmorepen' ? 'Dr. Morepen' : tenantId,
      industry: 'General',
      timezone: 'Asia/Kolkata',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Business root created: ${tenantId}`);
  } else {
    console.log(`ℹ️  Business root already exists: ${tenantId}`);
  }
}

async function seedSampleCalls(db, tenantId) {
  const businessRef = db.collection('businesses').doc(tenantId);

  const sampleCalls = [
    {
      id: '3bf231ee82303e98510a43ec8d0d19b9',
      from: '9828845755',
      to: '1414938005',
      direction: 'incoming',
      createdAt: '2025-11-09T05:49:09+05:30',
      totalDuration: 0,
      startTime: '2025-11-09T05:49:09+05:30',
      endTime: null,
      callType: 'call-attempt',
      status: 'call-attempt',
      recordingUrl: null,
      agentNumber: null,
      flowId: '1113030',
      tenantExternalId: '396915',
      currentTime: '2025-11-09T05:49:11+05:30',
      legOne: {
        agentNumber: null,
        disconnectedBy: null,
        duration: null,
        causeCode: null,
      },
      legTwo: {
        agentNumber: null,
        disconnectedBy: null,
        duration: null,
        causeCode: null,
      },
    },
    {
      id: '8d8b59fc863235a1ffad6139207e19ba',
      from: '7070597004',
      to: '1414938005',
      direction: 'incoming',
      createdAt: '2025-11-10T10:40:33+05:30',
      totalDuration: 95,
      startTime: '2025-11-10T10:40:33+05:30',
      endTime: null,
      callType: 'completed',
      status: 'completed',
      recordingUrl: 'https://recordings.exotel.com/exotelrecordings/aurika1/8d8b59fc863235a1ffad6139207e19ba.mp3',
      agentNumber: '9311336212',
      flowId: '1113030',
      tenantExternalId: '396915',
      currentTime: '2025-11-10T10:42:18+05:30',
      legOne: {
        agentNumber: '9311336212',
        disconnectedBy: 'Caller',
        duration: 90,
        causeCode: 'NORMAL_CLEARING',
      },
      legTwo: {
        agentNumber: null,
        disconnectedBy: null,
        duration: null,
        causeCode: null,
      },
    },
    {
      id: 'f10e6fea9e74fd3bc13e709d36e219ba',
      from: '7985126224',
      to: '1414938005',
      direction: 'incoming',
      createdAt: '2025-11-10T10:40:45+05:30',
      totalDuration: 450,
      startTime: '2025-11-10T10:40:45+05:30',
      endTime: '2025-11-10T10:48:15+05:30',
      callType: 'completed',
      status: 'completed',
      recordingUrl: 'https://recordings.exotel.com/exotelrecordings/aurika1/f10e6fea9e74fd3bc13e709d36e219ba.mp3',
      agentNumber: '9311336212',
      flowId: '1113030',
      tenantExternalId: '396915',
      currentTime: '2025-11-10T10:49:52+05:30',
      legOne: {
        agentNumber: '9311309384',
        disconnectedBy: 'Exotel',
        duration: 0,
        causeCode: 'NORMAL_CLEARING',
      },
      legTwo: {
        agentNumber: '9311336212',
        disconnectedBy: 'Caller',
        duration: 445,
        causeCode: 'NORMAL_CLEARING',
      },
    },
  ];

  for (const call of sampleCalls) {
    const answeringLeg =
      call.agentNumber && call.legOne.agentNumber === call.agentNumber
        ? call.legOne
        : call.agentNumber && call.legTwo.agentNumber === call.agentNumber
          ? call.legTwo
          : call.legTwo.agentNumber
            ? call.legTwo
            : call.legOne;

    const callRef = businessRef.collection('calls').doc(call.id);
    const payload = {
      from: call.from,
      to: call.to,
      direction: call.direction,
      created_at: toDate(call.createdAt) ?? new Date(),
      start_time: toDate(call.startTime),
      end_time: toDate(call.endTime),
      duration: call.totalDuration,
      total_duration: call.totalDuration,
      status: call.status,
      recording_url: call.recordingUrl ?? null,
      dialed_number: call.agentNumber ?? null,
      flow_id: call.flowId,
      tenant_id: call.tenantExternalId ?? null,
      current_time: toDate(call.currentTime),
      call_type: call.callType,
      agent_number: call.agentNumber ?? null,
      disconnected_by: answeringLeg.disconnectedBy ?? null,
      cause: answeringLeg.causeCode ?? null,
      updated_at: toDate(call.currentTime) ?? toDate(call.createdAt) ?? new Date(),
      l1_agent_number: call.legOne.agentNumber ?? null,
      l1_disconnected_by: call.legOne.disconnectedBy ?? null,
      l1_call_duration: call.legOne.duration ?? null,
      l1_cause_code: call.legOne.causeCode ?? null,
      l2_agent_number: call.legTwo.agentNumber ?? null,
      l2_disconnected_by: call.legTwo.disconnectedBy ?? null,
      l2_call_duration: call.legTwo.duration ?? null,
      l2_cause_code: call.legTwo.causeCode ?? null,
    };

    const callDoc = await callRef.get();
    if (!callDoc.exists) {
      await callRef.set(payload);
      console.log(`✅ Seeded IVR call: ${call.id}`);
    } else {
      await callRef.update(payload);
      console.log(`🔁 Updated IVR call: ${call.id}`);
    }
  }
}

async function main() {
  const tenantId = process.env.DEFAULT_TENANT || 'drmorepen';
  const projectKey = process.env.PROJECT_KEY || 'engage';
  const db = getFirestoreInstance();
  const project = process.env.FIREBASE_PROJECT_ID || '<unknown>';

  console.log(`🌱 Seeding base data for tenant "${tenantId}" on project "${project}"`);

  await ensureTenant(db, tenantId);

  await ensureUser(db, tenantId, `${tenantId}_admin`, {
    email: `admin@${tenantId}.com`,
    name: 'Aurika Admin',
    role: 'admin',
    password: '@dmin@2025',
    modules: ['dashboard', 'email', 'whatsapp', 'chatbot', 'ivr'],
  });

  await ensureUser(db, tenantId, `${tenantId}_ops`, {
    email: `ops@${tenantId}.com`,
    name: 'Operations',
    role: 'viewer',
    password: 'Oper@tions1',
    modules: ['dashboard', 'ivr'],
  });

  await ensurePage(
    db,
    { path: '/', projectKey },
    { name: 'Dashboard', path: '/', projectKey, tenantId: null, moduleKey: 'dashboard' }
  );

  const tenantPages = [
    { name: 'Email', path: '/email', moduleKey: 'email' },
    { name: 'WhatsApp', path: '/whatsapp', moduleKey: 'whatsapp' },
    { name: 'Chatbot', path: '/chatbot', moduleKey: 'chatbot' },
    { name: 'IVR', path: '/ivr', moduleKey: 'ivr' },
    { name: 'Tickets', path: '/tickets', moduleKey: 'dashboard' },
  ];

  for (const page of tenantPages) {
    await ensurePage(db, { path: page.path, projectKey }, { ...page, projectKey, tenantId: null });
  }

  const channels = [
    { type: 'email', name: 'Email Channel', isActive: true },
    { type: 'whatsapp', name: 'WhatsApp Channel', isActive: true },
    { type: 'chatbot', name: 'Website Chatbot', isActive: true },
    { type: 'ivr', name: 'IVR Channel', isActive: true },
  ];

  for (const channel of channels) {
    await ensureChannel(db, tenantId, channel);
  }

  await ensureBusiness(db, tenantId);
  await seedSampleCalls(db, tenantId);

  console.log('✅ Seed complete.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
