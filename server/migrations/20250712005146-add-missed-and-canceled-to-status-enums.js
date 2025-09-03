'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 为 calls 表的 status enum 添加 'missed' 和 'canceled'
    await queryInterface.sequelize.query("ALTER TYPE \"enum_calls_status\" ADD VALUE IF NOT EXISTS 'missed';");
    await queryInterface.sequelize.query("ALTER TYPE \"enum_calls_status\" ADD VALUE IF NOT EXISTS 'canceled';");

    // 为 incoming_calls 表的 status enum 添加 'missed' 和 'canceled'
    await queryInterface.sequelize.query("ALTER TYPE \"enum_incoming_calls_status\" ADD VALUE IF NOT EXISTS 'missed';");
    await queryInterface.sequelize.query("ALTER TYPE \"enum_incoming_calls_status\" ADD VALUE IF NOT EXISTS 'canceled';");
  },

  async down (queryInterface, Sequelize) {
    // Reverting ADD VALUE is complex and can be destructive.
    // Usually, it's safer to not support reverting this kind of migration.
    // If you must, you would need to create a new enum and replace the column type.
    console.log("Reverting this migration is not supported.");
  }
};
