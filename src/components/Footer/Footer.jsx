import styles from './Footer.module.css';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={styles.footer}>
      <div className="container">
        <button className={`btn btn--primary ${styles.btn}`} onClick={scrollToTop}>
          Наверх ↑
        </button>
      </div>
    </footer>
  );
};

export default Footer;