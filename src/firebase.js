import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Placeholder configuration. To enable real Firebase, replace these with your project configuration.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if configuration has been updated
export const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.startsWith("YOUR_");

let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Firebase initialization failed. Falling back to Demo Mode.", error);
    auth = null;
    db = null;
  }
} else {
  console.warn("Sylva is running in Local Demo Mode because Firebase configuration has not been set up in src/firebase.js.");
}

// Simulated Auth & Firestore for Demo Mode
const DEMO_USER = {
  uid: "demo-sylva-user-999",
  displayName: "Eco Enthusiast",
  email: "enthusiast@sylva.dev",
  photoURL: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150"
};

const demoAuthListeners = new Set();
let currentDemoUser = localStorage.getItem("sylva_demo_user_active") === "true" ? DEMO_USER : null;

// Auth functions
export function loginWithGoogle() {
  if (isFirebaseConfigured && auth && googleProvider) {
    return signInWithPopup(auth, googleProvider);
  } else {
    return new Promise((resolve) => {
      setTimeout(() => {
        currentDemoUser = DEMO_USER;
        localStorage.setItem("sylva_demo_user_active", "true");
        demoAuthListeners.forEach(cb => cb(currentDemoUser));
        resolve({ user: currentDemoUser });
      }, 600);
    });
  }
}

export function logout() {
  if (isFirebaseConfigured && auth) {
    return fbSignOut(auth);
  } else {
    return new Promise((resolve) => {
      currentDemoUser = null;
      localStorage.removeItem("sylva_demo_user_active");
      demoAuthListeners.forEach(cb => cb(null));
      resolve();
    });
  }
}

export function subscribeToAuth(callback) {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, callback);
  } else {
    demoAuthListeners.add(callback);
    // Trigger initial call asynchronously
    setTimeout(() => {
      callback(currentDemoUser);
    }, 0);
    return () => {
      demoAuthListeners.delete(callback);
    };
  }
}

// Database helper functions
export async function saveUserData(uid, data) {
  if (isFirebaseConfigured && db) {
    try {
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, data, { merge: true });
      return true;
    } catch (error) {
      console.error("Error saving data to Firestore:", error);
      return false;
    }
  } else {
    // Simulated cloud save in Local Storage for demo mode
    localStorage.setItem(`sylva_demo_cloud_db_${uid}`, JSON.stringify(data));
    return true;
  }
}

export async function fetchUserData(uid) {
  if (isFirebaseConfigured && db) {
    try {
      const userDocRef = doc(db, "users", uid);
      const snapshot = await getDoc(userDocRef);
      if (snapshot.exists()) {
        return snapshot.data();
      }
      return null;
    } catch (error) {
      console.error("Error fetching data from Firestore:", error);
      return null;
    }
  } else {
    const localCloudData = localStorage.getItem(`sylva_demo_cloud_db_${uid}`);
    return localCloudData ? JSON.parse(localCloudData) : null;
  }
}
