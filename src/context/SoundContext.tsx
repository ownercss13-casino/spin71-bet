import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export type SoundType = 'click' | 'win' | 'loss' | 'bet' | 'crash' | 'takeoff' | 'cashout' | 'deposit_success' | 'flew_away';

interface SoundContextType {
  bgmVolume: number;
  sfxVolume: number;
  soundEnabled: boolean;
  setBgmVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  toggleSound: () => void;
  playSound: (soundType: SoundType) => void;
  startBgm: () => void;
  stopBgm: () => void;
  updateEngineSound: (multiplier: number) => void;
  stopEngineSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Delightful arpeggiator looping melodies representing classic electronic casino games (like Spribe Aviator)
// C Major, G Major, A Minor, F Major arpeggiations to form a rich background pad/melody
const CHORD_PROGRESSION = [
  [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63, 392.00], // C
  [196.00, 246.94, 293.66, 392.00, 293.66, 246.94, 196.00, 293.66], // G
  [220.00, 261.63, 329.63, 440.00, 329.63, 261.63, 220.00, 329.63], // Am
  [174.61, 220.00, 261.63, 349.23, 261.63, 220.00, 174.61, 261.63]  // F
];

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.5);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Background Music (BGM) Sequencer state
  const isBgmRequestedRef = useRef(false);
  const bgmIntervalIdRef = useRef<any>(null);
  const bgmStepRef = useRef(0);
  const bgmMasterGainRef = useRef<GainNode | null>(null);
  const sfxMasterGainRef = useRef<GainNode | null>(null);

  // Engine sound synthesis state
  const engineOnRef = useRef(false);
  const engineOsc1Ref = useRef<OscillatorNode | null>(null);
  const engineOsc2Ref = useRef<OscillatorNode | null>(null);
  const engineLfoRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null); // This will need to be connected to sfxMasterGain

  useEffect(() => {
    const savedBgm = localStorage.getItem('bgm_volume');
    const savedSfx = localStorage.getItem('sfx_volume');
    if (savedBgm !== null) setBgmVolume(parseFloat(savedBgm));
    if (savedSfx !== null) setSfxVolume(parseFloat(savedSfx));
  }, []);

  useEffect(() => {
    localStorage.setItem('bgm_volume', String(bgmVolume));
    if (bgmMasterGainRef.current && audioCtxRef.current) {
        bgmMasterGainRef.current.gain.linearRampToValueAtTime(bgmVolume, audioCtxRef.current.currentTime + 0.1);
    }
  }, [bgmVolume]);

  useEffect(() => {
    localStorage.setItem('sfx_volume', String(sfxVolume));
    if (sfxMasterGainRef.current && audioCtxRef.current) {
        sfxMasterGainRef.current.gain.linearRampToValueAtTime(sfxVolume, audioCtxRef.current.currentTime + 0.1);
    }
  }, [sfxVolume]);

  const toggleSound = () => setSoundEnabled(!soundEnabled);

  const ensureAudioCtx = () => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const sfxMasterGain = audioCtxRef.current.createGain();
        sfxMasterGain.gain.setValueAtTime(sfxVolume, audioCtxRef.current.currentTime);
        sfxMasterGain.connect(audioCtxRef.current.destination);
        sfxMasterGainRef.current = sfxMasterGain;
    }
    if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playBgmStep = (ctx: AudioContext, step: number, synthGain: GainNode) => {
    try {
      const bar = Math.floor(step / 8) % 4;
      const noteIdx = step % 8;
      const freq = CHORD_PROGRESSION[bar][noteIdx];

      const osc = ctx.createOscillator();
      const stepGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle'; // Warm retro tone
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime); // Soft, non-piercing high cut

      osc.connect(filter);
      filter.connect(stepGain);
      stepGain.connect(synthGain);

      const now = ctx.currentTime;
      stepGain.gain.setValueAtTime(0, now);
      // Clean, pop-free attack/decay envelopes
      stepGain.gain.linearRampToValueAtTime(0.04, now + 0.02);
      stepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (_) {}
  };

  const startBgm = () => {
    isBgmRequestedRef.current = true;
    if (bgmIntervalIdRef.current) return;

    try {
      const ctx = ensureAudioCtx();

      const masterBgmGain = ctx.createGain();
      masterBgmGain.gain.setValueAtTime(0, ctx.currentTime);
      masterBgmGain.gain.linearRampToValueAtTime(bgmVolume, ctx.currentTime + 1.0);
      masterBgmGain.connect(ctx.destination);
      bgmMasterGainRef.current = masterBgmGain;

      bgmStepRef.current = 0;
      bgmIntervalIdRef.current = setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended') return;
        playBgmStep(audioCtxRef.current, bgmStepRef.current, masterBgmGain);
        bgmStepRef.current = (bgmStepRef.current + 1) % 32;
      }, 230);
    } catch (e) {
      console.warn("[SoundContext] Failed to start lobby arpeggiator:", e);
    }
  };

  const stopBgm = () => {
    isBgmRequestedRef.current = false;
    if (bgmIntervalIdRef.current) {
      clearInterval(bgmIntervalIdRef.current);
      bgmIntervalIdRef.current = null;
    }
    if (bgmMasterGainRef.current) {
      try {
        bgmMasterGainRef.current.disconnect();
      } catch (_) {}
      bgmMasterGainRef.current = null;
    }
  };

  const updateEngineSound = (multiplier: number) => {
    try {
      const ctx = ensureAudioCtx();

      // Propeller pitch scales smoothly up from 65Hz mimicking ascending revving turbine engine sound
      const targetFreq1 = 62 + Math.min(multiplier - 1.0, 15.0) * 12.5; 
      const targetFreq2 = targetFreq1 * 0.985; // Detuned down 1.5% for mechanical chorus/beating vibrato

      if (!engineOnRef.current) {
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(targetFreq1, ctx.currentTime);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(targetFreq2, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(160, ctx.currentTime); // Deep warm mechanical hum

        // Propeller frequency vibration
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(8 + (multiplier * 0.4), ctx.currentTime);

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(10, ctx.currentTime); // pitch mod scale

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.04, ctx.currentTime); 

        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        
        // Connect to sfxMasterGain instead of ctx.destination
        if (sfxMasterGainRef.current) {
            gainNode.connect(sfxMasterGainRef.current);
        } else {
             gainNode.connect(ctx.destination);
        }

        osc1.start();
        osc2.start();
        lfo.start();

        engineOsc1Ref.current = osc1;
        engineOsc2Ref.current = osc2;
        engineLfoRef.current = lfo;
        engineGainRef.current = gainNode;
        engineOnRef.current = true;
      } else {
        const now = ctx.currentTime;
        if (engineOsc1Ref.current) {
          engineOsc1Ref.current.frequency.exponentialRampToValueAtTime(targetFreq1, now + 0.15);
        }
        if (engineOsc2Ref.current) {
          engineOsc2Ref.current.frequency.exponentialRampToValueAtTime(targetFreq2, now + 0.15);
        }
        if (engineLfoRef.current) {
          engineLfoRef.current.frequency.setValueAtTime(8 + (multiplier * 0.4), now);
        }
      }
    } catch (e) {
      console.warn("[SoundContext] Engine simulation failed:", e);
    }
  };

  const stopEngineSound = () => {
    engineOnRef.current = false;
    try {
      if (engineOsc1Ref.current) {
        engineOsc1Ref.current.stop();
        engineOsc1Ref.current.disconnect();
        engineOsc1Ref.current = null;
      }
      if (engineOsc2Ref.current) {
        engineOsc2Ref.current.stop();
        engineOsc2Ref.current.disconnect();
        engineOsc2Ref.current = null;
      }
      if (engineLfoRef.current) {
        engineLfoRef.current.stop();
        engineLfoRef.current.disconnect();
        engineLfoRef.current = null;
      }
      if (engineGainRef.current) {
        engineGainRef.current.disconnect();
        engineGainRef.current = null;
      }
    } catch (_) {}
  };

  const playSynthesizedSound = (type: SoundType) => {
    try {
      const ctx = ensureAudioCtx();

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      if (sfxMasterGainRef.current) {
          gainNode.connect(sfxMasterGainRef.current);
      } else {
          gainNode.connect(ctx.destination);
      }

      const now = ctx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'bet') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.linearRampToValueAtTime(580, now + 0.08);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'win' || type === 'cashout') {
        // Sparkling major arpeggio cascades
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const singleOsc = ctx.createOscillator();
          const singleGain = ctx.createGain();

          singleOsc.type = 'sine';
          singleOsc.frequency.setValueAtTime(freq, now + idx * 0.05);

          singleGain.gain.setValueAtTime(0.2, now + idx * 0.05);
          singleGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

          singleOsc.connect(singleGain);
          singleGain.connect(ctx.destination);

          singleOsc.start(now + idx * 0.05);
          singleOsc.stop(now + idx * 0.05 + 0.35);
        });
      } else if (type === 'loss' || type === 'crash' || type === 'flew_away') {
        // Ascending-to-descending mechanical down sweep
        const sweepOsc = ctx.createOscillator();
        sweepOsc.type = 'sawtooth';
        sweepOsc.frequency.setValueAtTime(140, now);
        sweepOsc.frequency.exponentialRampToValueAtTime(15, now + 1.2);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, now);

        const sweepGain = ctx.createGain();
        sweepGain.gain.setValueAtTime(0.3, now);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        sweepOsc.connect(filter);
        filter.connect(sweepGain);
        sweepGain.connect(ctx.destination);

        sweepOsc.start(now);
        sweepOsc.stop(now + 1.2);

        // Heavy wind rush using real time synthesized bandpass modulated White Noise buffer
        try {
          const bufferSize = ctx.sampleRate * 1.5;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }

          const noiseNode = ctx.createBufferSource();
          noiseNode.buffer = buffer;

          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.setValueAtTime(750, now);
          noiseFilter.frequency.exponentialRampToValueAtTime(140, now + 1.4);
          noiseFilter.Q.setValueAtTime(2.2, now);

          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.2, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

          noiseNode.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(ctx.destination);

          noiseNode.start(now);
          noiseNode.stop(now + 1.4);
        } catch (_) {}
      } else if (type === 'takeoff') {
        // High-pitched launch warning signal with small pitch rise
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(440, now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);

        const ping = ctx.createOscillator();
        ping.type = 'triangle';
        ping.frequency.setValueAtTime(720, now);
        ping.frequency.linearRampToValueAtTime(960, now + 0.12);

        const pingGain = ctx.createGain();
        pingGain.gain.setValueAtTime(0.2, now);
        pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        ping.connect(pingGain);
        pingGain.connect(ctx.destination);
        ping.start(now);
        ping.stop(now + 0.12);
      } else if (type === 'deposit_success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        osc.frequency.setValueAtTime(1046.50, now + 0.24);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.43);
      }
    } catch (e) {
      console.warn('[SoundContext] Synthesized sound failed:', e);
    }
  };

  const playSound = (soundType: SoundType) => {
    playSynthesizedSound(soundType);
  };

  return (
    <SoundContext.Provider value={{ 
      bgmVolume, 
      sfxVolume,
      setBgmVolume,
      setSfxVolume,
      playSound,
      startBgm,
      stopBgm,
      updateEngineSound,
      stopEngineSound,
      soundEnabled,
      toggleSound
    }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
