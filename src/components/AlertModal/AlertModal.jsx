import styles from './AlertModal.module.css';

const AlertModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  confirmText = "Да", 
  cancelText = "Отмена",
  onConfirm,
  type = 'warning' 
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className={`${styles.alertModal} ${styles.alertModalVisible}`}>
      <div className={styles.overlay} onClick={onClose}></div>
      <div className={styles.container}>
        <div className={styles.header}>
          {type === 'warning' && (
            <div className={styles.icon}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 12V20M20 28H20.01" stroke="#FFA502" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="20" cy="20" r="18" stroke="#FFA502" strokeWidth="2"/>
              </svg>
            </div>
          )}
          {type === 'danger' && (
            <div className={styles.icon}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M15 15L25 25M25 15L15 25" stroke="#FF4757" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="20" cy="20" r="18" stroke="#FF4757" strokeWidth="2"/>
              </svg>
            </div>
          )}
          <h2 className={styles.title}>{title}</h2>
        </div>
        
        <div className={styles.content}>
          <p className={styles.message}>{message}</p>
        </div>
        
        <div className={styles.actions}>
          <button
            className={`btn btn--secondary ${styles.cancelBtn}`}
            onClick={onClose}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className={`btn ${type === 'danger' ? 'btn--danger' : 'btn--primary'} ${styles.confirmBtn}`}
            onClick={handleConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;