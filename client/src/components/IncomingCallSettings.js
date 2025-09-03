import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  PhoneIncoming, 
  Settings, 
  Phone, 
  Clock, 
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Content = styled.div`
  background: white;
  min-height: 100vh;
  color: black;
`;

const SettingsContainer = styled.div`
  padding: 2rem;
  background: #0a0f2f;
  min-height: 100vh;
  color: white;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #FFC900;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.125rem;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
`;

const SettingsCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 2rem;
  color: black;
`;

const CardTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #FFC900;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SettingGroup = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: black;
`;

const SettingDescription = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  color: black;
  font-size: 1rem;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #FFC900;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  color: black;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #FFC900;
  }
`;

const Toggle = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  
  &:hover .toggle-icon {
    color: #FFC900;
  }
`;

const ToggleIcon = styled.div`
  color: ${props => props.enabled ? '#FFC900' : '#666'};
  transition: color 0.3s ease;
`;

const ToggleText = styled.span`
  font-weight: 500;
  color: ${props => props.enabled ? '#FFC900' : '#666'};
`;

const BusinessHoursGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
`;

const DayLabel = styled.div`
  font-weight: 500;
  color: black;
`;

const TimeInput = styled(Input)`
  width: auto;
  min-width: 100px;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: #FFC900;
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: #FFC900;
  border: 3px solid #000;
  border-radius: 0;
  color: black;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 2rem;

  &:hover {
    background: #0a0f2f;
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const InfoBox = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1rem;
  margin-bottom: 2rem;
  color: black;
  font-size: 0.875rem;
`;

function IncomingCallSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    twilioNumber: '',
    forwardingEnabled: true,
    forwardingNumber: '',
    voicemailEnabled: true,
    autoAnswer: false,
    customGreeting: '',
    businessHours: {
      enabled: false,
      timezone: 'UTC',
      hours: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '17:00', enabled: true },
        saturday: { start: '09:00', end: '17:00', enabled: false },
        sunday: { start: '09:00', end: '17:00', enabled: false }
      }
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/incoming/settings', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        toast.error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/incoming/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleBusinessHoursToggle = () => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        enabled: !prev.businessHours.enabled
      }
    }));
  };

  const handleDayToggle = (day) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        hours: {
          ...prev.businessHours.hours,
          [day]: {
            ...prev.businessHours.hours[day],
            enabled: !prev.businessHours.hours[day].enabled
          }
        }
      }
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        hours: {
          ...prev.businessHours.hours,
          [day]: {
            ...prev.businessHours.hours[day],
            [field]: value
          }
        }
      }
    }));
  };

  if (!user) {
    return (
      <Content>
        <SettingsContainer>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Please login to manage incoming call settings</h2>
          </div>
        </SettingsContainer>
      </Content>
    );
  }

  if (loading) {
    return (
      <Content>
        <SettingsContainer>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Loading settings...</h2>
          </div>
        </SettingsContainer>
      </Content>
    );
  }

  return (
    <Content>
      <SettingsContainer>
      <Header>
        <Title>
          <PhoneIncoming size={40} />
          Incoming Call Settings
        </Title>
        <Subtitle>Configure how incoming calls are handled</Subtitle>
      </Header>

      <InfoBox>
        <strong>Your Phone Numbers:</strong> 
        <br />
        {settings.twilioNumber ? (
          <>
            {settings.twilioNumber}
            <br />
            Share this number with contacts who want to reach you through the platform.
          </>
        ) : (
          <>
            No phone numbers configured yet.
            <br />
            <a href="/phone-numbers" style={{ color: '#FFC900', textDecoration: 'underline' }}>
              Buy a phone number
            </a> to start receiving calls.
          </>
        )}
      </InfoBox>

      <SettingsGrid>
        <SettingsCard>
          <CardTitle>
            <Phone size={24} />
            Call Forwarding
          </CardTitle>

          <SettingGroup>
            <Toggle onClick={() => handleToggle('forwardingEnabled')}>
              <ToggleIcon className="toggle-icon" enabled={settings.forwardingEnabled}>
                {settings.forwardingEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </ToggleIcon>
              <ToggleText enabled={settings.forwardingEnabled}>
                Enable Call Forwarding
              </ToggleText>
            </Toggle>
            <SettingDescription>
              Forward incoming calls to your personal phone number
            </SettingDescription>
          </SettingGroup>

          {settings.forwardingEnabled && (
            <SettingGroup>
              <SettingLabel>Forwarding Number</SettingLabel>
              <Input
                type="tel"
                value={settings.forwardingNumber}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  forwardingNumber: e.target.value
                }))}
                placeholder="+1234567890"
              />
              <SettingDescription>
                The phone number where calls should be forwarded
              </SettingDescription>
            </SettingGroup>
          )}

          <SettingGroup>
            <Toggle onClick={() => handleToggle('autoAnswer')}>
              <ToggleIcon className="toggle-icon" enabled={settings.autoAnswer}>
                {settings.autoAnswer ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </ToggleIcon>
              <ToggleText enabled={settings.autoAnswer}>
                Auto Answer
              </ToggleText>
            </Toggle>
            <SettingDescription>
              Automatically answer and forward calls without manual intervention
            </SettingDescription>
          </SettingGroup>
        </SettingsCard>

        <SettingsCard>
          <CardTitle>
            <MessageSquare size={24} />
            Voicemail
          </CardTitle>

          <SettingGroup>
            <Toggle onClick={() => handleToggle('voicemailEnabled')}>
              <ToggleIcon className="toggle-icon" enabled={settings.voicemailEnabled}>
                {settings.voicemailEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </ToggleIcon>
              <ToggleText enabled={settings.voicemailEnabled}>
                Enable Voicemail
              </ToggleText>
            </Toggle>
            <SettingDescription>
              Allow callers to leave voicemail messages when you're unavailable
            </SettingDescription>
          </SettingGroup>

          <SettingGroup>
            <SettingLabel>Custom Greeting</SettingLabel>
            <TextArea
              value={settings.customGreeting}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                customGreeting: e.target.value
              }))}
              placeholder="Hello, you've reached [Your Name]. Please leave a message..."
            />
            <SettingDescription>
              Custom message played to callers (leave empty for default greeting)
            </SettingDescription>
          </SettingGroup>
        </SettingsCard>

        <SettingsCard style={{ gridColumn: '1 / -1' }}>
          <CardTitle>
            <Clock size={24} />
            Business Hours
          </CardTitle>

          <SettingGroup>
            <Toggle onClick={handleBusinessHoursToggle}>
              <ToggleIcon className="toggle-icon" enabled={settings.businessHours.enabled}>
                {settings.businessHours.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </ToggleIcon>
              <ToggleText enabled={settings.businessHours.enabled}>
                Enable Business Hours
              </ToggleText>
            </Toggle>
            <SettingDescription>
              Automatically handle calls differently during business hours vs. after hours
            </SettingDescription>
          </SettingGroup>

          {settings.businessHours.enabled && (
            <SettingGroup>
              <BusinessHoursGrid>
                <DayLabel><strong>Day</strong></DayLabel>
                <DayLabel><strong>Start</strong></DayLabel>
                <DayLabel><strong>End</strong></DayLabel>
                <DayLabel><strong>Enabled</strong></DayLabel>

                {Object.entries(settings.businessHours.hours).map(([day, hours]) => (
                  <React.Fragment key={day}>
                    <DayLabel style={{ textTransform: 'capitalize' }}>{day}</DayLabel>
                    <TimeInput
                      type="time"
                      value={hours.start}
                      onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                      disabled={!hours.enabled}
                    />
                    <TimeInput
                      type="time"
                      value={hours.end}
                      onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                      disabled={!hours.enabled}
                    />
                    <CheckboxContainer>
                      <Checkbox
                        type="checkbox"
                        checked={hours.enabled}
                        onChange={() => handleDayToggle(day)}
                      />
                    </CheckboxContainer>
                  </React.Fragment>
                ))}
              </BusinessHoursGrid>
            </SettingGroup>
          )}
        </SettingsCard>
      </SettingsGrid>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
        <SaveButton onClick={handleSave} disabled={saving}>
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Settings'}
        </SaveButton>
        
        <SaveButton 
          style={{ 
            background: 'white', 
            color: 'black',
            border: '3px solid #000'
          }}
          onClick={() => window.location.href = '/phone-numbers'}
        >
          <Phone size={20} />
          Manage Phone Numbers
        </SaveButton>
        
        <SaveButton 
          style={{ 
            background: 'white', 
            color: 'black',
            border: '3px solid #000'
          }}
          onClick={() => window.location.href = '/incoming-calls'}
        >
          <PhoneIncoming size={20} />
          Call History
        </SaveButton>
      </div>
    </SettingsContainer>
    </Content>
  );
}

export default IncomingCallSettings; 