import { useState } from 'react';
import Logo from '../../components/Logo/Logo';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import styles from './AuthPage.module.css';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Введите корректное электронное письмо');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('Пароли не совпадают.');
      return;
    }

    setLoading(true);
    const result = await register(email, password);
    setLoading(false);

    if (result.success) {
      alert('Регистрация прошла успешно! Теперь войдите в систему.');
      setIsLogin(true);
      setPassword('');
      setPasswordConfirm('');
      setError('');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        <div className={styles.authLogo}>
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

export default LoginPage;