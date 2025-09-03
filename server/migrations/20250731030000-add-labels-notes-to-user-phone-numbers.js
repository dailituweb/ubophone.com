'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_phone_numbers', 'label', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: '用户自定义标签，如"工作"、"个人"、"客服"等'
    });

    await queryInterface.addColumn('user_phone_numbers', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: '用户添加的备注信息'
    });

    // 为新字段添加索引以提高查询性能
    await queryInterface.addIndex('user_phone_numbers', ['label'], {
      name: 'user_phone_numbers_label_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('user_phone_numbers', 'user_phone_numbers_label_idx');
    await queryInterface.removeColumn('user_phone_numbers', 'notes');
    await queryInterface.removeColumn('user_phone_numbers', 'label');
  }
};