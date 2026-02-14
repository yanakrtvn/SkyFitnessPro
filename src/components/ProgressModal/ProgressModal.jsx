import { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import styles from './ProgressModal.module.css';

const ProgressModal = ({ isOpen, onClose, exercises, currentProgress, onSave }) => {
  const [progressData, setProgressData] = useState([]);
  const { showError } = useNotification();

  useEffect(() => {
    if (isOpen && exercises) {
      const initialProgress = exercises.map((_, index) => {
        return currentProgress?.progressData?.[index] ?? 0;
      });
      setProgressData(initialProgress);
    }
  }, [isOpen, exercises, currentProgress]);

  const handleInputChange = (index, value) => {
    const newProgress = [...progressData];
    if (value === '' || value === null || value === undefined) {
      newProgress[index] = 0;
    } else {
    const numValue = parseInt(value, 10);
    newProgress[index] = isNaN(numValue) ? 0 : numValue;
  }
  setProgressData(newProgress);
};

  const handleSave = async () => {
    if (!exercises || exercises.length === 0) {
      showError('Нет упражнений для сохранения');
      return;
    }

    if (progressData.length !== exercises.length) {
      showError(`Ошибка: количество значений прогресса (${progressData.length}) не совпадает с количеством упражнений (${exercises.length})`);
      return;
    }

    const validProgressData = progressData.map(val => {
      const num = parseInt(val);
      return isNaN(num) ? 0 : num;
    });

    if (onSave) {
      await onSave(validProgressData);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.progressModal} ${styles.progressModalVisible}`}>
      <div className={styles.overlay} onClick={onClose}></div>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Мой прогресс</h2>
          <button 
            className={styles.close}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className={styles.content}>
          {exercises && exercises.length > 0 ? (
            <div className={styles.exercises}>
              {exercises.map((exercise, index) => (
                <div key={exercise._id || index} className={styles.exercise}>
                  <label className={styles.exerciseLabel}>
                    Сколько раз вы сделали {exercise.name?.toLowerCase() || `упражнение ${index + 1}`}?
                    {exercise.quantity && (
                      <span className={styles.exerciseQuantity}>
                        (максимум: {exercise.quantity})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    className={styles.exerciseInput}
                    min="0"
                    max={exercise.quantity || 1000}
                    value={progressData[index] === 0 ? '' : (progressData[index] || '')}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        handleInputChange(index, '');
                      } else {
                        const cleanValue = inputValue.replace(/^0+/, '') || '0';
                        handleInputChange(index, cleanValue);
                      }
                    }}
                    onFocus={(e) => {
                      if (e.target.value === '0' || e.target.value === '') {
                        e.target.select();
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noExercises}>Упражнения не найдены</p>
          )}
        </div>
        <div className={styles.actions}>
          <button
            className={`btn btn--secondary ${styles.cancelBtn}`}
            onClick={onClose}
            type="button"
          >
            Отмена
          </button>
          <button
            className={`btn btn--primary ${styles.saveBtn}`}
            onClick={handleSave}
            type="button"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;