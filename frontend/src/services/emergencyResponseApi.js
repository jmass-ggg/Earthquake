import { getAccessToken } from "../utils/auth.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: null,
        longitude: null
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => {
        resolve({
          latitude: null,
          longitude: null
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 10000
      }
    );
  });
}

export async function submitEmergencyResponse(alertId, responseType) {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Login token not found. Please login again.");
  }

  if (!alertId) {
    throw new Error("Alert ID not found. Send a new alert and try again.");
  }

  const location = await getCurrentLocation();

  const payload = {
    alert_id: alertId,
    response: responseType,
    latitude: location.latitude,
    longitude: location.longitude
  };

  console.log("📤 Emergency response payload:", payload);

  const res = await fetch(`${API_BASE_URL}/ws/emergency/response`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        `Emergency response failed with status ${res.status}`
    );
  }

  return data;
}