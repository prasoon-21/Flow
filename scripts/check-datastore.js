'use strict';

/**
 * Utility script to inspect Firestore documents for a tenant.
 *
 * Usage:
 *   node scripts/check-datastore.js [tenantId]
 */

const path = require('path');
const dotenv = require('dotenv');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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

async function fetchCollection(db, collectionName, tenantId) {
  const snapshot = await db.collection(collectionName).where('tenantId', '==', tenantId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function main() {
  const tenantId = process.argv[2] || process.env.DEFAULT_TENANT || 'drmorepen';
  const db = getFirestoreInstance();

  console.log(`Inspecting tenant "${tenantId}" in project ${process.env.FIREBASE_PROJECT_ID}`);

  const tenantDoc = await db.collection('tenants').doc(tenantId).get();
  if (!tenantDoc.exists) {
    console.log('❌ Tenant document not found.');
    const existingTenants = await db.collection('tenants').limit(5).get();
    if (existingTenants.empty) {
      console.log('   ↳ No tenants exist in the collection.');
    } else {
      console.log(
        '   ↳ Sample tenants:',
        existingTenants.docs.map((doc) => ({ id: doc.id, name: doc.get('name') }))
      );
    }
  } else {
    console.log('✅ Tenant document found:', tenantDoc.data());
  }

  const businessDoc = await db.collection('businesses').doc(tenantId).get();
  if (!businessDoc.exists) {
    console.log('❌ Business record not found.');
  } else {
    console.log('✅ Business record found:', businessDoc.data());
  }

  const users = await fetchCollection(db, 'users', tenantId);
  console.log(`👤 Users (${users.length}):`, users.map((user) => ({ id: user.id, email: user.email, role: user.role })));

  const pages = await fetchCollection(db, 'pages', tenantId);
  console.log(
    `📄 Tenant Pages (${pages.length}):`,
    pages.map((page) => ({ id: page.id, path: page.path, moduleKey: page.moduleKey, requiredModules: page.requiredModules }))
  );

  const channels = await fetchCollection(db, 'channels', tenantId);
  console.log(
    `📡 Channels (${channels.length}):`,
    channels.map((channel) => ({ id: channel.id, type: channel.type, name: channel.name, isActive: channel.isActive }))
  );
}

main().catch((err) => {
  console.error('Failed to inspect datastore:', err);
  process.exit(1);
});
