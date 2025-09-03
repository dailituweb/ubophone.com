const express = require('express');
const { User, Contact } = require('../models');
const auth = require('../middleware/auth');
const { sequelize } = require('../config/database');
const router = express.Router();

// 获取用户联系人列表
router.get('/', auth, async (req, res) => {
  try {
    const contacts = await Contact.findAll({
      where: { userId: req.user.userId },
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      contacts: contacts
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch contacts' 
    });
  }
});

// 添加联系人
router.post('/', auth, async (req, res) => {
  try {
    const { name, phone, email, country, company, notes } = req.body;
    
    // 验证必填字段
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }
    
    // 创建新联系人
    const contact = await Contact.create({
      userId: req.user.userId,
      name,
      phone,
      email,
      country,
      company,
      notes
    });
    
    res.status(201).json({
      success: true,
      message: 'Contact added successfully',
      contact: contact
    });
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add contact' 
    });
  }
});

// 更新联系人
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, country, company, notes } = req.body;
    
    // 验证必填字段
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }
    
    // 查找联系人并验证所有权
    const contact = await Contact.findOne({
      where: {
        id: id,
        userId: req.user.userId
      }
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    // 更新联系人
    await contact.update({
      name,
      phone,
      email,
      country,
      company,
      notes
    });
    
    res.json({
      success: true,
      message: 'Contact updated successfully',
      contact: contact
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update contact' 
    });
  }
});

// 删除联系人
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找联系人并验证所有权
    const contact = await Contact.findOne({
      where: {
        id: id,
        userId: req.user.userId
      }
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    // 删除联系人
    await contact.destroy();
    
    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete contact' 
    });
  }
});

// 更新最后通话时间
router.post('/:id/last-called', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找联系人并验证所有权
    const contact = await Contact.findOne({
      where: {
        id: id,
        userId: req.user.userId
      }
    });
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    // 更新最后通话时间
    await contact.update({
      lastCalled: new Date()
    });
    
    res.json({
      success: true,
      message: 'Last called time updated'
    });
  } catch (error) {
    console.error('Error updating last called time:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update last called time' 
    });
  }
});

module.exports = router;
