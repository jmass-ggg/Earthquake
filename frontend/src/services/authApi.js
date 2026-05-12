const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getErrorMessage(errorData) {
  if (!errorData) {
    return "Something went wrong. Please try again.";
  }

  if (typeof errorData.detail === "string") {
    return errorData.detail;
  }

  if (Array.isArray(errorData.detail)) {
    return errorData.detail
      .map(item => item.msg || "Invalid input")
      .join(", ");
  }

  if (errorData.message) {
    return errorData.message;
  }

  return "Something went wrong. Please try again.";
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
}

export function requestOtp(phoneNumber) {
  return apiRequest("/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({
      phone_number: phoneNumber
    })
  });
}

export function verifyOtp({ phoneNumber, otpCode, deviceId }) {
  return apiRequest("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({
      phone_number: phoneNumber,
      otp_code: otpCode,
      device_id: deviceId
    })
  });
}