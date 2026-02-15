import api from '../core/FitApi';
const { get } = api;

export const getWorkoutById = async (workoutId) => {
  try {
    const result = await get(`/workouts/${workoutId}`, {
      requiresAuth: true,
    });
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Не удалось загрузить тренировку',
    };
  }
};

export const getCourseWorkouts = async (courseId) => {
  try {
    const result = await get(`/courses/${courseId}/workouts`, {
      requiresAuth: true,
    });
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Не удалось загрузить тренировки',
      data: [],
    };
  }
};

export default {
  getWorkoutById,
  getCourseWorkouts,
};