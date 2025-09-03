const express = require('express');
const { Call, User, CallRecording, sequelize } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const { client: twilioClient } = require('../config/twilio');
const webSocketManager = require('../config/websocket');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// 通话缓存，避免重复记录 - 内存中的临时缓存
const callCache = new Map();

// 缓存清理函数 - 定期清理过期的缓存条目
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000; // 1小时前
  for (const [key, callData] of callCache.entries()) {
    if (callData.timestamp < oneHourAgo) {
      callCache.delete(key);
    }
  }
}, 15 * 60 * 1000); // 每15分钟清理一次

// 国家代码到国家名称的映射表（扩展版）
const COUNTRY_CODE_MAP = {
  '1': 'United States',     // 美国/加拿大共用，需要进一步细分
  '7': 'Russia',           // 俄罗斯/哈萨克斯坦
  '20': 'Egypt',
  '27': 'South Africa',
  '30': 'Greece',
  '31': 'Netherlands',
  '32': 'Belgium',
  '33': 'France',
  '34': 'Spain',
  '36': 'Hungary',
  '39': 'Italy',
  '40': 'Romania',
  '41': 'Switzerland',
  '43': 'Austria',
  '44': 'United Kingdom',
  '45': 'Denmark',
  '46': 'Sweden',
  '47': 'Norway',
  '48': 'Poland',
  '49': 'Germany',
  '51': 'Peru',
  '52': 'Mexico',
  '53': 'Cuba',
  '54': 'Argentina',
  '55': 'Brazil',
  '56': 'Chile',
  '57': 'Colombia',
  '58': 'Venezuela',
  '60': 'Malaysia',
  '61': 'Australia',
  '62': 'Indonesia',
  '63': 'Philippines',
  '64': 'New Zealand',
  '65': 'Singapore',
  '66': 'Thailand',
  '81': 'Japan',
  '82': 'South Korea',
  '84': 'Vietnam',
  '86': 'China',
  '90': 'Turkey',
  '91': 'India',
  '92': 'Pakistan',
  '93': 'Afghanistan',
  '94': 'Sri Lanka',
  '95': 'Myanmar',
  '98': 'Iran',
  '212': 'Morocco',
  '213': 'Algeria',
  '216': 'Tunisia',
  '218': 'Libya',
  '220': 'Gambia',
  '221': 'Senegal',
  '222': 'Mauritania',
  '223': 'Mali',
  '224': 'Guinea',
  '225': 'Ivory Coast',
  '226': 'Burkina Faso',
  '227': 'Niger',
  '228': 'Togo',
  '229': 'Benin',
  '230': 'Mauritius',
  '231': 'Liberia',
  '232': 'Sierra Leone',
  '233': 'Ghana',
  '234': 'Nigeria',
  '235': 'Chad',
  '236': 'Central African Republic',
  '237': 'Cameroon',
  '238': 'Cape Verde',
  '239': 'Sao Tome and Principe',
  '240': 'Equatorial Guinea',
  '241': 'Gabon',
  '242': 'Republic of the Congo',
  '243': 'Democratic Republic of the Congo',
  '244': 'Angola',
  '245': 'Guinea-Bissau',
  '246': 'British Indian Ocean Territory',
  '247': 'Ascension Island',
  '248': 'Seychelles',
  '249': 'Sudan',
  '250': 'Rwanda',
  '251': 'Ethiopia',
  '252': 'Somalia',
  '253': 'Djibouti',
  '254': 'Kenya',
  '255': 'Tanzania',
  '256': 'Uganda',
  '257': 'Burundi',
  '258': 'Mozambique',
  '260': 'Zambia',
  '261': 'Madagascar',
  '262': 'Reunion',
  '263': 'Zimbabwe',
  '264': 'Namibia',
  '265': 'Malawi',
  '266': 'Lesotho',
  '267': 'Botswana',
  '268': 'Eswatini',
  '269': 'Comoros',
  '290': 'Saint Helena',
  '291': 'Eritrea',
  '297': 'Aruba',
  '298': 'Faroe Islands',
  '299': 'Greenland',
  '350': 'Gibraltar',
  '351': 'Portugal',
  '352': 'Luxembourg',
  '353': 'Ireland',
  '354': 'Iceland',
  '355': 'Albania',
  '356': 'Malta',
  '357': 'Cyprus',
  '358': 'Finland',
  '359': 'Bulgaria',
  '370': 'Lithuania',
  '371': 'Latvia',
  '372': 'Estonia',
  '373': 'Moldova',
  '374': 'Armenia',
  '375': 'Belarus',
  '376': 'Andorra',
  '377': 'Monaco',
  '378': 'San Marino',
  '380': 'Ukraine',
  '381': 'Serbia',
  '382': 'Montenegro',
  '383': 'Kosovo',
  '385': 'Croatia',
  '386': 'Slovenia',
  '387': 'Bosnia and Herzegovina',
  '389': 'North Macedonia',
  '420': 'Czech Republic',
  '421': 'Slovakia',
  '423': 'Liechtenstein',
  '500': 'Falkland Islands',
  '501': 'Belize',
  '502': 'Guatemala',
  '503': 'El Salvador',
  '504': 'Honduras',
  '505': 'Nicaragua',
  '506': 'Costa Rica',
  '507': 'Panama',
  '508': 'Saint Pierre and Miquelon',
  '509': 'Haiti',
  '590': 'Guadeloupe',
  '591': 'Bolivia',
  '592': 'Guyana',
  '593': 'Ecuador',
  '594': 'French Guiana',
  '595': 'Paraguay',
  '596': 'Martinique',
  '597': 'Suriname',
  '598': 'Uruguay',
  '599': 'Netherlands Antilles',
  '670': 'East Timor',
  '672': 'Australian External Territories',
  '673': 'Brunei',
  '674': 'Nauru',
  '675': 'Papua New Guinea',
  '676': 'Tonga',
  '677': 'Solomon Islands',
  '678': 'Vanuatu',
  '679': 'Fiji',
  '680': 'Palau',
  '681': 'Wallis and Futuna',
  '682': 'Cook Islands',
  '683': 'Niue',
  '684': 'American Samoa',
  '685': 'Samoa',
  '686': 'Kiribati',
  '687': 'New Caledonia',
  '688': 'Tuvalu',
  '689': 'French Polynesia',
  '690': 'Tokelau',
  '691': 'Micronesia',
  '692': 'Marshall Islands',
  '850': 'North Korea',
  '852': 'Hong Kong',        // 重点：香港
  '853': 'Macau',
  '855': 'Cambodia',
  '856': 'Laos',
  '880': 'Bangladesh',
  '886': 'Taiwan',
  '960': 'Maldives',
  '961': 'Lebanon',
  '962': 'Jordan',
  '963': 'Syria',
  '964': 'Iraq',
  '965': 'Kuwait',
  '966': 'Saudi Arabia',
  '967': 'Yemen',
  '968': 'Oman',
  '970': 'Palestine',
  '971': 'United Arab Emirates',
  '972': 'Israel',
  '973': 'Bahrain',
  '974': 'Qatar',
  '975': 'Bhutan',
  '976': 'Mongolia',
  '977': 'Nepal',
  '992': 'Tajikistan',
  '993': 'Turkmenistan',
  '994': 'Azerbaijan',
  '995': 'Georgia',
  '996': 'Kyrgyzstan',
  '998': 'Uzbekistan'
};

// 解析电话号码并返回国家名称
function getCountryFromPhoneNumber(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return 'Unknown';
  }
  
  // 标准化电话号码，移除空格、连字符等
  const cleanedNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
  
  // 检查是否以+开头
  if (!cleanedNumber.startsWith('+')) {
    return 'Unknown';
  }
  
  // 移除+号
  const numberWithoutPlus = cleanedNumber.substring(1);
  
  // 尝试匹配不同长度的国家代码（从长到短）
  for (let len = 4; len >= 1; len--) {
    const possibleCode = numberWithoutPlus.substring(0, len);
    if (COUNTRY_CODE_MAP[possibleCode]) {
      // 特殊处理北美地区（+1）
      if (possibleCode === '1') {
        // 根据区号进一步判断（简化版）
        const areaCode = numberWithoutPlus.substring(1, 4);
        if (['242', '246', '264', '268', '284', '340', '345', '441', '473', '649', '664', '670', '671', '684', '721', '758', '767', '784', '787', '809', '829', '849', '868', '869', '876', '939'].includes(areaCode)) {
          return 'Caribbean'; // 加勒比海地区
        } else if (numberWithoutPlus.length >= 11 && numberWithoutPlus.substring(1, 4).match(/^[2-9]/)) {
          // 进一步判断是美国还是加拿大（简化处理）
          return 'United States';
        }
        return 'United States'; // 默认为美国
      }
      return COUNTRY_CODE_MAP[possibleCode];
    }
  }
  
  return 'Unknown';
}

// 应用定价策略计算用户费率
function calculateUserRateFromTwilio(countryCode, twilioRate) {
  // 美国和加拿大固定费率
  if (countryCode === 'US' || countryCode === 'CA') {
    return 0.02;
  }
  
  // 其他国家100%利润（×2）
  return Math.round(twilioRate * 2 * 1000) / 1000; // 保留3位小数
}

// 根据国家获取Twilio基础费率
function getTwilioBaseRate(countryName, phoneType = 'mobile') {
  const rates = getGlobalRates();
  
  // 首先尝试直接匹配国家名称
  let countryCode = null;
  for (const [code, data] of Object.entries(rates)) {
    if (data.name.toLowerCase() === countryName.toLowerCase()) {
      countryCode = code;
      break;
    }
  }
  
  // 如果找到了对应的国家，返回相应费率
  if (countryCode && rates[countryCode]) {
    const countryRates = rates[countryCode];
    const rate = phoneType === 'landline' ? countryRates.landline : countryRates.mobile;
    return { rate, countryCode };
  }
  
  // 特殊处理一些常见的国家名称映射
  const countryNameMappings = {
    'hong kong': 'HK',
    'united states': 'US', 
    'thailand': 'TH',
    'china': 'CN',
    'united kingdom': 'GB',
    'singapore': 'SG',
    'malaysia': 'MY',
    'japan': 'JP',
    'south korea': 'KR',
    'moldova': 'MD'  // 添加Moldova映射
  };
  
  const mappedCode = countryNameMappings[countryName.toLowerCase()];
  if (mappedCode && rates[mappedCode]) {
    const countryRates = rates[mappedCode];
    const rate = phoneType === 'landline' ? countryRates.landline : countryRates.mobile;
    return { rate, countryCode: mappedCode };
  }
  
  // 默认费率（如果找不到对应国家）
  console.log(`⚠️ [RATE_WARNING] No rate found for country: "${countryName}", using default 0.02`);
  return { rate: 0.02, countryCode: 'UNKNOWN' };
}

// 根据国家和电话类型获取用户费率（应用定价策略）
function getRateByCountry(countryName, phoneType = 'mobile') {
  const { rate: twilioRate, countryCode } = getTwilioBaseRate(countryName, phoneType);
  const userRate = calculateUserRateFromTwilio(countryCode, twilioRate);
  
  console.log(`💰 [PRICING] ${countryName} (${countryCode}): Twilio $${twilioRate} → User $${userRate} (${countryCode === 'US' || countryCode === 'CA' ? Math.round(((userRate/twilioRate) - 1) * 100) + '%' : '100%'} markup)`);
  
  return userRate;
}

// Load complete countries data
const loadCompleteCountriesData = () => {
  try {
    const dataPath = path.join(__dirname, '..', 'data', 'complete-countries.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);
    return data.countries;
  } catch (error) {
    console.warn('Could not load complete countries data, falling back to legacy rates:', error.message);
    return null;
  }
};

// Comprehensive global rates - now using complete Twilio countries data
const getGlobalRates = () => {
  // Try to load complete countries data first
  const completeCountries = loadCompleteCountriesData();
  
  if (completeCountries) {
    // Convert complete countries data with our pricing strategy applied
    const rates = {};
    Object.entries(completeCountries).forEach(([isoCode, countryData]) => {
      // Apply our pricing strategy: US/CA fixed $0.02, others x2
      const twilioMobile = countryData.rates.mobile;
      const twilioLandline = countryData.rates.landline;
      
      let userMobile, userLandline;
      if (isoCode === 'US' || isoCode === 'CA') {
        // Fixed pricing for US/Canada
        userMobile = 0.02;
        userLandline = 0.02;
      } else {
        // 100% markup for other countries
        userMobile = Math.round(twilioMobile * 2 * 1000) / 1000;
        userLandline = Math.round(twilioLandline * 2 * 1000) / 1000;
      }
      
      rates[isoCode] = {
        mobile: userMobile,
        landline: userLandline,
        currency: 'USD',
        name: countryData.name,
        flag: countryData.flag,
        region: 'International'
      };
    });
    return rates;
  }

  // Fallback to legacy data if complete countries data is not available
  return {
    // North America - Updated with our pricing strategy
    'US': { 
      mobile: 0.020, landline: 0.020, currency: 'USD', 
      name: 'United States', flag: '🇺🇸', region: 'North America' 
    },
    'CA': { 
      mobile: 0.020, landline: 0.020, currency: 'USD', 
      name: 'Canada', flag: '🇨🇦', region: 'North America' 
    },
    'MX': { 
      mobile: 0.065, landline: 0.050, currency: 'USD', 
      name: 'Mexico', flag: '🇲🇽', region: 'North America' 
    },
    'GT': { 
      mobile: 0.180, landline: 0.150, currency: 'USD', 
      name: 'Guatemala', flag: '🇬🇹', region: 'North America' 
    },
    'BZ': { 
      mobile: 0.220, landline: 0.180, currency: 'USD', 
      name: 'Belize', flag: '🇧🇿', region: 'North America' 
    },
    'SV': { 
      mobile: 0.180, landline: 0.150, currency: 'USD', 
      name: 'El Salvador', flag: '🇸🇻', region: 'North America' 
    },
    'HN': { 
      mobile: 0.200, landline: 0.170, currency: 'USD', 
      name: 'Honduras', flag: '🇭🇳', region: 'North America' 
    },
    'NI': { 
      mobile: 0.220, landline: 0.180, currency: 'USD', 
      name: 'Nicaragua', flag: '🇳🇮', region: 'North America' 
    },
    'CR': { 
      mobile: 0.140, landline: 0.110, currency: 'USD', 
      name: 'Costa Rica', flag: '🇨🇷', region: 'North America' 
    },
    'PA': { 
      mobile: 0.120, landline: 0.100, currency: 'USD', 
      name: 'Panama', flag: '🇵🇦', region: 'North America' 
    },
    'DO': { 
      mobile: 0.220, landline: 0.180, currency: 'USD', 
      name: 'Dominican Republic', flag: '🇩🇴', region: 'North America' 
    },
    'HT': { 
      mobile: 0.350, landline: 0.280, currency: 'USD', 
      name: 'Haiti', flag: '🇭🇹', region: 'North America' 
    },
    'JM': { 
      mobile: 0.280, landline: 0.220, currency: 'USD', 
      name: 'Jamaica', flag: '🇯🇲', region: 'North America' 
    },
    'CU': { 
      mobile: 0.950, landline: 0.850, currency: 'USD', 
      name: 'Cuba', flag: '🇨🇺', region: 'North America' 
    },

    // South America
    'BR': { 
      mobile: 0.110, landline: 0.085, currency: 'USD', 
      name: 'Brazil', flag: '🇧🇷', region: 'South America' 
    },
    'AR': { 
      mobile: 0.090, landline: 0.070, currency: 'USD', 
      name: 'Argentina', flag: '🇦🇷', region: 'South America' 
    },
    'CL': { 
      mobile: 0.080, landline: 0.065, currency: 'USD', 
      name: 'Chile', flag: '🇨🇱', region: 'South America' 
    },
    'CO': { 
      mobile: 0.065, landline: 0.050, currency: 'USD', 
      name: 'Colombia', flag: '🇨🇴', region: 'South America' 
    },
    'PE': { 
      mobile: 0.085, landline: 0.065, currency: 'USD', 
      name: 'Peru', flag: '🇵🇪', region: 'South America' 
    },
    'VE': { 
      mobile: 0.150, landline: 0.120, currency: 'USD', 
      name: 'Venezuela', flag: '🇻🇪', region: 'South America' 
    },
    'EC': { 
      mobile: 0.180, landline: 0.150, currency: 'USD', 
      name: 'Ecuador', flag: '🇪🇨', region: 'South America' 
    },
    'BO': { 
      mobile: 0.220, landline: 0.180, currency: 'USD', 
      name: 'Bolivia', flag: '🇧🇴', region: 'South America' 
    },
    'PY': { 
      mobile: 0.120, landline: 0.095, currency: 'USD', 
      name: 'Paraguay', flag: '🇵🇾', region: 'South America' 
    },
    'UY': { 
      mobile: 0.140, landline: 0.110, currency: 'USD', 
      name: 'Uruguay', flag: '🇺🇾', region: 'South America' 
    },
    'GY': { 
      mobile: 0.350, landline: 0.280, currency: 'USD', 
      name: 'Guyana', flag: '🇬🇾', region: 'South America' 
    },
    'SR': { 
      mobile: 0.380, landline: 0.300, currency: 'USD', 
      name: 'Suriname', flag: '🇸🇷', region: 'South America' 
    },

    // Europe
    'GB': { 
      mobile: 0.042, landline: 0.032, currency: 'USD', 
      name: 'United Kingdom', flag: '🇬🇧', region: 'Europe' 
    },
    'DE': { 
      mobile: 0.038, landline: 0.028, currency: 'USD', 
      name: 'Germany', flag: '🇩🇪', region: 'Europe' 
    },
    'FR': { 
      mobile: 0.040, landline: 0.030, currency: 'USD', 
      name: 'France', flag: '🇫🇷', region: 'Europe' 
    },
    'IT': { 
      mobile: 0.045, landline: 0.035, currency: 'USD', 
      name: 'Italy', flag: '🇮🇹', region: 'Europe' 
    },
    'ES': { 
      mobile: 0.042, landline: 0.032, currency: 'USD', 
      name: 'Spain', flag: '🇪🇸', region: 'Europe' 
    },
    'NL': { 
      mobile: 0.038, landline: 0.028, currency: 'USD', 
      name: 'Netherlands', flag: '🇳🇱', region: 'Europe' 
    },
    'BE': { 
      mobile: 0.040, landline: 0.030, currency: 'USD', 
      name: 'Belgium', flag: '🇧🇪', region: 'Europe' 
    },
    'CH': { 
      mobile: 0.035, landline: 0.025, currency: 'USD', 
      name: 'Switzerland', flag: '🇨🇭', region: 'Europe' 
    },
    'AT': { 
      mobile: 0.042, landline: 0.032, currency: 'USD', 
      name: 'Austria', flag: '🇦🇹', region: 'Europe' 
    },
    'SE': { 
      mobile: 0.035, landline: 0.025, currency: 'USD', 
      name: 'Sweden', flag: '🇸🇪', region: 'Europe' 
    },
    'NO': { 
      mobile: 0.038, landline: 0.028, currency: 'USD', 
      name: 'Norway', flag: '🇳🇴', region: 'Europe' 
    },
    'DK': { 
      mobile: 0.035, landline: 0.025, currency: 'USD', 
      name: 'Denmark', flag: '🇩🇰', region: 'Europe' 
    },
    'FI': { 
      mobile: 0.038, landline: 0.028, currency: 'USD', 
      name: 'Finland', flag: '🇫🇮', region: 'Europe' 
    },
    'PL': { 
      mobile: 0.055, landline: 0.045, currency: 'USD', 
      name: 'Poland', flag: '🇵🇱', region: 'Europe' 
    },
    'CZ': { 
      mobile: 0.050, landline: 0.040, currency: 'USD', 
      name: 'Czech Republic', flag: '🇨🇿', region: 'Europe' 
    },
    'HU': { 
      mobile: 0.055, landline: 0.045, currency: 'USD', 
      name: 'Hungary', flag: '🇭🇺', region: 'Europe' 
    },
    'SK': { 
      mobile: 0.052, landline: 0.042, currency: 'USD', 
      name: 'Slovakia', flag: '🇸🇰', region: 'Europe' 
    },
    'SI': { 
      mobile: 0.050, landline: 0.040, currency: 'USD', 
      name: 'Slovenia', flag: '🇸🇮', region: 'Europe' 
    },
    'HR': { 
      mobile: 0.058, landline: 0.048, currency: 'USD', 
      name: 'Croatia', flag: '🇭🇷', region: 'Europe' 
    },
    'RS': { 
      mobile: 0.095, landline: 0.075, currency: 'USD', 
      name: 'Serbia', flag: '🇷🇸', region: 'Europe' 
    },
    'BG': { 
      mobile: 0.085, landline: 0.065, currency: 'USD', 
      name: 'Bulgaria', flag: '🇧🇬', region: 'Europe' 
    },
    'RO': { 
      mobile: 0.065, landline: 0.050, currency: 'USD', 
      name: 'Romania', flag: '🇷🇴', region: 'Europe' 
    },
    'GR': { 
      mobile: 0.068, landline: 0.052, currency: 'USD', 
      name: 'Greece', flag: '🇬🇷', region: 'Europe' 
    },
    'PT': { 
      mobile: 0.048, landline: 0.038, currency: 'USD', 
      name: 'Portugal', flag: '🇵🇹', region: 'Europe' 
    },
    'IE': { 
      mobile: 0.042, landline: 0.032, currency: 'USD', 
      name: 'Ireland', flag: '🇮🇪', region: 'Europe' 
    },
    'LU': { 
      mobile: 0.045, landline: 0.035, currency: 'USD', 
      name: 'Luxembourg', flag: '🇱🇺', region: 'Europe' 
    },
    'IS': { 
      mobile: 0.048, landline: 0.038, currency: 'USD', 
      name: 'Iceland', flag: '🇮🇸', region: 'Europe' 
    },
    'MT': { 
      mobile: 0.055, landline: 0.045, currency: 'USD', 
      name: 'Malta', flag: '🇲🇹', region: 'Europe' 
    },
    'CY': { 
      mobile: 0.058, landline: 0.048, currency: 'USD', 
      name: 'Cyprus', flag: '🇨🇾', region: 'Europe' 
    },
    'EE': { 
      mobile: 0.065, landline: 0.050, currency: 'USD', 
      name: 'Estonia', flag: '🇪🇪', region: 'Europe' 
    },
    'LV': { 
      mobile: 0.068, landline: 0.052, currency: 'USD', 
      name: 'Latvia', flag: '🇱🇻', region: 'Europe' 
    },
    'LT': { 
      mobile: 0.065, landline: 0.050, currency: 'USD', 
      name: 'Lithuania', flag: '🇱🇹', region: 'Europe' 
    },
    'RU': { 
      mobile: 0.110, landline: 0.085, currency: 'USD', 
      name: 'Russia', flag: '🇷🇺', region: 'Europe' 
    },
    'UA': { 
      mobile: 0.150, landline: 0.120, currency: 'USD', 
      name: 'Ukraine', flag: '🇺🇦', region: 'Europe' 
    },
    'BY': { 
      mobile: 0.180, landline: 0.150, currency: 'USD', 
      name: 'Belarus', flag: '🇧🇾', region: 'Europe' 
    },
    'MD': { 
      mobile: 0.730, landline: 0.884, currency: 'USD', 
      name: 'Moldova', flag: '🇲🇩', region: 'Europe' 
    },
    'TR': { 
      mobile: 0.078, landline: 0.060, currency: 'USD', 
      name: 'Turkey', flag: '🇹🇷', region: 'Europe' 
    },

    // Asia Pacific
    'JP': { 
      mobile: 0.065, landline: 0.050, currency: 'USD', 
      name: 'Japan', flag: '🇯🇵', region: 'Asia Pacific' 
    },
    'KR': { 
      mobile: 0.052, landline: 0.040, currency: 'USD', 
      name: 'South Korea', flag: '🇰🇷', region: 'Asia Pacific' 
    },
    'SG': { 
      mobile: 0.052, landline: 0.040, currency: 'USD', 
      name: 'Singapore', flag: '🇸🇬', region: 'Asia Pacific' 
    },
    'HK': { 
      mobile: 0.048, landline: 0.038, currency: 'USD', 
      name: 'Hong Kong', flag: '🇭🇰', region: 'Asia Pacific' 
    },
    'TW': { 
      mobile: 0.058, landline: 0.045, currency: 'USD', 
      name: 'Taiwan', flag: '🇹🇼', region: 'Asia Pacific' 
    },
    'MY': { 
      mobile: 0.078, landline: 0.060, currency: 'USD', 
      name: 'Malaysia', flag: '🇲🇾', region: 'Asia Pacific' 
    },
    'TH': { 
      mobile: 0.0240, landline: 0.0200, currency: 'USD', 
      name: 'Thailand', flag: '🇹🇭', region: 'Asia Pacific' 
    },
    'PH': { 
      mobile: 0.130, landline: 0.110, currency: 'USD', 
      name: 'Philippines', flag: '🇵🇭', region: 'Asia Pacific' 
    },
    'ID': { 
      mobile: 0.155, landline: 0.125, currency: 'USD', 
      name: 'Indonesia', flag: '🇮🇩', region: 'Asia Pacific' 
    },
    'VN': { 
      mobile: 0.118, landline: 0.095, currency: 'USD', 
      name: 'Vietnam', flag: '🇻🇳', region: 'Asia Pacific' 
    },
    'IN': { 
      mobile: 0.104, landline: 0.080, currency: 'USD', 
      name: 'India', flag: '🇮🇳', region: 'Asia Pacific' 
    },
    'PK': { 
      mobile: 0.130, landline: 0.105, currency: 'USD', 
      name: 'Pakistan', flag: '🇵🇰', region: 'Asia Pacific' 
    },
    'BD': { 
      mobile: 0.078, landline: 0.065, currency: 'USD', 
      name: 'Bangladesh', flag: '🇧🇩', region: 'Asia Pacific' 
    },
    'LK': { 
      mobile: 0.195, landline: 0.155, currency: 'USD', 
      name: 'Sri Lanka', flag: '🇱🇰', region: 'Asia Pacific' 
    },
    'NP': { 
      mobile: 0.180, landline: 0.150, currency: 'USD', 
      name: 'Nepal', flag: '🇳🇵', region: 'Asia Pacific' 
    },
    'MM': { 
      mobile: 0.350, landline: 0.280, currency: 'USD', 
      name: 'Myanmar', flag: '🇲🇲', region: 'Asia Pacific' 
    },
    'KH': { 
      mobile: 0.120, landline: 0.095, currency: 'USD', 
      name: 'Cambodia', flag: '🇰🇭', region: 'Asia Pacific' 
    },
    'LA': { 
      mobile: 0.180, landline: 0.150, currency: 'USD', 
      name: 'Laos', flag: '🇱🇦', region: 'Asia Pacific' 
    },
    'MN': { 
      mobile: 0.085, landline: 0.068, currency: 'USD', 
      name: 'Mongolia', flag: '🇲🇳', region: 'Asia Pacific' 
    },
    'BT': { 
      mobile: 0.195, landline: 0.155, currency: 'USD', 
      name: 'Bhutan', flag: '🇧🇹', region: 'Asia Pacific' 
    },
    'AU': { 
      mobile: 0.052, landline: 0.040, currency: 'USD', 
      name: 'Australia', flag: '🇦🇺', region: 'Asia Pacific' 
    },
    'NZ': { 
      mobile: 0.065, landline: 0.050, currency: 'USD', 
      name: 'New Zealand', flag: '🇳🇿', region: 'Asia Pacific' 
    },
    'FJ': { 
      mobile: 0.450, landline: 0.380, currency: 'USD', 
      name: 'Fiji', flag: '🇫🇯', region: 'Asia Pacific' 
    },
    'PG': { 
      mobile: 0.950, landline: 0.780, currency: 'USD', 
      name: 'Papua New Guinea', flag: '🇵🇬', region: 'Asia Pacific' 
    },

    // Middle East
    'IL': { 
      mobile: 0.052, landline: 0.040, currency: 'USD', 
      name: 'Israel', flag: '🇮🇱', region: 'Middle East' 
    },
    'AE': { 
      mobile: 0.065, landline: 0.050, currency: 'USD', 
      name: 'United Arab Emirates', flag: '🇦🇪', region: 'Middle East' 
    },
    'SA': { 
      mobile: 0.078, landline: 0.060, currency: 'USD', 
      name: 'Saudi Arabia', flag: '🇸🇦', region: 'Middle East' 
    },
    'QA': { 
      mobile: 0.195, landline: 0.155, currency: 'USD', 
      name: 'Qatar', flag: '🇶🇦', region: 'Middle East' 
    },
    'KW': { 
      mobile: 0.120, landline: 0.095, currency: 'USD', 
      name: 'Kuwait', flag: '🇰🇼', region: 'Middle East' 
    },
    'BH': { 
      mobile: 0.140, landline: 0.110, currency: 'USD', 
      name: 'Bahrain', flag: '🇧🇭', region: 'Middle East' 
    },
    'OM': { 
      mobile: 0.220, landline: 0.180, currency: 'USD', 
      name: 'Oman', flag: '🇴🇲', region: 'Middle East' 
    },
    'JO': { 
      mobile: 0.280, landline: 0.220, currency: 'USD', 
      name: 'Jordan', flag: '🇯🇴', region: 'Middle East' 
    },
    'LB': { 
      mobile: 0.195, landline: 0.155, currency: 'USD', 
      name: 'Lebanon', flag: '🇱🇧', region: 'Middle East' 
    },
    'SY': { 
      mobile: 0.450, landline: 0.380, currency: 'USD', 
      name: 'Syria', flag: '🇸🇾', region: 'Middle East' 
    },
    'IQ': { 
      mobile: 0.380, landline: 0.320, currency: 'USD', 
      name: 'Iraq', flag: '🇮🇶', region: 'Middle East' 
    },
    'IR': { 
      mobile: 0.280, landline: 0.220, currency: 'USD', 
      name: 'Iran', flag: '🇮🇷', region: 'Middle East' 
    },
    'AF': { 
      mobile: 0.320, landline: 0.260, currency: 'USD', 
      name: 'Afghanistan', flag: '🇦🇫', region: 'Middle East' 
    },
    'YE': { 
      mobile: 0.280, landline: 0.220, currency: 'USD', 
      name: 'Yemen', flag: '🇾🇪', region: 'Middle East' 
    },

    // Africa
    'ZA': { 
      mobile: 0.104, landline: 0.080, currency: 'USD', 
      name: 'South Africa', flag: '🇿🇦', region: 'Africa' 
    },
    'EG': { 
      mobile: 0.195, landline: 0.155, currency: 'USD', 
      name: 'Egypt', flag: '🇪🇬', region: 'Africa' 
    },
    'NG': { 
      mobile: 0.215, landline: 0.175, currency: 'USD', 
      name: 'Nigeria', flag: '🇳🇬', region: 'Africa' 
    },
    'KE': { 
      mobile: 0.182, landline: 0.150, currency: 'USD', 
      name: 'Kenya', flag: '🇰🇪', region: 'Africa' 
    },
    'GH': { 
      mobile: 0.195, landline: 0.155, currency: 'USD', 
      name: 'Ghana', flag: '🇬🇭', region: 'Africa' 
    },
    'UG': { 
      mobile: 0.320, landline: 0.260, currency: 'USD', 
      name: 'Uganda', flag: '🇺🇬', region: 'Africa' 
    },
    'TZ': { 
      mobile: 0.380, landline: 0.320, currency: 'USD', 
      name: 'Tanzania', flag: '🇹🇿', region: 'Africa' 
    },
    'RW': { 
      mobile: 0.420, landline: 0.350, currency: 'USD', 
      name: 'Rwanda', flag: '🇷🇼', region: 'Africa' 
    },
    'ET': { 
      mobile: 0.350, landline: 0.280, currency: 'USD', 
      name: 'Ethiopia', flag: '🇪🇹', region: 'Africa' 
    },
    'MA': { 
      mobile: 0.650, landline: 0.520, currency: 'USD', 
      name: 'Morocco', flag: '🇲🇦', region: 'Africa' 
    },
    'TN': { 
      mobile: 0.780, landline: 0.620, currency: 'USD', 
      name: 'Tunisia', flag: '🇹🇳', region: 'Africa' 
    },
    'DZ': { 
      mobile: 0.580, landline: 0.480, currency: 'USD', 
      name: 'Algeria', flag: '🇩🇿', region: 'Africa' 
    },
    'LY': { 
      mobile: 0.450, landline: 0.380, currency: 'USD', 
      name: 'Libya', flag: '🇱🇾', region: 'Africa' 
    },
    'SD': { 
      mobile: 0.280, landline: 0.220, currency: 'USD', 
      name: 'Sudan', flag: '🇸🇩', region: 'Africa' 
    },
    'ZW': { 
      mobile: 0.520, landline: 0.420, currency: 'USD', 
      name: 'Zimbabwe', flag: '🇿🇼', region: 'Africa' 
    },
    'ZM': { 
      mobile: 0.420, landline: 0.350, currency: 'USD', 
      name: 'Zambia', flag: '🇿🇲', region: 'Africa' 
    },
    'MW': { 
      mobile: 0.380, landline: 0.320, currency: 'USD', 
      name: 'Malawi', flag: '🇲🇼', region: 'Africa' 
    },
    'MZ': { 
      mobile: 0.320, landline: 0.260, currency: 'USD', 
      name: 'Mozambique', flag: '🇲🇿', region: 'Africa' 
    },
    'BW': { 
      mobile: 0.280, landline: 0.220, currency: 'USD', 
      name: 'Botswana', flag: '🇧🇼', region: 'Africa' 
    },
    'NA': { 
      mobile: 0.180, landline: 0.150, currency: 'USD', 
      name: 'Namibia', flag: '🇳🇦', region: 'Africa' 
    },
    'SZ': { 
      mobile: 0.220, landline: 0.180, currency: 'USD', 
      name: 'Eswatini', flag: '🇸🇿', region: 'Africa' 
    },
    'LS': { 
      mobile: 0.380, landline: 0.320, currency: 'USD', 
      name: 'Lesotho', flag: '🇱🇸', region: 'Africa' 
    },
    'MG': { 
      mobile: 0.950, landline: 0.780, currency: 'USD', 
      name: 'Madagascar', flag: '🇲🇬', region: 'Africa' 
    },
    'MU': { 
      mobile: 0.180, landline: 0.150, currency: 'USD', 
      name: 'Mauritius', flag: '🇲🇺', region: 'Africa' 
    },
    'SC': { 
      mobile: 0.650, landline: 0.520, currency: 'USD', 
      name: 'Seychelles', flag: '🇸🇨', region: 'Africa' 
    },
    'SN': { 
      mobile: 0.520, landline: 0.420, currency: 'USD', 
      name: 'Senegal', flag: '🇸🇳', region: 'Africa' 
    },
    'CI': { 
      mobile: 0.320, landline: 0.260, currency: 'USD', 
      name: 'Ivory Coast', flag: '🇨🇮', region: 'Africa' 
    },
    'ML': { 
      mobile: 0.420, landline: 0.350, currency: 'USD', 
      name: 'Mali', flag: '🇲🇱', region: 'Africa' 
    },
    'BF': { 
      mobile: 0.380, landline: 0.320, currency: 'USD', 
      name: 'Burkina Faso', flag: '🇧🇫', region: 'Africa' 
    },
    'NE': { 
      mobile: 0.520, landline: 0.420, currency: 'USD', 
      name: 'Niger', flag: '🇳🇪', region: 'Africa' 
    },
    'TD': { 
      mobile: 0.650, landline: 0.520, currency: 'USD', 
      name: 'Chad', flag: '🇹🇩', region: 'Africa' 
    },
    'CM': { 
      mobile: 0.280, landline: 0.220, currency: 'USD', 
      name: 'Cameroon', flag: '🇨🇲', region: 'Africa' 
    },
    'GA': { 
      mobile: 0.380, landline: 0.320, currency: 'USD', 
      name: 'Gabon', flag: '🇬🇦', region: 'Africa' 
    },
    'CG': { 
      mobile: 0.420, landline: 0.350, currency: 'USD', 
      name: 'Republic of the Congo', flag: '🇨🇬', region: 'Africa' 
    },
    'CD': { 
      mobile: 0.520, landline: 0.420, currency: 'USD', 
      name: 'Democratic Republic of the Congo', flag: '🇨🇩', region: 'Africa' 
    },
    'CF': { 
      mobile: 0.650, landline: 0.520, currency: 'USD', 
      name: 'Central African Republic', flag: '🇨🇫', region: 'Africa' 
    },
    'AO': { 
      mobile: 0.220, landline: 0.180, currency: 'USD', 
      name: 'Angola', flag: '🇦🇴', region: 'Africa' 
    }
  };
};

// Get call rates for different countries
router.get('/rates', async (req, res) => {
  try {
    const rates = getGlobalRates();
    res.json(rates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Initiate a call
router.post('/initiate', auth, async (req, res) => {
  try {
    const { to, from } = req.body;
    const user = await User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has sufficient balance (minimum $0.20)
    if (user.balance < 0.20) {
      return res.status(400).json({ 
        message: 'Insufficient balance. Please add credits.' 
      });
    }

    // Create a new call record
    const call = await Call.create({
      userId: req.user.userId,
      callSid: `CA${Date.now()}${Math.random().toString(36).substr(2, 9)}`, // 临时生成
      fromNumber: from || '+1234567890',
      toNumber: to,
      direction: 'outbound',
      status: 'initiated',
      rate: 0.02,
      startTime: new Date()
    });

    // In a real implementation, you would integrate with Twilio or other VoIP service
    // For demo purposes, we'll simulate the call initiation
    res.json({
      success: true,
      callId: call.id,
      message: 'Call initiated successfully',
      estimatedRate: 0.02 // USD per minute
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End a call
router.post('/end/:callId', auth, async (req, res) => {
  try {
    const call = await Call.findByPk(req.params.callId);
    
    if (!call || call.userId !== req.user.userId) {
      return res.status(404).json({ message: 'Call not found' });
    }

    const endTime = new Date();
    const duration = Math.ceil((endTime - call.startTime) / 1000); // seconds
    const cost = (duration / 60) * 0.02; // $0.02 per minute

    await call.update({
      endTime: endTime,
      duration: duration,
      cost: cost,
      status: 'completed'
    });

    // Deduct cost from user balance
    const user = await User.findByPk(req.user.userId);
    const newBalance = Math.max(0, parseFloat(user.balance) - cost);
    await user.update({
      balance: newBalance
    });

    res.json({
      success: true,
      duration: duration,
      cost: cost,
      remainingBalance: newBalance
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save call record
router.post('/', auth, async (req, res) => {
  try {
    // 🔒 最严格的用户验证 - 立即返回如果用户无效
    if (!req.user) {
      console.error('[AUTH_ERROR] req.user is null or undefined');
      return res.status(401).json({ 
        error: 'Authentication required',
        details: 'No user session found' 
      });
    }
    
    if (!req.user.userId || req.user.userId === null || req.user.userId === undefined) {
      console.error('[AUTH_ERROR] req.user.userId is invalid:', {
        userId: req.user.userId,
        userObject: req.user
      });
      return res.status(401).json({ 
        error: 'Authentication required',
        details: 'Invalid user ID in session' 
      });
    }

    console.log('[CALL_SAVE_START] Received call save request:', {
      userId: req.user.userId,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    // 🛡️ 防护性请求体解析
    const { phoneNumber, country, duration, cost, rate, status, callSid } = req.body || {};
    
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
      console.error('[VALIDATION_ERROR] Invalid phone number:', { phoneNumber, type: typeof phoneNumber });
      return res.status(400).json({ 
        error: 'Validation failed',
        details: 'Valid phone number is required' 
      });
    }

    // 🔧 超严格的类型断言和保护性解析
    const parsedDuration = Number(duration);
    const parsedCost = Number(cost);
    const parsedRate = Number(rate);
    
    const safeDuration = isNaN(parsedDuration) ? 0 : Math.max(0, Math.floor(parsedDuration));
    const safeCost = isNaN(parsedCost) ? 0 : Math.max(0, parsedCost);
    const safePhoneNumber = String(phoneNumber).trim();
    
    // 🌍 智能国家识别：优先使用自动识别，其次前端传递，最后Unknown
    let detectedCountry = getCountryFromPhoneNumber(safePhoneNumber);
    if (detectedCountry === 'Unknown' && country && String(country).trim() !== '') {
      detectedCountry = String(country).trim();
    }
    const safeCountry = detectedCountry.substring(0, 99);
    
    // 📞 根据国家获取正确的费率（默认手机费率，后续可根据号码类型优化）
    const countryRate = getRateByCountry(safeCountry, 'mobile');
    const safeRate = isNaN(parsedRate) ? countryRate : Math.max(0.001, parsedRate);
    const safeStatus = String(status || '').trim() || (safeDuration > 0 ? 'completed' : 'failed');
    
    console.log('[COUNTRY_DETECTION] Phone number country analysis:', {
      phoneNumber: safePhoneNumber,
      detectedFromNumber: getCountryFromPhoneNumber(safePhoneNumber),
      frontendProvided: country,
      finalCountry: safeCountry,
      backendCalculatedRate: countryRate,
      frontendProvidedRate: parsedRate,
      finalUsedRate: safeRate,
      rateMatch: Math.abs(countryRate - parsedRate) < 0.001 ? '✅ 匹配' : '❌ 不匹配'
    });

    // 🔒 防重复写入机制
    const callSessionKey = `${req.user.userId}_${safePhoneNumber}_${Math.floor(Date.now() / 60000)}`; // 按分钟分组
    
    // 检查是否在缓存中存在相同的通话会话
    if (callCache.has(callSessionKey)) {
      const cachedCall = callCache.get(callSessionKey);
      console.log('[DUPLICATE_PREVENTION] Found existing call session, updating instead of creating:', {
        sessionKey: callSessionKey,
        cachedCallId: cachedCall.callId,
        cachedDuration: cachedCall.duration,
        newDuration: safeDuration
      });
      
      // 更新现有记录而不是创建新记录
      try {
        const existingCall = await Call.findByPk(cachedCall.callId);
        if (existingCall) {
          const updateData = {
            duration: Math.max(existingCall.duration, safeDuration), // 取更大的时长
            cost: Math.max(existingCall.cost, safeCost), // 取更高的费用
            status: safeStatus,
            endTime: new Date()
          };
          
          await existingCall.update(updateData);
          
          // 更新缓存
          callCache.set(callSessionKey, {
            callId: existingCall.id,
            duration: updateData.duration,
            timestamp: Date.now()
          });
          
          console.log('[DUPLICATE_PREVENTION] Updated existing call record:', {
            callId: existingCall.id,
            updatedData: updateData
          });
          
          return res.json({
            success: true,
            callId: existingCall.id,
            message: 'Call record updated successfully',
            updated: true
          });
        }
      } catch (updateError) {
        console.error('[DUPLICATE_PREVENTION] Failed to update existing record:', updateError);
        // 继续创建新记录
      }
    }

    // 🔑 生成或使用提供的 callSid
    let finalCallSid;
    if (callSid && typeof callSid === 'string' && callSid.trim() !== '') {
      finalCallSid = callSid.trim();
      
      // 检查数据库中是否已存在相同的callSid
      const existingCall = await Call.findOne({ where: { callSid: finalCallSid } });
      if (existingCall) {
        console.log('[DUPLICATE_PREVENTION] CallSid already exists, updating instead of creating:', {
          callSid: finalCallSid,
          existingCallId: existingCall.id
        });
        
        const updateData = {
          duration: Math.max(existingCall.duration, safeDuration),
          cost: Math.max(existingCall.cost, safeCost),
          status: safeStatus,
          endTime: new Date(),
          // 确保使用正确的国家
          country: safeCountry
        };
        
        await existingCall.update(updateData);
        
        return res.json({
          success: true,
          callId: existingCall.id,
          message: 'Call record updated successfully',
          updated: true
        });
      }
    } else {
      // 生成新的callSid，包含更多唯一性信息
      finalCallSid = `CA${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    }
    
    console.log('[DATA_VALIDATION] Processed safe values:', {
      original: { phoneNumber, country, duration, cost, rate, status },
      safe: { safePhoneNumber, safeCountry, safeDuration, safeCost, safeRate, safeStatus },
      types: {
        duration: typeof safeDuration,
        cost: typeof safeCost,
        rate: typeof safeRate
      }
    });

    // 🔍 获取用户的默认来电显示号码
    let userCallerIdNumber = null;
    try {
      const { User, UserPhoneNumber } = require('../models');
      const user = await User.findByPk(req.user.userId, {
        include: [
          {
            model: UserPhoneNumber,
            as: 'defaultCallerIdNumber',
            attributes: ['phoneNumber'],
            required: false
          }
        ]
      });
      
      if (user && user.defaultCallerIdNumber) {
        userCallerIdNumber = user.defaultCallerIdNumber.phoneNumber;
        console.log('📞 Using user default caller ID for call record:', userCallerIdNumber);
      } else {
        console.log('📞 No default caller ID set, using system default for call record');
      }
    } catch (callerIdError) {
      console.warn('⚠️ Error getting user caller ID for call record:', callerIdError);
    }
    
    // 确定要使用的来电显示号码
    const callerIdToUse = userCallerIdNumber || process.env.TWILIO_PHONE_NUMBER || '+19156152367';
    
    // 📝 创建通话记录数据 - 使用完全验证的值
    const callData = {
      userId: req.user.userId, // 已验证不为null
      callSid: finalCallSid, // 使用生成或提供的callSid
      fromNumber: callerIdToUse, // 使用用户的默认来电显示号码或系统默认号码
      toNumber: safePhoneNumber,
      direction: 'outbound',
      status: safeStatus,
      duration: safeDuration,
      cost: safeCost,
      rate: safeRate, // 确保不为null、undefined或NaN
      country: safeCountry, // 使用智能识别的国家
      startTime: new Date(Date.now() - (safeDuration * 1000)),
      endTime: new Date(),
      // 🎛️ 确保 JSONB 字段有完整默认结构
      audioQuality: {
        mos: null,
        jitter: null,
        latency: null,
        packetLoss: null,
        audioLevel: null,
        echoCancellation: null,
        noiseSuppression: null
      },
      networkAnalysis: {
        connectionType: null,
        signalStrength: null,
        bandwidth: null,
        codecUsed: null,
        rtpStats: null
      },
      hasRecording: false,
      metadata: {
        userCallerIdNumber: userCallerIdNumber, // 存储用户的来电显示号码
        systemCallerIdUsed: !userCallerIdNumber // 标记是否使用了系统默认号码
      }
    };
    
    console.log('[CALL_DATA_PREPARED] About to save call record:', {
      ...callData,
      dataValidation: {
        userIdType: typeof callData.userId,
        rateType: typeof callData.rate,
        rateValue: callData.rate,
        durationValue: callData.duration,
        costValue: callData.cost,
        callerIdUsed: callerIdToUse,
        userHasDefaultCaller: !!userCallerIdNumber
      }
    });
    
    // 🛡️ 超强化数据库操作错误处理
    let call;
    try {
      console.log('[DB_CREATE_ATTEMPT] Starting Call.create with data types:', {
        userId: typeof callData.userId,
        rate: typeof callData.rate,
        duration: typeof callData.duration,
        cost: typeof callData.cost
      });
      
      call = await Call.create(callData);
      console.log('[DB_CREATE_SUCCESS] Call record saved successfully:', {
        id: call.id,
        callSid: call.callSid,
        userId: call.userId
      });
    } catch (dbError) {
      // 🚨 输出完整错误堆栈和上下文
      console.error('[CALL_CREATE_ERROR] Complete database error details:', {
        message: dbError.message,
        name: dbError.name,
        code: dbError.code,
        detail: dbError.detail,
        stack: dbError.stack,
        sql: dbError.sql,
        constraint: dbError.constraint,
        validationErrors: dbError.errors,
        userId: req.user?.userId,
        requestBody: req.body,
        processedData: callData,
        timestamp: new Date().toISOString()
      });
      
      // 🔍 分类处理不同类型的数据库错误
      if (dbError.name === 'SequelizeValidationError') {
        const validationDetails = dbError.errors.map(e => `Field '${e.path}': ${e.message} (value: ${e.value})`).join(', ');
        console.error('[VALIDATION_ERROR] Field validation failed:', validationDetails);
        return res.status(400).json({
          error: 'Validation failed',
          details: validationDetails,
          fields: dbError.errors.map(e => ({ field: e.path, message: e.message, value: e.value }))
        });
      }
      
      if (dbError.name === 'SequelizeUniqueConstraintError') {
        console.error('[CONSTRAINT_ERROR] Unique constraint violation:', dbError.constraint);
        return res.status(409).json({
          error: 'Duplicate record',
          details: `Constraint violation: ${dbError.constraint}`
        });
      }
      
      if (dbError.name === 'SequelizeDatabaseError') {
        console.error('[DATABASE_ERROR] Database operation error:', {
          message: dbError.message,
          sql: dbError.sql,
          constraint: dbError.constraint
        });
        return res.status(500).json({
          error: 'Database operation failed',
          details: `Database error: ${dbError.message}`
        });
      }
      
      // 其他未分类错误
      console.error('[UNKNOWN_DB_ERROR] Unclassified database error:', dbError);
      return res.status(500).json({
        error: 'Database operation failed',
        details: dbError.message,
        errorType: dbError.name
      });
    }
    
    // Verify the record was actually saved
    const verifyCall = await Call.findByPk(call.id);
    if (verifyCall) {
      console.log('🔍 Verification: Call record exists in database:', {
        id: verifyCall.id,
        callSid: verifyCall.callSid,
        toNumber: verifyCall.toNumber,
        duration: verifyCall.duration,
        cost: verifyCall.cost,
        status: verifyCall.status,
        country: verifyCall.country
      });
      
      // 💾 添加到缓存以防止重复创建
      callCache.set(callSessionKey, {
        callId: call.id,
        duration: safeDuration,
        timestamp: Date.now()
      });
      
      console.log('[CACHE_UPDATE] Added call to cache:', {
        sessionKey: callSessionKey,
        callId: call.id
      });

      // 🚀 实时推送新通话记录到前端
      console.log('📡 Broadcasting new call via WebSocket to user:', req.user.userId);
      try {
        webSocketManager.notifyNewCallRecord(req.user.userId, {
          id: call.id,
          phoneNumber: call.toNumber,
          country: call.country,
          status: call.status,
          duration: formatDuration(call.duration),
          cost: parseFloat(call.cost),
          rate: `$${call.rate}/min`,
          timestamp: formatTimestamp(call.endTime || call.startTime),
          hasRecording: false
        });
        
        console.log('✅ WebSocket broadcast sent successfully');
      } catch (wsError) {
        console.error('❌ WebSocket broadcast failed:', wsError);
        // 不阻塞主流程，WebSocket 失败不应该影响数据保存
      }
    } else {
      console.error('❌ Warning: Call record not found after creation!');
    }

    // Update user balance (subtract cost)
    console.log('📞 Updating user balance for userId:', req.user.userId);
    const user = await User.findByPk(req.user.userId);
    
    if (user) {
      const oldBalance = parseFloat(user.balance);
      const costToDeduct = safeCost; // 使用已验证的安全值
      const newBalance = Math.max(0, oldBalance - costToDeduct);
      
      console.log('💰 Balance update:', {
        userId: req.user.userId,
        oldBalance: oldBalance,
        costToDeduct: costToDeduct,
        newBalance: newBalance
      });
      
      const updateResult = await user.update({
        balance: newBalance
      });
      
      console.log('✅ Balance update result:', {
        success: true,
        updatedFields: updateResult.changed,
        newBalance: updateResult.balance
      });
      
      // Re-query to confirm update
      const updatedUser = await User.findByPk(req.user.userId);
      console.log('🔍 Verification - Updated user balance:', updatedUser.balance);
      
      return res.json({
        success: true,
        callId: call.id,
        message: 'Call record saved successfully',
        remainingBalance: parseFloat(updatedUser.balance)
      });
    } else {
      console.error('❌ User not found for balance update:', req.user.userId);
      return res.json({
        success: true,
        callId: call.id,
        message: 'Call record saved successfully'
      });
    }

  } catch (error) {
    // 🚨 最终兜底错误处理 - 输出所有可能的错误信息
    console.error('[FINAL_CATCH_ERROR] Call record save operation failed with unexpected error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
      userId: req.user?.userId,
      requestBody: req.body,
      userAgent: req.headers?.['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    });
    
    // 详细错误响应
    return res.status(500).json({ 
      error: 'Call record operation failed', 
      details: error.message,
      errorType: error.name,
      timestamp: new Date().toISOString(),
      requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });
  }
});

// Debug endpoint to check recent call records
router.get('/debug/recent', auth, async (req, res) => {
  try {
    const recentCalls = await Call.findAll({
      where: { userId: req.user.userId },
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'callSid', 'toNumber', 'duration', 'cost', 'status', 'createdAt']
    });
    
    console.log('🔍 Recent calls for user:', req.user.userId, recentCalls.length, 'records');
    
    res.json({
      success: true,
      userId: req.user.userId,
      callCount: recentCalls.length,
      calls: recentCalls
    });
  } catch (error) {
    console.error('Error fetching recent calls:', error);
    res.status(500).json({ message: 'Error fetching calls' });
  }
});

// Save call record (legacy endpoint for backward compatibility)
router.post('/save', auth, async (req, res) => {
  try {
    console.log('📞 [/save] Call record save request:', {
      userId: req.user.userId,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    const { phoneNumber, country, duration, cost, rate, status } = req.body;
    
    // 参数验证
    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid phone number is required' 
      });
    }
    
    // 数据处理
    const safeDuration = Math.max(0, parseInt(duration) || 0);
    const safeCost = Math.max(0, parseFloat(cost) || 0);
    const safeRate = Math.max(0, parseFloat(rate) || 0.02);
    const safeStatus = status || (safeDuration > 0 ? 'completed' : 'failed');
    const safeCountry = country || 'Unknown';
    
    // 生成 callSid
    const callSid = `CA${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建通话记录
    const call = await Call.create({
      userId: req.user.userId,
      callSid: callSid,
      fromNumber: '+19156152367', // 默认号码
      toNumber: phoneNumber.trim(),
      direction: 'outbound',
      status: safeStatus,
      duration: safeDuration,
      cost: safeCost,
      rate: safeRate,
      country: safeCountry,
      startTime: new Date(Date.now() - (safeDuration * 1000)),
      endTime: new Date(),
      audioQuality: {},
      networkAnalysis: {},
      hasRecording: false,
      metadata: {}
    });
    
    console.log('✅ [/save] Call record saved successfully:', {
      id: call.id,
      callSid: call.callSid,
      toNumber: call.toNumber,
      duration: call.duration,
      cost: call.cost
    });
    
    // 清除缓存
    const { invalidateCache } = require('../middleware/cache');
    invalidateCache('/api/calls/history');
    
    // WebSocket通知
    try {
      webSocketManager.notifyNewCallRecord(req.user.userId, {
        id: call.id,
        phoneNumber: call.toNumber,
        country: call.country,
        status: call.status,
        duration: formatDuration(call.duration),
        cost: parseFloat(call.cost),
        rate: `$${call.rate}/min`,
        timestamp: formatTimestamp(call.endTime),
        hasRecording: false
      });
    } catch (wsError) {
      console.warn('WebSocket notification failed:', wsError);
    }
    
    // 更新用户余额
    const user = await User.findByPk(req.user.userId);
    if (user) {
      const newBalance = Math.max(0, parseFloat(user.balance) - safeCost);
      await user.update({ balance: newBalance });
      
      return res.json({
        success: true,
        callId: call.id,
        message: 'Call record saved successfully',
        remainingBalance: newBalance
      });
    }
    
    return res.json({
      success: true,
      callId: call.id,
      message: 'Call record saved successfully'
    });
    
  } catch (error) {
    console.error('❌ [/save] Error saving call record:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to save call record' 
    });
  }
});

// Get demo dashboard data (public endpoint for testing) - DEPRECATED
// This endpoint is kept for backward compatibility but should not be used
/* 
router.get('/demo-dashboard', cacheMiddleware(300), async (req, res) => {
  try {
    // Find demo user
    const demoUser = await User.findOne({ where: { username: 'demo_user' } });
    if (!demoUser) {
      return res.status(404).json({ message: 'Demo user not found' });
    }

    // Get demo user's statistics
    const [totalCalls, totals, recentCalls] = await Promise.all([
      // Total calls
      Call.count({ where: { userId: demoUser.id } }),
      
      // Total minutes and cost
      Call.findAll({
        where: { userId: demoUser.id },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('duration')), 'totalDuration'],
          [sequelize.fn('SUM', sequelize.col('cost')), 'totalCost']
        ],
        raw: true
      }),
      
      // Recent calls (last 30 days)
      Call.count({
        where: {
          userId: demoUser.id,
          startTime: { 
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          }
        }
      })
    ]);

    const totalMinutes = Math.round((totals[0]?.totalDuration || 0) / 60);
    const totalSpent = parseFloat(totals[0]?.totalCost || 0);

    res.json({
      summary: {
        totalCalls,
        totalMinutes,
        totalSpent,
        recentCalls
      }
    });

  } catch (error) {
    console.error('Error fetching demo dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
*/

// Get demo call history (public endpoint for testing) - DEPRECATED
/*
router.get('/demo-history', cacheMiddleware(300), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    // Find demo user
    const demoUser = await User.findOne({ where: { username: 'demo_user' } });
    if (!demoUser) {
      return res.status(404).json({ message: 'Demo user not found' });
    }

    // Get demo user's call history
    const { count: total, rows: calls } = await Call.findAndCountAll({
      where: { userId: demoUser.id },
      order: [['startTime', 'DESC']],
      offset: offset,
      limit: limit,
      attributes: [
        'id', 'callSid', 'fromNumber', 'toNumber', 'direction',
        'status', 'duration', 'startTime', 'endTime', 'cost',
        'rate', 'country', 'hasRecording', 'recordingUrl'
      ]
    });

    // Format response
    const formattedCalls = calls.map(call => ({
      id: call.id,
      phoneNumber: call.direction === 'outbound' ? call.toNumber : call.fromNumber,
      country: call.country || 'Unknown',
      status: call.status,
      duration: formatDuration(call.duration),
      cost: parseFloat(call.cost || 0),
      rate: `$${call.rate || 0}/min`,
      timestamp: formatTimestamp(call.startTime),
      hasRecording: call.hasRecording || false,
      recordingUrl: call.recordingUrl
    }));

    res.json({
      calls: formattedCalls,
      pagination: {
        page,
        limit,
        total,
        hasNext: offset + calls.length < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching demo call history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
*/

// Get call history
router.get('/history', auth, cacheMiddleware(10), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Cap at 50
    const offset = (page - 1) * limit;

    // Add filtering options
    const { status, country, dateFrom, dateTo } = req.query;
    const whereClause = { 
      userId: req.user.userId,
      direction: 'outbound' // 🔧 只显示外拨通话，不显示来电记录
    };
    
    if (status) whereClause.status = status;
    if (country) whereClause.country = country;
    if (dateFrom || dateTo) {
      whereClause.startTime = {};
      if (dateFrom) whereClause.startTime[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.startTime[Op.lte] = new Date(dateTo);
    }

    const { count: total, rows: calls } = await Call.findAndCountAll({
      where: whereClause,
      order: [['startTime', 'DESC']],
      offset: offset,
      limit: limit,
      attributes: [
        'id', 'callSid', 'toNumber', 'fromNumber', 'status', 
        'duration', 'cost', 'rate', 'country', 'startTime', 'endTime'
      ], // Only select needed fields
      include: [
        {
          model: CallRecording,
          as: 'recording',
          required: false,
          attributes: ['id', 'recordingUrl', 'duration', 'status']
        }
      ]
    });

    // Set cache headers for better performance
    res.set('Cache-Control', 'private, max-age=300'); // 5 minutes

    // Format response data for frontend
    const formattedCalls = calls.map(call => ({
      id: call.id,
      phoneNumber: call.toNumber,
      country: call.country,
      status: call.status,
      duration: formatDuration(call.duration),
      cost: parseFloat(call.cost),
      rate: `$${call.rate}/min`,
      timestamp: formatTimestamp(call.startTime),
      hasRecording: !!call.recording
    }));

    res.json({
      calls: formattedCalls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions for formatting
function formatDuration(seconds) {
  if (!seconds) return '00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatTimestamp(date) {
  if (!date) return '';
  return date.toISOString();
}

// 费率计算器 - 计算通话费用（支持移动和固话费率）
router.post('/calculate', async (req, res) => {
  try {
    const { country, duration, unit = 'minutes', callType = 'mobile' } = req.body;
    
    if (!country || !duration) {
      return res.status(400).json({ 
        message: 'Country and duration are required' 
      });
    }

    // 获取费率数据
    const rates = getGlobalRates();

    const countryRate = rates[country.toUpperCase()];
    if (!countryRate) {
      return res.status(404).json({ 
        message: 'Country not found' 
      });
    }

    // 根据通话类型获取相应费率
    const rate = callType === 'landline' ? countryRate.landline : countryRate.mobile;

    // 转换时长为分钟
    let durationInMinutes = parseFloat(duration);
    if (unit === 'seconds') {
      durationInMinutes = durationInMinutes / 60;
    } else if (unit === 'hours') {
      durationInMinutes = durationInMinutes * 60;
    }

    // 计算费用（向上取整到分钟）
    const roundedMinutes = Math.ceil(durationInMinutes);
    const totalCost = roundedMinutes * rate;

    // 计算节省（如果选择固话）
    const mobileRate = countryRate.mobile;
    const landlineRate = countryRate.landline;
    const savingsPercent = ((mobileRate - landlineRate) / mobileRate * 100).toFixed(1);
    const savingsAmount = roundedMinutes * (mobileRate - landlineRate);

    // 计算各种统计信息
    const costBreakdown = {
      country: countryRate.name,
      flag: countryRate.flag,
      region: countryRate.region,
      callType: callType,
      rates: {
        mobile: mobileRate,
        landline: landlineRate,
        current: rate
      },
      currency: countryRate.currency,
      duration: {
        input: duration,
        unit: unit,
        minutes: durationInMinutes,
        billableMinutes: roundedMinutes
      },
      cost: {
        total: parseFloat(totalCost.toFixed(4)),
        perMinute: rate,
        formatted: `$${totalCost.toFixed(4)}`
      },
      savings: {
        percent: savingsPercent,
        amount: parseFloat(savingsAmount.toFixed(4)),
        formatted: `$${savingsAmount.toFixed(4)}`,
        applicable: callType === 'landline' && mobileRate > landlineRate
      },
      comparison: {
        // 与最便宜国家比较
        cheapest: rates['US'].mobile,
        difference: `${(((rate - rates['US'].mobile) / rates['US'].mobile) * 100).toFixed(1)}%`,
        // 与最贵国家比较  
        expensive: Math.max(...Object.values(rates).map(r => r.mobile)),
        discount: `${(((Math.max(...Object.values(rates).map(r => r.mobile)) - rate) / Math.max(...Object.values(rates).map(r => r.mobile)) * 100).toFixed(1))}%`
      }
    };

    res.json({
      success: true,
      calculation: costBreakdown
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 费率比较器 - 比较多个国家费率（支持移动和固话费率）
router.post('/compare', async (req, res) => {
  try {
    const { countries, duration = 10, callType = 'mobile' } = req.body; // 默认10分钟

    if (!countries || !Array.isArray(countries) || countries.length === 0) {
      return res.status(400).json({ 
        message: 'Countries array is required' 
      });
    }

    // 获取费率数据
    const rates = getGlobalRates();

    const comparisons = [];
    
    for (const country of countries) {
      const countryRate = rates[country.toUpperCase()];
      if (countryRate) {
        const rate = callType === 'landline' ? countryRate.landline : countryRate.mobile;
        const cost = duration * rate;
        const mobileRate = countryRate.mobile;
        const landlineRate = countryRate.landline;
        const savingsPercent = ((mobileRate - landlineRate) / mobileRate * 100).toFixed(1);
        
        comparisons.push({
          country: country.toUpperCase(),
          name: countryRate.name,
          flag: countryRate.flag,
          region: countryRate.region,
          callType: callType,
          rates: {
            mobile: mobileRate,
            landline: landlineRate,
            current: rate
          },
          cost: parseFloat(cost.toFixed(4)),
          formatted: `$${cost.toFixed(4)}`,
          savings: {
            percent: savingsPercent,
            amount: parseFloat((duration * (mobileRate - landlineRate)).toFixed(4)),
            applicable: mobileRate > landlineRate
          }
        });
      }
    }

    // 按费用排序
    comparisons.sort((a, b) => a.cost - b.cost);

    // 计算统计信息
    const costs = comparisons.map(c => c.cost);
    const stats = {
      cheapest: Math.min(...costs),
      expensive: Math.max(...costs),
      average: costs.reduce((a, b) => a + b, 0) / costs.length,
      duration: duration,
      callType: callType,
      totalCountries: comparisons.length
    };

    res.json({
      success: true,
      comparisons,
      stats: {
        ...stats,
        average: parseFloat(stats.average.toFixed(4)),
        cheapest: parseFloat(stats.cheapest.toFixed(4)),
        expensive: parseFloat(stats.expensive.toFixed(4))
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router; 