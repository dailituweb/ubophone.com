const NodeCache = require('node-cache');

// Create cache instance with default TTL of 300 seconds (5 minutes)
const cache = new NodeCache({ 
  stdTTL: 300, 
  checkperiod: 60,
  useClones: false
});

// Simple in-memory cache middleware
const cacheMiddleware = (ttl = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from route and query parameters
    const cacheKey = `${req.originalUrl || req.url}:${req.user?.userId || 'anonymous'}`;
    
    // Check if we have cached data
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(cacheKey, data, ttl);
        res.set('X-Cache', 'MISS');
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Cache invalidation helper
const invalidateCache = (pattern) => {
  const keys = cache.keys();
  const keysToDelete = keys.filter(key => key.includes(pattern));
  keysToDelete.forEach(key => cache.del(key));
  return keysToDelete.length;
};

// Cache stats helper
const getCacheStats = () => {
  return cache.getStats();
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  getCacheStats,
  cache
};