const https = require('https');
const fs = require('fs');
const path = require('path');

// Twilio credentials - replace with your actual credentials
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'YOUR_ACCOUNT_SID';
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'YOUR_AUTH_TOKEN';

// Function to make HTTPS requests
function makeRequest(url, auth) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

// Function to fetch all countries with pagination
async function fetchAllCountries() {
    const countries = [];
    const auth = `${ACCOUNT_SID}:${AUTH_TOKEN}`;
    let nextPageUrl = 'https://pricing.twilio.com/v1/Voice/Countries?PageSize=1000';

    try {
        while (nextPageUrl) {
            console.log(`Fetching: ${nextPageUrl}`);
            const response = await makeRequest(nextPageUrl, auth);
            
            if (response.countries) {
                countries.push(...response.countries);
                console.log(`Fetched ${response.countries.length} countries. Total: ${countries.length}`);
            }

            nextPageUrl = response.meta?.next_page_url || null;
        }

        return countries;
    } catch (error) {
        console.error('Error fetching countries:', error.message);
        throw error;
    }
}

// Function to fetch detailed pricing for a country
async function fetchCountryPricing(isoCountry) {
    const auth = `${ACCOUNT_SID}:${AUTH_TOKEN}`;
    const url = `https://pricing.twilio.com/v1/Voice/Countries/${isoCountry}`;
    
    try {
        const response = await makeRequest(url, auth);
        return response;
    } catch (error) {
        console.error(`Error fetching pricing for ${isoCountry}:`, error.message);
        return null;
    }
}

// Function to convert country data to our format
function convertToOurFormat(countries, pricingData) {
    const countryMap = {};
    const regions = {
        'North America': [],
        'South America': [],
        'Europe': [],
        'Asia Pacific': [],
        'Middle East': [],
        'Africa': [],
        'Oceania': []
    };

    // Map ISO codes to regions (simplified mapping)
    const regionMapping = {
        // North America
        'US': 'North America', 'CA': 'North America', 'MX': 'North America',
        'GT': 'North America', 'BZ': 'North America', 'SV': 'North America',
        'HN': 'North America', 'NI': 'North America', 'CR': 'North America',
        'PA': 'North America', 'DO': 'North America', 'HT': 'North America',
        'JM': 'North America', 'CU': 'North America', 'BB': 'North America',
        'TT': 'North America', 'BS': 'North America', 'AG': 'North America',
        
        // South America
        'BR': 'South America', 'AR': 'South America', 'CL': 'South America',
        'CO': 'South America', 'PE': 'South America', 'VE': 'South America',
        'EC': 'South America', 'BO': 'South America', 'PY': 'South America',
        'UY': 'South America', 'GY': 'South America', 'SR': 'South America',
        'GF': 'South America',
        
        // Europe
        'GB': 'Europe', 'DE': 'Europe', 'FR': 'Europe', 'IT': 'Europe',
        'ES': 'Europe', 'NL': 'Europe', 'BE': 'Europe', 'CH': 'Europe',
        'AT': 'Europe', 'SE': 'Europe', 'NO': 'Europe', 'DK': 'Europe',
        'FI': 'Europe', 'PL': 'Europe', 'CZ': 'Europe', 'HU': 'Europe',
        'SK': 'Europe', 'SI': 'Europe', 'HR': 'Europe', 'RS': 'Europe',
        'BG': 'Europe', 'RO': 'Europe', 'GR': 'Europe', 'PT': 'Europe',
        'IE': 'Europe', 'LU': 'Europe', 'IS': 'Europe', 'MT': 'Europe',
        'CY': 'Europe', 'EE': 'Europe', 'LV': 'Europe', 'LT': 'Europe',
        'RU': 'Europe', 'UA': 'Europe', 'BY': 'Europe', 'MD': 'Europe',
        'TR': 'Europe', 'AL': 'Europe', 'BA': 'Europe', 'MK': 'Europe',
        'ME': 'Europe', 'XK': 'Europe', 'AD': 'Europe', 'MC': 'Europe',
        'SM': 'Europe', 'VA': 'Europe', 'LI': 'Europe', 'FO': 'Europe',
        
        // Asia Pacific
        'CN': 'Asia Pacific', 'JP': 'Asia Pacific', 'KR': 'Asia Pacific',
        'IN': 'Asia Pacific', 'ID': 'Asia Pacific', 'TH': 'Asia Pacific',
        'VN': 'Asia Pacific', 'PH': 'Asia Pacific', 'MY': 'Asia Pacific',
        'SG': 'Asia Pacific', 'TW': 'Asia Pacific', 'HK': 'Asia Pacific',
        'MO': 'Asia Pacific', 'KH': 'Asia Pacific', 'LA': 'Asia Pacific',
        'MM': 'Asia Pacific', 'BD': 'Asia Pacific', 'LK': 'Asia Pacific',
        'NP': 'Asia Pacific', 'BT': 'Asia Pacific', 'MN': 'Asia Pacific',
        'KZ': 'Asia Pacific', 'KG': 'Asia Pacific', 'TJ': 'Asia Pacific',
        'UZ': 'Asia Pacific', 'TM': 'Asia Pacific', 'AF': 'Asia Pacific',
        'PK': 'Asia Pacific', 'AU': 'Asia Pacific', 'NZ': 'Asia Pacific',
        'FJ': 'Asia Pacific', 'PG': 'Asia Pacific', 'SB': 'Asia Pacific',
        'VU': 'Asia Pacific', 'NC': 'Asia Pacific', 'PF': 'Asia Pacific',
        
        // Middle East
        'SA': 'Middle East', 'AE': 'Middle East', 'QA': 'Middle East',
        'KW': 'Middle East', 'BH': 'Middle East', 'OM': 'Middle East',
        'YE': 'Middle East', 'JO': 'Middle East', 'LB': 'Middle East',
        'SY': 'Middle East', 'IQ': 'Middle East', 'IR': 'Middle East',
        'IL': 'Middle East', 'PS': 'Middle East',
        
        // Africa
        'EG': 'Africa', 'LY': 'Africa', 'SD': 'Africa', 'MA': 'Africa',
        'DZ': 'Africa', 'TN': 'Africa', 'NG': 'Africa', 'GH': 'Africa',
        'CI': 'Africa', 'SN': 'Africa', 'ML': 'Africa', 'BF': 'Africa',
        'NE': 'Africa', 'TD': 'Africa', 'CM': 'Africa', 'CF': 'Africa',
        'GA': 'Africa', 'CG': 'Africa', 'CD': 'Africa', 'AO': 'Africa',
        'ZA': 'Africa', 'NA': 'Africa', 'BW': 'Africa', 'ZW': 'Africa',
        'ZM': 'Africa', 'MW': 'Africa', 'MZ': 'Africa', 'SZ': 'Africa',
        'LS': 'Africa', 'KE': 'Africa', 'UG': 'Africa', 'TZ': 'Africa',
        'RW': 'Africa', 'BI': 'Africa', 'ET': 'Africa', 'ER': 'Africa',
        'DJ': 'Africa', 'SO': 'Africa', 'MG': 'Africa', 'MU': 'Africa',
        'SC': 'Africa', 'KM': 'Africa', 'CV': 'Africa', 'GW': 'Africa',
        'GN': 'Africa', 'SL': 'Africa', 'LR': 'Africa', 'GM': 'Africa'
    };

    countries.forEach(country => {
        const isoCode = country.iso_country;
        const pricing = pricingData[isoCode];
        
        if (!pricing) return;

        // Get the first outbound prefix (phone code)
        const phoneCode = pricing.outbound_prefix_prices?.[0]?.destination_prefixes?.[0] || '+1';
        
        // Get rates - use first available rate or default
        const outboundRate = pricing.outbound_prefix_prices?.[0]?.current_price || 0.05;
        
        // Estimate mobile and landline rates (mobile typically 20% higher)
        const landlineRate = outboundRate;
        const mobileRate = outboundRate * 1.2;

        // Determine region
        const region = regionMapping[isoCode] || 'Asia Pacific';

        countryMap[isoCode] = {
            name: country.country,
            flag: getCountryFlag(isoCode),
            phoneCode: phoneCode,
            rates: {
                mobile: mobileRate,
                landline: landlineRate
            }
        };

        regions[region].push(isoCode);
    });

    return { countryMap, regions };
}

// Function to get country flag emoji
function getCountryFlag(isoCode) {
    // Convert ISO code to flag emoji
    const codePoints = isoCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    
    return String.fromCodePoint(...codePoints);
}

// Main execution function
async function main() {
    try {
        console.log('Starting Twilio country data fetch...');
        
        // Check if credentials are provided
        if (ACCOUNT_SID === 'YOUR_ACCOUNT_SID' || AUTH_TOKEN === 'YOUR_AUTH_TOKEN') {
            console.error('Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables');
            process.exit(1);
        }

        // Fetch all countries
        console.log('Fetching countries list...');
        const countries = await fetchAllCountries();
        console.log(`Found ${countries.length} countries`);

        // Fetch detailed pricing for each country (in batches to avoid rate limits)
        console.log('Fetching detailed pricing data...');
        const pricingData = {};
        const batchSize = 10;
        
        for (let i = 0; i < countries.length; i += batchSize) {
            const batch = countries.slice(i, i + batchSize);
            const promises = batch.map(country => 
                fetchCountryPricing(country.iso_country)
                    .then(data => ({ iso: country.iso_country, data }))
            );
            
            const results = await Promise.all(promises);
            results.forEach(result => {
                if (result.data) {
                    pricingData[result.iso] = result.data;
                }
            });
            
            console.log(`Processed ${Math.min(i + batchSize, countries.length)}/${countries.length} countries`);
            
            // Add delay to avoid rate limits
            if (i + batchSize < countries.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Convert to our format
        console.log('Converting to application format...');
        const { countryMap, regions } = convertToOurFormat(countries, pricingData);

        // Save the data
        const outputDir = path.join(__dirname, '..', 'server', 'data');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const countryDataPath = path.join(outputDir, 'twilio-countries.json');
        const countryData = {
            countries: countryMap,
            regions: regions,
            metadata: {
                totalCountries: Object.keys(countryMap).length,
                fetchedAt: new Date().toISOString(),
                source: 'Twilio Pricing API'
            }
        };

        fs.writeFileSync(countryDataPath, JSON.stringify(countryData, null, 2));
        console.log(`Saved ${Object.keys(countryMap).length} countries to ${countryDataPath}`);

        // Generate country options for frontend
        const frontendCountries = Object.entries(countryMap)
            .map(([isoCode, data]) => ({
                code: data.phoneCode,
                flag: data.flag,
                name: data.name
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        const frontendPath = path.join(__dirname, '..', 'client', 'src', 'utils', 'countryOptions-complete.js');
        const frontendContent = `// Auto-generated from Twilio API on ${new Date().toISOString()}
// Total countries: ${frontendCountries.length}

export const COUNTRY_OPTIONS = ${JSON.stringify(frontendCountries, null, 2)};

// Helper function to detect country code from phone number
export const detectCountryFromPhone = (phoneNumber) => {
  if (!phoneNumber || !phoneNumber.startsWith('+')) {
    return null;
  }

  // Sort by code length (descending) to match longer codes first
  const sortedOptions = [...COUNTRY_OPTIONS].sort((a, b) => b.code.length - a.code.length);
  
  // Find the first matching country code
  const matchedCountry = sortedOptions.find(country => phoneNumber.startsWith(country.code));
  
  if (matchedCountry) {
    const cleanNumber = phoneNumber.substring(matchedCountry.code.length).replace(/[^\\d]/g, '');
    return {
      country: matchedCountry,
      cleanNumber: cleanNumber,
      countryCode: matchedCountry.code
    };
  }

  return null;
};
`;

        fs.writeFileSync(frontendPath, frontendContent);
        console.log(`Generated frontend country options with ${frontendCountries.length} countries`);

        console.log('\\n✅ Success! Country data has been fetched and saved.');
        console.log(`📊 Total countries supported: ${Object.keys(countryMap).length}`);
        console.log(`📁 Backend data: ${countryDataPath}`);
        console.log(`📁 Frontend data: ${frontendPath}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main, fetchAllCountries, fetchCountryPricing };