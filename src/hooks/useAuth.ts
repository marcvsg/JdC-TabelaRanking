import { useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, getCountFromServer, collection } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserRole } from '../lib/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const signingUp = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Skip reading role during signup — signup sets it directly
        if (!signingUp.current) {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role as UserRole);
          } else {
            // Profile deleted but user still logged in — auto logout
            await signOut(auth);
            setUser(null);
            setRole(null);
          }
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email: string, password: string) {
    signingUp.current = true;
    try {
      // Create account first (so we're authenticated for Firestore calls)
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Now check if this is the first user
      const countSnap = await getCountFromServer(collection(db, 'users'));
      const isFirst = countSnap.data().count === 0;
      const newRole: UserRole = isFirst ? 'admin' : 'viewer';

      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        role: newRole,
        createdAt: Date.now(),
      });

      setUser(cred.user);
      setRole(newRole);
      setLoading(false);
    } finally {
      signingUp.current = false;
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return { user, role, loading, login, signup, logout };
}
