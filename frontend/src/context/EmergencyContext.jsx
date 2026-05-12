import { createContext, useContext, useEffect, useState } from "react";

const EmergencyContext = createContext(null);

const STORAGE_KEY = "quakeguard_emergency_context";

const defaultState = {
  emergency: false,
  title: "",
  message: "",
  magnitude: null,
  risk_level: "SAFE",
  userStatus: "SAFE"
};

function getInitialState() {
  const storedState = localStorage.getItem(STORAGE_KEY);

  if (!storedState) {
    return defaultState;
  }

  try {
    return {
      ...defaultState,
      ...JSON.parse(storedState)
    };
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return defaultState;
  }
}

export function EmergencyProvider({ children }) {
  const [emergency, setEmergency] = useState(getInitialState().emergency);
  const [title, setTitle] = useState(getInitialState().title);
  const [message, setMessage] = useState(getInitialState().message);
  const [magnitude, setMagnitude] = useState(getInitialState().magnitude);
  const [risk_level, setRiskLevel] = useState(getInitialState().risk_level);
  const [userStatus, setUserStatus] = useState(getInitialState().userStatus);

  useEffect(() => {
    const stateToStore = {
      emergency,
      title,
      message,
      magnitude,
      risk_level,
      userStatus
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
  }, [emergency, title, message, magnitude, risk_level, userStatus]);

  function triggerEmergency(alertData) {
    setTitle(alertData.title || "Earthquake Alert");
    setMessage(alertData.message || "Stay safe and avoid buildings.");
    setMagnitude(alertData.magnitude || 6.8);
    setRiskLevel(alertData.risk_level || "HIGH");
    setUserStatus("PENDING");
    setEmergency(true);
  }

  function resolveEmergency() {
    setEmergency(false);
    setTitle("");
    setMessage("");
    setMagnitude(null);
    setRiskLevel("SAFE");
    setUserStatus("SAFE");
  }

  const value = {
    emergency,
    title,
    message,
    magnitude,
    risk_level,
    userStatus,

    setEmergency,
    setTitle,
    setMessage,
    setMagnitude,
    setRiskLevel,
    setUserStatus,

    triggerEmergency,
    resolveEmergency
  };

  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergencyContext() {
  const context = useContext(EmergencyContext);

  if (!context) {
    throw new Error(
      "useEmergencyContext must be used inside EmergencyProvider"
    );
  }

  return context;
}