import { useParams } from 'react-router-dom';
import { getProgramById } from '../../data/programs';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header/Header';
import { useState, useEffect } from 'react';
import { findCourseByTitle, addUserCourse } from '../../api/courses/CourseService';
import styles from './ProgramPage.module.css';

const ProgramPage = ({ onOpenAuth }) => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [userCourses, setUserCourses] = useState([]);
  const [apiCourseId, setApiCourseId] = useState(null);

  const program = getProgramById(id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchApiCourseId = async () => {
      if (!program) return;
      
      const result = await findCourseByTitle(program.title);
      if (result.success && result.data) {
        setApiCourseId(result.data._id);
      }
    };

    fetchApiCourseId();
  }, [program]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUserCourses([]);
      return;
    }

    try {
      const savedCourses = localStorage.getItem('userCourses');
      if (savedCourses) {
        const courseIds = JSON.parse(savedCourses);
        setUserCourses(courseIds);
      } else {
        setUserCourses([]);
      }
    } catch (error) {
      setUserCourses([]);
    }
  }, [isAuthenticated]);

  if (!program) {
    return (
      <>
        <Header onOpenAuth={onOpenAuth} />
        <main className="main">
          <div className="container">
            <h1>Курс не найден</h1>
          </div>
        </main>
      </>
    );
  }

  const hasCourse = apiCourseId ? userCourses.includes(apiCourseId) : false;

  const handleAddCourse = async () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    if (!apiCourseId) {
      alert('Не удалось найти курс в системе. Попробуйте обновить страницу.');
      return;
    }

    setIsAdding(true);
    
    const result = await addUserCourse(apiCourseId);
    
    if (result.success || result.isDuplicate) {
      if (!userCourses.includes(apiCourseId)) {
        const updatedCourses = [...userCourses, apiCourseId];
        setUserCourses(updatedCourses);
        localStorage.setItem('userCourses', JSON.stringify(updatedCourses));
      }
      
      if (result.isDuplicate) {
        alert('Курс уже был добавлен!');
      } else {
        alert('Курс успешно добавлен!');
      }
    } else {
      alert(result.error || 'Не удалось добавить курс. Попробуйте еще раз.');
    }
    
    setIsAdding(false);
  };

  return (
    <>
      <Header onOpenAuth={onOpenAuth} />
      <main className="main">
        <div className={styles.coursePage}>
          <div className="container">
            <div className={styles.header}>
              <div 
                className={styles.imageWrapper}
                style={{ backgroundColor: program.bgColor }}
              >
                <img 
                  src={program.detailImage || program.image} 
                  alt={program.title}
                  className={styles.image}
                />
                <img 
                  src={program.image} 
                  alt={program.title}
                  className={`${styles.image} ${styles.imageMobile}`}
                />
              </div>
            </div>

            <div className={styles.content}>
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Подойдет для вас, если:</h2>
                <div className={styles.suitableList}>
                  {program.suitableFor.map((item, index) => (
                    <div key={index} className={styles.suitableCard}>
                      <div className={styles.suitableCardInner}>
                        <div className={styles.suitableNumber}>{index + 1}</div>
                        <p className={styles.suitableText}>{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Направления</h2>
                <div className={styles.directions}>
                  <div className={styles.directionsColumn}>
                    {program.directions.slice(0, 2).map((direction, index) => (
                      <div key={index} className={styles.directionItem}>
                        <img 
                          src="/images/svg/star.svg" 
                          alt=""
                          className={styles.directionIcon}
                        />
                        <span>{direction}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.directionsColumn}>
                    {program.directions.slice(2, 4).map((direction, index) => (
                      <div key={index + 2} className={styles.directionItem}>
                        <img 
                          src="/images/svg/star.svg" 
                          alt=""
                          className={styles.directionIcon}
                        />
                        <span>{direction}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.directionsColumn}>
                    {program.directions.slice(4, 6).map((direction, index) => (
                      <div key={index + 4} className={styles.directionItem}>
                        <img 
                          src="/images/svg/star.svg" 
                          alt=""
                          className={styles.directionIcon}
                        />
                        <span>{direction}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.ctaWrapper}>
              <div className={styles.ctaImage}>
                <img 
                  src="/images/svg/greenline.svg" 
                  alt=""
                  className={styles.ctaDecoration}
                />
                <img 
                  src="/images/svg/man.png" 
                  alt="Тренировка"
                  className={styles.ctaImg}
                />
              </div>
              <div className={styles.cta}>
                <div className={styles.ctaContent}>
                  <div className={styles.ctaText}>
                    <h2 className={styles.ctaTitle}>
                      Начните путь<br />к новому телу
                    </h2>
                    <ul className={styles.benefits}>
                      {program.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                    <button 
                      className={`btn btn--primary ${styles.ctaBtn}`}
                      onClick={handleAddCourse}
                      disabled={isAdding || hasCourse}
                    >
                      {isAdding 
                        ? 'Добавление...' 
                        : hasCourse 
                          ? 'Курс уже добавлен' 
                          : isAuthenticated 
                            ? 'Добавить курс' 
                            : 'Войдите, чтобы добавить курс'
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ProgramPage;