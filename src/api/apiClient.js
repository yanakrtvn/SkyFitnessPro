const API_BASE_URL = 'https://wedev-api.sky.pro/api/fitness';

const ERROR_MESSAGES = {
  400: 'Некорректный запрос',
  401: 'Необходима авторизация. Войдите в систему',
  403: 'Доступ запрещен',
  404: 'Ресурс не найден',
  405: 'Метод не поддерживается',
  409: 'Конфликт данных',
  500: 'Внутренняя ошибка сервера',
  network: 'Ошибка сети. Проверьте подключение к интернету',
  parse: 'Ошибка при обработке ответа сервера',
  unknown: 'Произошла неизвестная ошибка. Попробуйте еще раз',
};

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const parseResponse = async (response) => {
  try {
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    
    if (!text) {
      return null;
    }

    if (contentType && contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch (e) {
        return { message: text || ERROR_MESSAGES.parse };
      }
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      return { message: text || ERROR_MESSAGES.parse };
    }
  } catch (error) {
    return { message: ERROR_MESSAGES.parse };
  }
};

const handleError = async (response, defaultMessage = ERROR_MESSAGES.unknown) => {
  const status = response.status;
  let errorMessage = ERROR_MESSAGES[status] || defaultMessage;
  let errorData = null;

  try {
    errorData = await parseResponse(response);
    if (errorData?.message) {
      errorMessage = errorData.message;
    } else if (errorData?.error) {
      errorMessage = errorData.error;
    } else if (typeof errorData === 'string' && errorData.trim()) {
      errorMessage = errorData;
    }
  } catch (e) {
    if (status === 500) {
      errorMessage = 'Внутренняя ошибка сервера. Попробуйте позже.';
    }
  }

  const error = new Error(errorMessage);
  error.status = status;
  error.data = errorData;
  return error;
};

const request = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    requiresAuth = false,
    headers = {},
    ...restOptions
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const requestHeaders = {
    'Accept': 'application/json',
    ...headers,
  };

  if (requiresAuth) {
    const token = getAuthToken();
    if (!token) {
      const error = new Error('Требуется авторизация');
      error.status = 401;
      throw error;
    }
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: requestHeaders,
    ...restOptions,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (response.status === 405 || response.status === 404) {
      const error = await handleError(
        response,
        `Ошибка ${response.status}: Сервер не может обработать запрос. Проверьте правильность URL эндпоинта API.`
      );
      throw error;
    }

    if (response.ok) {
      const data = await parseResponse(response);
      return { success: true, data };
    }

    const error = await handleError(response);
    throw error;
  } catch (error) {
    if (error.status) {
      throw error;
    }

    const networkError = new Error(ERROR_MESSAGES.network);
    networkError.originalError = error;
    networkError.status = 0;
    throw networkError;
  }
};

export const get = (endpoint, options = {}) => {
  return request(endpoint, { ...options, method: 'GET' });
};

export const post = (endpoint, body, options = {}) => {
  return request(endpoint, { ...options, method: 'POST', body });
};

export const patch = (endpoint, body, options = {}) => {
  return request(endpoint, { ...options, method: 'PATCH', body });
};

export const del = (endpoint, options = {}) => {
  return request(endpoint, { ...options, method: 'DELETE' });
};

export const put = (endpoint, body, options = {}) => {
  return request(endpoint, { ...options, method: 'PUT', body });
};

export default {
  get,
  post,
  patch,
  delete: del,
  put,
  API_BASE_URL,
};