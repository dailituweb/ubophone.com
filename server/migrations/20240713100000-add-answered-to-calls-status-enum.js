'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Adds the 'answered' value to the enum_calls_status type in PostgreSQL.
    // Using "ADD VALUE IF NOT EXISTS" makes the migration safe to re-run.
    await queryInterface.sequelize.query("ALTER TYPE public.enum_calls_status ADD VALUE IF NOT EXISTS 'answered';");
    console.log('✅ Added "answered" to enum_calls_status type.');
  },

  async down (queryInterface, Sequelize) {
    // Removing a value from an ENUM in PostgreSQL is a complex and
    // potentially destructive operation, especially if the value is in use.
    // It's safer to handle this manually if a rollback is truly needed.
    // Therefore, this down migration does nothing.
    console.log('🔄 Down migration for adding enum value is not automatically supported. Manual rollback required if necessary.');
    return Promise.resolve();
  }
}; 