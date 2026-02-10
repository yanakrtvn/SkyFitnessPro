import { get, post, del } from './apiClient';

export const getAllCourses = async () => {
  try {
    const token = localStorage.getItem('token');

    const requiresAuth = !!token;
    
    const result = await get('/courses', { requiresAuth });

    return result;
  } catch (error) {
    console.error('Ошибка получения курсов:', error);

    if (error.status === 401 || error.status === 400) {
      try {
        const result = await get('/courses', { requiresAuth: false });
        return result;
      } catch (noAuthError) {
        console.error('Ошибка получения курсов без авторизации:', noAuthError);
      }
    }
    
    return {
      success: false,
      error: error.message || 'Не удалось загрузить курсы',
      data: [],
    };
  }
};

export const getCourseById = async (courseId) => {
  try {
    const result = await get(`/courses/${courseId}`);
    return result;
  } catch (error) {
    console.error('Ошибка получения курса по ID:', error);
    return {
      success: false,
      error: error.message || 'Не удалось загрузить курс',
    };
  }
};

export const findCourseByTitle = async (title) => {
  try {
    const result = await getAllCourses();
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Не удалось загрузить список курсов',
      };
    }
    
    if (!result.data || result.data.length === 0) {
      return {
        success: false,
        error: 'Список курсов пуст',
      };
    }
    
    const course = result.data.find(
      (c) =>
        c.nameRU === title ||
        c.nameEN?.toLowerCase() === title?.toLowerCase()
    );
    
    if (course) {
      return {
        success: true,
        data: course,
      };
    }
    
    return {
      success: false,
      error: 'Курс не найден',
    };
  } catch (error) {
    console.error('Ошибка поиска курса по названию:', error);
    return {
      success: false,
      error: error.message || 'Не удалось найти курс',
    };
  }
};

export const addUserCourse = async (courseId) => {
  try {
    const result = await post(
      '/users/me/courses',
      { courseId },
      { requiresAuth: true }
    );
    
    if (result.success) {
      console.log('Курс успешно добавлен');
      return { success: true };
    }
    
    const errorMessage = result.data?.message || result.error || 'Не удалось добавить курс';
    const isDuplicate = 
      errorMessage.includes('уже') ||
      errorMessage.includes('добавлен') ||
      errorMessage.includes('already');
    
    return {
      success: isDuplicate,
      error: isDuplicate ? null : errorMessage,
      isDuplicate,
    };
  } catch (error) {
    console.error('Ошибка добавления курса:', error);
    let errorMessage = 'Не удалось добавить курс. Попробуйте еще раз.';
    
    if (error.data?.message) {
      errorMessage = error.data.message;
    } else if (error.message && !error.message.includes('Ошибка при обработке')) {
      errorMessage = error.message;
    } else if (error.status === 401) {
      errorMessage = 'Необходима авторизация. Войдите в систему.';
    } else if (error.status === 404) {
      errorMessage = 'Курс не найден.';
    } else if (error.status === 400) {
      errorMessage = error.data?.message || 'Некорректный запрос. Проверьте данные.';
    } else if (error.status === 500) {
      errorMessage = 'Ошибка сервера. Попробуйте позже или обратитесь в поддержку.';
    }
    
    const isDuplicate = 
      errorMessage.includes('уже') ||
      errorMessage.includes('добавлен') ||
      errorMessage.includes('already');
    
    return {
      success: isDuplicate,
      error: isDuplicate ? null : errorMessage,
      isDuplicate,
    };
  }
};

export const getUserCourses = async () => {
  try {
    const result = await get('/users/me/courses', { requiresAuth: true });
    return result;
  } catch (error) {
    console.error('Ошибка получения курсов пользователя:', error);
    return {
      success: false,
      error: error.message || 'Не удалось загрузить ваши курсы',
      data: [],
    };
  }
};

export const removeUserCourse = async (courseId) => {
  try {
    const result = await del(`/users/me/courses/${courseId}`, {
      requiresAuth: true,
    });
    
    if (result.success) {
      return { success: true };
    }
    
    return {
      success: false,
      error: result.data?.message || 'Не удалось удалить курс',
    };
  } catch (error) {
    console.error('Ошибка удаления курса:', error);
    return {
      success: false,
      error: error.message || 'Не удалось удалить курс. Попробуйте еще раз.',
    };
  }
};

export default {
  getAllCourses,
  getCourseById,
  findCourseByTitle,
  addUserCourse,
  getUserCourses,
  removeUserCourse,
};