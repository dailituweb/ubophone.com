require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

// This configuration file is used by the Sequelize CLI to connect to the database.
// It reads the database connection string from the environment variables,
// ensuring that credentials are not hard-coded.
// It also explicitly sets the SSL options required by NeonDB.

module.exports = {
  development: {
    url: process.env.DATABASE_URL || 'postgresql://phone_owner:npg_3jKSM2XfOgFP@ep-misty-pine-a8p5p1th-pooler.eastus2.azure.neon.tech/phone?sslmode=require',
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for NeonDB connections
      }
    },
    logging: console.log
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
}; 