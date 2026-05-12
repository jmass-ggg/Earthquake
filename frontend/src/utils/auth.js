const USER_KEY = "quakeguard_user";
const ACCESS_TOKEN_KEY = "quakeguard_access_token";
const REFRESH_TOKEN_KEY = "quakeguard_refresh_token";
const DEVICE_ID_KEY = "quakeguard_device_id";

export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = `web-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

export function saveAuthData(loginData) {
  localStorage.setItem(USER_KEY, JSON.stringify(loginData.user));
  localStorage.setItem(ACCESS_TOKEN_KEY, loginData.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, loginData.refresh_token);
}

export function getCurrentUser() {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getCurrentUser() && getAccessToken());
}

export function logoutUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}