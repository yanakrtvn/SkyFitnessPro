import api from '../core/FitApi';
const { get, post, delete: del, clearCache } = api;

const COURSE_CACHE = {
  ALL_COURSES: 'all_courses',
  USER_COURSES: 'user_courses',
};

export const getAllCourses = async (forceRefresh = false) => {
  try {
    const cacheKey = COURSE_CACHE.ALL_COURSES;
    
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
            return parsed.data;
          }
        } catch (e) {
          // Н
        }
      }
    }

    const token = localStorage.getItem('token');
    const requiresAuth = !!token;
    
    const result = await get('/courses', { 
      requiresAuth,
      useCache: true,
      cacheKey: 'courses_list'
    });

    if (result.success) {
      const cacheData = {
        data: result,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      console.log(`✅ Загружено ${result.data?.length || 0} курсов`);
      return result;
    }

    if (requiresAuth && (result.error?.includes('401') || result.error?.includes('auth'))) {
      console.log('Пробуем загрузить курсы без авторизации');
      const publicResult = await get('/courses', { requiresAuth: false });
      
      if (publicResult.success) {
        const cacheData = {
          data: publicResult,
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        return publicResult;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Ошибка получения курсов:', error);

    try {
      const cached = localStorage.getItem(COURSE_CACHE.ALL_COURSES);
      if (cached) {
        const parsed = JSON.parse(cached);
        console.log('Используем старые данные из кэша');
        return parsed.data;
      }
    } catch (e) {
      // Н
    }
    
    return {
      success: false,
      error: error.userMessage || 'Не удалось загрузить курсы',
      data: [],
      isOffline: true
    };
  }
};

export const getCourseById = async (courseId) => {
  try {
    const result = await get(`/courses/${courseId}`, {
      useCache: true,
      cacheKey: `course_${courseId}`
    });
    
    if (result.success) {
      console.log(`агружен курс: ${result.data?.nameRU || courseId}`);
    }
    
    return result;
  } catch (error) {
    console.error('Ошибка получения курса:', error);
    return {
      success: false,
      error: error.userMessage || 'Не удалось загрузить курс',
      courseId
    };
  }
};

export const findCourseByTitle = async (title) => {
  try {
    const cacheKey = `course_search_${title.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
          console.log('Используем кэшированный результат поиска');
          return parsed.data;
        }
      } catch (e) {
        // Н
      }
    }

    const result = await getAllCourses();
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Не удалось загрузить курсы для поиска',
      };
    }
    
    if (!result.data || result.data.length === 0) {
      return {
        success: false,
        error: 'Курсы не найдены',
        isEmpty: true
      };
    }

    const course = result.data.find(course => {
      const titleLower = title.toLowerCase();
      const nameRULower = (course.nameRU || '').toLowerCase();
      const nameENLower = (course.nameEN || '').toLowerCase();
      
      return nameRULower.includes(titleLower) || 
             nameENLower.includes(titleLower) ||
             nameRULower === titleLower ||
             nameENLower === titleLower;
    });
    
    const searchResult = course ? {
      success: true,
      data: course,
      matchType: course.nameRU === title ? 'exact_ru' : 
                 course.nameEN?.toLowerCase() === title.toLowerCase() ? 'exact_en' : 'partial'
    } : {
      success: false,
      error: `Курс "${title}" не найден`,
      suggestions: result.data.slice(0, 3).map(c => c.nameRU)
    };

    localStorage.setItem(cacheKey, JSON.stringify({
      data: searchResult,
      timestamp: Date.now()
    }));
    
    return searchResult;
  } catch (error) {
    console.error('Ошибка поиска курса:', error);
    return {
      success: false,
      error: error.userMessage || 'Ошибка при поиске курса',
    };
  }
};

export const addUserCourse = async (courseId) => {
  try {
    console.log(`➕ Добавляем курс: ${courseId}`);
    
    const result = await post(
      '/users/me/courses',
      { courseId },
      { requiresAuth: true }
    );
    
    if (result.success) {
      console.log('Курс успешно добавлен');

      clearCache('user_courses');
      localStorage.removeItem(COURSE_CACHE.USER_COURSES);

      const savedCourses = localStorage.getItem('userCourses') || '[]';
      const courseIds = JSON.parse(savedCourses);
      if (!courseIds.includes(courseId)) {
        courseIds.push(courseId);
        localStorage.setItem('userCourses', JSON.stringify(courseIds));
      }
      
      return { 
        success: true,
        message: 'Курс добавлен в вашу коллекцию!'
      };
    }
    
    const errorMessage = result.data?.message || result.error || 'Не удалось добавить курс';
    const isDuplicate = 
      errorMessage.toLowerCase().includes('уже') ||
      errorMessage.toLowerCase().includes('добавлен') ||
      errorMessage.toLowerCase().includes('already') ||
      errorMessage.toLowerCase().includes('exist');
    
    return {
      success: isDuplicate,
      error: isDuplicate ? null : errorMessage,
      isDuplicate,
      message: isDuplicate ? 'Этот курс уже в вашей коллекции!' : errorMessage
    };
  } catch (error) {
    console.error('Ошибка добавления курса:', error);
    
    let errorMessage = 'Не удалось добавить курс. Попробуйте еще раз.';
    let userMessage = 'Ошибка при добавлении курса';
    
    if (error.data?.message) {
      errorMessage = error.data.message;
      userMessage = error.data.message;
    } else if (error.userMessage) {
      errorMessage = error.userMessage;
      userMessage = error.userMessage;
    }
    
    const isDuplicate = 
      errorMessage.toLowerCase().includes('уже') ||
      errorMessage.toLowerCase().includes('добавлен') ||
      errorMessage.toLowerCase().includes('already');
    
    return {
      success: isDuplicate,
      error: isDuplicate ? null : errorMessage,
      userMessage: isDuplicate ? 'Курс уже добавлен!' : userMessage,
      isDuplicate,
    };
  }
};

export const getUserCourses = async (forceRefresh = false) => {
  try {
    const cacheKey = COURSE_CACHE.USER_COURSES;
    
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < 2 * 60 * 1000) {
            console.log('Используем кэшированные курсы пользователя');
            return parsed.data;
          }
        } catch (e) {
          // Н
        }
      }
    }
    
    const result = await get('/users/me/courses', { 
      requiresAuth: true,
      useCache: true,
      cacheKey: 'my_courses'
    });
    
    if (result.success) {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));

      if (result.data && Array.isArray(result.data)) {
        const courseIds = result.data.map(c => c._id || c.courseId).filter(Boolean);
        localStorage.setItem('userCourses', JSON.stringify(courseIds));
      }
      
      console.log(`Загружено ${result.data?.length || 0} курсов пользователя`);
    }
    
    return result;
  } catch (error) {
    console.error('Ошибка получения курсов пользователя:', error);

    try {
      const savedCourses = localStorage.getItem('userCourses');
      if (savedCourses) {
        const courseIds = JSON.parse(savedCourses);
        console.log('Используем сохраненные ID курсов');
        return {
          success: true,
          data: courseIds.map(id => ({ _id: id })),
          fromCache: true
        };
      }
    } catch (e) {
      // Н
    }
    
    return {
      success: false,
      error: error.userMessage || 'Не удалось загрузить ваши курсы',
      data: [],
      isOffline: true
    };
  }
};

export const removeUserCourse = async (courseId) => {
  try {
    console.log(`Удаляем курс: ${courseId}`);
    
    const result = await del(`/users/me/courses/${courseId}`, {
      requiresAuth: true,
    });
    
    if (result.success) {
      console.log('Курс удален');

      clearCache('user_courses');
      localStorage.removeItem(COURSE_CACHE.USER_COURSES);

      const savedCourses = localStorage.getItem('userCourses') || '[]';
      const courseIds = JSON.parse(savedCourses).filter(id => id !== courseId);
      localStorage.setItem('userCourses', JSON.stringify(courseIds));
      
      return { 
        success: true,
        message: 'Курс удален из вашей коллекции'
      };
    }
    
    return {
      success: false,
      error: result.data?.message || 'Не удалось удалить курс',
    };
  } catch (error) {
    console.error('Ошибка удаления курса:', error);
    return {
      success: false,
      error: error.userMessage || 'Не удалось удалить курс. Попробуйте еще раз.',
    };
  }
};

export const refreshCoursesCache = () => {
  localStorage.removeItem(COURSE_CACHE.ALL_COURSES);
  localStorage.removeItem(COURSE_CACHE.USER_COURSES);
  clearCache();
  console.log('Кэш курсов обновлен');
};

export default {
  getAllCourses,
  getCourseById,
  findCourseByTitle,
  addUserCourse,
  getUserCourses,
  removeUserCourse,
  refreshCoursesCache,
  COURSE_CACHE
};