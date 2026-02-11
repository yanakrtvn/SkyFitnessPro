export { default as api } from './core/FitApi';

import api from './core/FitApi';
export const { 
  get, 
  post, 
  patch, 
  delete: del, 
  put, 
  clearCache, 
  ERROR_MESSAGES, 
  FitApiError, 
  API_BASE_URL 
} = api;

// Auth
export { 
  login, 
  register, 
  checkAuth, 
  logout,
  validatePassword,
  validateEmail 
} from './auth/AuthService';

// Courses
export {
  getAllCourses,
  getCourseById,
  findCourseByTitle,
  addUserCourse,
  getUserCourses,
  removeUserCourse,
  refreshCoursesCache
} from './courses/CourseService';

// Workouts
export {
  getWorkoutById,
  getCourseWorkouts
} from './workouts/WorkoutService';

// Progress
export {
  getCourseProgress,
  getUserProgress,
  saveProgress,
  resetProgress,
  calculateWorkoutProgress,
  calculateCourseProgress
} from './progress/ProgressTracker';

// Utils
export { 
  appCache,
  courseCache,
  workoutCache,
  progressCache,
  searchCache,
  logCacheStats
} from './utils/cacheHelper';