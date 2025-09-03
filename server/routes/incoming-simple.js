const express = require('express');
const router = express.Router();

// 简化版的来电处理 - 用于测试
router.post('/webhook/voice-simple', (req, res) => {
  console.log('📞 Simple voice webhook triggered');
  console.log('📞 Request:', req.body);
  
  // 立即设置响应头
  res.set('Content-Type', 'text/xml; charset=utf-8');
  
  // 返回最简单的响应
  const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling. Please wait while we connect you to an agent.</Say>
  <Play loop="5">http://com.twilio.sounds.music.s3.amazonaws.com/WeAreInControl.mp3</Play>
  <Say>We are sorry, all agents are busy. Please try again later.</Say>
</Response>`;
  
  return res.status(200).send(response);
});

module.exports = router;