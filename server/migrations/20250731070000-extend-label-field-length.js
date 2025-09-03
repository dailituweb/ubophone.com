'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 扩展label字段长度以支持多个标签
    await queryInterface.changeColumn('user_phone_numbers', 'label', {
      type: Sequelize.STRING(200),
      allowNull: true,
      comment: '用户自定义标签，支持逗号分隔的多个标签，如"工作,个人,客服"等'
    });
  },

  async down(queryInterface, Sequelize) {
    // 回滚到原来的长度
    await queryInterface.changeColumn('user_phone_numbers', 'label', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: '用户自定义标签，如"工作"、"个人"、"客服"等'
    });
  }
};