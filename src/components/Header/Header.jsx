import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo/Logo';
import { useAuth } from '../../hooks/useAuth';
import styles from './Header.module.css';

const Header = ({ onOpenAuth }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleUserMenuClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/');
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    onOpenAuth();
  };

  
  const getUserName = () => {
    if (!user || !user.email) return 'Пользователь';
    const email = user.email;
    
    const namePart = email.split('@')[0];
    
    return namePart.charAt(0).toUpperCase() + namePart.slice(1).split('.')[0];
  };

  const userName = getUserName();

  return (
    <header className={styles.header}>
      <div className="container">
        <div className={styles.content}>
          <div className={styles.logoSection}>
            <Logo />
            <p className={styles.subtitle}>Онлайн-тренировки для занятий дома</p>
          </div>
          {isAuthenticated && user ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button 
                className={styles.userBtn} 
                onClick={handleUserMenuClick}
                type="button"
              >
                <div className={styles.userAvatar}>
                  <img 
                    src="/images/svg/profile-icon.svg" 
                    alt="Профиль"
                    className={styles.userAvatarImg}
                  />
                </div>
                <span className={styles.userName}>{userName}</span>
                <svg 
                  className={`${styles.userArrow} ${dropdownOpen ? styles.userArrowOpen : ''}`}
                  width="12" 
                  height="8" 
                  viewBox="0 0 12 8" 
                  fill="none"
                >
                  <path 
                    d="M1 1.5L6 6.5L11 1.5" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <button 
                    className={styles.dropdownItem}
                    onClick={handleProfileClick}
                  >
                    Мой профиль
                  </button>
                  <button 
                    className={styles.dropdownItem}
                    onClick={handleLogout}
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              className={`btn btn--primary ${styles.btn}`} 
              onClick={handleLoginClick}
              type="button"
            >
              Войти
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;