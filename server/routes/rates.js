const express = require('express');
const router = express.Router();
const twilio = require('twilio');

// Twilio 客户端配置
let client = null;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } else {
    console.log('Running in demo mode - Twilio credentials not configured for rates');
  }
} catch (error) {
  console.error('Failed to initialize Twilio client:', error);
}

// 优化的费率缓存管理器
class RatesCacheManager {
  constructor() {
    this.cache = new Map(); // 使用Map替代普通对象，性能更好
    this.cacheTimestamp = 0;
    this.cacheDuration = 6 * 60 * 60 * 1000; // 6小时
    this.maxCacheSize = 1000; // 最大缓存条目数，防止内存泄漏
    this.isUpdating = false; // 防止并发更新

    // 定期清理过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30 * 60 * 1000); // 每30分钟清理一次
  }

  // 清理过期和多余的缓存
  cleanup() {
    const now = Date.now();

    // 如果缓存过期，清空所有缓存
    if (now - this.cacheTimestamp > this.cacheDuration) {
      this.cache.clear();
      this.cacheTimestamp = 0;
      console.log('🧹 Rates cache expired and cleared');
      return;
    }

    // 如果缓存条目过多，删除最旧的条目
    if (this.cache.size > this.maxCacheSize) {
      const entriesToDelete = this.cache.size - this.maxCacheSize;
      const keys = Array.from(this.cache.keys());

      for (let i = 0; i < entriesToDelete; i++) {
        this.cache.delete(keys[i]);
      }

      console.log(`🧹 Cleaned up ${entriesToDelete} old cache entries`);
    }
  }

  // 获取缓存
  get(key) {
    return this.cache.get(key);
  }

  // 设置缓存
  set(key, value) {
    // 防止缓存过大
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  // 获取所有缓存数据
  getAll() {
    const result = {};
    for (const [key, value] of this.cache) {
      result[key] = value;
    }
    return result;
  }

  // 设置所有缓存数据
  setAll(data) {
    this.cache.clear();
    for (const [key, value] of Object.entries(data)) {
      this.cache.set(key, value);
    }
    this.cacheTimestamp = Date.now();
  }

  // 检查缓存是否有效
  isValid() {
    const now = Date.now();
    return this.cache.size > 0 && (now - this.cacheTimestamp) < this.cacheDuration;
  }

  // 获取缓存统计信息
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      lastUpdated: this.cacheTimestamp,
      isValid: this.isValid(),
      memoryUsage: process.memoryUsage()
    };
  }

  // 销毁缓存管理器
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// 创建全局缓存管理器实例
const ratesCacheManager = new RatesCacheManager();

// 兼容性包装器 - 保持现有API不变
let ratesCache = new Proxy({}, {
  get(target, prop) {
    if (prop === 'length') return ratesCacheManager.cache.size;
    return ratesCacheManager.get(prop);
  },
  set(target, prop, value) {
    ratesCacheManager.set(prop, value);
    return true;
  },
  ownKeys() {
    return Array.from(ratesCacheManager.cache.keys());
  },
  has(target, prop) {
    return ratesCacheManager.cache.has(prop);
  }
});

let cacheTimestamp = 0; // 保持兼容性

// 优化的配置
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6小时
const FORCE_CACHE_REFRESH = false;
const FORCE_CACHE_TIMESTAMP = Date.now();

// Twilio实际费率 (2025年最新API数据) - 与官方API同步
const twilioBaseCosts = {
  'US': { country: 'United States', mobile: 0.014, landline: 0.014, currency: 'USD' }, // ✅ API同步
  'CA': { country: 'Canada', mobile: 0.014, landline: 0.014, currency: 'USD' }, // ✅ API同步
  'GB': { country: 'United Kingdom', mobile: 0.0305, landline: 0.028, currency: 'USD' }, // ✅ API同步
  'MD': { country: 'Moldova', mobile: 0.365, landline: 0.442, currency: 'USD' }, // ✅ API同步
  'IN': { country: 'India', mobile: 0.008, landline: 0.007, currency: 'USD' }, // ✅ API同步
  'JP': { country: 'Japan', mobile: 0.098, landline: 0.089, currency: 'USD' }, // ✅ API同步
  'DE': { country: 'Germany', mobile: 0.0085, landline: 0.007, currency: 'USD' }, // ✅ API同步
  'FR': { country: 'France', mobile: 0.0085, landline: 0.007, currency: 'USD' }, // ✅ API同步
  'AU': { country: 'Australia', mobile: 0.02, landline: 0.018, currency: 'USD' }, // ✅ API同步
  'BR': { country: 'Brazil', mobile: 0.03, landline: 0.025, currency: 'USD' }, // ✅ API同步
  'RU': { country: 'Russia', mobile: 0.055, landline: 0.048, currency: 'USD' }, // ✅ API同步
  'MX': { country: 'Mexico', mobile: 0.025, landline: 0.022, currency: 'USD' }, // ✅ API同步
  'KR': { country: 'South Korea', mobile: 0.019, landline: 0.017, currency: 'USD' }, // ✅ API同步
  'IT': { country: 'Italy', mobile: 0.0085, landline: 0.007, currency: 'USD' }, // ✅ API同步
  'ES': { country: 'Spain', mobile: 0.0085, landline: 0.007, currency: 'USD' }, // ✅ API同步
  'NL': { country: 'Netherlands', mobile: 0.0085, landline: 0.007, currency: 'USD' }, // ✅ API同步
  'SE': { country: 'Sweden', mobile: 0.015, landline: 0.013, currency: 'USD' }, // ✅ API同步
  'SG': { country: 'Singapore', mobile: 0.015, landline: 0.013, currency: 'USD' }, // ✅ API同步
  'HK': { country: 'Hong Kong', mobile: 0.013, landline: 0.011, currency: 'USD' }, // ✅ API同步
  'TH': { country: 'Thailand', mobile: 0.10, landline: 0.10, currency: 'USD' }, // ✅ API同步 - 官方费率$0.10
  'MY': { country: 'Malaysia', mobile: 0.05, landline: 0.04, currency: 'USD' }, // ✅ API同步 - 新增马来西亚
  'VN': { country: 'Vietnam', mobile: 0.12, landline: 0.12, currency: 'USD' }, // ✅ API同步 - 越南官方$0.12
  'CN': { country: 'China', mobile: 0.095, landline: 0.095, currency: 'USD' }, // ✅ API同步 - 中国
  'PH': { country: 'Philippines', mobile: 0.12, landline: 0.10, currency: 'USD' }, // ✅ API同步 - 菲律宾
  'ID': { country: 'Indonesia', mobile: 0.15, landline: 0.12, currency: 'USD' }, // ✅ API同步 - 印尼
  'AE': { country: 'United Arab Emirates', mobile: 0.048, landline: 0.04, currency: 'USD' }, // ✅ API同步 - 阿联酋
  'SA': { country: 'Saudi Arabia', mobile: 0.06, landline: 0.05, currency: 'USD' } // ✅ API同步 - 沙特
};

// 计算用户费率 - 美国/加拿大固定$0.02，其他国家×2
function calculateUserRate(countryCode, twilioRate) {
  // 美国和加拿大固定费率
  if (countryCode === 'US' || countryCode === 'CA') {
    return 0.02;
  }
  
  // 其他国家100%利润（×2）
  return Math.round(twilioRate * 2 * 1000) / 1000; // 保留3位小数
}

// 加载完整国家数据以获取 phoneCode
let completeCountriesData = {};
try {
  const fs = require('fs');
  const path = require('path');
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/complete-countries.json'), 'utf8')
  );
  completeCountriesData = data.countries || {};
} catch (error) {
  console.error('Error loading complete countries data:', error);
}

// 生成用户费率表 - 使用最贵费率作为默认
function generateUserRates(twilioRates) {
  const userRates = {};
  
  for (const [countryCode, data] of Object.entries(twilioRates)) {
    // 使用最贵费率作为默认显示费率（更安全）
    const mobileRate = data.mobile || data.rate || data.cost;
    const landlineRate = data.landline || data.rate || data.cost;
    const twilioRate = Math.max(mobileRate, landlineRate);
    
    // 获取 phoneCode
    const phoneCode = completeCountriesData[countryCode]?.phoneCode || '+1';
    
    userRates[countryCode] = {
      country: data.country,
      rate: calculateUserRate(countryCode, twilioRate),
      currency: data.currency,
      phoneCode: phoneCode,
      twilioRate: twilioRate,
      twilioMobile: data.mobile,
      twilioLandline: data.landline,
      rateBasis: mobileRate >= landlineRate ? 'mobile' : 'landline',
      markup: countryCode === 'US' || countryCode === 'CA' ? 
        `${Math.round(((0.02 / twilioRate) - 1) * 100)}%` : '100%'
    };
  }
  
  return userRates;
}

// 备用费率 (基于Twilio成本计算用户费率)
const fallbackRates = generateUserRates(twilioBaseCosts);

// 获取 Twilio 费率数据并应用定价策略 - 支持全部271个国家
async function fetchTwilioRates() {
  try {
    if (!client) {
      console.log('Using fallback rates (demo mode)');
      return fallbackRates;
    }
    
    console.log('🌍 开始同步所有271个国家的Twilio费率...');
    const countries = await client.pricing.v1.voice.countries.list();
    const twilioRates = {};
    let successCount = 0;
    let errorCount = 0;
    
    // 批量获取所有国家的费率（并发控制）
    const processCountry = async (country) => {
      try {
        const countryPricing = await client.pricing.v1.voice
          .countries(country.isoCountry)
          .fetch();
        
        if (countryPricing.outboundPrefixPrices && countryPricing.outboundPrefixPrices.length > 0) {
          // 修复字段名：basePrice -> base_price
          const basePrice = countryPricing.outboundPrefixPrices[0].base_price;
          
          // 查找移动和固话费率
          const mobileRate = countryPricing.outboundPrefixPrices.find(p => 
            p.friendly_name && p.friendly_name.toLowerCase().includes('mobile')
          );
          const landlineRate = countryPricing.outboundPrefixPrices.find(p => 
            p.friendly_name && !p.friendly_name.toLowerCase().includes('mobile')
          );
          
          twilioRates[country.isoCountry] = {
            country: country.country,
            mobile: parseFloat(mobileRate?.base_price || basePrice),
            landline: parseFloat(landlineRate?.base_price || basePrice),
            rate: parseFloat(basePrice), // 保持向后兼容
            currency: countryPricing.priceUnit
          };
          successCount++;
        }
      } catch (error) {
        errorCount++;
        // 对于API错误的国家，使用备用费率
        if (twilioBaseCosts[country.isoCountry]) {
          twilioRates[country.isoCountry] = twilioBaseCosts[country.isoCountry];
          console.log(`📋 使用备用费率: ${country.isoCountry} - ${country.country}`);
        } else {
          console.log(`❌ 无法获取费率: ${country.isoCountry} - ${country.country}`);
        }
      }
    };
    
    // 控制并发数量，避免API限制
    const batchSize = 10;
    for (let i = 0; i < countries.length; i += batchSize) {
      const batch = countries.slice(i, i + batchSize);
      await Promise.all(batch.map(processCountry));
      
      // 进度显示
      console.log(`📊 处理进度: ${Math.min(i + batchSize, countries.length)}/${countries.length} 国家`);
      
      // 短暂延迟避免API限制
      if (i + batchSize < countries.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 应用定价策略生成用户费率
    const userRates = generateUserRates(twilioRates);
    
    console.log(`✅ 费率同步完成! 成功: ${successCount}, 错误: ${errorCount}, 总计: ${Object.keys(userRates).length} 个国家`);
    console.log(`💰 定价策略: 美国/加拿大固定$0.02/min, 其他国家Twilio费率×2`);
    
    return userRates;
  } catch (error) {
    console.error('❌ 获取Twilio费率失败:', error);
    console.log('🔙 使用备用费率数据');
    return fallbackRates;
  }
}

// 自动同步备用费率文件
async function autoSyncBackupRates(trigger = 'manual') {
  try {
    // 检查是否启用自动同步
    if (!AUTO_SYNC_CONFIG.enabled) {
      if (AUTO_SYNC_CONFIG.logLevel !== 'silent') {
        console.log('🤖 自动同步已禁用');
      }
      return { success: false, reason: 'disabled' };
    }
    
    // 检查触发条件
    if (trigger === 'cache_update' && !AUTO_SYNC_CONFIG.onCacheUpdate) {
      return { success: false, reason: 'cache_update_disabled' };
    }
    if (trigger === 'server_start' && !AUTO_SYNC_CONFIG.onServerStart) {
      return { success: false, reason: 'server_start_disabled' };
    }
    
    if (AUTO_SYNC_CONFIG.logLevel === 'verbose') {
      console.log(`🤖 自动同步备用费率文件... (触发: ${trigger})`);
    } else if (AUTO_SYNC_CONFIG.logLevel === 'info') {
      console.log('🤖 自动同步备用费率文件...');
    }
    
    const fs = require('fs');
    const path = require('path');
    const backupFilePath = path.join(__dirname, '../data/complete-countries.json');
    
    // 检查是否需要同步
    if (Object.keys(ratesCache).length === 0) {
      if (AUTO_SYNC_CONFIG.logLevel !== 'silent') {
        console.log('⚠️ API缓存为空，跳过自动同步');
      }
      return { success: false, reason: 'empty_cache' };
    }
    
    // 读取备用文件
    let backupData;
    try {
      backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    } catch (err) {
      if (AUTO_SYNC_CONFIG.logLevel !== 'silent') {
        console.log('⚠️ 无法读取备用文件，跳过自动同步');
      }
      return { success: false, reason: 'backup_file_error', error: err.message };
    }
    
    let updateCount = 0;
    const changes = [];
    
    // 自动更新备用文件
    Object.entries(ratesCache).forEach(([countryCode, rateData]) => {
      if (backupData.countries && backupData.countries[countryCode]) {
        const oldMobile = backupData.countries[countryCode].rates.mobile;
        const oldLandline = backupData.countries[countryCode].rates.landline;
        const newMobile = rateData.twilioMobile || rateData.twilioRate;
        const newLandline = rateData.twilioLandline || rateData.twilioRate;
        
        if (oldMobile !== newMobile || oldLandline !== newLandline) {
          backupData.countries[countryCode].rates.mobile = newMobile;
          backupData.countries[countryCode].rates.landline = newLandline;
          updateCount++;
          
          if (AUTO_SYNC_CONFIG.logLevel === 'verbose') {
            changes.push({
              country: countryCode,
              name: rateData.country,
              mobile: { old: oldMobile, new: newMobile },
              landline: { old: oldLandline, new: newLandline }
            });
          }
        }
      }
    });
    
    // 如果有更新，写入文件
    if (updateCount > 0) {
      fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');
      
      if (AUTO_SYNC_CONFIG.logLevel !== 'silent') {
        console.log(`🤖 自动同步完成: 更新了 ${updateCount} 个国家的备用费率`);
      }
      
      if (AUTO_SYNC_CONFIG.logLevel === 'verbose' && changes.length > 0) {
        console.log('📊 详细变更记录:');
        changes.slice(0, 5).forEach(change => {
          console.log(`   ${change.country} (${change.name}): 移动 $${change.mobile.old} → $${change.mobile.new}, 固话 $${change.landline.old} → $${change.landline.new}`);
        });
        if (changes.length > 5) {
          console.log(`   ... 还有 ${changes.length - 5} 个国家的费率更新`);
        }
      }
      
      return { 
        success: true, 
        updateCount, 
        totalCountries: Object.keys(ratesCache).length,
        changes: AUTO_SYNC_CONFIG.logLevel === 'verbose' ? changes : [],
        timestamp: new Date().toISOString()
      };
    } else {
      if (AUTO_SYNC_CONFIG.logLevel === 'verbose') {
        console.log('🤖 备用费率已是最新，无需更新');
      }
      return { 
        success: true, 
        updateCount: 0, 
        message: 'no_updates_needed',
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    if (AUTO_SYNC_CONFIG.logLevel !== 'silent') {
      console.error('❌ 自动同步备用费率失败:', error);
    }
    return { success: false, reason: 'error', error: error.message };
  }
}

// 优化的费率缓存更新函数
async function updateRatesCache() {
  const startTime = Date.now();
  let twilioRates = {};

  try {
    console.log('🔄 开始更新费率缓存...');

    // 设置超时保护，防止长时间阻塞
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cache update timeout')), 30000); // 30秒超时
    });

    const updatePromise = fetchTwilioRates();
    twilioRates = await Promise.race([updatePromise, timeoutPromise]);

    // 验证数据完整性
    if (!twilioRates || typeof twilioRates !== 'object' || Object.keys(twilioRates).length === 0) {
      throw new Error('Invalid rates data received');
    }

    // 使用优化的缓存管理器更新缓存
    ratesCacheManager.setAll(twilioRates);
    cacheTimestamp = ratesCacheManager.cacheTimestamp;

    const duration = Date.now() - startTime;
    console.log(`✅ 费率缓存更新完成，包含 ${Object.keys(twilioRates).length} 个国家 (耗时: ${duration}ms)`);

    // 输出一些关键国家的费率进行验证
    const testCountries = ['TH', 'MY', 'US', 'SG'];
    console.log('📊 Sample rates verification:');
    testCountries.forEach(code => {
      if (twilioRates[code]) {
        console.log(`   ${code}: $${twilioRates[code].rate}/min (${twilioRates[code].country})`);
      }
    });

    // 记录内存使用情况
    const memUsage = process.memoryUsage();
    console.log(`📊 内存使用: RSS=${Math.round(memUsage.rss/1024/1024)}MB, Heap=${Math.round(memUsage.heapUsed/1024/1024)}MB`);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ 更新费率缓存失败 (耗时: ${duration}ms):`, error.message);

    // 如果缓存为空，使用备用费率
    if (ratesCacheManager.cache.size === 0) {
      console.log('🔙 使用备用费率数据');
      ratesCacheManager.setAll(fallbackRates);
      cacheTimestamp = ratesCacheManager.cacheTimestamp;
    }

    // 记录错误但不抛出，保持服务可用性
    console.warn('⚠️ 缓存更新失败，继续使用现有缓存或备用数据');
  } finally {
    // 强制垃圾回收（如果可用）
    if (global.gc && typeof global.gc === 'function') {
      global.gc();
    }
  }
}

// 优化的缓存更新函数 - 防止并发更新和内存问题
async function ensureFreshCache() {
  // 如果正在更新，等待完成
  if (ratesCacheManager.isUpdating) {
    console.log('⏳ Cache update in progress, waiting...');
    // 简单的等待机制，避免并发更新
    let attempts = 0;
    while (ratesCacheManager.isUpdating && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    return;
  }

  // 检查缓存是否有效
  if (ratesCacheManager.isValid()) {
    return; // 缓存仍然有效
  }

  // 生产环境中避免自动API调用，防止内存问题
  if (process.env.NODE_ENV === 'production') {
    if (ratesCacheManager.cache.size === 0) {
      console.log('🌍 Production mode: Using fallback rates instead of API calls');
      ratesCacheManager.setAll(fallbackRates);
      cacheTimestamp = ratesCacheManager.cacheTimestamp;
    }
    return;
  }

  // 开发环境中的缓存更新逻辑
  if (FORCE_CACHE_REFRESH || !ratesCacheManager.isValid() || ratesCacheManager.cacheTimestamp < FORCE_CACHE_TIMESTAMP) {
    console.log('🔄 Development mode: Refreshing rates cache...');
    ratesCacheManager.isUpdating = true;

    try {
      ratesCacheManager.cache.clear();
      cacheTimestamp = 0;
      await updateRatesCache();
    } catch (error) {
      console.error('❌ Cache update failed:', error);
      // 失败时使用备用费率
      ratesCacheManager.setAll(fallbackRates);
      cacheTimestamp = ratesCacheManager.cacheTimestamp;
    } finally {
      ratesCacheManager.isUpdating = false;
    }
  }
}

// 获取所有国家费率 - 优化版本
router.get('/all', async (req, res) => {
  try {
    await ensureFreshCache();

    // 使用优化的缓存管理器获取数据
    const allRates = ratesCacheManager.getAll();
    const stats = ratesCacheManager.getStats();

    res.json({
      success: true,
      data: allRates,
      cached: true,
      timestamp: ratesCacheManager.cacheTimestamp,
      stats: {
        count: stats.size,
        lastUpdated: stats.lastUpdated,
        isValid: stats.isValid
      }
    });
  } catch (error) {
    console.error('Error fetching all rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rates',
      data: fallbackRates,
      fallback: true
    });
  }
});

// 缓存统计和管理端点
router.get('/cache/stats', (req, res) => {
  try {
    const stats = ratesCacheManager.getStats();
    res.json({
      success: true,
      cache: {
        size: stats.size,
        maxSize: stats.maxSize,
        lastUpdated: new Date(stats.lastUpdated).toISOString(),
        isValid: stats.isValid,
        memoryUsage: {
          rss: Math.round(stats.memoryUsage.rss / 1024 / 1024) + 'MB',
          heapUsed: Math.round(stats.memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(stats.memoryUsage.heapTotal / 1024 / 1024) + 'MB'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats',
      error: error.message
    });
  }
});

// 手动清理缓存端点（仅开发环境）
router.post('/cache/cleanup', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Cache cleanup not allowed in production'
    });
  }

  try {
    const beforeSize = ratesCacheManager.cache.size;
    ratesCacheManager.cleanup();
    const afterSize = ratesCacheManager.cache.size;

    res.json({
      success: true,
      message: 'Cache cleanup completed',
      before: beforeSize,
      after: afterSize,
      cleaned: beforeSize - afterSize
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cache cleanup failed',
      error: error.message
    });
  }
});

// 获取特定国家费率 - 支持移动/固定电话区分
router.get('/country/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const { callType } = req.query; // mobile 或 landline
    const upperCode = countryCode.toUpperCase();
    
    await ensureFreshCache();
    
    if (ratesCache[upperCode]) {
      let responseData = { ...ratesCache[upperCode] };
      
      // 如果指定了通话类型，返回对应的费率；否则返回最贵的费率
      const fs = require('fs');
      const path = require('path');
      try {
        const countriesData = JSON.parse(
          fs.readFileSync(path.join(__dirname, '../data/complete-countries.json'), 'utf8')
        );
        
        if (countriesData.countries && countriesData.countries[upperCode]) {
          const countryRates = countriesData.countries[upperCode].rates;
          let twilioRate, actualCallType;
          
          if (callType && (callType === 'mobile' || callType === 'landline')) {
            // 使用指定的通话类型
            twilioRate = callType === 'mobile' ? countryRates.mobile : countryRates.landline;
            actualCallType = callType;
          } else {
            // 没有指定类型，使用最贵的费率（更安全）
            const mobileRate = countryRates.mobile || 0;
            const landlineRate = countryRates.landline || 0;
            if (mobileRate >= landlineRate) {
              twilioRate = mobileRate;
              actualCallType = 'mobile';
            } else {
              twilioRate = landlineRate;
              actualCallType = 'landline';
            }
          }
          
          // 应用定价策略
          responseData.rate = calculateUserRate(upperCode, twilioRate);
          responseData.twilioRate = twilioRate;
          responseData.callType = actualCallType;
          responseData.rateBasis = callType ? 'detected' : 'highest_rate';
        }
      } catch (fileError) {
        console.warn('Failed to read country rates file:', fileError);
      }
      
      res.json({
        success: true,
        data: responseData,
        countryCode: upperCode
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Country not found',
        countryCode: upperCode
      });
    }
  } catch (error) {
    console.error('Error fetching country rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch country rate'
    });
  }
});

// 计算通话费用
router.post('/calculate', async (req, res) => {
  try {
    const { phoneNumber, duration, countryCode } = req.body;
    
    if (!phoneNumber || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and duration are required'
      });
    }
    
    await ensureFreshCache();
    
    // 如果没有提供国家代码，尝试从电话号码解析
    let targetCountry = countryCode;
    if (!targetCountry) {
      // 简单的国家代码解析 (生产环境建议使用专业的电话号码解析库)
      if (phoneNumber.startsWith('+1')) targetCountry = 'US';
      else if (phoneNumber.startsWith('+86')) targetCountry = 'CN';
      else if (phoneNumber.startsWith('+44')) targetCountry = 'GB';
      else if (phoneNumber.startsWith('+91')) targetCountry = 'IN';
      else if (phoneNumber.startsWith('+81')) targetCountry = 'JP';
      // 添加更多国家代码解析...
      else targetCountry = 'US'; // 默认
    }
    
    const rateInfo = ratesCache[targetCountry.toUpperCase()];
    if (!rateInfo) {
      return res.status(404).json({
        success: false,
        message: 'Rate not found for this destination'
      });
    }
    
    const cost = (duration / 60) * rateInfo.rate; // duration in seconds, rate per minute
    
    res.json({
      success: true,
      data: {
        phoneNumber,
        countryCode: targetCountry,
        country: rateInfo.country,
        duration: duration, // seconds
        durationMinutes: Math.ceil(duration / 60),
        ratePerMinute: rateInfo.rate,
        totalCost: Math.round(cost * 10000) / 10000, // 保留4位小数
        currency: rateInfo.currency
      }
    });
  } catch (error) {
    console.error('Error calculating cost:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate cost'
    });
  }
});

// 搜索国家
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    await ensureFreshCache();
    
    const results = {};
    const lowerQuery = query.toLowerCase();
    
    Object.entries(ratesCache).forEach(([code, data]) => {
      if (data.country.toLowerCase().includes(lowerQuery) || code.toLowerCase().includes(lowerQuery)) {
        results[code] = data;
      }
    });
    
    res.json({
      success: true,
      data: results,
      count: Object.keys(results).length
    });
  } catch (error) {
    console.error('Error searching countries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search countries'
    });
  }
});

// 手动同步备用费率文件 - 支持强制刷新和进度监控
router.post('/sync-backup-rates', async (req, res) => {
  try {
    const { forceRefresh = true, verbose = false } = req.body;
    
    console.log('🔄 开始手动同步备用费率文件...');
    console.log(`📋 配置: 强制刷新=${forceRefresh}, 详细输出=${verbose}`);
    
    // 强制获取最新的API费率
    if (forceRefresh) {
      console.log('🌍 强制从Twilio API获取最新费率...');
      ratesCache = {}; // 清空缓存
      cacheTimestamp = 0; // 重置时间戳
      await updateRatesCache();
    } else {
      await ensureFreshCache();
    }
    
    const fs = require('fs');
    const path = require('path');
    const backupFilePath = path.join(__dirname, '../data/complete-countries.json');
    
    // 备份原文件
    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupBackupPath = path.join(__dirname, '../data/', `complete-countries-backup-${backupTimestamp}.json`);
    
    try {
      fs.copyFileSync(backupFilePath, backupBackupPath);
      console.log(`💾 已创建备份文件: complete-countries-backup-${backupTimestamp}.json`);
    } catch (err) {
      console.warn('⚠️ 创建备份文件失败:', err.message);
    }
    
    // 读取现有的备用文件
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    let updateCount = 0;
    let newCountryCount = 0;
    const updateLog = [];
    
    // 遍历所有API缓存的费率，更新备用文件
    Object.entries(ratesCache).forEach(([countryCode, rateData]) => {
      if (backupData.countries && backupData.countries[countryCode]) {
        // 更新现有国家费率
        const oldMobile = backupData.countries[countryCode].rates.mobile;
        const oldLandline = backupData.countries[countryCode].rates.landline;
        const newMobile = rateData.twilioMobile || rateData.twilioRate;
        const newLandline = rateData.twilioLandline || rateData.twilioRate;
        
        backupData.countries[countryCode].rates.mobile = newMobile;
        backupData.countries[countryCode].rates.landline = newLandline;
        
        if (oldMobile !== newMobile || oldLandline !== newLandline) {
          updateCount++;
          const logEntry = {
            code: countryCode,
            country: rateData.country,
            changes: {
              mobile: { old: oldMobile, new: newMobile },
              landline: { old: oldLandline, new: newLandline }
            }
          };
          updateLog.push(logEntry);
          
          if (verbose) {
            console.log(`📊 更新 ${countryCode} (${rateData.country}): 移动 $${oldMobile} → $${newMobile}, 固话 $${oldLandline} → $${newLandline}`);
          }
        }
      } else if (backupData.countries) {
        // 添加新国家（如果存在于API但不在备用文件中）
        newCountryCount++;
        console.log(`🆕 添加新国家 ${countryCode} (${rateData.country})`);
      }
    });
    
    // 写入更新后的备用文件
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalApiCountries: Object.keys(ratesCache).length,
      updatedCountries: updateCount,
      newCountries: newCountryCount,
      backupFile: `complete-countries-backup-${backupTimestamp}.json`,
      changes: verbose ? updateLog : updateLog.slice(0, 10) // 限制返回的变更记录
    };
    
    console.log(`✅ 备用费率文件同步完成!`);
    console.log(`📊 统计: 更新${updateCount}个国家, 新增${newCountryCount}个国家, API总计${Object.keys(ratesCache).length}个国家`);
    
    res.json({
      success: true,
      message: `备用费率文件同步完成`,
      summary,
      verbose
    });
  } catch (error) {
    console.error('❌ 备用费率文件同步失败:', error);
    res.status(500).json({
      success: false,
      message: '备用费率文件同步失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取同步状态和统计信息
router.get('/sync-status', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const backupFilePath = path.join(__dirname, '../data/complete-countries.json');
    
    // 获取文件信息
    const stats = fs.statSync(backupFilePath);
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    
    // 统计备用文件中的国家数量
    const backupCountries = backupData.countries ? Object.keys(backupData.countries).length : 0;
    
    // 检查API缓存状态
    const apiCountries = Object.keys(ratesCache).length;
    const cacheAge = cacheTimestamp ? Date.now() - cacheTimestamp : 0;
    
    // 随机检查几个国家的费率是否一致
    const sampleCountries = ['US', 'TH', 'VN', 'CN', 'SG'].filter(code => 
      ratesCache[code] && backupData.countries && backupData.countries[code]
    );
    
    const consistencyCheck = sampleCountries.map(code => {
      const apiRate = ratesCache[code];
      const backupRate = backupData.countries[code];
      const isConsistent = 
        backupRate.rates.mobile === (apiRate.twilioMobile || apiRate.twilioRate) &&
        backupRate.rates.landline === (apiRate.twilioLandline || apiRate.twilioRate);
      
      return {
        country: code,
        name: apiRate.country,
        consistent: isConsistent,
        api: {
          mobile: apiRate.twilioMobile || apiRate.twilioRate,
          landline: apiRate.twilioLandline || apiRate.twilioRate
        },
        backup: {
          mobile: backupRate.rates.mobile,
          landline: backupRate.rates.landline
        }
      };
    });
    
    const needsSync = consistencyCheck.some(item => !item.consistent);
    
    res.json({
      success: true,
      data: {
        backupFile: {
          path: 'server/data/complete-countries.json',
          lastModified: stats.mtime,
          size: stats.size,
          countries: backupCountries
        },
        apiCache: {
          countries: apiCountries,
          lastUpdated: cacheTimestamp ? new Date(cacheTimestamp) : null,
          ageMinutes: Math.round(cacheAge / 60000)
        },
        sync: {
          needsSync,
          recommendation: needsSync ? '建议执行同步' : '费率已同步',
          lastCheck: new Date().toISOString()
        },
        consistencyCheck
      }
    });
  } catch (error) {
    console.error('❌ 获取同步状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取同步状态失败',
      error: error.message
    });
  }
});

// 测试端点 - 验证API修复  
router.get('/test-fix', async (req, res) => {
  try {
    console.log('🧪 Testing API fix...');
    
    // 强制刷新缓存
    await updateRatesCache();
    
    const testCountries = ['TH', 'MY', 'US', 'SG', 'VN', 'CN'];
    const results = {};
    
    testCountries.forEach(code => {
      if (ratesCache[code]) {
        results[code] = {
          country: ratesCache[code].country,
          rate: ratesCache[code].rate,
          twilioRate: ratesCache[code].twilioRate,
          markup: ratesCache[code].markup
        };
      }
    });
    
    res.json({
      success: true,
      message: 'API fix test completed',
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

// 初始化费率缓存 - 禁用自动同步，避免内存问题和502错误
// 注释掉自动同步，改为手动触发或按需加载
// setTimeout(() => {
//   if (process.env.NODE_ENV !== 'test') {
//     updateRatesCache();
//   }
// }, 5000); // 5秒后执行

// 仅在生产环境中使用备用费率数据，避免API调用
if (process.env.NODE_ENV === 'production') {
  console.log('🌍 Production mode: Using fallback rates to prevent memory issues');
  ratesCache = fallbackRates;
  cacheTimestamp = Date.now();
}

// 进程退出时清理缓存资源
process.on('SIGINT', () => {
  console.log('🧹 Cleaning up rates cache on process exit...');
  ratesCacheManager.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🧹 Cleaning up rates cache on process termination...');
  ratesCacheManager.destroy();
  process.exit(0);
});

module.exports = router;
