import api from '../core/FitApi';

const { post } = api;

const AUTH_ERRORS = {
  loginIncorrect: 'Пароль введен неверно, попробуйте еще раз.',
  emailExists: 'Эта почта уже используется. Попробуйте войти.',
  userNotFound: 'Пользователь не найден. Проверьте email.',
  weakPassword: 'Пароль слишком слабый. Используйте буквы, цифры и символы.',
  invalidEmail: 'Некорректный email. Проверьте формат.',
  networkError: 'Проблемы с сетью. Проверьте подключение.',
  serverError: 'Ошибка сервера. Попробуйте позже.',
};

const validatePassword = (password) => {
  if (password.length < 6) {
    return 'Пароль должен быть не менее 6 символов';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Добавьте хотя бы одну заглавную букву';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Добавьте хотя бы один специальный символ';
  }
  return null;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const login = async (email, password) => {
  try {
    if (!validateEmail(email)) {
      return {
        success: false,
        error: AUTH_ERRORS.invalidEmail,
        field: 'email'
      };
    }

    if (!password || password.length < 1) {
      return {
        success: false,
        error: 'Введите пароль',
        field: 'password'
      };
    }

    const result = await post('/auth/login', { email, password });
    
    if (result.success && result.data?.token) {
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('email', email);
      localStorage.setItem('auth_time', Date.now().toString());     
      
      return {
        success: true,
        token: result.data.token,
        email,
        timestamp: Date.now()
      };
    }
    
    return {
      success: false,
      error: result.data?.message || AUTH_ERRORS.loginIncorrect,
    };
  } catch (error) {
    let errorMessage = AUTH_ERRORS.loginIncorrect;
    let userMessage = null;
    
    if (error.message) {
      errorMessage = error.message;
      if (errorMessage === 'Network Error') {
        userMessage = 'Проблемы с сетью. Проверьте подключение.';
      }
    } else if (error.data?.message) {
      errorMessage = error.data.message;
    }

    let field = 'general';
    if (errorMessage.toLowerCase().includes('парол')) field = 'password';
    if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('почт')) field = 'email';
    
    return {
      success: false,
      error: errorMessage,
      userMessage: userMessage,
      field
    };
  }
};

export const register = async (email, password) => {
  try {
    if (!validateEmail(email)) {
      return {
        success: false,
        error: AUTH_ERRORS.invalidEmail,
        field: 'email'
      };
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return {
        success: false,
        error: passwordError,
        field: 'password'
      };
    }

    const result = await post('/auth/register', { email, password });
    
    if (result.success) {
      return { 
        success: true,
        message: 'Регистрация прошла успешно! Теперь войдите в систему.',
        email
      };
    }
    
    return {
      success: false,
      error: result.data?.message || AUTH_ERRORS.emailExists,
    };
  } catch (error) {
    let errorMessage = AUTH_ERRORS.emailExists;
    let userMessage = null;
    
    if (error.message) {
      errorMessage = error.message;
      if (errorMessage === 'Server Error') {
        userMessage = 'Ошибка сервера';
      }
    } else if (error.data?.message) {
      errorMessage = error.data.message;
    }

    let field = 'general';
    if (errorMessage.toLowerCase().includes('парол')) field = 'password';
    if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('почт')) field = 'email';
    
    return {
      success: false,
      error: errorMessage,
      userMessage: userMessage,
      field
    };
  }
};

export const checkAuth = () => {
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  const authTime = localStorage.getItem('auth_time');
  
  if (!token || !email) {
    return { isAuthenticated: false };
  }
  
  if (authTime) {
    const timePassed = Date.now() - parseInt(authTime);
    const sixDaysInMs = 6 * 24 * 60 * 60 * 1000;

    if (timePassed > sixDaysInMs) {
      console.warn('Токен скоро истекает');
    }
  }
  
  return {
    isAuthenticated: true,
    email,
    token
  };
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  localStorage.removeItem('auth_time');
  return { success: true };
};

export default {
  login,
  register,
  checkAuth,
  logout,
  validatePassword,
  validateEmail,
  AUTH_ERRORS
};