import { useEffect, useState } from "react";
import { useEmergencyContext } from "../context/EmergencyContext.jsx";

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
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const activeTitle = title || "Earthquake Alert";
  const activeMessage = message || "Stay safe and avoid buildings.";
  const activeMagnitude = magnitude || 6.8;
  const activeRiskLevel = risk_level || "HIGH";

  useEffect(() => {
    if (emergency) {
      setShowEmergencyModal(true);
      setShowHelpPanel(true);
      startFakeGpsLoading();
    } else {
      setShowEmergencyModal(false);
      setShowHelpPanel(false);
      setGpsLoading(false);
    }
  }, [emergency]);

  useEffect(() => {
    if (userStatus === "NEED_HELP") {
      setShowHelpPanel(true);
      startFakeGpsLoading();
    }
  }, [userStatus]);

  function startFakeGpsLoading() {
    setGpsLoading(true);

    setTimeout(() => {
      setGpsLoading(false);
    }, 2500);
  }

  function simulateEarthquake() {
    const mockEvent = {
      title: "Earthquake Alert",
      message: "Stay safe and avoid buildings.",
      magnitude: 6.8,
      risk_level: "HIGH",
      emergency: true
    };

    setTitle(mockEvent.title);
    setMessage(mockEvent.message);
    setMagnitude(mockEvent.magnitude);
    setRiskLevel(mockEvent.risk_level);
    setEmergency(true);
    setUserStatus("PENDING");

    setShowEmergencyModal(true);
    setShowHelpPanel(true);
    startFakeGpsLoading();
  }

  function resolveAlert() {
    setEmergency(false);
    setUserStatus("SAFE");
    setTitle("");
    setMessage("");
    setMagnitude(null);
    setRiskLevel("SAFE");

    setShowEmergencyModal(false);
    setShowHelpPanel(false);
    setGpsLoading(false);
  }

  function handleSafeResponse() {
    setUserStatus("SAFE");
    setShowEmergencyModal(false);
  }

  function handleNeedHelpResponse() {
    setUserStatus("NEED_HELP");
    setShowEmergencyModal(false);
    setShowHelpPanel(true);
    startFakeGpsLoading();
  }

  return (
    <main className={emergency ? "dashboard emergency-mode" : "dashboard normal-mode"}>
      <header className="dashboard-status-bar">
        {emergency ? (
          <div className="status-bar-content emergency">
            <span className="status-dot">🔴</span>

            <div>
              <h1>Emergency Active</h1>
              <p>Earthquake Alert Running</p>
            </div>
          </div>
        ) : (
          <div className="status-bar-content normal">
            <span className="status-dot">🟢</span>

            <div>
              <h1>System Safe</h1>
              <p>No Earthquake Detected</p>
            </div>
          </div>
        )}
      </header>

      <section
        className={
          emergency
            ? "main-dashboard-card emergency"
            : "main-dashboard-card normal"
        }
      >
        <div className="dashboard-card-header">
          <p className="dashboard-label">Current Earthquake Status</p>

          <span className={emergency ? "risk-badge high" : "risk-badge safe"}>
            {emergency ? activeRiskLevel : "SAFE"}
          </span>
        </div>

        <h2>{emergency ? "Emergency" : "Safe"}</h2>

        {!emergency && (
          <p className="dashboard-message">
            QuakeGuard is monitoring alerts. No earthquake has been detected.
          </p>
        )}

        {emergency && (
          <>
            <p className="dashboard-message">{activeMessage}</p>

            <div className="earthquake-details">
              <div className="detail-box">
                <span>Magnitude</span>
                <strong>{activeMagnitude}</strong>
              </div>

              <div className="detail-box">
                <span>Risk Level</span>
                <strong>{activeRiskLevel}</strong>
              </div>

              <div className="detail-box">
                <span>User Status</span>
                <strong>{userStatus || "PENDING"}</strong>
              </div>
            </div>
          </>
        )}
      </section>

      {showEmergencyModal && emergency && (
        <section
          className="emergency-modal-backdrop"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="emergency-modal">
            <div className="modal-warning-icon">⚠️</div>

            <h2>{activeTitle}</h2>

            <p className="modal-message">{activeMessage}</p>

            <div className="modal-alert-grid">
              <div>
                <span>Magnitude</span>
                <strong>{activeMagnitude}</strong>
              </div>

              <div>
                <span>Risk Level</span>
                <strong>{activeRiskLevel}</strong>
              </div>
            </div>

            <h3>Are you safe right now?</h3>

            <div className="modal-actions">
              <button
                type="button"
                className="safe-action-button"
                onClick={handleSafeResponse}
              >
                🟢 Yes, I am Safe
              </button>

              <button
                type="button"
                className="help-action-button"
                onClick={handleNeedHelpResponse}
              >
                🔴 I Need Help
              </button>
            </div>
          </div>
        </section>
      )}

      {(userStatus === "NEED_HELP" || emergency) && showHelpPanel && (
        <section className="emergency-help-panel">
          <div className="help-panel-header">
            <h2>Emergency Help Panel</h2>
            <p>Contact nearby emergency services immediately.</p>
          </div>

          <div className="emergency-contact-grid">
            <article className="contact-card">
              <span>🚑</span>

              <div>
                <h3>Ambulance</h3>
                <p>102</p>
              </div>
            </article>

            <article className="contact-card">
              <span>👮</span>

              <div>
                <h3>Police</h3>
                <p>100</p>
              </div>
            </article>

            <article className="contact-card hospital-card">
              <span>🏥</span>

              <div>
                <h3>Hospitals</h3>
                <p>Patan Hospital</p>
                <p>Bir Hospital</p>
              </div>
            </article>
          </div>

          <div className="gps-status">
            {gpsLoading ? (
              <p className="gps-loading">📍 Locating nearest hospital...</p>
            ) : (
              <p>📍 Nearest hospital location simulated.</p>
            )}
          </div>
        </section>
      )}

      <section className="bottom-control-panel">
        <button
          type="button"
          className="simulate-earthquake-button"
          onClick={simulateEarthquake}
        >
          🚨 Simulate Earthquake
        </button>

        <button
          type="button"
          className="resolve-alert-button"
          onClick={resolveAlert}
        >
          ✅ Resolve Alert
        </button>
      </section>

      <section className="quick-emergency-contacts">
        <div className="quick-contacts-header">
          <p className="dashboard-label">Emergency Contacts</p>
          <h2>Nearby Help Numbers</h2>
        </div>

        <div className="quick-contact-grid">
          <a href="tel:102" className="quick-contact-card ambulance">
            <span className="quick-contact-icon">🚑</span>

            <div>
              <h3>Ambulance</h3>
              <p>102</p>
            </div>
          </a>

          <a href="tel:100" className="quick-contact-card police">
            <span className="quick-contact-icon">👮</span>

            <div>
              <h3>Police</h3>
              <p>100</p>
            </div>
          </a>

          <a href="tel:015522295" className="quick-contact-card hospital">
            <span className="quick-contact-icon">🏥</span>

            <div>
              <h3>Patan Hospital</h3>
              <p>01-5522295</p>
            </div>
          </a>

          <a href="tel:014221119" className="quick-contact-card hospital">
            <span className="quick-contact-icon">🏥</span>

            <div>
              <h3>Bir Hospital</h3>
              <p>01-4221119</p>
            </div>
          </a>
        </div>

        <p className="quick-contact-note">
          Tap a card to call emergency services. Replace hospital numbers with verified local contacts before production.
        </p>
      </section>
    </main>
  );
}

export default Dashboard;