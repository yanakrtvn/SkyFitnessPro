import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header/Header';
import { programs, getProgramById } from '../../data/programs';
import { getAllCourses, removeUserCourse } from '../../api/courses/CourseService';
import { calculateCourseProgress } from '../../api/progress/ProgressTracker';
import styles from './AccountPage.module.css';

const AccountPage = ({ onOpenAuth }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [userCourses, setUserCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allApiCourses, setAllApiCourses] = useState([]);
  const [courseProgress, setCourseProgress] = useState({});
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    
    if (!token || !email) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      console.log('🔍 Начинаем загрузку данных профиля...');
      
      try {
        const savedCourseIds = localStorage.getItem('userCourses');
        if (!savedCourseIds) {
          console.log('У пользователя нет сохраненных курсов');
          setUserCourses([]);
          setLoading(false);
          return;
        }

        const courseIds = JSON.parse(savedCourseIds);
        console.log(`ID сохраненных курсов:`, courseIds);

        const allCoursesResult = await getAllCourses(false);
        
        if (allCoursesResult.success && allCoursesResult.data) {
          const allCourses = allCoursesResult.data;
          setAllApiCourses(allCourses);
          console.log(`✅ Загружено ${allCourses.length} курсов из API`);
          
          const userCoursesData = allCourses.filter(course => 
            courseIds.includes(course._id)
          );
          
          console.log(`👤 Найдено ${userCoursesData.length} курсов пользователя`);
          setUserCourses(userCoursesData);
          
          const progressPromises = userCoursesData.map(async (course) => {
            try {
              const progress = await calculateCourseProgress(course._id);
              console.log(`📊 Прогресс курса ${course.nameRU || course._id}: ${progress}%`);
              return { courseId: course._id, progress };
            } catch (error) {
              console.error(`Ошибка прогресса для ${course._id}:`, error);
              return { courseId: course._id, progress: 0 };
            }
          });
          
          const progressResults = await Promise.allSettled(progressPromises);
          const progressMap = {};
          
          progressResults.forEach((result) => {
            if (result.status === 'fulfilled') {
              progressMap[result.value.courseId] = result.value.progress;
            }
          });
          
          setCourseProgress(progressMap);
          console.log('Прогресс всех курсов загружен');
        } else {
          console.warn('Не удалось загрузить курсы из API');
          setUserCourses(courseIds.map(id => ({ 
            _id: id, 
            nameRU: 'Курс ' + id.substring(0, 6),
            nameEN: 'Course ' + id.substring(0, 6)
          })));
        }
      } catch (error) {
        console.error('Ошибка загрузки данных профиля:', error);
        setUserCourses([]);
      } finally {
        setLoading(false);
        console.log('Загрузка профиля завершена');
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот курс?')) {
      return;
    }

    const result = await removeUserCourse(courseId);
    
    if (result.success) {
      const updatedCourses = userCourses.filter(course => course._id !== courseId);
      setUserCourses(updatedCourses);
      
      const courseIds = updatedCourses.map(c => c._id);
      localStorage.setItem('userCourses', JSON.stringify(courseIds));

      const updatedProgress = { ...courseProgress };
      delete updatedProgress[courseId];
      setCourseProgress(updatedProgress);
      
      alert('Курс успешно удален!');
    } else {
      alert(result.error || 'Не удалось удалить курс. Попробуйте еще раз.');
    }
  };

  const handleStartTraining = (courseId) => {
    const apiCourse = userCourses.find(c => c._id === courseId);
    if (!apiCourse) {
      alert('Курс не найден');
      return;
    }

    const localProgram = programs.find(p => 
      p.title === apiCourse.nameRU || 
      p.title.toLowerCase() === (apiCourse.nameEN || '').toLowerCase()
    );
    
    if (localProgram) {
      navigate(`/course/${localProgram.id}/workouts`);
    } else {
      navigate(`/course/${programs[0].id}/workouts`);
    }
  };

  const getCourseButtonText = (progress) => {
    if (progress === 0) {
      return 'Начать тренировки';
    } else if (progress === 100) {
      return 'Начать заново';
    } else {
      return 'Продолжить';
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <>
        <Header onOpenAuth={onOpenAuth} />
        <main className="main">
          <div className="container">
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>Загружаем ваши курсы...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  const userName = user?.email?.split('@')[0]?.split('.')[0] || 'Пользователь';
  const userLogin = user?.email || '';

  return (
    <>
      <Header onOpenAuth={onOpenAuth} />
      <main className="main">
        <div className="container">
          <div className={styles.profilePage}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Профиль</h2>
              <div className={styles.profileCard}>
                <div className={styles.profileContent}>
                  <div className={styles.avatar}>
                    <img 
                      src="/images/svg/profile-icon.svg" 
                      alt="Профиль"
                      className={styles.avatarImg}
                    />
                  </div>
                  <div className={styles.profileInfo}>
                    <div className={styles.profileHeader}>
                      <h3 className={styles.name}>{userName}</h3>
                      <p className={styles.login}>Логин: {userLogin}</p>
                    </div>
                    <button 
                      className={`btn btn--secondary ${styles.logoutBtn}`}
                      onClick={handleLogout}
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Мои курсы</h2>
              <div className={styles.coursesList}>
                {userCourses.length === 0 ? (
                  <div className={styles.empty}>
                    <p>У вас пока нет добавленных курсов</p>
                    <button 
                      className={`btn btn--primary ${styles.browseBtn}`}
                      onClick={() => navigate('/')}
                    >
                      Найти курсы
                    </button>
                  </div>
                ) : (
                  <>
                    {userCourses.map((course) => {
                      const courseId = course._id;
                      let program = null;
                      
                      program = programs.find(p => 
                        p.title === course.nameRU || 
                        p.title.toLowerCase() === (course.nameEN || '').toLowerCase()
                      );
                      
                      if (!program) {
                        program = {
                          title: course.nameRU || 'Курс',
                          image: '/images/programs/default.jpg',
                          bgColor: '#4CAF50',
                          duration: '25 дней',
                          timePerDay: '20-50 мин/день',
                          difficulty: 'Средняя'
                        };
                      }

                      const progress = courseProgress[courseId] || 0;

                      return (
                        <div key={courseId} className={styles.courseCard}>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteCourse(courseId)}
                            title="Удалить курс"
                          >
                            <img 
                              src="/images/svg/remove-in-circle.svg" 
                              alt="Удалить"
                              className={styles.deleteIcon}
                            />
                          </button>
                          <div className={styles.courseImage}>
                            <img 
                              src={program.image} 
                              alt={program.title}
                              className={styles.courseImg}
                            />
                          </div>
                          <div className={styles.courseContent}>
                            <h3 className={styles.courseTitle}>{program.title}</h3>
                            <div className={styles.courseMeta}>
                              <div className={styles.metaItem}>
                                <img 
                                  src="/images/svg/kalendar.svg" 
                                  alt=""
                                  className={styles.metaIcon}
                                />
                                <span>{program.duration}</span>
                              </div>
                              <div className={styles.metaItem}>
                                <img 
                                  src="/images/svg/time.svg" 
                                  alt=""
                                  className={styles.metaIcon}
                                />
                                <span>{program.timePerDay}</span>
                              </div>
                              <div className={styles.metaItem}>
                                <img 
                                  src="/images/svg/signal.svg" 
                                  alt=""
                                  className={styles.metaIcon}
                                />
                                <span>{program.difficulty}</span>
                              </div>
                            </div>
                            <div className={styles.courseProgress}>
                              <div className={styles.progressHeader}>
                                <span className={styles.progressText}>Прогресс {progress}%</span>
                                <div className={styles.progressBar}>
                                  <div 
                                    className={styles.progressFill}
                                    style={{ 
                                      width: `${progress}%`,
                                      backgroundColor: program.bgColor 
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <button
                              className={`btn btn--primary ${styles.courseActionBtn}`}
                              onClick={() => handleStartTraining(courseId)}
                              style={{ backgroundColor: program.bgColor }}
                            >
                              {getCourseButtonText(progress)}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <button 
                      className={`btn btn--primary ${styles.scrollTopBtn}`} 
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      Наверх ↑
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AccountPage;