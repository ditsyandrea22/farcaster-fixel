"use client";

import { useCallback, useRef, useEffect } from "react";

// Sound URLs - using free sound effects
const SOUNDS = {
  reveal: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
  platinum: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
  gold: "https://assets.mixkit.co/active_storage/sfx/1999/1999-preview.mp3",
  silver: "https://assets.mixkit.co/active_storage/sfx/1998/1998-preview.mp3",
  uncommon: "https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.mp3",
  common: "https://assets.mixkit.co/active_storage/sfx/1996/1996-preview.mp3",
  success: "https://assets.mixkit.co/active_storage/sfx/1995/1995-preview.mp3",
  error: "https://assets.mixkit.co/active_storage/sfx/1994/1994-preview.mp3",
};

type SoundType = keyof typeof SOUNDS;

export function useSound() {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Preload sounds on mount
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, url]) => {
      if (!audioRefs.current[key]) {
        const audio = new Audio(url);
        audio.preload = "auto";
        audioRefs.current[key] = audio;
      }
    });

    return () => {
      // Cleanup audio elements
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = "";
      });
    };
  }, []);

  const playSound = useCallback((type: SoundType, volume: number = 1.0) => {
    const audio = audioRefs.current[type];
    if (audio) {
      // Clone audio to allow overlapping sounds
      const soundClone = new Audio(audio.src);
      soundClone.volume = Math.min(1, Math.max(0, volume));
      soundClone.play().catch(e => {
        console.log("Sound play error:", e);
      });
    }
  }, []);

  const playReveal = useCallback((rarity: string) => {
    // Play appropriate sound based on rarity
    switch (rarity) {
      case "PLATINUM":
        playSound("platinum", 1.0);
        break;
      case "GOLD":
        playSound("gold", 0.9);
        break;
      case "SILVER":
        playSound("silver", 0.8);
        break;
      case "UNCOMMON":
        playSound("uncommon", 0.7);
        break;
      default:
        playSound("common", 0.6);
    }
    // Also play reveal sound
    setTimeout(() => playSound("reveal", 0.8), 500);
  }, [playSound]);

  const playSuccess = useCallback(() => {
    playSound("success", 0.8);
  }, [playSound]);

  const playError = useCallback(() => {
    playSound("error", 0.6);
  }, [playSound]);

  return {
    playSound,
    playReveal,
    playSuccess,
    playError,
  };
}

export default useSound;
