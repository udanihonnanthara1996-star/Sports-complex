import React, { useEffect } from 'react';
import './Popup.css';

const typeIcons = {
  success: '✅',
  error: '⚠️',
  warning: '⚠️',
  info: 'ℹ️'
};

function Popup({
  open,
  type = 'info',
  title,
  message,
  actions = [],
  onClose
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (onClose) {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const icon = typeIcons[type] || typeIcons.info;
  const hasActions = Array.isArray(actions) && actions.length > 0;

  const handleAction = (action) => {
    if (!action) return;

    if (typeof action.onClick === 'function') {
      action.onClick();
    }

    if (action.closesPopup !== false && onClose) {
      onClose();
    }
  };

  return (
    <div className="popup-overlay" role="dialog" aria-modal="true">
      <div className={`popup-card popup-${type}`}>
        <button
          type="button"
          className="popup-close"
          onClick={onClose}
          aria-label="Close popup"
        >
          ×
        </button>

        <div className="popup-icon" aria-hidden="true">{icon}</div>
        {title && <h3 className="popup-title">{title}</h3>}
        {message && <p className="popup-message">{message}</p>}

        <div className="popup-actions">
          {hasActions ? (
            actions.map((action, index) => (
              <button
                key={index}
                type="button"
                className={`popup-button popup-button-${action.variant || 'primary'}`}
                onClick={() => handleAction(action)}
              >
                {action.label}
              </button>
            ))
          ) : (
            <button
              type="button"
              className="popup-button popup-button-primary"
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Popup;
