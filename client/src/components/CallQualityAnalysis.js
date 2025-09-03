import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  BarChart3, 
  Activity, 
  Signal, 
  Zap, 
  Volume2, 
  Wifi,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AnalysisContainer = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h3 {
    color: #FFC900;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const OverallScore = styled.div`
  text-align: center;
  padding: 1rem;
  border-radius: 1rem;
  ${props => {
    if (props.score >= 8) {
      return 'background: #FFC900; border: 3px solid #000000;';
    } else if (props.score >= 6) {
      return 'background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.3);';
    } else if (props.score >= 4) {
      return 'background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.3);';
    } else {
      return 'background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3);';
    }
  }}
`;

const ScoreNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  ${props => {
    if (props.score >= 8) return 'color: #0a0f2f;';
    if (props.score >= 6) return 'color: #3b82f6;';
    if (props.score >= 4) return 'color: #f59e0b;';
    return 'color: #ef4444;';
  }}
`;

const ScoreLabel = styled.div`
  color: #9ca3af;
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.25rem;
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const MetricTitle = styled.h4`
  color: #ffffff;
  margin: 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  ${props => {
    if (props.status === 'good') return 'color: #FFC900;';
    if (props.status === 'warning') return 'color: #f59e0b;';
    if (props.status === 'poor') return 'color: #ef4444;';
    return 'color: #ffffff;';
  }}
`;

const MetricSubtext = styled.div`
  color: #9ca3af;
  font-size: 0.85rem;
  margin-top: 0.25rem;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  
  ${props => {
    if (props.status === 'good') return 'color: #FFC900;';
    if (props.status === 'warning') return 'color: #f59e0b;';
    if (props.status === 'poor') return 'color: #ef4444;';
    return 'color: #9ca3af;';
  }}
`;

const ChartContainer = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ChartTitle = styled.h4`
  color: #ffffff;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button`
  padding: 0.5rem 1rem;
  border: 3px solid #000000;
  border-radius: 0;
  background: ${props => props.active ? '#FFC900' : '#ffffff'};
  color: ${props => props.active ? '#0a0f2f' : '#9ca3af'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  &:hover {
    background: #FFC900;
    color: #0a0f2f;
  }
`;

const InsightCard = styled.div`
  background: #ffffff;
  border-left: 4px solid #FFC900;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 0;
`;

const InsightTitle = styled.h5`
  color: #FFC900;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InsightText = styled.p`
  color: #e2e8f0;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
`;

function CallQualityAnalysis({ callData, recordingData, realTime = false }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [qualityBreakdown, setQualityBreakdown] = useState([]);

  useEffect(() => {
    // Generate mock time-series data for quality metrics
    const generateTimeSeriesData = () => {
      const duration = callData?.duration || 120; // seconds
      const points = Math.min(duration, 60); // max 60 data points
      
      return Array.from({ length: points }, (_, i) => {
        const time = (i / points) * duration;
        return {
          time: Math.floor(time),
          mos: 3.5 + Math.sin(i * 0.1) * 0.8 + Math.random() * 0.4,
          jitter: 5 + Math.sin(i * 0.2) * 3 + Math.random() * 2,
          latency: 80 + Math.sin(i * 0.15) * 20 + Math.random() * 10,
          packetLoss: Math.max(0, 0.5 + Math.sin(i * 0.3) * 0.3 + Math.random() * 0.2),
          audioLevel: 60 + Math.sin(i * 0.25) * 15 + Math.random() * 10
        };
      });
    };

    setTimeSeriesData(generateTimeSeriesData());

    // Quality breakdown for pie chart
    setQualityBreakdown([
      { name: 'Excellent', value: 45, color: '#FFC900' },
      { name: 'Good', value: 30, color: '#3b82f6' },
      { name: 'Fair', value: 15, color: '#f59e0b' },
      { name: 'Poor', value: 10, color: '#ef4444' }
    ]);
  }, [callData]);

  const getStatusIndicator = (value, thresholds) => {
    if (value >= thresholds.good) return { status: 'good', icon: CheckCircle };
    if (value >= thresholds.warning) return { status: 'warning', icon: AlertTriangle };
    return { status: 'poor', icon: AlertTriangle };
  };

  const audioQuality = callData?.audioQuality || {};
  const networkAnalysis = callData?.networkAnalysis || {};
  
  const mosScore = audioQuality.mos || 4.2;
  const jitter = audioQuality.jitter || 8;
  const latency = audioQuality.latency || 95;
  const packetLoss = audioQuality.packetLoss || 0.3;
  const audioLevel = audioQuality.audioLevel || 65;

  const mosStatus = getStatusIndicator(mosScore, { good: 4.0, warning: 3.0 });
  const jitterStatus = getStatusIndicator(15 - jitter, { good: 10, warning: 5 }); // Inverted scale
  const latencyStatus = getStatusIndicator(200 - latency, { good: 100, warning: 50 }); // Inverted scale
  const packetLossStatus = getStatusIndicator(2 - packetLoss, { good: 1.5, warning: 1.0 }); // Inverted scale

  const overallScore = Math.round((mosScore + (15 - jitter) / 3 + (200 - latency) / 25 + (2 - packetLoss) * 2) / 4 * 2);

  const renderOverviewTab = () => (
    <>
      <MetricsGrid>
        <MetricCard>
          <MetricHeader>
            <MetricTitle>
              <Volume2 size={16} />
              Mean Opinion Score (MOS)
            </MetricTitle>
            <StatusIndicator status={mosStatus.status}>
              <mosStatus.icon size={14} />
              {mosStatus.status}
            </StatusIndicator>
          </MetricHeader>
          <MetricValue status={mosStatus.status}>{mosScore.toFixed(1)}</MetricValue>
          <MetricSubtext>Out of 5.0 (Industry Standard)</MetricSubtext>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricTitle>
              <Activity size={16} />
              Network Jitter
            </MetricTitle>
            <StatusIndicator status={jitterStatus.status}>
              <jitterStatus.icon size={14} />
              {jitterStatus.status}
            </StatusIndicator>
          </MetricHeader>
          <MetricValue status={jitterStatus.status}>{jitter.toFixed(1)} ms</MetricValue>
          <MetricSubtext>Lower is better (&lt; 10ms ideal)</MetricSubtext>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricTitle>
              <Clock size={16} />
              Round Trip Latency
            </MetricTitle>
            <StatusIndicator status={latencyStatus.status}>
              <latencyStatus.icon size={14} />
              {latencyStatus.status}
            </StatusIndicator>
          </MetricHeader>
          <MetricValue status={latencyStatus.status}>{latency.toFixed(0)} ms</MetricValue>
          <MetricSubtext>Lower is better (&lt; 100ms ideal)</MetricSubtext>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricTitle>
              <Signal size={16} />
              Packet Loss
            </MetricTitle>
            <StatusIndicator status={packetLossStatus.status}>
              <packetLossStatus.icon size={14} />
              {packetLossStatus.status}
            </StatusIndicator>
          </MetricHeader>
          <MetricValue status={packetLossStatus.status}>{packetLoss.toFixed(2)}%</MetricValue>
          <MetricSubtext>Lower is better (&lt; 1% ideal)</MetricSubtext>
        </MetricCard>
      </MetricsGrid>

      <ChartContainer>
        <ChartTitle>
          <TrendingUp size={16} />
          Call Quality Over Time
        </ChartTitle>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '3px solid #000000',
                borderRadius: '0',
                color: '#000000'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="mos" 
              stroke="#FFC900" 
              strokeWidth={2}
              dot={{ fill: '#FFC900', strokeWidth: 0, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </>
  );

  const renderNetworkTab = () => (
    <>
      <MetricsGrid>
        <MetricCard>
          <MetricHeader>
            <MetricTitle>
              <Wifi size={16} />
              Connection Type
            </MetricTitle>
          </MetricHeader>
          <MetricValue>{networkAnalysis.connectionType || 'WiFi'}</MetricValue>
          <MetricSubtext>Network Interface Used</MetricSubtext>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricTitle>
              <Signal size={16} />
              Signal Strength
            </MetricTitle>
          </MetricHeader>
          <MetricValue status="good">{networkAnalysis.signalStrength || '85'}%</MetricValue>
          <MetricSubtext>Connection Quality</MetricSubtext>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricTitle>
              <Zap size={16} />
              Bandwidth
            </MetricTitle>
          </MetricHeader>
          <MetricValue>{networkAnalysis.bandwidth || '1.2'} Mbps</MetricValue>
          <MetricSubtext>Available for Voice</MetricSubtext>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricTitle>
              <BarChart3 size={16} />
              Codec Used
            </MetricTitle>
          </MetricHeader>
          <MetricValue>{networkAnalysis.codecUsed || 'OPUS'}</MetricValue>
          <MetricSubtext>Audio Compression</MetricSubtext>
        </MetricCard>
      </MetricsGrid>

      <ChartContainer>
        <ChartTitle>
          <Activity size={16} />
          Network Performance Metrics
        </ChartTitle>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '3px solid #000000',
                borderRadius: '0',
                color: '#000000'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="jitter" 
              stackId="1"
              stroke="#3b82f6" 
              fill="rgba(59, 130, 246, 0.3)"
            />
            <Area 
              type="monotone" 
              dataKey="packetLoss" 
              stackId="2"
              stroke="#ef4444" 
              fill="rgba(239, 68, 68, 0.3)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </>
  );

  const renderAudioTab = () => (
    <>
      <MetricsGrid>
        <MetricCard>
          <MetricHeader>
            <MetricTitle>
              <Volume2 size={16} />
              Audio Level
            </MetricTitle>
          </MetricHeader>
          <MetricValue status="good">{audioLevel.toFixed(0)} dB</MetricValue>
          <MetricSubtext>Average Signal Strength</MetricSubtext>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricTitle>
              <CheckCircle size={16} />
              Echo Cancellation
            </MetricTitle>
          </MetricHeader>
          <MetricValue status="good">{audioQuality.echoCancellation ? 'Enabled' : 'Disabled'}</MetricValue>
          <MetricSubtext>Echo Suppression Status</MetricSubtext>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricTitle>
              <Volume2 size={16} />
              Noise Suppression
            </MetricTitle>
          </MetricHeader>
          <MetricValue status="good">{audioQuality.noiseSuppression ? 'Active' : 'Inactive'}</MetricValue>
          <MetricSubtext>Background Noise Filtering</MetricSubtext>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <MetricTitle>
              <BarChart3 size={16} />
              Quality Distribution
            </MetricTitle>
          </MetricHeader>
          <ResponsiveContainer width="100%" height={80}>
            <PieChart>
              <Pie
                data={qualityBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={35}
                dataKey="value"
              >
                {qualityBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </MetricCard>
      </MetricsGrid>

      <ChartContainer>
        <ChartTitle>
          <Volume2 size={16} />
          Audio Level Timeline
        </ChartTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={timeSeriesData.slice(0, 20)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#000000" />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff', 
                border: '3px solid #000000',
                borderRadius: '0',
                color: '#000000'
              }}
            />
            <Bar dataKey="audioLevel" fill="#FFC900" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </>
  );

  const renderInsights = () => (
    <>
      <InsightCard>
        <InsightTitle>
          <CheckCircle size={16} />
          Quality Assessment
        </InsightTitle>
        <InsightText>
          This call achieved an excellent quality score of {overallScore}/10. The Mean Opinion Score of {mosScore.toFixed(1)} 
          indicates high audio quality with minimal distortion or degradation.
        </InsightText>
      </InsightCard>

      {jitter > 10 && (
        <InsightCard>
          <InsightTitle>
            <AlertTriangle size={16} />
            Network Recommendation
          </InsightTitle>
          <InsightText>
            Network jitter of {jitter.toFixed(1)}ms is above optimal levels. Consider using a wired connection or 
            switching to a less congested WiFi channel for better call quality.
          </InsightText>
        </InsightCard>
      )}

      {packetLoss > 1 && (
        <InsightCard>
          <InsightTitle>
            <AlertTriangle size={16} />
            Packet Loss Detected
          </InsightTitle>
          <InsightText>
            Packet loss of {packetLoss.toFixed(2)}% may cause audio dropouts. Check your network connection 
            and consider reducing bandwidth usage from other applications.
          </InsightText>
        </InsightCard>
      )}

      <InsightCard>
        <InsightTitle>
          <Info size={16} />
          Technical Details
        </InsightTitle>
        <InsightText>
          Call used {networkAnalysis.codecUsed || 'OPUS'} codec with {networkAnalysis.connectionType || 'WiFi'} connection. 
          Echo cancellation and noise suppression were active throughout the call.
        </InsightText>
      </InsightCard>
    </>
  );

  return (
    <AnalysisContainer>
      <Header>
        <h3>
          <BarChart3 size={20} />
          Call Quality Analysis
        </h3>
        <OverallScore score={overallScore}>
          <ScoreNumber score={overallScore}>{overallScore}</ScoreNumber>
          <ScoreLabel>Overall Score</ScoreLabel>
        </OverallScore>
      </Header>

      <TabContainer>
        <Tab 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </Tab>
        <Tab 
          active={activeTab === 'network'} 
          onClick={() => setActiveTab('network')}
        >
          Network
        </Tab>
        <Tab 
          active={activeTab === 'audio'} 
          onClick={() => setActiveTab('audio')}
        >
          Audio
        </Tab>
        <Tab 
          active={activeTab === 'insights'} 
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </Tab>
      </TabContainer>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'network' && renderNetworkTab()}
      {activeTab === 'audio' && renderAudioTab()}
      {activeTab === 'insights' && renderInsights()}
    </AnalysisContainer>
  );
}

export default CallQualityAnalysis; 