import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

let firebaseApp: FirebaseApp | null = null;
let firebaseMessaging: Messaging | null = null;

export function hasFirebaseMessagingConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId
  );
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!hasFirebaseMessagingConfig()) {
    return null;
  }
  const supported = await isSupported();
  if (!supported) {
    return null;
  }
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else if (!firebaseApp) {
    firebaseApp = getApps()[0];
  }
  if (!firebaseMessaging) {
    firebaseMessaging = getMessaging(firebaseApp);
  }
  return firebaseMessaging;
}
