import { auth, db } from '../services/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export function useFirebase() {
  const [user, loading, error] = useAuthState(auth);

  return {
    user,
    loading,
    error,
    db,
    auth,
    // Add common helpers
    isLoggedIn: !!user,
    uid: user?.uid
  };
}
