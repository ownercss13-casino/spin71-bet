import { useState, useEffect, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface GameSession {
  gameId: string;
  multiplier: number;
  status: 'waiting' | 'running' | 'crashed';
  crashPoint: number;
  startTime: any;
  lastUpdate: any;
  history: number[];
}

export function useLiveAviator() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [isController, setIsController] = useState(false);
  const controllerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sessionRef = doc(db, 'game_sessions', 'aviator');
    
    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GameSession;
        setSession(data);

        // Check if we should take over as controller
        const lastUpdate = data.lastUpdate?.toDate?.() || new Date(0);
        const now = new Date();
        const diff = now.getTime() - lastUpdate.getTime();

        if (diff > 5000 && !isController) {
          setIsController(true);
        }
      } else {
        // Initialize session if it doesn't exist
        setDoc(sessionRef, {
          gameId: 'aviator',
          multiplier: 1.00,
          status: 'waiting',
          crashPoint: 2.00,
          startTime: serverTimestamp(),
          lastUpdate: serverTimestamp(),
          history: []
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'game_sessions/aviator'));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'game_sessions/aviator'));

    return () => unsubscribe();
  }, [isController]);

  // Controller logic to update the multiplier
  useEffect(() => {
    if (!isController) return;

    const interval = setInterval(async () => {
      if (!session) return;

      const sessionRef = doc(db, 'game_sessions', 'aviator');
      const now = new Date();

      if (session.status === 'waiting') {
        const startTime = session.startTime?.toDate?.() || now;
        const diff = (now.getTime() - startTime.getTime()) / 1000;
        
        if (diff >= 5) { // 5 seconds betting time
          const rand = Math.random();
          const crashPoint = Number((1 + Math.pow(rand, 2) * 14).toFixed(2));
          
          await updateDoc(sessionRef, {
            status: 'running',
            multiplier: 1.00,
            crashPoint,
            startTime: serverTimestamp(),
            lastUpdate: serverTimestamp()
          });
        } else {
          await updateDoc(sessionRef, {
            lastUpdate: serverTimestamp()
          });
        }
      } else if (session.status === 'running') {
        const startTime = session.startTime?.toDate?.() || now;
        const elapsed = (now.getTime() - startTime.getTime()) / 1000;
        
        // Aviator multiplier formula: 1.00 * e^(0.1 * t)
        const newMultiplier = Number(Math.pow(1.06, elapsed).toFixed(2));

        if (newMultiplier >= session.crashPoint) {
          const newHistory = [session.crashPoint, ...(session.history || [])].slice(0, 20);
          await updateDoc(sessionRef, {
            status: 'crashed',
            multiplier: session.crashPoint,
            lastUpdate: serverTimestamp(),
            history: newHistory,
            startTime: serverTimestamp() // Reset timer for waiting phase
          });
        } else {
          await updateDoc(sessionRef, {
            multiplier: newMultiplier,
            lastUpdate: serverTimestamp()
          });
        }
      } else if (session.status === 'crashed') {
        const startTime = session.startTime?.toDate?.() || now;
        const diff = (now.getTime() - startTime.getTime()) / 1000;

        if (diff >= 3) { // 3 seconds crashed state
          await updateDoc(sessionRef, {
            status: 'waiting',
            multiplier: 1.00,
            startTime: serverTimestamp(),
            lastUpdate: serverTimestamp()
          });
        } else {
          await updateDoc(sessionRef, {
            lastUpdate: serverTimestamp()
          });
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isController, session]);

  return { session, isController };
}
