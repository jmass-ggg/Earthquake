export const API_BASE_URL =
  (typeof window !== "undefined" && (window as any).__QUAKEGUARD_API__) ||
  "http://127.0.0.1:8000";

export const WS_URL = API_BASE_URL.replace(/^http/, "ws") + "/ws/alerts";

async function handle(res: Response) {
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${txt || res.statusText}`);
  }
  return res.json();
}

export async function requestOtp(phoneNumber: string) {
  return handle(
    await fetch(`${API_BASE_URL}/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phoneNumber }),
    }),
  );
}

export async function verifyOtp(phoneNumber: string, otp: string, deviceId = "web-browser") {
  return handle(
    await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phoneNumber, otp_code: otp, device_id: deviceId }),
    }),
  );
}

function authHeaders() {
  const token = localStorage.getItem("user_access_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function savePushSubscription(subscription: PushSubscriptionJSON) {
  return handle(
    await fetch(`${API_BASE_URL}/push/subscribe`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ subscription }),
    }),
  );
}

export interface EmergencyResponsePayload {
  alert_id: string | null;
  response: "SAFE" | "NEED_HELP";
  latitude: number | null;
  longitude: number | null;
}

export async function respondToEmergency(payload: EmergencyResponsePayload) {
  return handle(
    await fetch(`${API_BASE_URL}/emergency/respond`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }),
  );
}
