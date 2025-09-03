import React, { memo } from 'react';
import styled from 'styled-components';
import { Phone, Delete, ToggleLeft, ToggleRight } from 'lucide-react';

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const CallButton = styled.button`
  background: #FFC900;
  color: #0a0f2f;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex: 1;
  justify-content: center;
  max-width: 200px;

  &:hover:not(:disabled) {
    background: #e6b400;
    transform: translate(-3px, -3px);
    box-shadow: 3px 3px 0 #000;
  }

  &:active:not(:disabled) {
    transform: translate(0, 0);
    box-shadow: none;
  }

  &:disabled {
    background: #f0f0f0;
    color: #999;
    cursor: not-allowed;
    border-color: #ddd;
  }

  @media (max-width: 768px) {
    padding: 0.8rem 1.5rem;
    font-size: 0.9rem;
  }
`;

const DeleteButton = styled.button`
  background: white;
  color: #dc3545;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: #dc3545;
    color: white;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &:active:not(:disabled) {
    transform: translate(0, 0);
    box-shadow: none;
  }

  &:disabled {
    background: #f0f0f0;
    color: #999;
    cursor: not-allowed;
    border-color: #ddd;
  }
`;

const ToggleButton = styled.button`
  background: white;
  color: #0a0f2f;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &:hover {
    background: #f8f9fa;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &:active {
    transform: translate(0, 0);
    box-shadow: none;
  }

  ${props => props.$isActive && `
    background: #FFC900;
    color: #0a0f2f;
    
    &:hover {
      background: #e6b400;
    }
  `}
`;

const ButtonLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  position: absolute;
  bottom: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  color: #666;
`;

const CallActionButtons = memo(({ 
  phoneNumber,
  onCall,
  onDelete,
  onToggleSpeaker,
  isSpeakerOn = false,
  isCallInProgress = false,
  isCallDisabled = false,
  callButtonText = "Call"
}) => {
  const hasNumber = phoneNumber && phoneNumber.trim().length > 0;

  return (
    <ActionButtonsContainer>
      <CallButton
        onClick={onCall}
        disabled={!hasNumber || isCallDisabled}
        title={!hasNumber ? "Enter a phone number" : "Start call"}
      >
        <Phone size={20} />
        {isCallInProgress ? "Calling..." : callButtonText}
      </CallButton>

      <DeleteButton
        onClick={onDelete}
        disabled={!hasNumber}
        title="Delete last digit"
      >
        <Delete size={20} />
      </DeleteButton>

      <ToggleButton
        onClick={onToggleSpeaker}
        $isActive={isSpeakerOn}
        title={isSpeakerOn ? "Turn off speaker" : "Turn on speaker"}
      >
        {isSpeakerOn ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
        <ButtonLabel>Speaker</ButtonLabel>
      </ToggleButton>
    </ActionButtonsContainer>
  );
});

CallActionButtons.displayName = 'CallActionButtons';

export default CallActionButtons;
