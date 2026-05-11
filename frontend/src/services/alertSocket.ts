export interface AlertPayload {
  type: string;
  alert_id: string;
  title?: string;
  message?: string;
  magnitude?: number;
  risk_level?: string;
  emergency?: boolean;
  open_url?: string;
  alarm?: boolean;
  vibration?: boolean;
  requires_response?: boolean;
  response_options?: string[];
  [key: string]: any;
}

export type SocketStatus = "connected" | "disconnected" | "reconnecting";

let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let manualClose = false;

export function connectAlertSocket(
  url: string,
  onAlert: (alert: AlertPayload) => void,
  onStatusChange: (s: SocketStatus) => void,
) {
  manualClose = false;

  const open = () => {
    onStatusChange("reconnecting");
    try {
      socket = new WebSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }

    socket.onopen = () => onStatusChange("connected");

    socket.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.type === "EARTHQUAKE_ALERT") onAlert(data);
      } catch {
        // ignore non-JSON
      }
    };

    socket.onclose = () => {
      onStatusChange("disconnected");
      if (!manualClose) scheduleReconnect();
    };

    socket.onerror = () => {
      try {
        socket?.close();
      } catch {
        /* noop */
      }
    };
  };

  const scheduleReconnect = () => {
    if (reconnectTimer) return;
    onStatusChange("reconnecting");
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      open();
    }, 3000);
  };

  open();

  return () => {
    manualClose = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    try {
      socket?.close();
    } catch {
      /* noop */
    }
    socket = null;
  };
}
