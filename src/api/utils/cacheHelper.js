const cache = new Map();

export const generateCacheKey = (endpoint, params = {}) => {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return `${endpoint}?${sortedParams}`;
};

export const getFromCache = (key) => {
  return cache.get(key);
};

export const saveToCache = (key, data) => {
  cache.set(key, data);
};

export const clearCache = (pattern = null) => {
  if (!pattern) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

export const getCacheInfo = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
};

export const cachedRequest = async (apiMethod, endpoint, params = {}, options = {}) => {
  const cacheKey = generateCacheKey(endpoint, params);
  
  const cachedData = getFromCache(cacheKey);
  if (cachedData && options.useCache !== false) {
    return cachedData;
  }

  try {
    const response = await apiMethod(endpoint, { 
      ...options, 
      params 
    });

    if (response.success && options.useCache !== false) {
      saveToCache(cacheKey, response);
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

export default {
  generateCacheKey,
  getFromCache,
  saveToCache,
  clearCache,
  getCacheInfo,
  cachedRequest,
};