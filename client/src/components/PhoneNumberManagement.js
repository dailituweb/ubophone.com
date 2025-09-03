import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Plus, 
  DollarSign,
  PhoneCall,
  MessageSquare,
  Clock,
  RefreshCw,
  Eye,
  Settings,
  PhoneForwarded,
  Monitor,
  Tag,
  Edit3,
  Save,
  X,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Container = styled.div`
  min-height: 100vh;
  background: #FAFAFA;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: #0a0f2f;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: ${props => props.primary ? '#FFC900' : 'white'};
  color: #0a0f2f;
  border: 3px solid #000;
  border-radius: 0;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NumbersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NumberCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 0 #000;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 #000;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
`;

const PhoneIcon = styled.div`
  width: 60px;
  height: 60px;
  background: #FFC900;
  border: 3px solid #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
  }
`;

const NumberInfo = styled.div`
  flex: 1;
`;

const NumberDisplay = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.25rem;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const NumberLabel = styled.div`
  font-size: 0.875rem;
  color: #666;
  font-weight: 600;
`;

const MiddleSection = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-top: 2px solid #f0f0f0;
  border-bottom: 2px solid #f0f0f0;
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
  
  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const InfoBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  color: #999;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  font-size: 1.125rem;
  font-weight: 800;
  color: #0a0f2f;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const InfoIcon = styled.div`
  color: #FFC900;
  margin-bottom: 0.25rem;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

const StatusBadge = styled.div`
  padding: 0.5rem 1rem;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 800;
  text-transform: uppercase;
  background: ${props => {
    switch (props.status) {
      case 'active': return '#10b981';
      case 'inactive': return '#ef4444';
      case 'trial': return '#f59e0b';
      default: return '#6b7280';
    }
  }};
  color: white;
  border: 2px solid #000;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  color: #0a0f2f;
  border: 2px solid #000;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.danger ? '#ef4444' : '#FFC900'};
    color: ${props => props.danger ? 'white' : '#0a0f2f'};
    transform: translateY(-1px);
  }
  
  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
  }
`;

const CallerIdButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.isDefault ? '#10b981' : '#6b7280'};
  color: white;
  border: 2px solid #000;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.isDefault ? '#059669' : '#4b5563'};
    transform: translateY(-1px);
  }
  
  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
  }
`;

const IncomingCallSection = styled.div`
  padding: 1.5rem 0;
  border-top: 2px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
`;

const CallHandlingOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${props => props.selected ? '#FFF8DC' : 'white'};
  border: 2px solid ${props => props.selected ? '#FFC900' : '#e5e5e5'};
  border-radius: 0;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #FFC900;
    background: #FFF8DC;
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem;
    gap: 0.75rem;
  }
`;

const RadioInput = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #FFC900;
  cursor: pointer;
`;

const RadioContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const RadioTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: #0a0f2f;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

const RadioDescription = styled.div`
  font-size: 0.875rem;
  color: #666;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const ForwardingInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e5e5;
  border-radius: 0;
  font-size: 1rem;
  margin-top: 0.5rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #FFC900;
    background: #FFF8DC;
  }
  
  @media (max-width: 768px) {
    padding: 0.625rem;
    font-size: 0.875rem;
  }
`;

const UpdateButton = styled.button`
  align-self: flex-start;
  padding: 0.75rem 1.5rem;
  background: #FFC900;
  color: #0a0f2f;
  border: 2px solid #000;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 1px 1px 0 #000;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

// 标签和备注功能的样式组件
const LabelSection = styled.div`
  padding: 1.5rem 0;
  border-top: 2px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const LabelSectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
`;

const LabelRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
  }
`;

const LabelField = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const LabelFieldTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #0a0f2f;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LabelInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e5e5;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #FFC900;
    background: #FFF8DC;
  }

  &::placeholder {
    color: #999;
  }
  
  @media (max-width: 768px) {
    padding: 0.625rem;
    font-size: 0.8rem;
  }
`;

const NotesTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e5e5;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background: white;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #FFC900;
    background: #FFF8DC;
  }

  &::placeholder {
    color: #999;
  }
  
  @media (max-width: 768px) {
    padding: 0.625rem;
    font-size: 0.8rem;
    min-height: 60px;
  }
`;

const LabelDisplay = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #FFC900;
  color: #0a0f2f;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
`;

const LabelsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
`;

const NotesDisplay = styled.div`
  background: #f8f8f8;
  border: 2px solid #e5e5e5;
  border-radius: 0;
  padding: 0.75rem;
  font-size: 0.875rem;
  color: #666;
  line-height: 1.4;
  font-style: italic;
  margin-top: 0.5rem;
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  color: #0a0f2f;
  border: 2px solid #000;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-start;

  &:hover {
    background: #f5f5f5;
    transform: translate(-1px, -1px);
    box-shadow: 1px 1px 0 #000;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #FFC900;
  color: #0a0f2f;
  border: 2px solid #000;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover {
    transform: translate(-1px, -1px);
    box-shadow: 1px 1px 0 #000;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;


const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #666;
  font-size: 1.125rem;
  gap: 1rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  box-shadow: 0 4px 0 #000;
`;

function PhoneNumberManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [defaultCallerId, setDefaultCallerId] = useState(null);
  
  // 🔧 来电处理设置状态
  const [callHandlingSettings, setCallHandlingSettings] = useState({});
  const [updatingSettings, setUpdatingSettings] = useState({});
  
  // 🏷️ 标签和备注功能状态
  const [editingLabels, setEditingLabels] = useState({}); // 跟踪哪个号码正在编辑
  const [labelInputs, setLabelInputs] = useState({}); // 临时输入值
  const [savingLabels, setSavingLabels] = useState({}); // 保存状态

  const fetchPhoneNumbers = React.useCallback(async () => {
    if (!user?.token) return;
    
    try {
      const response = await fetch('/api/phone-numbers', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPhoneNumbers(data.phoneNumbers || []);
        setDefaultCallerId(data.defaultCallerId || null);
        
        // 🔧 初始化来电处理设置
        const initialSettings = {};
        const initialLabelInputs = {};
        (data.phoneNumbers || []).forEach(number => {
          initialSettings[number.id] = {
            mode: number.forwardingEnabled ? 'forward' : 'browser',
            forwardingNumber: number.forwardingNumber || ''
          };
          
          // 🏷️ 初始化标签和备注输入值
          initialLabelInputs[number.id] = {
            label: number.label || '',
            notes: number.notes || ''
          };
        });
        setCallHandlingSettings(initialSettings);
        setLabelInputs(initialLabelInputs);
      } else {
        toast.error('Failed to fetch phone numbers');
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast.error('Error loading phone numbers');
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  const handleToggleDefaultCallerId = async (phoneNumberId, isCurrentlyDefault) => {
    if (!user?.token) return;

    // 🚀 乐观更新：立即更新UI状态
    const newCallerId = isCurrentlyDefault ? null : phoneNumberId;
    const previousCallerId = defaultCallerId; // 保存之前的状态用于回滚
    
    setDefaultCallerId(newCallerId);

    try {
      const response = await fetch('/api/phone-numbers/default-caller-id', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumberId: isCurrentlyDefault ? null : phoneNumberId
        })
      });

      if (response.ok) {
        const data = await response.json();
        // ✅ API成功，确认UI状态与服务器同步
        setDefaultCallerId(data.defaultCallerId);
        toast.success(isCurrentlyDefault ? 'Default caller ID removed' : 'Default caller ID set');
      } else {
        // ❌ API失败，回滚UI状态
        setDefaultCallerId(previousCallerId);
        toast.error('Failed to update default caller ID');
      }
    } catch (error) {
      console.error('Error updating default caller ID:', error);
      // ❌ 网络错误，回滚UI状态
      setDefaultCallerId(previousCallerId);
      toast.error('Error updating caller ID setting');
    }
  };

  // 🔧 处理来电设置变更
  const handleCallHandlingChange = (phoneNumberId, field, value) => {
    setCallHandlingSettings(prev => ({
      ...prev,
      [phoneNumberId]: {
        ...prev[phoneNumberId],
        [field]: value
      }
    }));
  };

  // 🔧 更新来电处理设置
  const handleUpdateCallHandling = async (phoneNumberId) => {
    if (!user?.token) return;
    
    const settings = callHandlingSettings[phoneNumberId];
    if (!settings) return;

    // 验证转发号码
    if (settings.mode === 'forward' && !settings.forwardingNumber.trim()) {
      toast.error('Please enter a forwarding number');
      return;
    }

    setUpdatingSettings(prev => ({ ...prev, [phoneNumberId]: true }));

    try {
      const response = await fetch(`/api/phone-numbers/${phoneNumberId}/incoming-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          incomingCallMode: settings.mode,
          forwardingEnabled: settings.mode === 'forward',
          forwardingNumber: settings.mode === 'forward' ? settings.forwardingNumber.trim() : null
        })
      });

      if (response.ok) {
        toast.success('Incoming call settings updated');
        // 重新获取号码列表以更新显示
        fetchPhoneNumbers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating call handling settings:', error);
      toast.error('Error updating settings');
    } finally {
      setUpdatingSettings(prev => ({ ...prev, [phoneNumberId]: false }));
    }
  };

  // 🏷️ 解析标签字符串为数组
  const parseLabels = (labelString) => {
    if (!labelString || typeof labelString !== 'string') return [];
    return labelString
      .split(',')
      .map(label => label.trim())
      .filter(label => label.length > 0);
  };

  // 🏷️ 标签和备注处理函数
  const handleEditLabels = (phoneNumberId) => {
    setEditingLabels(prev => ({ ...prev, [phoneNumberId]: true }));
  };

  const handleCancelEditLabels = (phoneNumberId) => {
    setEditingLabels(prev => ({ ...prev, [phoneNumberId]: false }));
    // 重置输入值到原始值
    const originalNumber = phoneNumbers.find(n => n.id === phoneNumberId);
    if (originalNumber) {
      setLabelInputs(prev => ({
        ...prev,
        [phoneNumberId]: {
          label: originalNumber.label || '',
          notes: originalNumber.notes || ''
        }
      }));
    }
  };

  const handleLabelInputChange = (phoneNumberId, field, value) => {
    setLabelInputs(prev => ({
      ...prev,
      [phoneNumberId]: {
        ...prev[phoneNumberId],
        [field]: value
      }
    }));
  };

  const handleSaveLabels = async (phoneNumberId) => {
    if (!user?.token) return;
    
    const inputs = labelInputs[phoneNumberId];
    if (!inputs) return;

    setSavingLabels(prev => ({ ...prev, [phoneNumberId]: true }));

    try {
      const response = await fetch(`/api/phone-numbers/${phoneNumberId}/labels`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          label: inputs.label.trim() || null,
          notes: inputs.notes.trim() || null
        })
      });

      if (response.ok) {
        toast.success('Labels and notes updated successfully');
        setEditingLabels(prev => ({ ...prev, [phoneNumberId]: false }));
        // 重新获取号码列表以更新显示
        fetchPhoneNumbers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update labels');
      }
    } catch (error) {
      console.error('Error updating labels:', error);
      toast.error('Error updating labels and notes');
    } finally {
      setSavingLabels(prev => ({ ...prev, [phoneNumberId]: false }));
    }
  };

  useEffect(() => {
    if (user) {
      fetchPhoneNumbers();
    }
  }, [user, fetchPhoneNumbers]);





  const openPurchaseModal = () => {
    navigate('/buy-phone-number');
  };

  if (!user) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Please login to manage phone numbers</h2>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>
          <RefreshCw className="animate-spin" size={24} />
          <span style={{ marginLeft: '0.5rem' }}>Loading phone numbers...</span>
        </LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>My Phone Numbers</Title>
        <Button primary onClick={openPurchaseModal}>
          <Plus size={20} />
          Buy New Number
        </Button>
      </Header>

      {phoneNumbers.length === 0 ? (
        <EmptyState>
          <Phone size={64} color="#FFC900" />
          <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#0a0f2f' }}>No Phone Numbers Yet</h3>
          <p style={{ color: '#666' }}>Get started by purchasing your first dedicated phone number.</p>
          <Button primary onClick={openPurchaseModal} style={{ marginTop: '1.5rem' }}>
            <Plus size={20} />
            Buy Your First Number
          </Button>
        </EmptyState>
      ) : (
        <NumbersList>
          {phoneNumbers.map((number) => (
            <NumberCard key={number.id}>
              <CardContent>
                <TopSection>
                  <LeftSection>
                    <PhoneIcon>
                      <Phone size={28} color="#0a0f2f" />
                    </PhoneIcon>
                    <NumberInfo>
                      <NumberDisplay>{number.phoneNumber}</NumberDisplay>
                      <NumberLabel>
                        {number.locality && number.region 
                          ? `${number.locality}, ${number.region}` 
                          : number.callerIdName || number.type}
                      </NumberLabel>
                    </NumberInfo>
                  </LeftSection>
                  <StatusBadge status={number.status}>
                    {number.status}
                  </StatusBadge>
                </TopSection>

                <MiddleSection>
                  <InfoBox>
                    <InfoIcon>
                      <DollarSign size={20} />
                    </InfoIcon>
                    <InfoLabel>Monthly</InfoLabel>
                    <InfoValue>${number.monthlyFee}</InfoValue>
                  </InfoBox>
                  <InfoBox>
                    <InfoIcon>
                      <PhoneCall size={20} />
                    </InfoIcon>
                    <InfoLabel>Incoming</InfoLabel>
                    <InfoValue>{number.statistics.totalIncomingCalls || 0}</InfoValue>
                  </InfoBox>
                  <InfoBox>
                    <InfoIcon>
                      <Clock size={20} />
                    </InfoIcon>
                    <InfoLabel>Minutes</InfoLabel>
                    <InfoValue>{number.statistics.totalIncomingMinutes || 0}</InfoValue>
                  </InfoBox>
                  <InfoBox>
                    <InfoIcon>
                      <MessageSquare size={20} />
                    </InfoIcon>
                    <InfoLabel>Voicemail</InfoLabel>
                    <InfoValue>{number.settings.voicemailEnabled ? 'ON' : 'OFF'}</InfoValue>
                  </InfoBox>
                </MiddleSection>

                <RightSection>
                  <CallerIdButton
                    isDefault={number.isDefaultCallerId || defaultCallerId === number.id}
                    onClick={() => handleToggleDefaultCallerId(number.id, number.isDefaultCallerId || defaultCallerId === number.id)}
                  >
                    {(number.isDefaultCallerId || defaultCallerId === number.id) ? 'Default Caller ID' : 'Set as Default'}
                  </CallerIdButton>
                  <ActionButton 
                    onClick={() => navigate(`/incoming-calls?phoneNumberId=${number.id}`)}
                  >
                    <Eye size={16} />
                    History
                  </ActionButton>
                </RightSection>

                {/* 🔧 来电处理设置区域 */}
                <IncomingCallSection>
                  <SectionTitle>
                    <Settings size={20} />
                    Incoming Call Handling
                  </SectionTitle>
                  
                  <CallHandlingOptions>
                    <RadioOption 
                      selected={callHandlingSettings[number.id]?.mode === 'forward'}
                      onClick={() => handleCallHandlingChange(number.id, 'mode', 'forward')}
                    >
                      <RadioInput
                        type="radio"
                        name={`callHandling_${number.id}`}
                        value="forward"
                        checked={callHandlingSettings[number.id]?.mode === 'forward'}
                        onChange={() => handleCallHandlingChange(number.id, 'mode', 'forward')}
                      />
                      <RadioContent>
                        <RadioTitle>
                          <PhoneForwarded size={18} />
                          Forward to Phone
                        </RadioTitle>
                        <RadioDescription>
                          Automatically forward incoming calls to your mobile phone
                        </RadioDescription>
                        {callHandlingSettings[number.id]?.mode === 'forward' && (
                          <ForwardingInput
                            type="tel"
                            placeholder="Enter phone number (e.g., +1234567890)"
                            value={callHandlingSettings[number.id]?.forwardingNumber || ''}
                            onChange={(e) => handleCallHandlingChange(number.id, 'forwardingNumber', e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateCallHandling(number.id);
                              }
                            }}
                          />
                        )}
                      </RadioContent>
                    </RadioOption>

                    <RadioOption 
                      selected={callHandlingSettings[number.id]?.mode === 'browser'}
                      onClick={() => handleCallHandlingChange(number.id, 'mode', 'browser')}
                    >
                      <RadioInput
                        type="radio"
                        name={`callHandling_${number.id}`}
                        value="browser"
                        checked={callHandlingSettings[number.id]?.mode === 'browser'}
                        onChange={() => handleCallHandlingChange(number.id, 'mode', 'browser')}
                      />
                      <RadioContent>
                        <RadioTitle>
                          <Monitor size={18} />
                          Browser Pickup
                        </RadioTitle>
                        <RadioDescription>
                          Answer calls directly in your browser with notifications
                        </RadioDescription>
                      </RadioContent>
                    </RadioOption>
                  </CallHandlingOptions>

                  <UpdateButton 
                    onClick={() => handleUpdateCallHandling(number.id)}
                    disabled={updatingSettings[number.id]}
                  >
                    {updatingSettings[number.id] ? 'Updating...' : 'Update Settings'}
                  </UpdateButton>
                </IncomingCallSection>

                {/* 🏷️ 标签和备注功能区域 */}
                <LabelSection>
                  <LabelSectionTitle>
                    <Tag size={20} />
                    Labels & Notes
                  </LabelSectionTitle>
                  
                  {editingLabels[number.id] ? (
                    // 编辑模式
                    <>
                      <LabelRow>
                        <LabelField>
                          <LabelFieldTitle>
                            <Tag size={16} />
                            Label
                          </LabelFieldTitle>
                          <LabelInput
                            type="text"
                            placeholder="e.g., Work, Personal, Support (separate multiple labels with commas)"
                            value={labelInputs[number.id]?.label || ''}
                            onChange={(e) => handleLabelInputChange(number.id, 'label', e.target.value)}
                            maxLength={200}
                          />
                        </LabelField>
                        
                        <LabelField>
                          <LabelFieldTitle>
                            <FileText size={16} />
                            Notes
                          </LabelFieldTitle>
                          <NotesTextarea
                            placeholder="Add notes about this number's purpose or usage..."
                            value={labelInputs[number.id]?.notes || ''}
                            onChange={(e) => handleLabelInputChange(number.id, 'notes', e.target.value)}
                            maxLength={500}
                          />
                        </LabelField>
                      </LabelRow>
                      
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <SaveButton
                          onClick={() => handleSaveLabels(number.id)}
                          disabled={savingLabels[number.id]}
                        >
                          <Save size={16} />
                          {savingLabels[number.id] ? 'Saving...' : 'Save'}
                        </SaveButton>
                        
                        <EditButton onClick={() => handleCancelEditLabels(number.id)}>
                          <X size={16} />
                          Cancel
                        </EditButton>
                      </div>
                    </>
                  ) : (
                    // 显示模式
                    <>
                      <LabelsContainer>
                        {(() => {
                          const labels = parseLabels(number.label);
                          if (labels.length > 0) {
                            return labels.map((label, index) => (
                              <LabelDisplay key={index}>
                                <Tag size={14} />
                                {label}
                              </LabelDisplay>
                            ));
                          } else {
                            return (
                              <div style={{ color: '#999', fontStyle: 'italic', fontSize: '0.875rem' }}>
                                No labels set
                              </div>
                            );
                          }
                        })()}
                      </LabelsContainer>
                      
                      {number.notes && (
                        <NotesDisplay>
                          <strong>Notes:</strong> {number.notes}
                        </NotesDisplay>
                      )}
                      {!number.notes && (
                        <div style={{ color: '#999', fontStyle: 'italic', fontSize: '0.875rem' }}>
                          No notes added
                        </div>
                      )}
                      
                      <EditButton onClick={() => handleEditLabels(number.id)}>
                        <Edit3 size={16} />
                        Edit Labels & Notes
                      </EditButton>
                    </>
                  )}
                </LabelSection>
              </CardContent>
            </NumberCard>
          ))}
        </NumbersList>
      )}
    </Container>
  );
}

export default PhoneNumberManagement;