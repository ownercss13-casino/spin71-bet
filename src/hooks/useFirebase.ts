import { auth, db, getActiveUser } from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useState, useEffect } from 'react';

export function useFirebase() {
  const [firebaseUser, loading, error] = useAuthState(auth);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Priority 1: Real Firebase User
    if (firebaseUser) {
      setUser(firebaseUser);
      return;
    }

    // Priority 2: Mock Session User
    const mockUser = getActiveUser();
    if (mockUser) {
      setUser(mockUser);
    } else {
      setUser(null);
    }
  }, [firebaseUser]);

  return {
    user,
    loading,
    error,
    db,
    auth,
    // Use the potentially-mocked user for these helpers
    isLoggedIn: !!user,
    uid: user?.uid
  };
}
