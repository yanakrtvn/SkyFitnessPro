import styles from './Hero.module.css';

const Hero = () => {
  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.content}>
          <h1 className={styles.title}>
            Начните заниматься спортом<br />и улучшите качество жизни
          </h1>
          <div className={styles.badge}>
            <p className={styles.badgeText}>
              Измени своё<br />тело за полгода!
            </p>
            <img 
              src="/images/icons/badge-arrow.png" 
              alt="" 
              className={styles.badgeArrow} 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;