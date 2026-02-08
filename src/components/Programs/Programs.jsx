import ProgramCard from '../ProgramCard/ProgramCard';
import { programs } from '../../data/programs';
import styles from './Programs.module.css';

const Programs = ({ onOpenAuth }) => {
  return (
    <section className={styles.programs}>
      <div className="container">
        <div className={styles.grid}>
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} onOpenAuth={onOpenAuth} />
          ))}
          <button 
            className={`btn btn--primary ${styles.scrollTopBtn}`} 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Наверх ↑
          </button>
        </div>
      </div>
    </section>
  );
};

export default Programs;