import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header/Header';
import ProgressModal from '../../components/ProgressModal/ProgressModal';
import SuccessModal from '../../components/SuccessModal/SuccessModal';
import { getProgramById } from '../../data/programs';
import { findCourseByTitle } from '../../api/courses/CourseService';
import { getWorkoutById } from '../../api/workouts/WorkoutService';
import { getUserProgress, saveProgress, resetProgress } from '../../api/progress/ProgressTracker';
import styles from './TrainingPage.module.css';

const TrainingPage = ({ onOpenAuth }) => {
  const { courseId, workoutId } = useParams();
  const { loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiCourseId, setApiCourseId] = useState(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const program = getProgramById(courseId);

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

  const [userProgress, setUserProgress] = useState(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!workoutId) {
        setLoading(false);
        return;
      }

      const result = await getWorkoutById(workoutId);
      
      if (result.success && result.data) {
        setWorkout(result.data);
        setExercises(result.data.exercises || []);
      }
      
      setLoading(false);
    };

    fetchWorkout();
  }, [workoutId]);

  const fetchUserProgress = useCallback(async () => {
    if (!apiCourseId || !workoutId) {
      return;
    }

    const result = await getUserProgress(apiCourseId, workoutId);
    
    if (result.success && result.data) {
      setUserProgress(result.data);
    } else {
      setUserProgress(null);
    }
  }, [apiCourseId, workoutId]);

  useEffect(() => {
    if (apiCourseId && workoutId) {
      fetchUserProgress();
    }
  }, [apiCourseId, workoutId, fetchUserProgress]);

  useEffect(() => {
    if (!authLoading) {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('email');
      if (!token || !email) {
        navigate('/');
        return;
      }
    }
  }, [authLoading, navigate]);

  if (authLoading) {
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

  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  if (!token || !email) {
    return null;
  }

  if (loading) {
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

  if (!workout) {
    return (
      <>
        <Header onOpenAuth={onOpenAuth} />
        <main className="main">
          <div className="container">
            <div className={styles.error}>Тренировка не найдена</div>
          </div>
        </main>
      </>
    );
  }

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(workout.video);

  const handleSaveProgress = async (progressData) => {
    if (!apiCourseId || !workoutId) {
      alert('Ошибка: не удалось определить курс или тренировку');
      return;
    }

    if (!exercises || exercises.length === 0) {
      alert('Ошибка: нет упражнений для сохранения прогресса');
      return;
    }

    if (progressData.length !== exercises.length) {
      alert(`Ошибка: количество значений прогресса (${progressData.length}) не совпадает с количество упражнений (${exercises.length})`);
      return;
    }

    const validProgressData = progressData.map(val => {
      const num = parseInt(val);
      return isNaN(num) ? 0 : num;
    });

    const result = await saveProgress(apiCourseId, workoutId, validProgressData);
    
    if (result.success) {
      await fetchUserProgress();
      setSuccessModalOpen(true);
    } else {
      alert(result.error || 'Не удалось сохранить прогресс');
    }
  };

  const handleResetProgress = async () => {
    if (!apiCourseId || !workoutId) {
      alert('Ошибка: не удалось определить курс или тренировку');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите удалить весь прогресс по этой тренировке?')) {
      return;
    }

    const result = await resetProgress(apiCourseId, workoutId);
    
    if (result.success) {
      await fetchUserProgress();
      setSuccessModalOpen(true);
    } else {
      alert(result.error || 'Не удалось удалить прогресс');
    }
  };

  return (
    <>
      <Header onOpenAuth={onOpenAuth} />
      <main className="main">
        <div className="container">
          <div className={styles.workoutPage}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(`/course/${courseId}/workouts`)}
            >
              ← К списку тренировок
            </button>
            <div className={styles.header}>
              <h1 className={styles.title}>{workout.name || 'Тренировка'}</h1>
            </div>

            <div className={styles.videoSection}>
              {videoId ? (
                <div className={styles.videoWrapper}>
                  <iframe
                    className={styles.video}
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={workout.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className={styles.videoPlaceholder}>
                  Видео недоступно
                </div>
              )}
            </div>

            <div className={styles.exercisesSection}>
              <h2 className={styles.exercisesTitle}>
                Упражнения тренировки {workout.name?.match(/\d+/)?.[0] || ''}
              </h2>
              <div className={styles.exercisesList}>
                {exercises.length === 0 ? (
                  <p className={styles.noExercises}>Упражнения пока не добавлены</p>
                ) : (
                  exercises.map((exercise, index) => {
                    const progressValue = userProgress?.progressData?.[index] ?? 0;
                    const quantity = exercise.quantity || 0;
                    const progressPercent = quantity > 0 
                      ? Math.min(100, Math.round((progressValue / quantity) * 100)) 
                      : 0;
                    
                    
                    return (
                      <div key={exercise._id || index} className={styles.exerciseItem}>
                        <div className={styles.exerciseHeader}>
                          <span className={styles.exerciseName}>
                            {exercise.name || `Упражнение ${index + 1}`}
                          </span>
                          <span className={styles.exerciseProgress}>
                            {progressPercent}%
                          </span>
                        </div>
                        <div className={styles.exerciseProgressBar}>
                          <div 
                            className={styles.exerciseProgressFill}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className={styles.progressActions}>
                <button
                  className={`btn btn--primary ${styles.progressBtn}`}
                  onClick={() => setProgressModalOpen(true)}
                >
                  Обновить свой прогресс
                </button>
                {userProgress && userProgress.progressData && userProgress.progressData.some(val => val > 0) && (
                  <button
                    className={`btn btn--secondary ${styles.resetBtn}`}
                    onClick={handleResetProgress}
                  >
                    Сбросить прогресс
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <ProgressModal
        isOpen={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        exercises={exercises}
        currentProgress={userProgress}
        onSave={handleSaveProgress}
        workoutId={workoutId}
        courseId={apiCourseId}
      />
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
      />
    </>
  );
};

export default TrainingPage;