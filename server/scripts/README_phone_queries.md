# Phone Number Database Query Scripts

This directory contains scripts to safely query the database for phone number information without making any changes.

## Available Scripts

### 1. checkPhoneNumber.js
- **Purpose**: Specifically checks the database for phone number +16318955550
- **Usage**: `node checkPhoneNumber.js`
- **Description**: Hardcoded to search for the specific number +16318955550 and provides comprehensive information

### 2. queryPhoneNumber.js
- **Purpose**: General-purpose phone number query script
- **Usage**: `node queryPhoneNumber.js [phone_number]`
- **Example**: `node queryPhoneNumber.js +16318955550`
- **Description**: Flexible script that accepts any phone number as a command-line argument

### 3. check_phone_number.sql
- **Purpose**: Direct SQL queries for PostgreSQL client
- **Usage**: Run in psql, pgAdmin, or any PostgreSQL client
- **Description**: Raw SQL queries that can be executed directly in a database client

## What These Scripts Check

1. **user_phone_numbers table**: 
   - Phone number ownership
   - User details (username, email, balance)
   - Phone number type (dedicated, shared, trial)
   - Status (active, inactive, expired, suspended)
   - Twilio SID and capabilities
   - Purchase and expiry dates
   - Monthly fees
   - Default caller ID settings
   - Location information
   - Forwarding and voicemail settings
   - Usage statistics

2. **calls table**:
   - All calls involving the phone number (inbound and outbound)
   - Call details (duration, cost, status)
   - Associated users
   - Call timestamps

3. **incoming_calls table**:
   - Incoming call records
   - Call handling information
   - Recording and voicemail status
   - Spam/blocking flags

4. **Default caller ID check**:
   - Whether the number is set as default caller ID for any user

5. **contacts table**:
   - Any contacts saved with this phone number

6. **Database statistics**:
   - Total counts of users, phone numbers, calls
   - Recent activity overview

## Database Connection

All scripts use the database connection configured in:
- `/Users/ivanall/Documents/new/qwe/server/config/database.js`

The connection uses:
- **Database**: PostgreSQL on Neon
- **Connection string**: Configured with SSL required
- **ORM**: Sequelize

## Running the Scripts

### Prerequisites
- Node.js installed
- Navigate to the server directory: `cd /Users/ivanall/Documents/new/qwe/server`

### Run the specific check for +16318955550:
```bash
node scripts/checkPhoneNumber.js
```

### Run a general query for any phone number:
```bash
node scripts/queryPhoneNumber.js +16318955550
node scripts/queryPhoneNumber.js +1234567890
node scripts/queryPhoneNumber.js 1234567890
```

### Run SQL directly (if you have psql access):
```bash
psql [connection_string] -f scripts/check_phone_number.sql
```

## Database Schema Overview

### Key Tables:
- **users**: User account information
- **user_phone_numbers**: Phone numbers purchased/assigned to users
- **calls**: All call records (inbound/outbound)
- **incoming_calls**: Detailed incoming call tracking
- **contacts**: User's contact lists

### Important Fields:
- **phoneNumber**: Stored in E.164 format (e.g., +16318955550)
- **userId**: UUID linking to users table
- **status**: Current status of phone number or call
- **type**: Type of phone number (dedicated, shared, trial)

## Safety Features

- **Read-only**: All scripts only query the database, no modifications
- **No authentication bypass**: Uses existing database connection
- **Comprehensive logging**: Detailed output for debugging
- **Error handling**: Graceful error handling and reporting
- **Multiple format support**: Searches for phone numbers in various formats

## Current Status for +16318955550

Based on the most recent query:
- ✅ **Found in database**: Yes
- **Owner**: dailituweb (dailituweb@gmail.com)
- **Status**: Active
- **Type**: Dedicated
- **Location**: Long Island, NY (US)
- **Twilio SID**: PNb8b5d407d531b4bdf93cfead299060a8
- **Default Caller ID**: Yes
- **Recent activity**: 3 calls found (1 outbound, 2 inbound)
- **User balance**: $58.4023

## Troubleshooting

If you encounter errors:
1. Check database connection in `/Users/ivanall/Documents/new/qwe/server/config/database.js`
2. Ensure you're in the correct directory (`/Users/ivanall/Documents/new/qwe/server`)
3. Verify Node.js and npm dependencies are installed
4. Check that the database is accessible

## Security Note

These scripts contain database connection information and should only be used by authorized personnel. Never share or commit these scripts to public repositories without removing sensitive information.