import React, { memo, useCallback } from 'react';
import styled from 'styled-components';

const DialPadContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const DialButton = styled.button`
  width: 70px;
  height: 70px;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0a0f2f;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  user-select: none;

  &:hover {
    background: #FFC900;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &:active {
    transform: translate(0, 0);
    box-shadow: none;
    background: #e6b400;
  }

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 1.3rem;
  }

  @media (max-width: 480px) {
    width: 55px;
    height: 55px;
    font-size: 1.2rem;
  }
`;

const DialNumber = styled.span`
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const DialLetters = styled.span`
  font-size: 0.6rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-top: 2px;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 0.55rem;
  }
`;

const dialPadData = [
  { number: '1', letters: '' },
  { number: '2', letters: 'ABC' },
  { number: '3', letters: 'DEF' },
  { number: '4', letters: 'GHI' },
  { number: '5', letters: 'JKL' },
  { number: '6', letters: 'MNO' },
  { number: '7', letters: 'PQRS' },
  { number: '8', letters: 'TUV' },
  { number: '9', letters: 'WXYZ' },
  { number: '*', letters: '' },
  { number: '0', letters: '+' },
  { number: '#', letters: '' }
];

const DialPad = memo(({ onNumberPress, disabled = false }) => {
  const handlePress = useCallback((number) => {
    if (disabled) return;
    
    // 添加触觉反馈（如果支持）
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // 播放按键音效（可选）
    if (window.AudioContext || window.webkitAudioContext) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 不同按键不同音调
        const frequencies = {
          '1': 697, '2': 697, '3': 697,
          '4': 770, '5': 770, '6': 770,
          '7': 852, '8': 852, '9': 852,
          '*': 941, '0': 941, '#': 941
        };
        
        oscillator.frequency.setValueAtTime(frequencies[number] || 800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        // 音效播放失败，忽略错误
      }
    }
    
    onNumberPress?.(number);
  }, [onNumberPress, disabled]);

  return (
    <DialPadContainer>
      {dialPadData.map(({ number, letters }) => (
        <DialButton
          key={number}
          onClick={() => handlePress(number)}
          disabled={disabled}
          aria-label={`Dial ${number}${letters ? ` (${letters})` : ''}`}
        >
          <DialNumber>{number}</DialNumber>
          {letters && <DialLetters>{letters}</DialLetters>}
        </DialButton>
      ))}
    </DialPadContainer>
  );
});

DialPad.displayName = 'DialPad';

export default DialPad;
