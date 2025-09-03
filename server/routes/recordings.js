const express = require('express');
const router = express.Router();
const { CallRecording, Call, User } = require('../models');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// 获取用户的录音列表
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { userId: req.user.userId };
    
    if (status) {
      whereClause.status = status;
    }
    
    const recordings = await CallRecording.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Call,
          as: 'call',
          attributes: ['fromNumber', 'toNumber', 'direction', 'startTime', 'duration'],
          where: search ? {
            [require('sequelize').Op.or]: [
              { fromNumber: { [require('sequelize').Op.iLike]: `%${search}%` } },
              { toNumber: { [require('sequelize').Op.iLike]: `%${search}%` } }
            ]
          } : {}
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      recordings: recordings.rows,
      total: recordings.count,
      totalPages: Math.ceil(recordings.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recordings'
    });
  }
});

// 获取单个录音详情
router.get('/:id', auth, async (req, res) => {
  try {
    const recording = await CallRecording.findOne({
      where: {
        id: req.params.id,
        userId: req.user.userId
      },
      include: [
        {
          model: Call,
          as: 'call',
          attributes: ['fromNumber', 'toNumber', 'direction', 'startTime', 'endTime', 'duration', 'cost']
        }
      ]
    });
    
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }
    
    res.json({
      success: true,
      recording
    });
  } catch (error) {
    console.error('Error fetching recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recording'
    });
  }
});

// 生成录音下载链接
router.post('/:id/download', auth, async (req, res) => {
  try {
    const recording = await CallRecording.findOne({
      where: {
        id: req.params.id,
        userId: req.user.userId,
        status: 'completed'
      }
    });
    
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found or not ready'
      });
    }
    
    // 生成带签名的下载URL
    const expires = Math.floor(Date.now() / 1000) + 3600; // 1小时有效
    const signature = crypto
      .createHmac('sha256', process.env.RECORDING_SECRET || 'default-secret')
      .update(`${recording.id}:${expires}`)
      .digest('hex');
    
    const downloadUrl = `${req.protocol}://${req.get('host')}/api/recordings/${recording.id}/file?expires=${expires}&signature=${signature}`;
    
    // 更新下载统计
    await recording.increment('downloadCount');
    await recording.update({ lastDownloaded: new Date() });
    
    res.json({
      success: true,
      downloadUrl,
      expiresAt: new Date(expires * 1000)
    });
  } catch (error) {
    console.error('Error generating download link:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate download link'
    });
  }
});

// 下载录音文件
router.get('/:id/file', async (req, res) => {
  try {
    const { expires, signature } = req.query;
    
    if (!expires || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid download link'
      });
    }
    
    // 验证签名
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > parseInt(expires)) {
      return res.status(410).json({
        success: false,
        message: 'Download link expired'
      });
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RECORDING_SECRET || 'default-secret')
      .update(`${req.params.id}:${expires}`)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return res.status(403).json({
        success: false,
        message: 'Invalid signature'
      });
    }
    
    const recording = await CallRecording.findByPk(req.params.id);
    if (!recording || recording.status !== 'completed') {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }
    
    // 重定向到Twilio录音URL
    res.redirect(recording.recordingUrl);
  } catch (error) {
    console.error('Error downloading recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download recording'
    });
  }
});

// 删除录音
router.delete('/:id', auth, async (req, res) => {
  try {
    const recording = await CallRecording.findOne({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }
    
    // 标记为已删除而不是物理删除
    await recording.update({ status: 'deleted' });
    
    res.json({
      success: true,
      message: 'Recording deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recording'
    });
  }
});

// Twilio录音状态回调处理
router.post('/webhook/status', async (req, res) => {
  try {
    const { RecordingSid, RecordingUrl, RecordingStatus, CallSid, RecordingDuration } = req.body;
    
    console.log('Recording webhook received:', {
      RecordingSid,
      RecordingStatus,
      CallSid,
      RecordingDuration
    });
    
    // 查找对应的通话记录
    const call = await Call.findOne({ where: { callSid: CallSid } });
    if (!call) {
      console.log('Call not found for recording webhook:', CallSid);
      return res.status(200).send('OK');
    }
    
    // 更新或创建录音记录
    const [recording, created] = await CallRecording.findOrCreate({
      where: { recordingSid: RecordingSid },
      defaults: {
        callId: call.id,
        userId: call.userId,
        recordingSid: RecordingSid,
        recordingUrl: RecordingUrl,
        duration: parseInt(RecordingDuration) || 0,
        status: RecordingStatus === 'completed' ? 'completed' : 'processing'
      }
    });
    
    if (!created) {
      await recording.update({
        recordingUrl: RecordingUrl,
        duration: parseInt(RecordingDuration) || recording.duration,
        status: RecordingStatus === 'completed' ? 'completed' : 
                RecordingStatus === 'failed' ? 'failed' : 'processing'
      });
    }
    
    console.log(`Recording ${created ? 'created' : 'updated'}:`, recording.id);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing recording webhook:', error);
    res.status(500).send('Error');
  }
});

// 获取录音统计
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = { userId: req.user.userId };
    if (startDate && endDate) {
      whereClause.createdAt = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const stats = await CallRecording.findAll({
      where: whereClause,
      attributes: [
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalRecordings'],
        [require('sequelize').fn('SUM', require('sequelize').col('duration')), 'totalDuration'],
        [require('sequelize').fn('SUM', require('sequelize').col('fileSize')), 'totalSize'],
        [require('sequelize').fn('SUM', require('sequelize').col('downloadCount')), 'totalDownloads']
      ],
      raw: true
    });
    
    const statusBreakdown = await CallRecording.findAll({
      where: whereClause,
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    res.json({
      success: true,
      stats: stats[0],
      statusBreakdown
    });
  } catch (error) {
    console.error('Error fetching recording stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recording stats'
    });
  }
});

// 更新播放统计
router.post('/:id/stats', auth, async (req, res) => {
  try {
    const { action } = req.body; // 'play', 'pause', 'complete'
    
    const recording = await CallRecording.findOne({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }
    
    if (action === 'play') {
      await recording.increment('playCount');
      await recording.update({ lastPlayed: new Date() });
    }
    
    res.json({
      success: true,
      message: 'Stats updated'
    });
  } catch (error) {
    console.error('Error updating playback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stats'
    });
  }
});

// 获取音频波形数据
router.get('/:id/waveform', auth, async (req, res) => {
  try {
    const recording = await CallRecording.findOne({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });
    
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }
    
    // In a real application, you would generate or retrieve the actual waveform data
    // For demo purposes, we'll generate mock waveform data
    const duration = recording.duration || 60;
    const samples = Math.min(duration * 2, 200); // 2 samples per second, max 200
    
    const waveformData = Array.from({ length: samples }, (_, i) => 
      Math.sin(i * 0.1) * 0.5 + Math.random() * 0.3 + 0.2
    );
    
    res.json({
      success: true,
      waveform: waveformData,
      duration: duration,
      sampleRate: samples / duration
    });
  } catch (error) {
    console.error('Error generating waveform:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate waveform'
    });
  }
});

// 分析录音质量
router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const recording = await CallRecording.findOne({
      where: {
        id: req.params.id,
        userId: req.user.userId
      },
      include: [
        {
          model: Call,
          as: 'call'
        }
      ]
    });
    
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found'
      });
    }
    
    // In a real application, this would use actual audio analysis
    // For demo purposes, we'll generate mock analysis data
    const analysisData = {
      audioAnalysis: {
        waveform: Array.from({ length: 100 }, (_, i) => 
          Math.sin(i * 0.1) * 0.5 + Math.random() * 0.3 + 0.2
        ),
        peaks: Array.from({ length: 20 }, (_, i) => ({
          time: i * (recording.duration / 20),
          amplitude: Math.random() * 0.8 + 0.2
        })),
        frequency: {
          low: 85 + Math.random() * 20,
          mid: 65 + Math.random() * 30,
          high: 45 + Math.random() * 25
        },
        volume: Array.from({ length: 50 }, (_, i) => 
          60 + Math.sin(i * 0.2) * 15 + Math.random() * 10
        ),
        silenceDetection: Array.from({ length: 5 }, (_, i) => ({
          start: i * 30 + Math.random() * 10,
          duration: 2 + Math.random() * 3
        })),
        speechToText: "This is a demo transcription of the call recording.",
        sentiment: {
          overall: 'positive',
          confidence: 0.85,
          emotions: {
            positive: 0.7,
            neutral: 0.2,
            negative: 0.1
          }
        },
        keywords: ['call', 'quality', 'service', 'support', 'demo'],
        speakerDiarization: [
          { speaker: 'Speaker 1', segments: [{ start: 0, end: 30 }, { start: 60, end: 90 }] },
          { speaker: 'Speaker 2', segments: [{ start: 30, end: 60 }, { start: 90, end: 120 }] }
        ]
      },
      qualityMetrics: {
        clarity: 7.5 + Math.random() * 2,
        backgroundNoise: Math.random() > 0.5 ? 'Low' : 'Medium',
        speechQuality: 7 + Math.random() * 2.5,
        audioDistortion: Math.random() * 0.3,
        recordingQuality: 7 + Math.random() * 2.5
      }
    };
    
    // Update the recording with analysis data
    await recording.update({
      audioAnalysis: analysisData.audioAnalysis,
      qualityMetrics: analysisData.qualityMetrics
    });
    
    res.json({
      success: true,
      analysis: analysisData
    });
  } catch (error) {
    console.error('Error analyzing recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze recording'
    });
  }
});

// 获取质量分析报告
router.get('/quality/report', auth, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const whereClause = { userId: req.user.userId };
    if (startDate && endDate) {
      whereClause.createdAt = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const recordings = await CallRecording.findAll({
      where: whereClause,
      include: [
        {
          model: Call,
          as: 'call',
          attributes: ['fromNumber', 'toNumber', 'direction', 'duration', 'audioQuality', 'networkAnalysis']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Generate quality report
    const report = {
      summary: {
        totalRecordings: recordings.length,
        averageQuality: recordings.reduce((sum, r) => sum + (r.qualityMetrics?.recordingQuality || 5), 0) / recordings.length,
        totalDuration: recordings.reduce((sum, r) => sum + r.duration, 0),
        qualityDistribution: {
          excellent: recordings.filter(r => (r.qualityMetrics?.recordingQuality || 5) >= 8).length,
          good: recordings.filter(r => {
            const q = r.qualityMetrics?.recordingQuality || 5;
            return q >= 6 && q < 8;
          }).length,
          fair: recordings.filter(r => {
            const q = r.qualityMetrics?.recordingQuality || 5;
            return q >= 4 && q < 6;
          }).length,
          poor: recordings.filter(r => (r.qualityMetrics?.recordingQuality || 5) < 4).length
        }
      },
      trends: {
        qualityOverTime: recordings.slice(0, 30).map(r => ({
          date: r.createdAt,
          quality: r.qualityMetrics?.recordingQuality || 5,
          duration: r.duration
        })),
        commonIssues: [
          { issue: 'Background Noise', frequency: Math.floor(Math.random() * 20) + 5 },
          { issue: 'Low Audio Level', frequency: Math.floor(Math.random() * 15) + 3 },
          { issue: 'Network Jitter', frequency: Math.floor(Math.random() * 10) + 2 }
        ]
      },
      recommendations: [
        'Use a headset to reduce background noise',
        'Ensure stable internet connection for better quality',
        'Consider upgrading audio hardware for clearer recordings'
      ]
    };
    
    if (format === 'pdf') {
      // In a real application, you would generate a PDF report here
      return res.status(501).json({
        success: false,
        message: 'PDF export not implemented yet'
      });
    }
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating quality report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quality report'
    });
  }
});

module.exports = router; 