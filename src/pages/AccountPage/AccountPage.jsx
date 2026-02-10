import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header/Header';
import { programs, getProgramById } from '../../data/programs';
import { getAllCourses, removeUserCourse } from '../../api/courses.api';
import { getWorkoutById, getCourseWorkouts } from '../../api/workouts.api';
import { getUserProgress, calculateWorkoutProgress, resetProgress } from '../../api/progress.api';
import styles from './AccountPage.module.css';

const AccountPage = ({ onOpenAuth }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [userCourses, setUserCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allApiCourses, setAllApiCourses] = useState([]);
  const [courseProgress, setCourseProgress] = useState({}); 

  const fetchCourseProgress = async (apiCourseId) => {
      try {
        const workoutsResult = await getCourseWorkouts(apiCourseId);
        
        if (!workoutsResult.success || !workoutsResult.data || workoutsResult.data.length === 0) {
          return 0;
        }

        const workouts = workoutsResult.data;
        const progressPromises = workouts.map(async (workout) => {
          try {
            const [progressResult, workoutDetailResult] = await Promise.all([
              getUserProgress(apiCourseId, workout._id),
              getWorkoutById(workout._id),
            ]);

            if (progressResult.success && workoutDetailResult.success) {
              return calculateWorkoutProgress(
                progressResult.data,
                workoutDetailResult.data?.exercises || []
              );
            }
            return 0;
          } catch (error) {
            return 0;
          }
        });

        const workoutProgresses = await Promise.all(progressPromises);
        const totalProgress = workoutProgresses.reduce((sum, progress) => sum + progress, 0);
        const averageProgress = workouts.length > 0 ? Math.round(totalProgress / workouts.length) : 0;
        return averageProgress;
      } catch (error) {
        return 0;
      }
    };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    
    if (!token || !email) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const savedCourseIds = localStorage.getItem('userCourses');
        if (!savedCourseIds) {
          setUserCourses([]);
          setLoading(false);
          return;
        }

        try {
          const courseIds = JSON.parse(savedCourseIds);
          const allCoursesResult = await getAllCourses();
          
          if (allCoursesResult.success && allCoursesResult.data) {
            const allCourses = allCoursesResult.data;
            setAllApiCourses(allCourses);
            
            const userCoursesData = allCourses.filter(course => 
              courseIds.includes(course._id)
            );
            setUserCourses(userCoursesData);
            
            const progressPromises = userCoursesData.map(async (course) => {
              const progress = await fetchCourseProgress(course._id);
              return { courseId: course._id, progress };
            });
            
            const progressResults = await Promise.all(progressPromises);
            const progressMap = {};
            progressResults.forEach(({ courseId, progress }) => {
              progressMap[courseId] = progress;
            });
            setCourseProgress(progressMap);
          } else {
            setUserCourses(courseIds.map(id => ({ _id: id })));
          }
        } catch (e) {
          setUserCourses([]);
        }
      } catch (error) {
        setUserCourses([]);
      } finally {
        setLoading(false);
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
      const updatedCourses = userCourses.filter(course => {
        const courseIdToCheck = course._id || course.id || course.courseId;
        return courseIdToCheck !== courseId;
      });
      setUserCourses(updatedCourses);
      
      const courseIds = updatedCourses.map(c => c._id || c.id || c.courseId);
      localStorage.setItem('userCourses', JSON.stringify(courseIds));
    } else {
      alert(result.error || 'Не удалось удалить курс. Попробуйте еще раз.');
    }
  };

  const handleCourseAction = async (courseId, progress) => {
    
    const localProgram = getProgramById(courseId);
    if (!localProgram) {
      navigate(`/course/${courseId}`);
      return;
    }

    
    let apiCourseId = null;
    
    
    const userCourse = userCourses.find(c => {
      if (typeof c === 'object' && c._id) {
        return c.nameRU === localProgram.title || c.nameEN?.toLowerCase() === localProgram.title?.toLowerCase();
      }
      return false;
    });
    
    if (userCourse && userCourse._id) {
      apiCourseId = userCourse._id;
    } else {
      
      const apiCourse = allApiCourses.find(c => 
        c.nameRU === localProgram.title || c.nameEN?.toLowerCase() === localProgram.title?.toLowerCase()
      );
      if (apiCourse && apiCourse._id) {
        apiCourseId = apiCourse._id;
      }
    }

    if (!apiCourseId) {
      
      navigate(`/course/${courseId}`);
      return;
    }

    if (progress === 100) {
      try {
        const workoutsResult = await getCourseWorkouts(apiCourseId);
        
        if (workoutsResult.success && workoutsResult.data) {
          const workouts = workoutsResult.data;
          
          for (const workout of workouts) {
            try {
              await resetProgress(apiCourseId, workout._id);
            } catch (error) {
              console.error('Ошибка при сбросе прогресса:', error);
            }
          }
          
          const updatedProgress = await fetchCourseProgress(apiCourseId);
          setCourseProgress(prev => ({
            ...prev,
            [apiCourseId]: updatedProgress
          }));
        }
      } catch (error) {
        console.error('Ошибка при сбросе прогресса курса:', error);
      }
    }

    navigate(`/course/${courseId}/workouts`);
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
            <div className={styles.loading}>Загрузка...</div>
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
                  <p className={styles.empty}>У вас пока нет добавленных курсов</p>
                ) : (
                  <>
                    {userCourses.map((course) => {
                    
                    
                    const courseId = course._id || course.id || course.courseId;
                    let program = null;
                    
                    
                    if (course.nameRU) {
                      program = programs.find(p => p.title === course.nameRU);
                    }
                    
                    
                    if (!program && courseId) {
                      const numericId = parseInt(courseId);
                      if (!isNaN(numericId)) {
                        program = getProgramById(numericId);
                      }
                    }
                    
                    if (!program) {
                      return null;
                    }

                    const progress = courseProgress[courseId] ?? 0;

                    return (
                      <div key={courseId} className={styles.courseCard}>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteCourse(courseId)}
                          title="Удалить курс"
                          style={{ color: program.bgColor }}
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
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                                 <button
                                   className={`btn btn--primary ${styles.courseActionBtn}`}
                                   onClick={() => {
                                     
                                     const localProgramId = program.id;
                                     handleCourseAction(localProgramId, progress);
                                   }}
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