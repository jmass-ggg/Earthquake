export const MOCK_EARTHQUAKE_ALERT = {
  type: "EARTHQUAKE_ALERT",
  title: "Earthquake Alert",
  message: "Strong earthquake detected. Move to a safe area immediately.",
  magnitude: 6.5,
  risk_level: "HIGH",
  location: "Demo Seismic Zone",
  issuedAt: new Date().toISOString()
};

export function createMockEarthquakeAlert() {
  return {
    ...MOCK_EARTHQUAKE_ALERT,
    id: `alert_${Date.now()}`,
    issuedAt: new Date().toISOString()
  };
}

export class MockSocket {
  constructor({ onStatusChange, onAlert } = {}) {
    this.status = "disconnected";
    this.onStatusChange = onStatusChange;
    this.onAlert = onAlert;
    this.connectionTimer = null;
    this.reconnectTimer = null;
  }

  setStatus(nextStatus) {
    this.status = nextStatus;

    if (typeof this.onStatusChange === "function") {
      this.onStatusChange(nextStatus);
    }
  }

  connect() {
    this.setStatus("reconnecting");

    this.connectionTimer = setTimeout(() => {
      this.setStatus("connected");
    }, 900);
  }

  disconnect() {
    clearTimeout(this.connectionTimer);
    clearTimeout(this.reconnectTimer);
    this.setStatus("disconnected");
  }

  simulateReconnect() {
    this.setStatus("disconnected");

    this.reconnectTimer = setTimeout(() => {
      this.setStatus("reconnecting");

      this.connectionTimer = setTimeout(() => {
        this.setStatus("connected");
      }, 1200);
    }, 800);
  }

  triggerDemoAlert() {
    const alert = createMockEarthquakeAlert();

    if (typeof this.onAlert === "function") {
      this.onAlert(alert);
    }

    return alert;
  }
}