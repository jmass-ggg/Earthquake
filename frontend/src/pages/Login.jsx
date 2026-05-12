import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { requestOtp, verifyOtp } from "../services/authApi.js";
import {
  getOrCreateDeviceId,
  isAuthenticated,
  saveAuthData
} from "../utils/auth.js";

function Login() {
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  function resetMessages() {
    setSuccessMessage("");
    setErrorMessage("");
  }

  function validatePhone() {
    const cleanedPhone = phoneNumber.trim();

    if (!cleanedPhone) {
      setErrorMessage("Please enter your phone number.");
      return false;
    }

    if (cleanedPhone.length < 7) {
      setErrorMessage("Please enter a valid phone number.");
      return false;
    }

    return true;
  }

  async function handleSendOtp(event) {
    event.preventDefault();
    resetMessages();

    if (!validatePhone()) {
      return;
    }

    try {
      setLoading(true);

      const data = await requestOtp(phoneNumber.trim());

      setOtpSent(true);
      setDevOtp(data.dev_otp || "");
      setExpiresAt(data.expires_at || "");
      setSuccessMessage(data.message || "OTP sent successfully.");
    } catch (error) {
      setErrorMessage(error.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    resetMessages();

    if (!validatePhone()) {
      return;
    }

    try {
      setLoading(true);

      const data = await requestOtp(phoneNumber.trim());

      setOtp("");
      setDevOtp(data.dev_otp || "");
      setExpiresAt(data.expires_at || "");
      setSuccessMessage(data.message || "A new OTP has been sent.");
    } catch (error) {
      setErrorMessage(error.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    resetMessages();

    const cleanedOtp = otp.trim();

    if (!cleanedOtp) {
      setErrorMessage("Please enter the OTP.");
      return;
    }

    try {
      setLoading(true);

      const loginData = await verifyOtp({
        phoneNumber: phoneNumber.trim(),
        otpCode: cleanedOtp,
        deviceId: getOrCreateDeviceId()
      });

      saveAuthData(loginData);

      setSuccessMessage("Login successful.");

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark" aria-hidden="true">
          QG
        </div>

        <h1>QuakeGuard</h1>

        <p className="login-subtitle">
          Disaster Alert & Emergency Response
        </p>

        <form
          className="login-form"
          onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
        >
          <label htmlFor="phoneNumber">Phone Number</label>

          <input
            id="phoneNumber"
            type="tel"
            inputMode="tel"
            placeholder="+977 9800000000"
            value={phoneNumber}
            disabled={loading || otpSent}
            onChange={event => setPhoneNumber(event.target.value)}
          />

          {!otpSent && (
            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          )}

          {otpSent && (
            <div className="otp-section">
              {devOtp && (
                <div className="development-otp">
                  Development OTP: <strong>{devOtp}</strong>
                </div>
              )}

              {expiresAt && (
                <p className="otp-expiry">
                  OTP expires at: {new Date(expiresAt).toLocaleString()}
                </p>
              )}

              <label htmlFor="otp">Enter OTP</label>

              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder="Enter OTP"
                value={otp}
                disabled={loading}
                onChange={event => setOtp(event.target.value)}
              />

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                className="secondary-button"
                disabled={loading}
                onClick={handleResendOtp}
              >
                {loading ? "Please wait..." : "Resend OTP"}
              </button>
            </div>
          )}

          {successMessage && (
            <p className="success-message" role="status">
              {successMessage}
            </p>
          )}

          {errorMessage && (
            <p className="error-message" role="alert">
              {errorMessage}
            </p>
          )}
        </form>

        <p className="login-note">
          OTP is generated by your FastAPI backend.
        </p>
      </section>
    </main>
  );
}

export default Login;