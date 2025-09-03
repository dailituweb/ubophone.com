const countriesData = require('../data/complete-countries.json');

// Create a reverse mapping from phone code to country ISO code
const phoneCodeToCountry = {};
Object.entries(countriesData.countries).forEach(([isoCode, data]) => {
  if (data.phoneCode) {
    // Remove + from phoneCode for easier matching
    const cleanCode = data.phoneCode.replace('+', '');
    if (!phoneCodeToCountry[cleanCode]) {
      phoneCodeToCountry[cleanCode] = [];
    }
    phoneCodeToCountry[cleanCode].push(isoCode);
  }
});

// Sort phone codes by length (descending) for proper matching
const sortedPhoneCodes = Object.keys(phoneCodeToCountry).sort((a, b) => b.length - a.length);

/**
 * Extract country ISO code from a phone number
 * @param {string} phoneNumber - Phone number starting with +
 * @returns {string} - ISO country code or 'US' as default
 */
function getCountryFromPhoneNumber(phoneNumber) {
  if (!phoneNumber || !phoneNumber.startsWith('+')) {
    return 'US'; // Default to US
  }
  
  // Remove the + and any non-digit characters
  const cleanNumber = phoneNumber.substring(1).replace(/\D/g, '');
  
  // Try to match the longest phone code first
  for (const code of sortedPhoneCodes) {
    if (cleanNumber.startsWith(code)) {
      const countries = phoneCodeToCountry[code];
      // For phone codes shared by multiple countries, return the first one
      // In a production system, you might want more sophisticated logic
      return countries[0];
    }
  }
  
  return 'US'; // Default fallback
}

module.exports = {
  getCountryFromPhoneNumber,
  phoneCodeToCountry,
  countriesData
};