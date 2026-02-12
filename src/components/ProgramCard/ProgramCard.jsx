import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../context/NotificationContext';
import { findCourseByTitle, addUserCourse } from '../../api/courses/CourseService';
import styles from './ProgramCard.module.css';

const ProgramCard = ({ program, onOpenAuth }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const [isAdding, setIsAdding] = useState(false);

  const handleCardClick = () => {
    navigate(`/course/${program.id}`);
  };

  const handleAddClick = async (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      showInfo('Войдите в систему, чтобы добавить курс');
      if (onOpenAuth) {
        onOpenAuth();
      }
      return;
    }

    setIsAdding(true);
    
    try {
      const findResult = await findCourseByTitle(program.title);
      
      if (!findResult.success || !findResult.data) {
        showError('Не удалось найти курс в системе. Попробуйте позже.');
        setIsAdding(false);
        return;
      }

      const apiCourseId = findResult.data._id;

      const result = await addUserCourse(apiCourseId);
      
      if (result.success || result.isDuplicate) {
        const savedCourses = localStorage.getItem('userCourses');
        const courseIds = savedCourses ? JSON.parse(savedCourses) : [];
        
        if (!courseIds.includes(apiCourseId)) {
          courseIds.push(apiCourseId);
          localStorage.setItem('userCourses', JSON.stringify(courseIds));
        }
        
        if (result.isDuplicate) {
          showInfo('Курс уже был добавлен ранее!');
        } else {
          showSuccess('Курс успешно добавлен в вашу коллекцию!');
        }
      } else {
        showError(result.error || 'Не удалось добавить курс. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка при добавлении курса:', error);
      showError('Произошла ошибка. Попробуйте еще раз.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <article className={styles.programCard} onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div 
        className={styles.image} 
        style={{ backgroundColor: program.bgColor }}
      >
        <button 
          className={styles.addBtn} 
          aria-label="Добавить в избранное"
          onClick={handleAddClick}
          disabled={isAdding}
          title={isAdding ? 'Добавление...' : 'Добавить курс'}
        >
          {isAdding ? '...' : '+'}
        </button>
        <img 
          src={program.image} 
          alt={program.title} 
          className={styles.img} 
        />
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{program.title}</h3>
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <div className={styles.detailItem}>
              <img 
                src="/images/svg/kalendar.svg" 
                alt=""
                className={styles.detailIcon}
              />
              <span>{program.duration}</span>
            </div>
            <div className={styles.detailItem}>
              <img 
                src="/images/svg/time.svg" 
                alt=""
                className={styles.detailIcon}
              />
              <span>{program.timePerDay}</span>
            </div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailItem}>
              <img 
                src="/images/svg/signal.svg" 
                alt=""
                className={styles.detailIcon}
              />
              <span>{program.difficulty}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProgramCard;