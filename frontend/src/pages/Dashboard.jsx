import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import EmergencyOverlay from "../components/EmergencyOverlay.jsx";
import { MockSocket } from "../services/mockSocket.js";
import { getCurrentUser, logoutUser } from "../utils/auth.js";

function getInitialNotificationPermission() {
  if (!("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

function Dashboard() {
  const navigate = useNavigate();

  const user = getCurrentUser();
  const socketRef = useRef(null);

  const [notificationPermission, setNotificationPermission] = useState(
    getInitialNotificationPermission
  );
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [activeAlert, setActiveAlert] = useState(() => {
    const storedAlert = localStorage.getItem("quakeguard_active_alert");

    if (!storedAlert) {
      return null;
    }

    try {
      return JSON.parse(storedAlert);
    } catch (error) {
      localStorage.removeItem("quakeguard_active_alert");
      return null;
    }
  });

  const [userStatus, setUserStatus] = useState(() => {
    return localStorage.getItem("quakeguard_user_status") || "Not reported";
  });

  useEffect(() => {
    const socket = new MockSocket({
      onStatusChange: status => {
        setSocketStatus(status);
        localStorage.setItem("quakeguard_socket_status", status);
      },
      onAlert: alert => {
        localStorage.setItem("quakeguard_active_alert", JSON.stringify(alert));
        setActiveAlert(alert);
        navigate("/emergency");
      }
    });

    socketRef.current = socket;
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  async function handleEnableNotifications() {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    localStorage.setItem("quakeguard_notification_permission", permission);
  }

  function handleDemoAlert() {
    const alert = socketRef.current?.triggerDemoAlert();

    if (!alert) {
      return;
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🚨 QuakeGuard Emergency Alert", {
        body: alert.message,
        icon: "/icons/icon-192.png",
        requireInteraction: true,
        vibrate: [500, 200, 500, 200, 800]
      });
    }
  }

  function handleReconnect() {
    socketRef.current?.simulateReconnect();
  }

  function handleEmergencyAction(status) {
    localStorage.setItem("quakeguard_user_status", status);
    setUserStatus(status);
  }

  function handleLogout() {
    logoutUser();
    navigate("/login", { replace: true });
  }

  return (
    <main className="dashboard-page">
      <EmergencyOverlay alert={activeAlert} />

      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Emergency Response Console</p>
          <h1>QuakeGuard Dashboard</h1>
          <p>
            Monitor alert readiness, connection state, and your emergency
            response status.
          </p>
        </div>

        <button type="button" className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <div className="card-icon">👤</div>
          <h2>User Status</h2>

          <div className="info-row">
            <span>Phone</span>
            <strong>{user?.phoneNumber || "Unknown"}</strong>
          </div>

          <div className="info-row">
            <span>Verification</span>
            <strong className="status-text safe">
              {user?.verified ? "Verified user" : "Not verified"}
            </strong>
          </div>

          <div className="info-row">
            <span>Emergency Status</span>
            <strong>{userStatus}</strong>
          </div>
        </article>

        <article className="dashboard-card">
          <div className="card-icon">🔔</div>
          <h2>Notification Status</h2>

          <div className="permission-box">
            <span>Permission state</span>
            <strong className={`permission-state ${notificationPermission}`}>
              {notificationPermission}
            </strong>
          </div>

          <button
            type="button"
            className="primary-button full-width"
            onClick={handleEnableNotifications}
          >
            Enable Emergency Notifications
          </button>

          {notificationPermission === "unsupported" && (
            <p className="small-warning">
              Browser notifications are not supported on this device.
            </p>
          )}
        </article>

        <article className="dashboard-card">
          <div className="card-icon">📡</div>
          <h2>Alert Connection</h2>

          <div className={`connection-status ${socketStatus}`}>
            <span className="connection-dot"></span>
            <strong>{socketStatus}</strong>
          </div>

          <p>
            This is a mock WebSocket-ready connection layer. No backend is used.
          </p>

          <button
            type="button"
            className="secondary-button full-width"
            onClick={handleReconnect}
          >
            Simulate Reconnect
          </button>
        </article>

        <article className="dashboard-card emergency-actions-card">
          <div className="card-icon">🆘</div>
          <h2>Emergency Actions</h2>

          <div className="action-button-group">
            <button
              type="button"
              className="safe-button"
              onClick={() => handleEmergencyAction("I am safe")}
            >
              I Am Safe
            </button>

            <button
              type="button"
              className="danger-button"
              onClick={() => handleEmergencyAction("I need help")}
            >
              I Need Help
            </button>
          </div>
        </article>
      </section>

      <section className="demo-alert-panel">
        <div>
          <h2>Earthquake Alert Simulation</h2>
          <p>
            Trigger a frontend-only earthquake alert. The alert is stored in
            localStorage and opens the emergency screen.
          </p>
        </div>

        <button type="button" className="demo-alert-button" onClick={handleDemoAlert}>
          Trigger Demo Earthquake Alert
        </button>
      </section>
    </main>
  );
}

export default Dashboard;