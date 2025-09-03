// 根据电话号码获取地理位置信息
function getPhoneNumberLocation(phoneNumber) {
  // 移除所有非数字字符
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // 提取区号（北美地区）
  if (cleanNumber.startsWith('1') && cleanNumber.length === 11) {
    const areaCode = cleanNumber.substring(1, 4);
    return getLocationByAreaCode(areaCode);
  }
  
  // 默认返回
  return {
    locality: 'Unknown',
    region: 'United States',
    isoCountry: 'US'
  };
}

// 根据区号获取地理位置
function getLocationByAreaCode(areaCode) {
  const areaCodeMap = {
    // 纽约地区
    '212': { locality: 'New York', region: 'NY', isoCountry: 'US' },
    '646': { locality: 'New York', region: 'NY', isoCountry: 'US' },
    '917': { locality: 'New York', region: 'NY', isoCountry: 'US' },
    '718': { locality: 'Brooklyn', region: 'NY', isoCountry: 'US' },
    
    // 加州地区
    '415': { locality: 'San Francisco', region: 'CA', isoCountry: 'US' },
    '510': { locality: 'Oakland', region: 'CA', isoCountry: 'US' },
    '650': { locality: 'Palo Alto', region: 'CA', isoCountry: 'US' },
    '925': { locality: 'Walnut Creek', region: 'CA', isoCountry: 'US' },
    '408': { locality: 'San Jose', region: 'CA', isoCountry: 'US' },
    '669': { locality: 'San Jose', region: 'CA', isoCountry: 'US' },
    '213': { locality: 'Los Angeles', region: 'CA', isoCountry: 'US' },
    '323': { locality: 'Los Angeles', region: 'CA', isoCountry: 'US' },
    '424': { locality: 'Los Angeles', region: 'CA', isoCountry: 'US' },
    '310': { locality: 'Beverly Hills', region: 'CA', isoCountry: 'US' },
    '818': { locality: 'San Fernando Valley', region: 'CA', isoCountry: 'US' },
    '619': { locality: 'San Diego', region: 'CA', isoCountry: 'US' },
    '858': { locality: 'San Diego', region: 'CA', isoCountry: 'US' },
    
    // 佛罗里达州
    '305': { locality: 'Miami', region: 'FL', isoCountry: 'US' },
    '786': { locality: 'Miami', region: 'FL', isoCountry: 'US' },
    '954': { locality: 'Fort Lauderdale', region: 'FL', isoCountry: 'US' },
    '561': { locality: 'West Palm Beach', region: 'FL', isoCountry: 'US' },
    '407': { locality: 'Orlando', region: 'FL', isoCountry: 'US' },
    '321': { locality: 'Orlando', region: 'FL', isoCountry: 'US' },
    '813': { locality: 'Tampa', region: 'FL', isoCountry: 'US' },
    '727': { locality: 'St. Petersburg', region: 'FL', isoCountry: 'US' },
    '904': { locality: 'Jacksonville', region: 'FL', isoCountry: 'US' },
    
    // 德州
    '214': { locality: 'Dallas', region: 'TX', isoCountry: 'US' },
    '469': { locality: 'Dallas', region: 'TX', isoCountry: 'US' },
    '972': { locality: 'Dallas', region: 'TX', isoCountry: 'US' },
    '713': { locality: 'Houston', region: 'TX', isoCountry: 'US' },
    '281': { locality: 'Houston', region: 'TX', isoCountry: 'US' },
    '832': { locality: 'Houston', region: 'TX', isoCountry: 'US' },
    '210': { locality: 'San Antonio', region: 'TX', isoCountry: 'US' },
    '726': { locality: 'San Antonio', region: 'TX', isoCountry: 'US' },
    '512': { locality: 'Austin', region: 'TX', isoCountry: 'US' },
    '737': { locality: 'Austin', region: 'TX', isoCountry: 'US' },
    
    // 伊利诺伊州
    '312': { locality: 'Chicago', region: 'IL', isoCountry: 'US' },
    '773': { locality: 'Chicago', region: 'IL', isoCountry: 'US' },
    '872': { locality: 'Chicago', region: 'IL', isoCountry: 'US' },
    '630': { locality: 'Aurora', region: 'IL', isoCountry: 'US' },
    
    // 华盛顿州
    '206': { locality: 'Seattle', region: 'WA', isoCountry: 'US' },
    '253': { locality: 'Tacoma', region: 'WA', isoCountry: 'US' },
    '425': { locality: 'Bellevue', region: 'WA', isoCountry: 'US' },
    
    // 马萨诸塞州
    '617': { locality: 'Boston', region: 'MA', isoCountry: 'US' },
    '857': { locality: 'Boston', region: 'MA', isoCountry: 'US' },
    '508': { locality: 'Worcester', region: 'MA', isoCountry: 'US' },
    
    // 佐治亚州
    '404': { locality: 'Atlanta', region: 'GA', isoCountry: 'US' },
    '770': { locality: 'Atlanta', region: 'GA', isoCountry: 'US' },
    '678': { locality: 'Atlanta', region: 'GA', isoCountry: 'US' },
    
    // 宾夕法尼亚州
    '215': { locality: 'Philadelphia', region: 'PA', isoCountry: 'US' },
    '267': { locality: 'Philadelphia', region: 'PA', isoCountry: 'US' },
    '412': { locality: 'Pittsburgh', region: 'PA', isoCountry: 'US' },
    
    // 加拿大主要城市
    '416': { locality: 'Toronto', region: 'ON', isoCountry: 'CA' },
    '647': { locality: 'Toronto', region: 'ON', isoCountry: 'CA' },
    '437': { locality: 'Toronto', region: 'ON', isoCountry: 'CA' },
    '604': { locality: 'Vancouver', region: 'BC', isoCountry: 'CA' },
    '778': { locality: 'Vancouver', region: 'BC', isoCountry: 'CA' },
    '236': { locality: 'Vancouver', region: 'BC', isoCountry: 'CA' },
    '514': { locality: 'Montreal', region: 'QC', isoCountry: 'CA' },
    '438': { locality: 'Montreal', region: 'QC', isoCountry: 'CA' },
    '403': { locality: 'Calgary', region: 'AB', isoCountry: 'CA' },
    '587': { locality: 'Calgary', region: 'AB', isoCountry: 'CA' },
    '780': { locality: 'Edmonton', region: 'AB', isoCountry: 'CA' },
    '825': { locality: 'Edmonton', region: 'AB', isoCountry: 'CA' },
    
    // 默认区号（示例中使用的）
    '555': { locality: 'Various', region: 'US', isoCountry: 'US' },
    '631': { locality: 'Long Island', region: 'NY', isoCountry: 'US' }
  };
  
  return areaCodeMap[areaCode] || {
    locality: 'Various',
    region: 'United States',
    isoCountry: 'US'
  };
}

module.exports = {
  getPhoneNumberLocation,
  getLocationByAreaCode
};