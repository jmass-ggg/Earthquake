const USER_KEY = "quakeguard_user";
const ACCESS_TOKEN_KEY = "quakeguard_access_token";
const REFRESH_TOKEN_KEY = "quakeguard_refresh_token";

const ADMIN_KEY = "quakeguard_admin";
const ADMIN_ACCESS_TOKEN_KEY = "quakeguard_admin_access_token";
const ADMIN_REFRESH_TOKEN_KEY = "quakeguard_admin_refresh_token";

const DEVICE_ID_KEY = "quakeguard_device_id";

function getTokenFromLoginData(loginData) {
  return (
    loginData?.access_token ||
    loginData?.accessToken ||
    loginData?.token ||
    null
  );
}

function getRefreshTokenFromLoginData(loginData) {
  return (
    loginData?.refresh_token ||
    loginData?.refreshToken ||
    null
  );
}

function isJwtExpired(token) {
  if (!token) {
    return true;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiry = payload.exp;

    if (!expiry) {
      return false;
    }

    return Date.now() >= expiry * 1000;
  } catch {
    return false;
  }
}

export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = `web-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * Use this for normal USER login from /auth/verify-otp
 */
export function saveAuthData(loginData) {
  const accessToken = getTokenFromLoginData(loginData);
  const refreshToken = getRefreshTokenFromLoginData(loginData);
  const user = loginData?.user || loginData?.data?.user || loginData;

  if (!accessToken) {
    throw new Error("Access token missing from login response");
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Use this only for ADMIN login from /auth/admin/login
 */
export function saveAdminAuthData(loginData) {
  const accessToken = getTokenFromLoginData(loginData);
  const refreshToken = getRefreshTokenFromLoginData(loginData);
  const admin = loginData?.admin || loginData?.user || loginData?.data?.admin || loginData;

  if (!accessToken) {
    throw new Error("Admin access token missing from login response");
  }

  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);

  if (refreshToken) {
    localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Normal USER data
 */
export function getCurrentUser() {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function getAccessToken() {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!token || isJwtExpired(token)) {
    return null;
  }

  return token;
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getCurrentUser() && getAccessToken());
}

/**
 * ADMIN data
 */
export function getCurrentAdmin() {
  const storedAdmin = localStorage.getItem(ADMIN_KEY);

  if (!storedAdmin) {
    return null;
  }

  try {
    return JSON.parse(storedAdmin);
  } catch {
    localStorage.removeItem(ADMIN_KEY);
    return null;
  }
}

export function getAdminAccessToken() {
  const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);

  if (!token || isJwtExpired(token)) {
    return null;
  }

  return token;
}

export function getAdminRefreshToken() {
  return localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
}

export function isAdminAuthenticated() {
  return Boolean(getCurrentAdmin() && getAdminAccessToken());
}

/**
 * Logout only normal user
 */
export function logoutUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Logout only admin
 */
export function logoutAdmin() {
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
}

/**
 * Clear everything
 */
export function logoutAll() {
  logoutUser();
  logoutAdmin();
}