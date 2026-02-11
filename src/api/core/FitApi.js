const API_BASE_URL = 'https://wedev-api.sky.pro/api/fitness';
const requestCache = new Map();
class FitApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'FitApiError';
    this.status = status;
  }
}

const request = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    requiresAuth = false,
    useCache = false,
    cacheKey = endpoint,
    ...restOptions
  } = options;

  if (method === 'GET' && useCache) {
    const cached = requestCache.get(cacheKey);
    if (cached) {
      console.log('💾 Кэш:', cacheKey);
      return cached;
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    ...restOptions.headers,
  };

  if (requiresAuth) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new FitApiError('Требуется авторизация', 401);
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
    ...restOptions,
  };

  if (body && !(body instanceof FormData)) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (response.ok) {
      const data = await response.json();
      const result = { success: true, data };

      if (method === 'GET' && useCache) {
        requestCache.set(cacheKey, result);
      }
      
      return result;
    }

    if (response.status === 401 || response.status === 403) {
      requestCache.clear();
    }

    const errorText = await response.text();
    throw new FitApiError(errorText || 'Ошибка запроса', response.status);

  } catch (error) {
    if (error instanceof FitApiError) {
      throw error;
    }
    throw new FitApiError(error.message || 'Ошибка сети', 0);
  }
};

const clearCache = (pattern = null) => {
  if (!pattern) {
    requestCache.clear();
    return;
  }

  for (const key of requestCache.keys()) {
    if (key.includes(pattern)) {
      requestCache.delete(key);
    }
  }
};

const get = (endpoint, options = {}) => 
  request(endpoint, { ...options, method: 'GET' });

const post = (endpoint, body, options = {}) => 
  request(endpoint, { ...options, method: 'POST', body });

const patch = (endpoint, body, options = {}) => 
  request(endpoint, { ...options, method: 'PATCH', body });

const del = (endpoint, options = {}) => 
  request(endpoint, { ...options, method: 'DELETE' });

const api = {
  get,
  post,
  patch,
  delete: del,
  clearCache,
  _getCacheSize: () => requestCache.size,
  _getCacheKeys: () => Array.from(requestCache.keys()),
};

export default api;