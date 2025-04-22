export default function Notification({ message, type, onClose }) {
    if (!message) return null;
    return (
      <div className={`notification ${type}`}>
        <span>{message}</span>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
    );
  }
  