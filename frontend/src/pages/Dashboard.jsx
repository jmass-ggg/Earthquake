import { useEffect, useMemo, useState } from "react";
import { useEmergencyContext } from "../context/EmergencyContext.jsx";
import {
  startEmergencyAlarm,
  stopEmergencyAlarm
} from "../services/emergencyAlarm.js";
import { submitEmergencyResponse } from "../services/emergencyResponseApi.js";
const ALERT_WS_URL = "ws://127.0.0.1:8000/ws/alerts";
const API_BASE_URL = "http://127.0.0.1:8000";

const STORED_ALERT_ID_KEY = "quakeguard_current_alert_id";

const STATUS_CONFIG = {
  safe: {
    label: "System Safe",
    subtitle: "Daily Status: Safe",
    eyebrow: "Current Safety Status",
    icon: "🟢",
    badge: "Safe",
    titleFallback: "Daily Status",
    messageFallback: "No earthquake or disaster warning today."
  },
  warning: {
    label: "Warning Active",
    subtitle: "Medium Risk Detected",
    eyebrow: "Current Alert Status",
    icon: "🟠",
    badge: "Warning",
    titleFallback: "Disaster Warning",
    messageFallback: "Disaster warning detected. Please stay alert."
  },
  danger: {
    label: "Emergency Active",
    subtitle: "High Risk Disaster Warning",
    eyebrow: "Emergency Alert Status",
    icon: "🔴",
    badge: "Emergency",
    titleFallback: "Evacuation Alert",
    messageFallback: "Critical earthquake risk. Evacuate immediately."
  }
};

function getAlertMode(status, riskLevel, emergencyValue) {
  const normalizedStatus = String(status || "safe").toLowerCase();
  const normalizedRisk = String(riskLevel || "low").toLowerCase();

  if (emergencyValue === true) {
    return "danger";
  }

  if (
    normalizedStatus === "danger" ||
    normalizedStatus === "evacuate" ||
    normalizedRisk === "high" ||
    normalizedRisk === "very_high" ||
    normalizedRisk === "critical"
  ) {
    return "danger";
  }

  if (
    normalizedStatus === "warning" ||
    normalizedRisk === "medium"
  ) {
    return "warning";
  }

  return "safe";
}

function formatRiskLevel(value) {
  return String(value || "LOW").replaceAll("_", " ").toUpperCase();
}

function getStoredAlertId() {
  return localStorage.getItem(STORED_ALERT_ID_KEY);
}

function saveStoredAlertId(alertId) {
  if (alertId) {
    localStorage.setItem(STORED_ALERT_ID_KEY, alertId);
  }
}

function clearStoredAlertId() {
  localStorage.removeItem(STORED_ALERT_ID_KEY);
}

function looksLikeJwt(value) {
  return (
    typeof value === "string" &&
    value.split(".").length === 3 &&
    value.length > 40
  );
}

function findTokenInsideObject(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const possibleTokenKeys = [
    "token",
    "access_token",
    "accessToken",
    "authToken",
    "auth_token",
    "jwt",
    "access"
  ];

  for (const key of possibleTokenKeys) {
    if (looksLikeJwt(value[key]) || typeof value[key] === "string") {
      return value[key];
    }
  }

  for (const key of Object.keys(value)) {
    const nestedToken = findTokenInsideObject(value[key]);

    if (nestedToken) {
      return nestedToken;
    }
  }

  return null;
}

function getAuthToken() {
  const directKeys = [
    "token",
    "access_token",
    "accessToken",
    "authToken",
    "auth_token",
    "jwt",
    "quakeguard_token",
    "quakeguard_access_token"
  ];

  for (const key of directKeys) {
    const value = localStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  for (const key of Object.keys(localStorage)) {
    const value = localStorage.getItem(key);

    if (looksLikeJwt(value)) {
      return value;
    }

    try {
      const parsed = JSON.parse(value);
      const token = findTokenInsideObject(parsed);

      if (token) {
        return token;
      }
    } catch {
      // Ignore non-JSON localStorage values
    }
  }

  return null;
}

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

async function submitEmergencyResponseToApi(alertId, responseType) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Login token not found. Please login as a user again.");
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

  console.log("📤 Sending emergency response:", payload);

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

  console.log("✅ Emergency response saved:", data);
  return data;
}

function Dashboard() {
  const {
    emergency,
    title,
    message,
    magnitude,
    risk_level,
    userStatus,
    setEmergency,
    setUserStatus,
    setTitle,
    setMessage,
    setMagnitude,
    setRiskLevel
  } = useEmergencyContext();

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [alertMode, setAlertMode] = useState("safe");
  const [alarmShouldPlay, setAlarmShouldPlay] = useState(false);
  const [alarmNeedsTap, setAlarmNeedsTap] = useState(false);
  const [currentAlertId, setCurrentAlertId] = useState(getStoredAlertId());
  const [responseSubmitting, setResponseSubmitting] = useState(false);
  const [responseError, setResponseError] = useState("");

  const config = STATUS_CONFIG[alertMode];

  const hasMagnitude =
    magnitude !== null &&
    magnitude !== undefined &&
    magnitude !== "";

  const activeTitle = title || config.titleFallback;
  const activeMessage = message || config.messageFallback;
  const activeRiskLevel = formatRiskLevel(risk_level);

  const statusSummary = useMemo(() => {
    if (alertMode === "safe") {
      return "No active emergency";
    }

    if (alertMode === "warning") {
      return "Monitor closely";
    }

    return "Immediate attention required";
  }, [alertMode]);

  useEffect(() => {
    const ws = new WebSocket(ALERT_WS_URL);

    ws.onopen = () => {
      console.log("✅ WebSocket connected:", ALERT_WS_URL);
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      console.log("📩 Raw WebSocket message:", event.data);

      try {
        const alertData = JSON.parse(event.data);

        const receivedAlertId =
          alertData.id ||
          alertData.alert_id ||
          alertData.alertId;

        console.log("🚨 Received alert ID:", receivedAlertId);

        const backendEmergency =
          alertData.emergency === true ||
          alertData.type === "ALERT" ||
          alertData.alarm === true;

        const mode = getAlertMode(
          alertData.status,
          alertData.risk_level,
          backendEmergency
        );

        setAlertMode(mode);

        setTitle(alertData.title || STATUS_CONFIG[mode].titleFallback);
        setMessage(alertData.message || STATUS_CONFIG[mode].messageFallback);
        setMagnitude(alertData.magnitude ?? null);
        setRiskLevel(formatRiskLevel(alertData.risk_level || "low"));

        if (receivedAlertId) {
          setCurrentAlertId(receivedAlertId);
          saveStoredAlertId(receivedAlertId);
        }

        setResponseError("");

        if (mode === "safe") {
          setEmergency(false);
          setUserStatus("SAFE");
          setShowEmergencyModal(false);
          setAlarmShouldPlay(false);
          clearStoredAlertId();
          setCurrentAlertId(null);
          stopEmergencyAlarm();
        } else {
          setEmergency(true);
          setUserStatus("PENDING");
          setShowEmergencyModal(true);
          setAlarmShouldPlay(alertData.alarm === true || backendEmergency);
        }
      } catch (error) {
        console.error("Invalid WebSocket JSON:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log("❌ WebSocket disconnected");
      setWsConnected(false);
    };

    return () => {
      ws.close();
      stopEmergencyAlarm();
    };
  }, [
    setEmergency,
    setMagnitude,
    setMessage,
    setRiskLevel,
    setTitle,
    setUserStatus
  ]);

  useEffect(() => {
    async function controlAlarm() {
      if (alarmShouldPlay) {
        const result = await startEmergencyAlarm();

        if (result?.autoplayBlocked) {
          setAlarmNeedsTap(true);
        } else {
          setAlarmNeedsTap(false);
        }
      } else {
        stopEmergencyAlarm();
        setAlarmNeedsTap(false);
      }
    }

    controlAlarm();

    return () => {
      if (!alarmShouldPlay) {
        stopEmergencyAlarm();
      }
    };
  }, [alarmShouldPlay]);

  useEffect(() => {
    function stopOnPageHide() {
      stopEmergencyAlarm();
    }

    window.addEventListener("pagehide", stopOnPageHide);
    window.addEventListener("beforeunload", stopOnPageHide);

    return () => {
      window.removeEventListener("pagehide", stopOnPageHide);
      window.removeEventListener("beforeunload", stopOnPageHide);
    };
  }, []);

  async function handleStartAlarmTap() {
    const result = await startEmergencyAlarm();

    if (result?.success) {
      setAlarmNeedsTap(false);
    }
  }

 async function handleEmergencyResponse(responseType) {
  try {
    setResponseSubmitting(true);
    setResponseError("");

    await submitEmergencyResponse(currentAlertId, responseType);

    if (responseType === "safe") {
      setUserStatus("SAFE");
    }

    if (responseType === "not_safe") {
      setUserStatus("NOT_SAFE");
    }

    if (responseType === "need_help") {
      setUserStatus("NEED_HELP");
    }

    setShowEmergencyModal(false);
    setAlarmShouldPlay(false);
    stopEmergencyAlarm();
  } catch (error) {
    console.error("Emergency response error:", error);
    setResponseError(error.message || "Failed to submit response");
  } finally {
    setResponseSubmitting(false);
  }
}

function handleSafeResponse() {
  handleEmergencyResponse("safe");
}

function handleNotSafeResponse() {
  handleEmergencyResponse("not_safe");
}

function handleNeedHelpResponse() {
  handleEmergencyResponse("need_help");
}

  return (
    <main className={`dashboard dashboard--${alertMode}`}>
      <section className="dashboard-shell">
        <header className={`status-hero status-hero--${alertMode}`}>
          <div className="status-hero__content">
            <div className="status-hero__icon" aria-hidden="true">
              {config.icon}
            </div>

            <div>
              <p className="status-hero__eyebrow">QuakeGuard Monitoring</p>
              <h1>{config.label}</h1>
              <p>{config.subtitle}</p>
            </div>
          </div>

          <div className="status-hero__meta">
            <span
              className={`connection-pill ${
                wsConnected ? "is-online" : "is-offline"
              }`}
            >
              <span />
              {wsConnected ? "Live connected" : "Disconnected"}
            </span>

            <span className={`mode-pill mode-pill--${alertMode}`}>
              {statusSummary}
            </span>
          </div>
        </header>

        <section className="dashboard-grid">
          <article className={`alert-card alert-card--${alertMode}`}>
            <div className="section-header">
              <div>
                <p className="section-kicker">{config.eyebrow}</p>
                <h2>{alertMode === "safe" ? "Daily Status" : activeTitle}</h2>
              </div>

              <span className={`risk-badge risk-badge--${alertMode}`}>
                {alertMode === "safe" ? "SAFE" : activeRiskLevel}
              </span>
            </div>

            <p className="alert-card__message">{activeMessage}</p>

            {alertMode !== "safe" && (
              <div className="metric-grid">
                {hasMagnitude && (
                  <div className="metric-card">
                    <span>Magnitude</span>
                    <strong>{magnitude}</strong>
                  </div>
                )}

                <div className="metric-card">
                  <span>Risk Level</span>
                  <strong>{activeRiskLevel}</strong>
                </div>

                <div className="metric-card">
                  <span>User Status</span>
                  <strong>{userStatus || "PENDING"}</strong>
                </div>
              </div>
            )}
          </article>

          <aside className="side-panel">
            <div className="mini-card">
              <span className="mini-card__icon">📡</span>
              <div>
                <p>Alert Channel</p>
                <strong>{wsConnected ? "Operational" : "Offline"}</strong>
              </div>
            </div>

            <div className="mini-card">
              <span className="mini-card__icon">🛡️</span>
              <div>
                <p>Current Mode</p>
                <strong>{config.badge}</strong>
              </div>
            </div>

            <div className="mini-card">
              <span className="mini-card__icon">👤</span>
              <div>
                <p>User Response</p>
                <strong>{userStatus || "SAFE"}</strong>
              </div>
            </div>
          </aside>
        </section>

        <section className="contacts-panel">
          <div className="section-header">
            <div>
              <p className="section-kicker">Emergency Contacts</p>
              <h2>Nearby Help Numbers</h2>
            </div>
          </div>

          <div className="contact-grid">
            <a href="tel:102" className="contact-card contact-card--ambulance">
              <span>🚑</span>
              <div>
                <p>Ambulance</p>
                <strong>102</strong>
              </div>
            </a>

            <a href="tel:100" className="contact-card contact-card--police">
              <span>👮</span>
              <div>
                <p>Police</p>
                <strong>100</strong>
              </div>
            </a>

            <a
              href="tel:015522295"
              className="contact-card contact-card--hospital"
            >
              <span>🏥</span>
              <div>
                <p>Patan Hospital</p>
                <strong>01-5522295</strong>
              </div>
            </a>

            <a
              href="tel:014221119"
              className="contact-card contact-card--hospital"
            >
              <span>🏥</span>
              <div>
                <p>Bir Hospital</p>
                <strong>01-4221119</strong>
              </div>
            </a>
          </div>

          <p className="contacts-note">Tap a card to call emergency services.</p>
        </section>
      </section>

      {showEmergencyModal && alertMode !== "safe" && emergency && (
        <section
          className="emergency-modal-backdrop"
          role="alertdialog"
          aria-modal="true"
        >
          <div className={`emergency-modal emergency-modal--${alertMode}`}>
            <div className="modal-icon" aria-hidden="true">
              {alertMode === "warning" ? "⚠️" : "🚨"}
            </div>

            <p className="section-kicker">
              {alertMode === "warning" ? "Warning Alert" : "Emergency Alert"}
            </p>

            <h2>{activeTitle}</h2>

            <p className="modal-message">{activeMessage}</p>

            <div className="modal-metrics">
              {hasMagnitude && (
                <div>
                  <span>Magnitude</span>
                  <strong>{magnitude}</strong>
                </div>
              )}

              <div>
                <span>Risk Level</span>
                <strong>{activeRiskLevel}</strong>
              </div>
            </div>

            {alarmNeedsTap && (
              <button
                type="button"
                className="start-alarm-button"
                onClick={handleStartAlarmTap}
              >
                🔊 Tap to Start Alarm
              </button>
            )}

            <h3>Are you safe right now?</h3>

            {responseError && (
              <p className="response-error">{responseError}</p>
            )}

            <div className="modal-actions modal-actions--three">
              <button
                type="button"
                className="safe-action-button"
                onClick={handleSafeResponse}
                disabled={responseSubmitting}
              >
                I am Safe
              </button>

              <button
                type="button"
                className="not-safe-action-button"
                onClick={handleNotSafeResponse}
                disabled={responseSubmitting}
              >
                I'm Not Safe
              </button>

              <button
                type="button"
                className="help-action-button"
                onClick={handleNeedHelpResponse}
                disabled={responseSubmitting}
              >
                I Need Help
              </button>
            </div>

            {responseSubmitting && (
              <p className="response-loading">Sending your response...</p>
            )}

            {currentAlertId && (
              <p className="alert-id-note">Alert ID: {currentAlertId}</p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default Dashboard;