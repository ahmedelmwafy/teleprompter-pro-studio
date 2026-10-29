import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  query,
  orderBy 
} from 'firebase/firestore';
import { Episode } from '../types';

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyADk4pZiY43dmmWfm4fsPgAXvGWrqJASEI",
  authDomain: "binrushd-mobile-app.firebaseapp.com",
  projectId: "binrushd-mobile-app",
  storageBucket: "binrushd-mobile-app.firebasestorage.app",
  messagingSenderId: "1019581044361",
  appId: "1:1019581044361:web:808fec63b5a01ad6c11858",
  measurementId: "G-XMPNSSTWJ0"
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

class FirebaseAuthService {
  /**
   * Sign in with Google Popup
   */
  async loginWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } catch (error: any) {
      console.error('Google Sign-in error:', error);
      return { 
        success: false, 
        error: error.code === 'auth/popup-closed-by-user' 
          ? 'تم إغلاق نافذة تسجيل الدخول' 
          : (error.message || 'فشل تسجيل الدخول عبر Google') 
      };
    }
  }

  /**
   * Log out
   */
  async logout(): Promise<void> {
    await signOut(auth);
  }

  /**
   * Listen to Auth State
   */
  onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Fetch all user episodes from Firestore
   */
  async getUserEpisodes(userId: string): Promise<Episode[]> {
    try {
      const epRef = collection(db, 'users', userId, 'episodes');
      const q = query(epRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const episodes: Episode[] = [];
      snapshot.forEach(docSnap => {
        episodes.push(docSnap.data() as Episode);
      });
      return episodes;
    } catch (e) {
      console.error('Failed to fetch user episodes from Firestore:', e);
      return [];
    }
  }

  /**
   * Save or update single episode in Firestore
   */
  async saveUserEpisode(userId: string, episode: Episode): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId, 'episodes', episode.id);
      await setDoc(docRef, { ...episode, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Failed to save episode to Firestore:', e);
    }
  }

  /**
   * Delete episode from Firestore
   */
  async deleteUserEpisode(userId: string, episodeId: string): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId, 'episodes', episodeId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Failed to delete episode from Firestore:', e);
    }
  }

  /**
   * Sync local episodes up to Firestore
   */
  async syncLocalEpisodesToCloud(userId: string, localEpisodes: Episode[]): Promise<void> {
    try {
      for (const ep of localEpisodes) {
        await this.saveUserEpisode(userId, ep);
      }
    } catch (e) {
      console.error('Failed to sync local episodes:', e);
    }
  }
}

export const firebaseAuth = new FirebaseAuthService();
