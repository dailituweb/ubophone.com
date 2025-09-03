import React, { useState } from 'react';
import styled from 'styled-components';
import { Mic, MicOff, CheckCircle, Settings, RefreshCw } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: rgba(26, 35, 50, 0.95);
  backdrop-filter: blur(20px);
  border: 3px solid #000;
  border-radius: 0;
  padding: 2rem;
  width: 100%;
  max-width: 450px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    max-width: 380px;
    padding: 1.75rem;
    border-radius: 0;
  }

  @media (max-width: 480px) {
    max-width: 350px;
    padding: 1.5rem;
    border-radius: 0;
  }
`;

const IconContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 0;
  background: ${props => {
    switch (props.status) {
      case 'granted': return '#FFC900';
      case 'denied': return '#ef4444';
      case 'prompt': return '#FFC900';
      default: return '#9ca3af';
    }
  }};
  border: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: ${props => {
    switch (props.status) {
      case 'granted': return '#0a0f2f';
      case 'denied': return '#ffffff';
      case 'prompt': return '#0a0f2f';
      default: return '#ffffff';
    }
  }};

  svg {
    width: 36px;
    height: 36px;
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.75rem;

  @media (max-width: 768px) {
    font-size: 1.35rem;
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const Description = styled.p`
  color: #9ca3af;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.75rem;

  @media (max-width: 768px) {
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
    margin-bottom: 1.25rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PrimaryButton = styled.button`
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: #FFC900;
  border: 3px solid #000;
  border-radius: 0;
  color: #0a0f2f;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 0 #000;
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    padding: 0.8rem 1.25rem;
    font-size: 0.95rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    border-radius: 0;
  }
`;

const SecondaryButton = styled.button`
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: transparent;
  border: 3px solid #FFC900;
  border-radius: 0;
  color: #FFC900;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: #FFC900;
    color: #0a0f2f;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    padding: 0.8rem 1.25rem;
    font-size: 0.95rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    border-radius: 0;
  }
`;

const StepsContainer = styled.div`
  background: rgba(17, 24, 39, 0.8);
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  margin: 1.5rem 0;
  text-align: left;

  @media (max-width: 768px) {
    padding: 1.25rem;
    margin: 1.25rem 0;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 0;
  }
`;

const StepItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #d1d5db;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }

  .step-number {
    background: #FFC900;
    color: #0a0f2f;
    width: 24px;
    height: 24px;
    border-radius: 0;
    border: 2px solid #000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function MicrophonePermissionModal({ 
  isOpen, 
  onClose, 
  onPermissionGranted, 
  onPermissionDenied,
  permissionStatus = 'prompt' 
}) {
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(permissionStatus);

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // 立即停止流
      stream.getTracks().forEach(track => track.stop());
      
      setCurrentStatus('granted');
      setTimeout(() => {
        onPermissionGranted();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Permission request failed:', error);
      setCurrentStatus('denied');
      onPermissionDenied(error);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleOpenSettings = () => {
    // 提供浏览器设置指导
    const userAgent = navigator.userAgent;
    let settingsUrl = '';
    
    if (userAgent.includes('Chrome')) {
      settingsUrl = 'chrome://settings/content/microphone';
    } else if (userAgent.includes('Firefox')) {
      settingsUrl = 'about:preferences#privacy';
    } else if (userAgent.includes('Safari')) {
      // Safari需要用户手动打开系统偏好设置
      alert('请在Safari菜单 > 偏好设置 > 网站 > 麦克风中允许此网站使用麦克风');
      return;
    }
    
    if (settingsUrl) {
      window.open(settingsUrl, '_blank');
    }
  };

  const getContent = () => {
    switch (currentStatus) {
      case 'granted':
        return {
          icon: <CheckCircle />,
          title: '麦克风权限已授予',
          description: '太棒了！您现在可以进行语音通话了。',
          showSteps: false,
          buttons: []
        };

      case 'denied':
        return {
          icon: <MicOff />,
          title: '麦克风权限被拒绝',
          description: '要使用通话功能，您需要在浏览器设置中允许麦克风访问。',
          showSteps: true,
          steps: [
            '点击地址栏左侧的锁图标',
            '选择"站点设置"或"权限"',
            '将麦克风设置为"允许"',
            '刷新页面重试'
          ],
          buttons: [
            { 
              type: 'primary', 
              text: '打开浏览器设置', 
              icon: <Settings />, 
              onClick: handleOpenSettings 
            },
            { 
              type: 'secondary', 
              text: '重新尝试', 
              icon: <RefreshCw />, 
              onClick: handleRequestPermission 
            }
          ]
        };

      case 'prompt':
      default:
        return {
          icon: <Mic />,
          title: '需要麦克风权限',
          description: '为了进行语音通话，我们需要访问您的麦克风。点击下方按钮将弹出权限请求，请选择"允许"。',
          showSteps: true,
          steps: [
            '点击下方"允许麦克风访问"按钮',
            '在浏览器弹出框中点击"允许"',
            '开始享受高质量语音通话'
          ],
          buttons: [
            { 
              type: 'primary', 
              text: isRequestingPermission ? '请求权限中...' : '允许麦克风访问', 
              icon: isRequestingPermission ? <LoadingSpinner /> : <Mic />, 
              onClick: handleRequestPermission,
              disabled: isRequestingPermission
            }
          ]
        };
    }
  };

  if (!isOpen) return null;

  const content = getContent();

  return (
    <ModalOverlay>
      <ModalContainer>
        <IconContainer status={currentStatus}>
          {content.icon}
        </IconContainer>

        <Title>{content.title}</Title>
        <Description>{content.description}</Description>

        {content.showSteps && content.steps && (
          <StepsContainer>
            {content.steps.map((step, index) => (
              <StepItem key={index}>
                <div className="step-number">{index + 1}</div>
                <div>{step}</div>
              </StepItem>
            ))}
          </StepsContainer>
        )}

        <ButtonContainer>
          {content.buttons.map((button, index) => (
            button.type === 'primary' ? (
              <PrimaryButton
                key={index}
                onClick={button.onClick}
                disabled={button.disabled}
              >
                {button.icon}
                {button.text}
              </PrimaryButton>
            ) : (
              <SecondaryButton
                key={index}
                onClick={button.onClick}
              >
                {button.icon}
                {button.text}
              </SecondaryButton>
            )
          ))}

          {currentStatus !== 'granted' && (
            <SecondaryButton onClick={onClose}>
              稍后设置
            </SecondaryButton>
          )}
        </ButtonContainer>
      </ModalContainer>
    </ModalOverlay>
  );
}

export default MicrophonePermissionModal;