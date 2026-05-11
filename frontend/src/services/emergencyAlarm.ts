import type { AlertPayload } from "./alertSocket";

const STORAGE_KEY = "quakeguard_emergency";

let audio: HTMLAudioElement | null = null;
let vibrationInterval: number | null = null;

export function getStoredEmergency(): AlertPayload | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeEmergency(alert: AlertPayload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alert));
}

export function clearStoredEmergency() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function startEmergencyAlarm(_alert: AlertPayload): Promise<boolean> {
  startVibration();
  try {
    if (!audio) {
      audio = new Audio("/alarm.mp3");
      audio.loop = true;
      audio.volume = 1.0;
    }
    await audio.play();
    return true;
  } catch {
    return false; // autoplay blocked — UI should show "Tap to start alarm"
  }
}

export async function retryAlarmAfterTap(): Promise<boolean> {
  try {
    if (!audio) {
      audio = new Audio("/alarm.mp3");
      audio.loop = true;
      audio.volume = 1.0;
    }
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export function stopEmergencyAlarm() {
  if (audio) {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      /* noop */
    }
    audio = null;
  }
  stopVibration();
}

export function startVibration() {
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate([1000, 500, 1000, 500, 2000]);
  } catch {
    /* noop */
  }
  if (vibrationInterval) return;
  vibrationInterval = window.setInterval(() => {
    try {
      navigator.vibrate([1000, 500, 1000, 500, 2000]);
    } catch {
      /* noop */
    }
  }, 5000);
}

export function stopVibration() {
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
  try {
    navigator.vibrate?.(0);
  } catch {
    /* noop */
  }
}

export function getCurrentPosition(): Promise<{ latitude: number | null; longitude: number | null }> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve({ latitude: null, longitude: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve({ latitude: null, longitude: null }),
      { timeout: 5000, maximumAge: 60_000 },
    );
  });
}
