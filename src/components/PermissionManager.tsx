import React, { useEffect, useState } from 'react';
import { Shield, Camera, Mic, MapPin, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PermissionState {
  camera: PermissionStatus | 'prompt' | 'granted' | 'denied';
  microphone: PermissionStatus | 'prompt' | 'granted' | 'denied';
  geolocation: PermissionStatus | 'prompt' | 'granted' | 'denied';
}

export default function PermissionManager() {
  useEffect(() => {
    let hasRequested = false;

    const requestAllPermissions = async () => {
      if (hasRequested) return;
      hasRequested = true;

      // Request Geolocation
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => console.log("Geolocation granted"),
          (err) => console.log("Geolocation error:", err.message),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }

      // Request Camera & Mic
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const tryMediaAccess = async () => {
          try {
            // Try combined first
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            stream.getTracks().forEach(track => track.stop());
            console.log("Media permissions granted (combined)");
            return true;
          } catch (error: any) {
            console.log("Combined media access error:", error.name || error.message);
            
            // Try separately if combined fails
            try {
              const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
              videoStream.getTracks().forEach(track => track.stop());
              console.log("Camera permission granted (separate)");
            } catch (vErr: any) {
              console.log("Camera access error:", vErr.name || vErr.message);
            }

            try {
              const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              audioStream.getTracks().forEach(track => track.stop());
              console.log("Microphone permission granted (separate)");
            } catch (aErr: any) {
              console.log("Microphone access error:", aErr.name || aErr.message);
            }
            
            return false;
          }
        };

        const success = await tryMediaAccess();
        
        if (!success) {
          // If it failed because of a missing gesture or other transient issue, 
          // we'll try again on the first user interaction
          const handleFirstInteraction = async () => {
            const retrySuccess = await tryMediaAccess();
            if (retrySuccess) {
              window.removeEventListener('click', handleFirstInteraction);
              window.removeEventListener('touchstart', handleFirstInteraction);
            }
          };

          window.addEventListener('click', handleFirstInteraction, { once: true });
          window.addEventListener('touchstart', handleFirstInteraction, { once: true });
        }
      }
    };

    // Try immediately
    requestAllPermissions();

    // Also try on first interaction just in case the immediate one was blocked by browser policy
    const initialTrigger = () => {
      requestAllPermissions();
      window.removeEventListener('click', initialTrigger);
      window.removeEventListener('touchstart', initialTrigger);
    };
    window.addEventListener('click', initialTrigger, { once: true });
    window.addEventListener('touchstart', initialTrigger, { once: true });

    return () => {
      window.removeEventListener('click', initialTrigger);
      window.removeEventListener('touchstart', initialTrigger);
    };
  }, []);

  return null;
}
