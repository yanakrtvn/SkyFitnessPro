import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header/Header';
import { getProgramById } from '../../data/programs';
import { findCourseByTitle } from '../../api/courses/CourseService';
import { getCourseWorkouts, getWorkoutById } from '../../api/workouts/WorkoutService';
import { getCourseProgress, calculateWorkoutProgress } from '../../api/progress/ProgressTracker';
import styles from './WorkoutsPage.module.css';

const WorkoutsPage = ({ onOpenAuth }) => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [workoutProgress, setWorkoutProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [apiCourseId, setApiCourseId] = useState(null);

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (!token || !email) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!apiCourseId) {
        if (isMounted) setLoading(false);
        return;
      }

      setLoading(true);
      
      const [workoutsResult, progressResult] = await Promise.all([
        getCourseWorkouts(apiCourseId),
        getCourseProgress(apiCourseId),
      ]);

      if (!isMounted) return;

      if (!workoutsResult.success || !workoutsResult.data) {
        setLoading(false);
        return;
      }

      setWorkouts(workoutsResult.data);

      if (progressResult.success && progressResult.data?.workoutsProgress) {
        const progressMap = {};
        const details = await Promise.all(
          progressResult.data.workoutsProgress.map(async (wp) => {
            const detail = await getWorkoutById(wp.workoutId);
            const percent =
              detail.success && detail.data?.exercises
                ? calculateWorkoutProgress(wp, detail.data.exercises)
                : wp.workoutCompleted
                  ? 100
                  : 0;
            return { workoutId: wp.workoutId, progress: percent };
          })
        );
        details.forEach(({ workoutId, progress }) => {
          progressMap[workoutId] = progress;
        });
        setWorkoutProgress(progressMap);
      }
      
      if (isMounted) setLoading(false);
    };

    fetchData();
  
    return () => {
      isMounted = false;
    };
  }, [apiCourseId]);

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

  if (loading) {
    return (
      <>
        <Header onOpenAuth={onOpenAuth} />
        <main className="main">
          <div className="container">
            <div className={styles.loading}>Загрузка тренировок...</div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header onOpenAuth={onOpenAuth} />
      <main className="main">
        <div className="container">
          <div className={styles.page}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate('/profile')}
            >
              ← К профилю
            </button>
            <h1 className={styles.title}>
              Тренировки курса «{program.title}»
            </h1>
            <p className={styles.subtitle}>
              Выберите тренировку для занятия
            </p>
            {workouts.length === 0 ? (
              <p className={styles.empty}>Тренировки пока не добавлены</p>
            ) : (
              <ul className={styles.list}>
                {workouts.map((workout) => {
                  const progress = workoutProgress[workout._id] ?? 0;
                  return (
                    <li key={workout._id} className={styles.item}>
                      <button
                        type="button"
                        className={styles.card}
                        onClick={() =>
                          navigate(`/course/${courseId}/workout/${workout._id}`)
                        }
                      >
                        <span className={styles.cardTitle}>
                          {workout.name || 'Тренировка'}
                        </span>
                        <span className={styles.progress}>
                          Прогресс: {progress}%
                        </span>
                        <span className={styles.arrow}>→</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default WorkoutsPage;