import { useState, useEffect, useRef } from 'react';

export interface RocketSession {
  gameId: string;
  multiplier: number;
  status: 'waiting' | 'running' | 'crashed';
  crashPoint: number;
  startTime: number;
  lastUpdate: number;
  history: number[];
}

export function useLiveRocket() {
  const [session, setSession] = useState<RocketSession>({
    gameId: 'rocket',
    multiplier: 1.00,
    status: 'waiting',
    crashPoint: 2.00,
    startTime: Date.now(),
    lastUpdate: Date.now(),
    history: [2.5, 1.2, 4.8, 1.1, 15.2, 3.4, 1.9, 1.05, 5.2, 2.1]
  });
  
  const sessionRef = useRef<RocketSession>(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const current = sessionRef.current;
      
      if (current.status === 'waiting') {
        const diff = (now - current.startTime) / 1000;
        if (diff >= 6) { // 6 seconds waiting time between rounds
          // Generate crash point with exponential distribution for "house edge" feel
          const crashPoint = Number((1 + Math.pow(Math.random(), 2.8) * 40).toFixed(2));
          setSession({
            ...current,
            status: 'running',
            multiplier: 1.00,
            crashPoint,
            startTime: now,
            lastUpdate: now
          });
        }
      } else if (current.status === 'running') {
        const startTime = current.startTime;
        const elapsed = (now - startTime) / 1000;
        
        // Slightly different growth curve for Rocket: 1.08^t (faster than Aviator's 1.06)
        const nextMultiplier = Number(Math.pow(1.08, elapsed).toFixed(2));
        
        if (nextMultiplier >= current.crashPoint) {
          setSession({
            ...current,
            status: 'crashed',
            multiplier: current.crashPoint,
            lastUpdate: now,
            startTime: now // reset for crash phase
          });
        } else {
          setSession({
            ...current,
            multiplier: nextMultiplier,
            lastUpdate: now
          });
        }
      } else if (current.status === 'crashed') {
        const diff = (now - current.startTime) / 1000;
        if (diff >= 4) { // 4 seconds crash display
          setSession(prev => ({
            ...prev,
            status: 'waiting',
            multiplier: 1.00,
            startTime: now,
            lastUpdate: now,
            history: [prev.multiplier, ...prev.history].slice(0, 20)
          }));
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return { session };
}
