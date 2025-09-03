import React, { memo } from 'react';
import styled from 'styled-components';
import { Info, ArrowRight } from 'lucide-react';

const TutorialCardContainer = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #000;
  }

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

const TutorialBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #FFC900;
  color: #0a0f2f;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
  margin-bottom: 1rem;
  text-transform: uppercase;
`;

const TutorialTitle = styled.h3`
  color: #0a0f2f;
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
`;

const TutorialDescription = styled.p`
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  font-weight: 500;
`;

const TutorialActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const TutorialButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #0a0f2f;
  color: white;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #1a1f3f;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }
`;

const SkipButton = styled.button`
  background: none;
  color: #666;
  border: 2px solid #ddd;
  border-radius: 0;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #0a0f2f;
    border-color: #0a0f2f;
    transform: translate(-1px, -1px);
    box-shadow: 1px 1px 0 #0a0f2f;
  }
`;

const TutorialCard = memo(({ 
  title, 
  description, 
  onStart, 
  onSkip, 
  buttonText = "Get Started",
  skipText = "Skip Tutorial" 
}) => {
  return (
    <TutorialCardContainer>
      <TutorialBadge>
        <Info size={12} />
        Tutorial
      </TutorialBadge>
      
      <TutorialTitle>{title}</TutorialTitle>
      <TutorialDescription>{description}</TutorialDescription>
      
      <TutorialActions>
        <TutorialButton onClick={onStart}>
          {buttonText}
          <ArrowRight size={14} />
        </TutorialButton>
        <SkipButton onClick={onSkip}>
          {skipText}
        </SkipButton>
      </TutorialActions>
    </TutorialCardContainer>
  );
});

TutorialCard.displayName = 'TutorialCard';

export default TutorialCard;
