import { useNavigate } from "react-router-dom";

function EmergencyOverlay({ alert }) {
  const navigate = useNavigate();

  if (!alert) {
    return null;
  }

  return (
    <div className="emergency-overlay" role="alert">
      <div>
        <strong>🚨 Active Emergency Alert</strong>
        <p>{alert.message}</p>
      </div>

      <button
        type="button"
        className="overlay-button"
        onClick={() => navigate("/emergency")}
      >
        Open Alert
      </button>
    </div>
  );
}

export default EmergencyOverlay;