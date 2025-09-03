import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { 
  Phone, 
  PhoneOff, 
  User,
  Clock,
  Volume2,
  VolumeX
} from 'lucide-react';

// Animations
const slideIn = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;


// Styled components
const NotificationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: ${slideIn} 0.3s ease-out;
`;

const NotificationCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 2rem;
  width: 90%;
  max-width: 400px;
  text-align: center;
  color: #000;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  animation: ${pulse} 2s infinite;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #FFC900;
  }
`;

const IncomingCallHeader = styled.div`
  margin-bottom: 1.5rem;
`;

const CallStatus = styled.div`
  color: #FFC900;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const CallerInfo = styled.div`
  margin-bottom: 2rem;
`;

const CallerNumber = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
  word-break: break-all;
`;

const CallerDetails = styled.div`
  font-size: 0.875rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const CallTimer = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #0a0f2f;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
`;

const ActionButton = styled.button`
  width: 70px;
  height: 70px;
  border-radius: 0;
  border: 3px solid #000;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  ${props => props.accept && `
    background: #FFC900;
    color: #000;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    
    &:hover {
      background: #e6b600;
      transform: scale(1.1);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
    }
  `}
  
  ${props => props.decline && `
    background: #0a0f2f;
    color: white;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    
    &:hover {
      background: #1a1f3f;
      transform: scale(1.1);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
    }
  `}
  
  ${props => props.mute && `
    background: white;
    color: #666;
    border: 3px solid #000;
    width: 50px;
    height: 50px;
    
    &:hover {
      background: #f5f5f5;
      color: #000;
      transform: scale(1.1);
    }
  `}

  svg {
    width: ${props => props.mute ? '20px' : '24px'};
    height: ${props => props.mute ? '20px' : '24px'};
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
`;

const QuickButton = styled.button`
  padding: 0.5rem 1rem;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  color: #666;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #f5f5f5;
    color: #000;
    border-color: #FFC900;
  }
`;

function IncomingCallNotification({ 
  callData, 
  onAccept, 
  onDecline, 
  onMute,
  isMuted = false,
  isVisible = true 
}) {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isMutedState, setIsMutedState] = useState(isMuted);

  useEffect(() => {
    if (!isVisible || !callData) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-decline when timer reaches 0
          onDecline && onDecline(callData);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, callData, onDecline]);

  const handleMute = () => {
    setIsMutedState(!isMutedState);
    onMute && onMute(!isMutedState);
  };

  const formatTime = (seconds) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (!isVisible || !callData) {
    return null;
  }

  return (
    <NotificationOverlay>
      <NotificationCard>
        <IncomingCallHeader>
          <CallStatus>
            <Phone size={16} />
            Incoming Call
          </CallStatus>
        </IncomingCallHeader>

        <CallerInfo>
          <CallerNumber>{callData.fromNumber}</CallerNumber>
          <CallerDetails>
            <span><User size={14} /> {callData.callerIdName || 'Unknown Caller'}</span>
            <span>To: {callData.toNumber}</span>
          </CallerDetails>
        </CallerInfo>

        <CallTimer>
          <Clock size={16} />
          <span>Auto-decline in {formatTime(timeRemaining)}</span>
        </CallTimer>

        <ActionButtons>
          <ActionButton 
            decline 
            onClick={() => onDecline && onDecline(callData)}
            title="Decline call"
          >
            <PhoneOff />
          </ActionButton>

          <ActionButton 
            mute 
            onClick={handleMute}
            title={isMutedState ? "Unmute" : "Mute"}
          >
            {isMutedState ? <VolumeX /> : <Volume2 />}
          </ActionButton>

          <ActionButton 
            accept 
            onClick={() => onAccept && onAccept(callData)}
            title="Accept call"
          >
            <Phone />
          </ActionButton>
        </ActionButtons>

        <QuickActions>
          <QuickButton onClick={() => onDecline && onDecline(callData)}>
            Send to Voicemail
          </QuickButton>
        </QuickActions>
      </NotificationCard>
    </NotificationOverlay>
  );
}

export default IncomingCallNotification;