import { Link } from 'react-router-dom';
import styles from './Logo.module.css';

const Logo = ({ className = '' }) => {
  return (
    <Link to="/" className={`${styles.logo} ${className}`} style={{ textDecoration: 'none' }}>
      <div className={styles.icon}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M8 5V19L19 12L8 5Z" fill="url(#playGradient)"/>
          <defs>
            <linearGradient id="playGradient" x1="8" y1="5" x2="19" y2="12" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00C1FF"/>
              <stop offset="1" stopColor="#99D100"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className={styles.text}>SkyFitnessPro</span>
    </Link>
  );
};

export default Logo;