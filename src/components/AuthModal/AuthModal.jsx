import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo/Logo';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../context/NotificationContext';
import styles from './AuthModal.module.css';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { showSuccess } = useNotification();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setError('');
      setEmail('');
      setPassword('');
      setPasswordConfirm('');
      setIsLogin(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleLogin = async (e) => {
  e.preventDefault();
  setError('');

  if (!email || !email.includes('@')) {
    setError('Введите корректный email');
    return;
  }

  setLoading(true);
  const result = await login(email, password);
  setLoading(false);

  if (result.success) {
    onClose();
    setTimeout(() => {
      navigate('/profile');
    }, 100);
  } else {
    setError(result.error || 'Произошла ошибка при входе');
  }
};

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    const result = await register(email, password);
    setLoading(false);

    if (result.success) {
      showSuccess('Регистрация прошла успешно! Теперь войдите в систему.');
      setIsLogin(true);
      setPassword('');
      setPasswordConfirm('');
      setError('');
    } else {
      setError(result.error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.authModal} ${styles.authModalVisible}`}>
      <div className={styles.overlay} onClick={onClose}></div>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Logo />
        </div>

        {isLogin ? (
          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.fields}>
              <div className={styles.field}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="Эл. почта"
                  required
                />
              </div>
              <div className={styles.field}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Пароль"
                  required
                />
                {error && <p className={`${styles.error} ${styles.errorVisible}`}>{error}</p>}
              </div>
            </div>
            <div className={styles.actions}>
              <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                {loading ? 'Вход...' : 'Войти'}
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--full"
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
              >
                Зарегистрироваться
              </button>
            </div>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleRegister}>
            <div className={styles.fields}>
              <div className={styles.field}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="Эл. почта"
                  required
                />
              </div>
              <div className={styles.field}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Пароль"
                  required
                />
              </div>
              <div className={styles.field}>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className={styles.input}
                  placeholder="Повторите пароль"
                  required
                />
                {error && <p className={`${styles.error} ${styles.errorVisible}`}>{error}</p>}
              </div>
            </div>
            <div className={styles.actions}>
              <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--full"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
              >
                Войти
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;