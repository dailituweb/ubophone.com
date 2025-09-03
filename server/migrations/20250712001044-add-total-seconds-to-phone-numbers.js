'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_phone_numbers', 'totalIncomingSeconds', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('user_phone_numbers', 'totalAnsweredCalls', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_phone_numbers', 'totalIncomingSeconds');
    await queryInterface.removeColumn('user_phone_numbers', 'totalAnsweredCalls');
  }
};
