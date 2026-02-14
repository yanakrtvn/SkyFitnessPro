import React, { createContext, useState, useContext, useCallback } from 'react';
import Toast from '../components/Toast/Toast';
import AlertModal from '../components/AlertModal/AlertModal';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info'
  });

  const [alert, setAlert] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Да',
    cancelText: 'Отмена',
    type: 'warning',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const showToast = useCallback((message, type = 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  }, []);

  const showSuccess = useCallback((message) => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((message) => {
    showToast(message, 'error');
  }, [showToast]);

  const showWarning = useCallback((message) => {
    showToast(message, 'warning');
  }, [showToast]);

  const showInfo = useCallback((message) => {
    showToast(message, 'info');
  }, [showToast]);

  const showAlert = useCallback(({
    title,
    message,
    confirmText = 'Да',
    cancelText = 'Отмена',
    type = 'warning',
    onConfirm,
    onCancel
  }) => {
    setAlert({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm: onConfirm || (() => {}),
      onCancel: onCancel || (() => {})
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <NotificationContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showAlert
    }}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={4000}
      />
      <AlertModal
        isOpen={alert.isOpen}
        onClose={() => {
          alert.onCancel?.();
          hideAlert();
        }}
        title={alert.title}
        message={alert.message}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        type={alert.type}
        onConfirm={() => {
          alert.onConfirm?.();
          hideAlert();
        }}
      />
    </NotificationContext.Provider>
  );
};