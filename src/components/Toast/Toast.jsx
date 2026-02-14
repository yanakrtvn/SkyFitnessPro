import { useEffect } from 'react';
import styles from './Toast.module.css';

const Toast = ({ 
  message, 
  type = 'info', 
  isVisible, 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.content}>
        {type === 'success' && (
          <div className={styles.icon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 10L9.5 12L12.5 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
        )}
        {type === 'error' && (
          <div className={styles.icon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
        )}
        {type === 'warning' && (
          <div className={styles.icon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 6V10M10 14H10.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
        )}
        <span className={styles.message}>{message}</span>
      </div>
      <button className={styles.close} onClick={onClose}>
        ×
      </button>
    </div>
  );
};

export default Toast;