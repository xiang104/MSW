import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
};

let appInstance = null;
let databaseInstance = null;
let storageInstance = null;
let appCheckInitialized = false;

function initAppCheck(app) {
  if (appCheckInitialized) return;

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
  if (!recaptchaSiteKey) return;

  if (import.meta.env.DEV) {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });

  appCheckInitialized = true;
}

function ensureApp() {
  if (!appInstance) {
    appInstance = initializeApp(firebaseConfig);
    initAppCheck(appInstance);
  }
  return appInstance;
}

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL);
}

export function isStorageConfigured() {
  return Boolean(firebaseConfig.storageBucket);
}

export function getDb() {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!databaseInstance) {
    databaseInstance = getDatabase(ensureApp());
  }

  return databaseInstance;
}

export function getStorageInstance() {
  if (!isStorageConfigured()) {
    return null;
  }

  if (!storageInstance) {
    storageInstance = getStorage(ensureApp());
  }

  return storageInstance;
}

export { firebaseConfig };
