import api from '../core/FitApi';
const { get, patch } = api;

export const getCourseProgress = async (courseId) => {
  try {
    const result = await get(
      `/users/me/progress?courseId=${courseId}`,
      { requiresAuth: true }
    );
    return result;
  } catch (error) {
    console.error('Ошибка получения прогресса курса:', error);
    return {
      success: false,
      error: error.userMessage || 'Не удалось загрузить прогресс по курсу',
    };
  }
};

export const getUserProgress = async (courseId, workoutId) => {
  try {
    const result = await get(
      `/users/me/progress?courseId=${courseId}&workoutId=${workoutId}`,
      { requiresAuth: true }
    );
    return result;
  } catch (error) {
    console.error('Ошибка получения прогресса пользователя:', error);
    return {
      success: false,
      error: error.userMessage || 'Не удалось загрузить прогресс',
    };
  }
};

export const saveProgress = async (courseId, workoutId, progressData) => {
  try {
    const result = await patch(
      `/courses/${courseId}/workouts/${workoutId}`,
      { progressData },
      { requiresAuth: true }
    );
    
    if (result.success) {
      return { success: true };
    }
    
    return {
      success: false,
      error: result.data?.message || 'Не удалось сохранить прогресс',
    };
  } catch (error) {
    console.error('Ошибка сохранения прогресса:', error);
    return {
      success: false,
      error: error.userMessage || 'Не удалось сохранить прогресс',
    };
  }
};

export const resetProgress = async (courseId, workoutId) => {
  try {
    const result = await patch(
      `/courses/${courseId}/workouts/${workoutId}/reset`,
      null,
      { requiresAuth: true }
    );
    
    if (result.success) {
      return { success: true };
    }
    
    return {
      success: false,
      error: result.data?.message || 'Не удалось сбросить прогресс',
    };
  } catch (error) {
    console.error('Ошибка сброса прогресса:', error);
    return {
      success: false,
      error: error.userMessage || 'Не удалось сбросить прогресс',
    };
  }
};

export const calculateWorkoutProgress = (progressData, exercises) => {
  if (!progressData || !progressData.progressData || progressData.progressData.length === 0) {
    return 0;
  }

  if (progressData.workoutCompleted) {
    return 100;
  }

  const workoutProgress = progressData.progressData.reduce(
    (sum, val) => sum + (val || 0),
    0
  );
  const workoutTotal = exercises.reduce(
    (sum, ex) => sum + (ex.quantity || 0),
    0
  );

  if (workoutTotal === 0) {
    return 0;
  }

  return Math.min(100, Math.round((workoutProgress / workoutTotal) * 100));
};

export const calculateCourseProgress = async (courseId) => {
  try {
    const progressResult = await getCourseProgress(courseId);
    
    if (!progressResult.success || !progressResult.data) {
      return 0;
    }

    const progressMap = progressResult.data.workoutsProgress || [];
    
    if (progressMap.length === 0) {
      return 0;
    }

    const hasProgress = progressMap.some(p => 
      p.progressData && p.progressData.some(val => val > 0)
    );
    
    const completedWorkouts = progressMap.filter(p => p.workoutCompleted).length;
    
    if (completedWorkouts === progressMap.length) {
      return 100;
    }

    return hasProgress ? 50 : 0;
    
  } catch (error) {
    console.error('Ошибка расчета прогресса курса:', error);
    return 0;
  }
};

export default {
  getCourseProgress,
  getUserProgress,
  saveProgress,
  resetProgress,
  calculateWorkoutProgress,
  calculateCourseProgress,
};