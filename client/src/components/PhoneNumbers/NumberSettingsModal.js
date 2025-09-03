import React, { memo, useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Save, Settings } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #FFC900;
  border-bottom: 3px solid #000;
`;

const ModalTitle = styled.h2`
  color: #0a0f2f;
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #0a0f2f;
  cursor: pointer;
  padding: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(10, 15, 47, 0.1);
    transform: scale(1.1);
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
`;

const NumberDisplay = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border: 2px solid #000;
  border-radius: 0;
`;

const NumberText = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
`;

const NumberStatus = styled.div`
  font-size: 0.9rem;
  color: #666;
  text-transform: uppercase;
  font-weight: 600;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #0a0f2f;
  margin-bottom: 1rem;
  text-transform: uppercase;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const FormLabel = styled.label`
  display: block;
  font-weight: 600;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 3px solid #000;
  border-radius: 0;
  font-size: 1rem;
  font-weight: 600;

  &:focus {
    outline: none;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 3px solid #000;
  border-radius: 0;
  font-size: 1rem;
  font-weight: 600;
  background: white;

  &:focus {
    outline: none;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  color: #0a0f2f;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const FormActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const FormButton = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: 3px solid #000;
  border-radius: 0;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.primary {
    background: #FFC900;
    color: #0a0f2f;

    &:hover:not(:disabled) {
      background: #e6b400;
    }
  }

  &.secondary {
    background: white;
    color: #0a0f2f;

    &:hover:not(:disabled) {
      background: #f8f9fa;
    }
  }
`;

const NumberSettingsModal = memo(({ 
  isOpen, 
  onClose, 
  number, 
  onSave 
}) => {
  const [settings, setSettings] = useState({
    friendlyName: '',
    voiceUrl: '',
    smsUrl: '',
    statusCallback: '',
    enableVoice: true,
    enableSms: true,
    enableMms: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // 初始化设置
  useEffect(() => {
    if (number) {
      setSettings({
        friendlyName: number.friendlyName || '',
        voiceUrl: number.voiceUrl || '',
        smsUrl: number.smsUrl || '',
        statusCallback: number.statusCallback || '',
        enableVoice: number.capabilities?.voice || true,
        enableSms: number.capabilities?.sms || true,
        enableMms: number.capabilities?.mms || false
      });
    }
  }, [number]);

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!number) return;

    setIsLoading(true);
    try {
      await onSave(number.id, settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !number) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Settings size={20} />
            Number Settings
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <NumberDisplay>
            <NumberText>{number.phoneNumber}</NumberText>
            <NumberStatus>Status: {number.status}</NumberStatus>
          </NumberDisplay>

          <FormSection>
            <SectionTitle>Basic Settings</SectionTitle>
            
            <FormGroup>
              <FormLabel htmlFor="friendlyName">Friendly Name</FormLabel>
              <FormInput
                id="friendlyName"
                type="text"
                value={settings.friendlyName}
                onChange={(e) => handleInputChange('friendlyName', e.target.value)}
                placeholder="Enter a friendly name for this number"
              />
            </FormGroup>
          </FormSection>

          <FormSection>
            <SectionTitle>Webhook URLs</SectionTitle>
            
            <FormGroup>
              <FormLabel htmlFor="voiceUrl">Voice URL</FormLabel>
              <FormInput
                id="voiceUrl"
                type="url"
                value={settings.voiceUrl}
                onChange={(e) => handleInputChange('voiceUrl', e.target.value)}
                placeholder="https://your-app.com/voice"
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="smsUrl">SMS URL</FormLabel>
              <FormInput
                id="smsUrl"
                type="url"
                value={settings.smsUrl}
                onChange={(e) => handleInputChange('smsUrl', e.target.value)}
                placeholder="https://your-app.com/sms"
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="statusCallback">Status Callback URL</FormLabel>
              <FormInput
                id="statusCallback"
                type="url"
                value={settings.statusCallback}
                onChange={(e) => handleInputChange('statusCallback', e.target.value)}
                placeholder="https://your-app.com/status"
              />
            </FormGroup>
          </FormSection>

          <FormSection>
            <SectionTitle>Capabilities</SectionTitle>
            
            <CheckboxGroup>
              <CheckboxItem>
                <Checkbox
                  type="checkbox"
                  checked={settings.enableVoice}
                  onChange={(e) => handleInputChange('enableVoice', e.target.checked)}
                />
                Enable Voice Calls
              </CheckboxItem>
              
              <CheckboxItem>
                <Checkbox
                  type="checkbox"
                  checked={settings.enableSms}
                  onChange={(e) => handleInputChange('enableSms', e.target.checked)}
                />
                Enable SMS Messages
              </CheckboxItem>
              
              <CheckboxItem>
                <Checkbox
                  type="checkbox"
                  checked={settings.enableMms}
                  onChange={(e) => handleInputChange('enableMms', e.target.checked)}
                />
                Enable MMS Messages
              </CheckboxItem>
            </CheckboxGroup>
          </FormSection>

          <FormActions>
            <FormButton
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              <X size={16} />
              Cancel
            </FormButton>
            
            <FormButton
              type="button"
              className="primary"
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save size={16} />
              {isLoading ? 'Saving...' : 'Save Settings'}
            </FormButton>
          </FormActions>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
});

NumberSettingsModal.displayName = 'NumberSettingsModal';

export default NumberSettingsModal;
