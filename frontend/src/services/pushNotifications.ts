import { savePushSubscription, API_BASE_URL } from "@/lib/api";

// Public VAPID key — set window.__QUAKEGUARD_VAPID__ or replace below.
const VAPID_PUBLIC_KEY =
  (typeof window !== "undefined" && (window as any).__QUAKEGUARD_VAPID__) || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const output = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) throw new Error("Service Worker not supported");
  return navigator.serviceWorker.register("/sw.js");
}

export async function askNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) throw new Error("Notifications not supported");
  return Notification.requestPermission();
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription> {
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const opts: PushSubscriptionOptionsInit = { userVisibleOnly: true };
  if (VAPID_PUBLIC_KEY) {
    opts.applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer;
  }
  return registration.pushManager.subscribe(opts);
}

export async function sendSubscriptionToBackend(sub: PushSubscription) {
  return savePushSubscription(sub.toJSON());
}

export async function enableEmergencyNotifications(): Promise<{
  ok: boolean;
  message: string;
  permission: NotificationPermission;
}> {
  try {
    const perm = await askNotificationPermission();
    if (perm !== "granted") {
      return { ok: false, message: "Notification permission denied", permission: perm };
    }
    const reg = await registerServiceWorker();
    await navigator.serviceWorker.ready;
    const sub = await subscribeToPush(reg);
    await sendSubscriptionToBackend(sub);
    return { ok: true, message: "Emergency notifications enabled", permission: perm };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.message || "Failed to enable notifications",
      permission: typeof Notification !== "undefined" ? Notification.permission : "default",
    };
  }
}

export { API_BASE_URL };
