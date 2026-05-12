import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  startEmergencyAlarm,
  stopEmergencyAlarm
} from "../services/emergencyAlarm.js";
import { createMockEarthquakeAlert } from "../services/mockSocket.js";

function readStoredAlert() {
  const storedAlert = localStorage.getItem("quakeguard_active_alert");

  if (!storedAlert) {
    const fallbackAlert = createMockEarthquakeAlert();
    localStorage.setItem(
      "quakeguard_active_alert",
      JSON.stringify(fallbackAlert)
    );
    return fallbackAlert;
  }

  try {
    return JSON.parse(storedAlert);
  } catch (error) {
    const fallbackAlert = createMockEarthquakeAlert();
    localStorage.setItem(
      "quakeguard_active_alert",
      JSON.stringify(fallbackAlert)
    );
    return fallbackAlert;
  }
}

function Emergency() {
  const navigate = useNavigate();

  const alert = useMemo(() => readStoredAlert(), []);

  const [alarmNeedsTap, setAlarmNeedsTap] = useState(false);
  const [responded, setResponded] = useState(false);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    localStorage.setItem("quakeguard_emergency_active", "true");

    startEmergencyAlarm().then(result => {
      if (result.autoplayBlocked) {
        setAlarmNeedsTap(true);
      }
    });
  }, []);

  async function handleStartAlarmTap() {
    const result = await startEmergencyAlarm();

    if (result.success) {
      setAlarmNeedsTap(false);
    }
  }

  function handleResponse(response) {
    stopEmergencyAlarm();

    localStorage.setItem("quakeguard_emergency_active", "false");
    localStorage.setItem("quakeguard_user_status", response);
    localStorage.setItem(
      "quakeguard_emergency_response",
      JSON.stringify({
        response,
        alertId: alert.id,
        respondedAt: new Date().toISOString()
      })
    );

    localStorage.removeItem("quakeguard_active_alert");

    setResponded(true);
    setResponseText(response);

    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 1200);
  }

  return (
    <main className="emergency-page">
      <section className="emergency-card" role="alert">
        <div className="emergency-symbol" aria-hidden="true">
          🚨
        </div>

        <p className="emergency-label">Emergency Alert</p>

        <h1>{alert.title}</h1>

        <p className="emergency-message">{alert.message}</p>

        <div className="alert-details-grid">
          <div className="alert-detail">
            <span>Magnitude</span>
            <strong>{alert.magnitude}</strong>
          </div>

          <div className="alert-detail">
            <span>Risk Level</span>
            <strong>{alert.risk_level}</strong>
          </div>

          <div className="alert-detail">
            <span>Location</span>
            <strong>{alert.location || "Unknown"}</strong>
          </div>

          <div className="alert-detail">
            <span>Issued</span>
            <strong>
              {alert.issuedAt
                ? new Date(alert.issuedAt).toLocaleTimeString()
                : "Now"}
            </strong>
          </div>
        </div>

        <p className="urgent-warning">
          Please respond immediately. Alarm will continue until you respond.
        </p>

        {alarmNeedsTap && !responded && (
          <button
            type="button"
            className="start-alarm-button"
            onClick={handleStartAlarmTap}
          >
            Tap to Start Alarm
          </button>
        )}

        {!responded && (
          <div className="emergency-response-buttons">
            <button
              type="button"
              className="safe-button large"
              onClick={() => handleResponse("I am safe")}
            >
              I Am Safe
            </button>

            <button
              type="button"
              className="danger-button large"
              onClick={() => handleResponse("I need help")}
            >
              Need Help
            </button>
          </div>
        )}

        {responded && (
          <div className="response-confirmation">
            Response saved: <strong>{responseText}</strong>
          </div>
        )}
      </section>
    </main>
  );
}

export default Emergency;