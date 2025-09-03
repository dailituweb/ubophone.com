'use strict';

const { AdminAuditLog } = require('../models');
const { getClientIp, parseUserAgent } = require('./adminAuth');

/**
 * Create audit log entry
 */
const createAuditLog = async (logData) => {
  try {
    await AdminAuditLog.create(logData);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main request
  }
};

/**
 * Middleware to log admin actions
 */
const auditLog = (options = {}) => {
  const {
    action = null,
    resource = null,
    includeRequestBody = false,
    includeResponseBody = false,
    skipIfNoAdmin = true
  } = options;

  return (req, res, next) => {
    // Skip if no admin context and skipIfNoAdmin is true
    if (skipIfNoAdmin && !req.admin) {
      return next();
    }

    const startTime = Date.now();
    const originalSend = res.send;
    let responseBody = null;
    let responseStatus = null;

    // Capture response
    res.send = function(body) {
      responseBody = body;
      responseStatus = res.statusCode;
      originalSend.call(this, body);
    };

    // Capture response end event
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        const ipAddress = getClientIp(req);
        const userAgent = req.get('User-Agent') || '';
        const deviceInfo = parseUserAgent(userAgent);

        // Prepare request data
        const requestData = {};
        if (includeRequestBody && req.body) {
          // Filter sensitive data
          requestData.body = filterSensitiveData(req.body);
        }
        if (req.params && Object.keys(req.params).length > 0) {
          requestData.params = req.params;
        }
        if (req.query && Object.keys(req.query).length > 0) {
          requestData.query = filterSensitiveData(req.query);
        }

        // Prepare response data for logging
        let responseData = null;
        if (includeResponseBody && responseBody) {
          try {
            const parsedResponse = JSON.parse(responseBody);
            responseData = filterSensitiveData(parsedResponse);
          } catch (e) {
            responseData = { size: responseBody.length };
          }
        }

        // Determine action and resource from options or request
        const logAction = action || determineAction(req.method, req.route?.path || req.path);
        const logResource = resource || determineResource(req.route?.path || req.path);

        // Determine if request was successful
        const success = responseStatus >= 200 && responseStatus < 400;

        // Prepare audit log data
        const auditData = {
          adminId: req.admin?.id || null,
          action: logAction,
          resource: logResource,
          resourceId: extractResourceId(req),
          method: req.method,
          endpoint: req.originalUrl || req.url,
          ipAddress,
          userAgent,
          requestData,
          responseStatus,
          duration,
          success,
          errorMessage: success ? null : extractErrorMessage(responseBody),
          sessionId: req.admin?.sessionId || null,
          metadata: {
            responseData: includeResponseBody ? responseData : null,
            deviceInfo,
            referer: req.get('Referer'),
            timestamp: new Date().toISOString()
          }
        };

        await createAuditLog(auditData);
      } catch (error) {
        console.error('Audit logging error:', error);
      }
    });

    next();
  };
};

/**
 * Filter sensitive data from objects
 */
const filterSensitiveData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
    'twoFactorSecret',
    'emergencyAccessCodes'
  ];

  const filtered = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      filtered[key] = '[FILTERED]';
    } else if (Array.isArray(value)) {
      filtered[key] = value.map(item => 
        typeof item === 'object' ? filterSensitiveData(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      filtered[key] = filterSensitiveData(value);
    } else {
      filtered[key] = value;
    }
  }

  return filtered;
};

/**
 * Determine action from HTTP method and path
 */
const determineAction = (method, path) => {
  const pathLower = path.toLowerCase();
  
  switch (method) {
    case 'GET':
      return pathLower.includes('/export') ? 'export' : 'view';
    case 'POST':
      if (pathLower.includes('/login')) return 'login';
      if (pathLower.includes('/logout')) return 'logout';
      if (pathLower.includes('/refresh')) return 'refresh_token';
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return method.toLowerCase();
  }
};

/**
 * Determine resource from path
 */
const determineResource = (path) => {
  const pathSegments = path.split('/').filter(segment => segment && !segment.match(/^[0-9a-fA-F-]+$/));
  
  // Map common path patterns to resources
  const resourceMap = {
    'users': 'users',
    'calls': 'calls',
    'billing': 'billing',
    'payments': 'billing',
    'analytics': 'analytics',
    'settings': 'settings',
    'admins': 'admins',
    'roles': 'admins',
    'logs': 'logs',
    'dashboard': 'dashboard',
    'auth': 'auth',
    'login': 'auth',
    'logout': 'auth',
    'profile': 'profile'
  };

  for (const segment of pathSegments) {
    if (resourceMap[segment]) {
      return resourceMap[segment];
    }
  }

  return pathSegments[pathSegments.length - 1] || 'unknown';
};

/**
 * Extract resource ID from request
 */
const extractResourceId = (req) => {
  // Try to get ID from params
  if (req.params.id) return req.params.id;
  if (req.params.userId) return req.params.userId;
  if (req.params.adminId) return req.params.adminId;
  if (req.params.callId) return req.params.callId;
  
  // Try to get ID from body
  if (req.body && req.body.id) return req.body.id;
  
  return null;
};

/**
 * Extract error message from response
 */
const extractErrorMessage = (responseBody) => {
  if (!responseBody) return null;
  
  try {
    const parsed = JSON.parse(responseBody);
    return parsed.message || parsed.error || null;
  } catch (e) {
    return null;
  }
};

/**
 * Middleware specifically for login attempts
 */
const auditLoginAttempt = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(body) {
    const result = originalSend.call(this, body);
    
    // Log login attempt after response is sent
    setImmediate(async () => {
      try {
        const success = res.statusCode === 200;
        const ipAddress = getClientIp(req);
        const userAgent = req.get('User-Agent') || '';
        
        let adminId = null;
        let errorMessage = null;
        
        if (success) {
          try {
            const responseData = JSON.parse(body);
            adminId = responseData.admin?.id || null;
          } catch (e) {
            // Ignore parsing errors
          }
        } else {
          try {
            const errorData = JSON.parse(body);
            errorMessage = errorData.message || errorData.error;
          } catch (e) {
            errorMessage = 'Login failed';
          }
        }

        await createAuditLog({
          adminId,
          action: 'login_attempt',
          resource: 'auth',
          resourceId: req.body?.username || req.body?.email || null,
          method: req.method,
          endpoint: req.originalUrl,
          ipAddress,
          userAgent,
          requestData: {
            username: req.body?.username || req.body?.email,
            timestamp: new Date().toISOString()
          },
          responseStatus: res.statusCode,
          success,
          errorMessage,
          metadata: {
            deviceInfo: parseUserAgent(userAgent),
            attemptedCredentials: {
              username: req.body?.username || req.body?.email,
              hasPassword: !!req.body?.password
            }
          }
        });
      } catch (error) {
        console.error('Login audit error:', error);
      }
    });
    
    return result;
  };
  
  next();
};

module.exports = {
  auditLog,
  auditLoginAttempt,
  createAuditLog,
  filterSensitiveData
};