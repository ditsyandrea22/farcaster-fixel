"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX, Speaker } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SoundToggleProps {
  className?: string;
}

export function SoundToggle({ className = "" }: SoundToggleProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load sound preference from localStorage
    const stored = localStorage.getItem("soundEnabled");
    if (stored !== null) {
      setSoundEnabled(JSON.parse(stored));
    }
  }, []);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem("soundEnabled", JSON.stringify(newValue));
  };

  if (!mounted) {
    return null;
  }

  return (
    <Button
      onClick={toggleSound}
      variant="ghost"
      size="sm"
      className={className}
      style={{ color: soundEnabled ? "#10B981" : "#666" }}
      title={soundEnabled ? "Mute sounds" : "Enable sounds"}
    >
      {soundEnabled ? (
        <Volume2 className="w-5 h-5" />
      ) : (
        <VolumeX className="w-5 h-5" />
      )}
    </Button>
  );
}

export function getSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("soundEnabled");
  if (stored === null) return true;
  return JSON.parse(stored);
}

export default SoundToggle;
