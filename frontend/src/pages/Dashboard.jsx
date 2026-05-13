import { useEffect, useMemo, useState } from "react";
import { useEmergencyContext } from "../context/EmergencyContext.jsx";
import {
  startEmergencyAlarm,
  stopEmergencyAlarm
} from "../services/emergencyAlarm.js";

const ALERT_WS_URL = "ws://127.0.0.1:8000/ws/alerts";

const STATUS_CONFIG = {
  safe: {
    label: "System Safe",
    subtitle: "Daily Status: Safe",
    eyebrow: "Current Safety Status",
    icon: "🟢",
    badge: "Safe",
    titleFallback: "Daily Safety Status",
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
    eyebrow: "Critical Alert Status",
    icon: "🔴",
    badge: "Emergency",
    titleFallback: "Emergency Alert",
    messageFallback: "Critical disaster warning. Move to a safe place immediately."
  }
};

function getAlertMode(status, riskLevel, emergencyValue) {
  const normalizedStatus = String(status || "safe").toLowerCase();
  const normalizedRisk = String(riskLevel || "low").toLowerCase();

  const isSafe =
    normalizedStatus === "safe" &&
    normalizedRisk === "low" &&
    emergencyValue === false;

  if (isSafe) return "safe";

  if (normalizedStatus === "warning" || normalizedRisk === "medium") {
    return "warning";
  }

  if (
    emergencyValue === true ||
    normalizedStatus === "danger" ||
    normalizedStatus === "evacuate" ||
    normalizedRisk === "high" ||
    normalizedRisk === "very_high" ||
    normalizedRisk === "critical"
  ) {
    return "danger";
  }

  return "safe";
}

function formatRiskLevel(value) {
  return String(value || "LOW").replace("_", " ").toUpperCase();
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

    ws.onmessage = event => {
      console.log("📩 Raw WebSocket message:", event.data);

      try {
        const alertData = JSON.parse(event.data);
        const backendEmergency = alertData.emergency === true;

        const mode = getAlertMode(
          alertData.status,
          alertData.risk_level,
          backendEmergency
        );

        setAlertMode(mode);

        setTitle(
          alertData.title ||
            STATUS_CONFIG[mode].titleFallback
        );

        setMessage(
          alertData.message ||
            STATUS_CONFIG[mode].messageFallback
        );

        setMagnitude(alertData.magnitude ?? null);
        setRiskLevel(formatRiskLevel(alertData.risk_level || "low"));

        if (mode === "safe") {
          setEmergency(false);
          setUserStatus("SAFE");
          setShowEmergencyModal(false);
          setAlarmShouldPlay(false);
        } else {
          setEmergency(true);
          setUserStatus("PENDING");
          setShowEmergencyModal(true);
          setAlarmShouldPlay(backendEmergency);
        }
      } catch (error) {
        console.error("Invalid WebSocket JSON:", error);
      }
    };

    ws.onerror = error => {
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
  }, [alarmShouldPlay]);

  async function handleStartAlarmTap() {
    const result = await startEmergencyAlarm();

    if (result?.success) {
      setAlarmNeedsTap(false);
    }
  }

  function handleSafeResponse() {
    setUserStatus("SAFE");
    setShowEmergencyModal(false);
    setAlarmShouldPlay(false);
    stopEmergencyAlarm();
  }

  function handleNeedHelpResponse() {
    setUserStatus("NEED_HELP");
    setShowEmergencyModal(false);
    setAlarmShouldPlay(false);
    stopEmergencyAlarm();
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
            <span className={`connection-pill ${wsConnected ? "is-online" : "is-offline"}`}>
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

            <a href="tel:015522295" className="contact-card contact-card--hospital">
              <span>🏥</span>
              <div>
                <p>Patan Hospital</p>
                <strong>01-5522295</strong>
              </div>
            </a>

            <a href="tel:014221119" className="contact-card contact-card--hospital">
              <span>🏥</span>
              <div>
                <p>Bir Hospital</p>
                <strong>01-4221119</strong>
              </div>
            </a>
          </div>

          <p className="contacts-note">
            Tap a card to call emergency services.
          </p>
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

            <div className="modal-actions">
              <button
                type="button"
                className="safe-action-button"
                onClick={handleSafeResponse}
              >
                I am Safe
              </button>

              <button
                type="button"
                className="help-action-button"
                onClick={handleNeedHelpResponse}
              >
                I Need Help
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default Dashboard;