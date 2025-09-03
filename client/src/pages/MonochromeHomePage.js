import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import PhoneStyleDialer from '../components/PhoneStyleDialer';
import RateCalculator from '../components/RateCalculator';
import { useAuth } from '../context/AuthContext';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  /* Flat Icon Styles */
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 24px;
    height: 24px;
    color: currentColor;
  }

  /* Phone Icon */
  .icon-phone::before {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    border: 3px solid currentColor;
    border-radius: 4px;
    transform: rotate(-25deg);
  }
  .icon-phone::after {
    content: '';
    position: absolute;
    width: 5px;
    height: 5px;
    background: currentColor;
    border-radius: 1px;
    top: 3px;
    left: 9px;
  }

  /* Globe Icon */
  .icon-globe::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid currentColor;
    border-radius: 50%;
  }
  .icon-globe::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 10px;
    border: 2px solid currentColor;
    border-radius: 50%;
    border-bottom: none;
    top: 50%;
    transform: translateY(-50%);
  }

  /* Lightning Icon */
  .icon-lightning::before {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    background: currentColor;
    transform: rotate(45deg);
    top: 50%;
    left: 50%;
    margin-top: -6px;
    margin-left: -6px;
    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  }
  .icon-lightning::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background: #0a0f2f;
    transform: rotate(45deg);
    top: 50%;
    left: 50%;
    margin-top: -4px;
    margin-left: -4px;
    clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  }

  /* Credit Card Icon */
  .icon-credit::before {
    content: '';
    position: absolute;
    width: 18px;
    height: 12px;
    background: currentColor;
    border-radius: 2px;
    top: 6px;
    left: 3px;
  }
  .icon-credit::after {
    content: '';
    position: absolute;
    width: 18px;
    height: 3px;
    background: #FFC900;
    top: 9px;
    left: 3px;
  }

  /* Dollar Icon */
  .icon-dollar::before {
    content: '$';
    font-size: 20px;
    font-weight: bold;
  }

  /* Users Icon */
  .icon-users::before {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    background: currentColor;
    border-radius: 50%;
    left: 2px;
    top: 2px;
  }
  .icon-users::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 10px;
    background: currentColor;
    border-radius: 10px 10px 0 0;
    bottom: 0;
    left: 2px;
  }

  /* Lock Icon */
  .icon-lock::before {
    content: '';
    position: absolute;
    width: 16px;
    height: 12px;
    background: currentColor;
    bottom: 0;
    border-radius: 2px;
  }
  .icon-lock::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 10px;
    border: 2px solid currentColor;
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    top: 0;
  }

  /* Form Icon */
  .icon-form::before {
    content: '';
    position: absolute;
    width: 16px;
    height: 20px;
    background: currentColor;
    border-radius: 1px;
    top: 2px;
    left: 4px;
  }
  .icon-form::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 2px;
    background: #FFC900;
    top: 7px;
    left: 7px;
    box-shadow: 0 4px 0 #FFC900, 0 8px 0 #FFC900, 0 12px 0 #FFC900;
  }

  /* Call Icon */
  .icon-call::before {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    border: 3px solid currentColor;
    border-radius: 4px;
    transform: rotate(-25deg);
    top: 3px;
    left: 3px;
  }
  .icon-call::after {
    content: '';
    position: absolute;
    width: 5px;
    height: 5px;
    background: currentColor;
    border-radius: 1px;
    top: 5px;
    left: 10px;
  }

  /* Menu Icon */
  .icon-menu {
    width: 24px;
    height: 24px;
  }
  .icon-menu span {
    position: absolute;
    width: 20px;
    height: 2px;
    background: currentColor;
    left: 2px;
  }
  .icon-menu span:nth-child(1) { top: 5px; }
  .icon-menu span:nth-child(2) { top: 11px; }
  .icon-menu span:nth-child(3) { bottom: 5px; }
`;

const Container = styled.div`
  background: #FAFAFA;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow-x: hidden;
`;

const Header = styled.header`
  padding: 24px 48px;
  background: white;
  border-bottom: 2px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
  
  @media (max-width: 768px) {
    padding: 16px 24px;
  }
`;

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: #0a0f2f;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #FFC900;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 3px solid #0a0f2f;
    border-radius: 4px;
    transform: rotate(-25deg);
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 6px;
    height: 6px;
    background: #0a0f2f;
    border-radius: 1px;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
  }
`;

const NavMenu = styled.div`
  display: flex;
  gap: 40px;
  align-items: center;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a`
  color: #0a0f2f;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  transition: color 0.2s;
  cursor: pointer;
  
  &:hover {
    color: #0a0f2f;
    opacity: 0.8;
  }
`;

const CTAButton = styled.button`
  padding: 12px 32px;
  background: #FFC900;
  border: none;
  border-radius: 50px;
  color: #0a0f2f;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const MobileMenuToggle = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: #0a0f2f;
  font-size: 24px;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 200;
  padding: 24px;
  
  &.active {
    display: block;
  }
`;

const MobileMenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
`;

const MobileCloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #0a0f2f;
  font-size: 24px;
`;

const MobileMenuLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const MobileNavLink = styled.a`
  color: #0a0f2f;
  text-decoration: none;
  font-size: 20px;
  font-weight: 600;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
`;

const HeroSection = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 48px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 48px;
    padding: 48px 16px;
    width: 100%;
    max-width: 100%;
  }
  
  @media (max-width: 480px) {
    padding: 32px 8px;
    gap: 32px;
  }
`;

const HeroContent = styled.div`
  @media (max-width: 768px) {
    text-align: center;
  }
`;

const Title = styled.h1`
  font-size: 56px;
  font-weight: 800;
  color: #0a0f2f;
  line-height: 1.1;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    font-size: 40px;
  }
  
  @media (max-width: 480px) {
    font-size: 32px;
  }
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: #0a0f2f;
  line-height: 1.6;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const PricingHighlight = styled.div`
  margin-top: 40px;
  background: #FFC900;
  border: 3px solid #000;
  padding: 32px 48px;
  position: relative;
  display: inline-block;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #000;
  }
  
  @media (max-width: 768px) {
    padding: 24px 32px;
    margin-top: 32px;
    text-align: center;
  }
  
  @media (max-width: 480px) {
    padding: 20px 24px;
    margin-top: 24px;
  }
`;

const PricingTitle = styled.h3`
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 12px;
  display: block;
  color: #0a0f2f;
  
  @media (max-width: 768px) {
    font-size: 20px;
    text-align: center;
  }
  
  @media (max-width: 480px) {
    font-size: 18px;
    margin-bottom: 8px;
  }
`;

const CountryFlag = styled.span`
  display: inline-block;
  width: 32px;
  height: 24px;
  border: 2px solid #000;
  position: relative;
  overflow: hidden;
  background: #fff;
  
  .flag-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    animation: flagScroll 12s infinite linear;
  }
  
  .flag-item {
    width: 100%;
    height: 24px;
    flex-shrink: 0;
    position: relative;
  }
  
  /* USA Flag */
  .flag-usa {
    background: linear-gradient(to bottom, 
      #002868 0%, #002868 40%, 
      #bf0a30 40%, #bf0a30 45%,
      #fff 45%, #fff 50%,
      #bf0a30 50%, #bf0a30 55%,
      #fff 55%, #fff 60%,
      #bf0a30 60%, #bf0a30 65%,
      #fff 65%, #fff 70%,
      #bf0a30 70%, #bf0a30 100%);
  }
  
  .flag-usa::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 12px;
    height: 10px;
    background: #002868;
  }
  
  /* UK Flag */
  .flag-uk {
    background: #012169;
    position: relative;
  }
  
  .flag-uk::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      linear-gradient(45deg, transparent 40%, #fff 40%, #fff 45%, transparent 45%),
      linear-gradient(-45deg, transparent 40%, #fff 40%, #fff 45%, transparent 45%),
      linear-gradient(0deg, transparent 45%, #fff 45%, #fff 55%, transparent 55%),
      linear-gradient(90deg, transparent 45%, #fff 45%, #fff 55%, transparent 55%);
  }
  
  /* Canada Flag */
  .flag-canada {
    background: linear-gradient(to right, 
      #ff0000 0%, #ff0000 25%, 
      #fff 25%, #fff 75%, 
      #ff0000 75%, #ff0000 100%);
  }
  
  .flag-canada::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    background: #ff0000;
    transform: translate(-50%, -50%) rotate(45deg);
  }
  
  /* Germany Flag */
  .flag-germany {
    background: linear-gradient(to bottom, 
      #000 0%, #000 33.33%, 
      #dd0000 33.33%, #dd0000 66.66%, 
      #ffce00 66.66%, #ffce00 100%);
  }
  
  /* France Flag */
  .flag-france {
    background: linear-gradient(to right, 
      #002395 0%, #002395 33.33%, 
      #fff 33.33%, #fff 66.66%, 
      #ed2939 66.66%, #ed2939 100%);
  }
  
  /* Japan Flag */
  .flag-japan {
    background: #fff;
  }
  
  .flag-japan::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    background: #bc002d;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
  
  /* China Flag */
  .flag-china {
    background: #de2910;
  }
  
  .flag-china::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 6px;
    height: 6px;
    background: #ffde00;
    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  }
  
  /* India Flag */
  .flag-india {
    background: linear-gradient(to bottom, 
      #ff9933 0%, #ff9933 33.33%, 
      #fff 33.33%, #fff 66.66%, 
      #138808 66.66%, #138808 100%);
  }
  
  .flag-india::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 6px;
    border: 1px solid #000080;
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }
  
  /* Brazil Flag */
  .flag-brazil {
    background: #009739;
  }
  
  .flag-brazil::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 16px;
    height: 8px;
    background: #fedd00;
    transform: translate(-50%, -50%) rotate(45deg);
    clip-path: polygon(0 50%, 50% 0, 100% 50%, 50% 100%);
  }
  
  /* Australia Flag */
  .flag-australia {
    background: #012169;
  }
  
  .flag-australia::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 12px;
    height: 10px;
    background: 
      linear-gradient(45deg, transparent 40%, #fff 40%, #fff 45%, transparent 45%),
      linear-gradient(-45deg, transparent 40%, #fff 40%, #fff 45%, transparent 45%),
      linear-gradient(0deg, transparent 45%, #fff 45%, #fff 55%, transparent 55%),
      linear-gradient(90deg, transparent 45%, #fff 45%, #fff 55%, transparent 55%);
  }
  
  @keyframes flagScroll {
    0% { transform: translateY(0); }
    100% { transform: translateY(-240px); }
  }
`;

const PricingText = styled.p`
  font-size: 20px;
  margin-bottom: 8px;
  color: #0a0f2f;
  font-weight: 600;
  text-align: left;
  
  @media (max-width: 768px) {
    font-size: 18px;
    text-align: center;
  }
  
  @media (max-width: 480px) {
    font-size: 16px;
    margin-bottom: 6px;
  }
`;

const PricingBadge = styled.div`
  display: inline-block;
  background: #0a0f2f;
  color: #FFC900;
  padding: 8px 20px;
  font-size: 16px;
  font-weight: 800;
  margin-top: 8px;
  text-transform: uppercase;
  text-align: center;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 6px 16px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    padding: 6px 12px;
    font-size: 12px;
    margin-top: 6px;
  }
`;

const DialerWrapper = styled.div`
  background: white;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  width: 100%;
  display: flex;
  justify-content: center;
  
  @media (max-width: 768px) {
    padding: 16px;
    margin: 0;
    border-radius: 16px;
    width: 100%;
    max-width: 100%;
  }
  
  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 12px;
    margin: 0 0px;
  }
`;

const RateCalculatorSection = styled.section`
  padding: 80px 48px;
  background: #FAFAFA;
  
  @media (max-width: 768px) {
    padding: 60px 24px;
  }
`;

const RateCalculatorContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const HowItWorksSection = styled.section`
  padding: 80px 48px;
  background: #FAFAFA;
  
  @media (max-width: 768px) {
    padding: 60px 24px;
  }
`;

const SectionContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  font-size: 48px;
  font-weight: 800;
  color: #0a0f2f;
  text-align: center;
  margin-bottom: 64px;
  
  @media (max-width: 768px) {
    font-size: 36px;
    margin-bottom: 48px;
  }
`;

const StepsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  margin-bottom: 64px;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 48px;
  }
`;

const StepCard = styled.div`
  flex: 1;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 40px 32px;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 8px 8px 0 #FFC900;
  }
  
  @media (max-width: 1024px) {
    max-width: 500px;
    width: 100%;
  }
  
  @media (max-width: 768px) {
    padding: 32px 24px;
  }
`;

const StepIcon = styled.div`
  width: 80px;
  height: 80px;
  background: #FFC900;
  border: 3px solid #000;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #0a0f2f;
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
`;

const StepTitle = styled.h3`
  font-size: 28px;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const StepDesc = styled.p`
  font-size: 18px;
  color: #0a0f2f;
  line-height: 1.6;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const StepFeatures = styled.ul`
  list-style: none;
  text-align: left;
`;

const StepFeature = styled.li`
  font-size: 16px;
  color: #0a0f2f;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  &::before {
    content: '✓';
    color: #FFC900;
    font-weight: 800;
    font-size: 20px;
  }
`;

const StepArrow = styled.div`
  font-size: 48px;
  font-weight: 800;
  color: #FFC900;
  flex-shrink: 0;
  
  @media (max-width: 1024px) {
    transform: rotate(90deg);
  }
`;

const GetStartedButton = styled.button`
  display: inline-block;
  padding: 20px 60px;
  background: #10B981;
  border: 3px solid #000;
  color: white;
  font-size: 20px;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #000;
  }
  
  @media (max-width: 768px) {
    font-size: 18px;
    padding: 16px 48px;
  }
`;

const FeaturesSection = styled.section`
  padding: 80px 48px;
  background: #FAFAFA;
  
  @media (max-width: 768px) {
    padding: 60px 24px;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const FeatureCard = styled.div`
  padding: 40px 28px;
  background: white;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  border: 3px solid transparent;
  
  &:hover {
    transform: translateY(-8px);
    border-color: #FFC900;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  }
  
  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const FeatureIcon = styled.div`
  width: 80px;
  height: 80px;
  background: #FFC900;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: #0a0f2f;
  transition: all 0.3s ease;
  font-size: 32px;
  
  ${FeatureCard}:hover & {
    transform: scale(1.1);
    background: #000;
    color: #FFC900;
  }
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
`;

const FeatureTitle = styled.h3`
  font-size: 22px;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const FeatureDesc = styled.p`
  font-size: 16px;
  color: #0a0f2f;
  line-height: 1.6;
`;

const ComparisonSection = styled.section`
  padding: 80px 48px;
  background: #FAFAFA;
  
  @media (max-width: 768px) {
    padding: 60px 24px;
  }
`;

const MobileFeatureList = styled.div`
  display: none;
`;

const MobileFeatureCard = styled.div`
  background: white;
  padding: 24px;
  margin-bottom: 16px;
  border-radius: 12px;
  border-left: 4px solid #FFC900;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  
  h4 {
    font-size: 18px;
    font-weight: 800;
    color: #0a0f2f;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  p {
    font-size: 14px;
    color: #0a0f2f;
    line-height: 1.5;
    margin-bottom: 12px;
  }
  
  .status {
    display: inline-block;
    padding: 6px 16px;
    background: #FFC900;
    color: #0a0f2f;
    font-size: 12px;
    font-weight: 800;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const ComparisonTable = styled.div`
  background: white;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  overflow: hidden;
  border-radius: 0;
  overflow-x: auto;
  
  @media (max-width: 768px) {
    margin: 0 -1rem;
    border-radius: 0;
  }
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  background: #000;
  padding: 32px 24px;
  position: sticky;
  top: 0;
  z-index: 10;
  min-width: 600px;
  
  @media (max-width: 768px) {
    padding: 20px 16px;
    min-width: 500px;
  }
`;

const FeatureLabel = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: #FFC900;
  text-align: left;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const CompanyLabel = styled.div`
  font-size: 18px;
  font-weight: 800;
  text-align: center;
  color: white;
  
  &.ubophone {
    color: #FFC900;
    font-size: 20px;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      background: #FFC900;
      border-radius: 50%;
    }
  }
  
  @media (max-width: 768px) {
    font-size: 14px;
    
    &.ubophone {
      font-size: 16px;
    }
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  padding: 28px 24px;
  border-bottom: 2px solid #f0f0f0;
  align-items: center;
  transition: all 0.3s ease;
  background: white;
  min-width: 600px;
  
  &:hover {
    background: #FFF8DC;
    transform: translateX(4px);
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 768px) {
    padding: 20px 16px;
    min-width: 500px;
    
    &:hover {
      transform: none;
    }
  }
`;

const FeatureName = styled.div`
  @media (max-width: 768px) {
    margin-bottom: 0;
  }
`;

const FeatureNameTitle = styled.h4`
  font-size: 18px;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 6px;
  
  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 4px;
  }
`;

const FeatureNameDesc = styled.p`
  font-size: 14px;
  color: #0a0f2f;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const Check = styled.div`
  text-align: center;
  font-size: 24px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.yes {
    color: #FFC900;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      width: 40px;
      height: 40px;
      background: #FFC900;
      opacity: 0.1;
      border-radius: 50%;
      z-index: -1;
    }
  }
  
  &.no {
    color: #ddd;
    font-size: 20px;
  }
  
  @media (max-width: 768px) {
    font-size: 18px;
    
    &.no {
      font-size: 16px;
    }
    
    &.yes::before {
      width: 30px;
      height: 30px;
    }
  }
`;

const TestimonialsSection = styled.section`
  padding: 80px 48px;
  background: white;
  
  @media (max-width: 768px) {
    padding: 60px 24px;
  }
`;

const TestimonialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-bottom: 80px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
    margin-bottom: 48px;
  }
`;

const TestimonialCard = styled.div`
  background: #FAFAFA;
  padding: 40px;
  position: relative;
  transition: all 0.3s ease;
  border: 3px solid transparent;
  
  &:hover {
    transform: translateY(-4px);
    border-color: #FFC900;
    background: white;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }
  
  @media (max-width: 768px) {
    padding: 32px 24px;
  }
`;

const QuoteIcon = styled.div`
  font-size: 80px;
  font-weight: 800;
  color: #FFC900;
  line-height: 1;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    font-size: 60px;
  }
`;

const TestimonialText = styled.p`
  font-size: 18px;
  line-height: 1.6;
  color: #0a0f2f;
  margin-bottom: 32px;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const TestimonialAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const AuthorAvatar = styled.div`
  width: 56px;
  height: 56px;
  background: ${props => props.bg || '#000'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  transition: all 0.3s ease;
  
  ${TestimonialCard}:hover & {
    transform: scale(1.1);
  }
`;

const AuthorInfo = styled.div``;

const AuthorName = styled.h4`
  font-size: 18px;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 4px;
`;

const AuthorTitle = styled.p`
  font-size: 14px;
  color: #0a0f2f;
`;

const TestimonialsStats = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 48px;
  padding: 48px;
  background: #FFC900;
  border: 3px solid #000;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 32px;
    padding: 32px 24px;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.h3`
  font-size: 42px;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const StatLabel = styled.p`
  font-size: 18px;
  font-weight: 600;
  color: #0a0f2f;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const StatDivider = styled.div`
  width: 3px;
  height: 60px;
  background: #0a0f2f;
  
  @media (max-width: 768px) {
    width: 60px;
    height: 3px;
  }
`;

const CTASection = styled.section`
  padding: 80px 48px;
  background: #000;
  color: white;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 60px 24px;
  }
`;

const CTATitle = styled.h2`
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    font-size: 36px;
  }
`;

const CTASubtitle = styled.p`
  font-size: 20px;
  margin-bottom: 32px;
  opacity: 0.8;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const CTAButtonLight = styled(CTAButton)`
  background: #FFC900;
  color: #0a0f2f;
  padding: 16px 48px;
  font-size: 18px;
  font-weight: 700;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const Footer = styled.footer`
  padding: 48px;
  background: #FAFAFA;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 32px 24px;
  }
  
  @media (max-width: 480px) {
    padding: 24px 16px;
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const FooterText = styled.p`
  color: #0a0f2f;
  font-size: 14px;
  margin-bottom: 16px;
`;

const FooterLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    gap: 16px;
  }
`;

const FooterLink = styled.a`
  color: #0a0f2f;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
  cursor: pointer;
  
  &:hover {
    color: #666;
  }
`;

const FAQSection = styled.section`
  padding: 80px 48px;
  background: white;
  
  @media (max-width: 768px) {
    padding: 60px 24px;
  }
`;

const FAQContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const FAQTitle = styled.h2`
  font-size: 48px;
  font-weight: 800;
  color: #0a0f2f;
  text-align: center;
  margin-bottom: 64px;
  
  @media (max-width: 768px) {
    font-size: 36px;
    margin-bottom: 48px;
  }
`;

const FAQList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FAQItem = styled.div`
  border: 3px solid #f0f0f0;
  border-radius: 0;
  background: white;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #FFC900;
    transform: translateX(4px);
  }
  
  &.active {
    border-color: #FFC900;
    box-shadow: 0 4px 12px rgba(255, 201, 0, 0.2);
  }
`;

const FAQQuestion = styled.button`
  width: 100%;
  padding: 24px 32px;
  background: none;
  border: none;
  text-align: left;
  font-size: 18px;
  font-weight: 700;
  color: #0a0f2f;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: #FFF8DC;
  }
  
  @media (max-width: 768px) {
    padding: 20px 24px;
    font-size: 16px;
  }
`;

const FAQIcon = styled.span`
  font-size: 24px;
  font-weight: 800;
  color: #FFC900;
  transition: transform 0.3s ease;
  
  &.open {
    transform: rotate(45deg);
  }
`;

const FAQAnswer = styled.div`
  max-height: ${props => props.isOpen ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.4s ease, padding 0.4s ease;
  padding: ${props => props.isOpen ? '0 32px 24px 32px' : '0 32px'};
  
  @media (max-width: 768px) {
    padding: ${props => props.isOpen ? '0 24px 20px 24px' : '0 24px'};
  }
`;

const FAQAnswerText = styled.p`
  color: #0a0f2f;
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const MonochromeHomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqData = [
    {
      id: 1,
      question: "How does Ubophone work?",
      answer: "Ubophone allows you to make international calls directly from your web browser without downloading any apps. Simply create an account, add credits, and start calling any phone number worldwide using our secure WebRTC technology."
    },
    {
      id: 2,
      question: "Do I need to download any software or apps?",
      answer: "No! Ubophone works entirely in your web browser. No downloads, installations, or app store visits required. Just visit our website and start calling immediately."
    },
    {
      id: 3,
      question: "What countries can I call?",
      answer: "You can call virtually any country in the world. We support over 180 countries and territories with competitive rates. Check our rates page for specific pricing for your destination."
    },
    {
      id: 4,
      question: "How much does it cost to make calls?",
      answer: "We use a pay-as-you-go model starting from just $0.02 per minute for many destinations. There are no monthly fees, subscriptions, or hidden costs. You only pay for the minutes you actually use."
    },
    {
      id: 5,
      question: "Do I need to verify my phone number to sign up?",
      answer: "No phone verification required! Unlike other services, you can sign up with just your email address and start calling immediately. This makes Ubophone perfect for users who don't have a local phone number."
    },
    {
      id: 6,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and various digital payment methods. Payments are processed securely through our encrypted payment system."
    },
    {
      id: 7,
      question: "Can I receive calls on Ubophone?",
      answer: "Yes! You can purchase virtual phone numbers from various countries and receive incoming calls directly in your browser. This feature is perfect for businesses that need a local presence in multiple countries."
    },
    {
      id: 8,
      question: "Is call quality good for business use?",
      answer: "Absolutely! We use enterprise-grade infrastructure with crystal-clear HD voice quality. Our calls are routed through premium carriers to ensure professional call quality suitable for business communications."
    },
    {
      id: 9,
      question: "Are my calls private and secure?",
      answer: "Yes, all calls are encrypted end-to-end using industry-standard security protocols. We don't store call recordings, and your personal information is protected according to strict privacy standards."
    },
    {
      id: 10,
      question: "Can I use my own caller ID?",
      answer: "Yes, you can set a custom caller ID for outgoing calls. You can also purchase verified phone numbers from various countries to display as your caller ID, giving you a local presence worldwide."
    },
    {
      id: 11,
      question: "What happens if I run out of credits during a call?",
      answer: "Your call will be automatically ended when your balance reaches zero. We recommend keeping a minimum balance to avoid interruptions. You'll receive notifications when your balance is running low."
    },
    {
      id: 12,
      question: "Can I get a refund for unused credits?",
      answer: "Yes, unused credits can be refunded within 30 days of purchase, minus any processing fees. Credits do not expire, so you can use them whenever you need to make calls."
    },
    {
      id: 13,
      question: "Do you offer customer support?",
      answer: "Yes, we provide 24/7 customer support through live chat, email, and phone. Our support team can help with account setup, technical issues, billing questions, and any other concerns you may have."
    },
    {
      id: 14,
      question: "Can I use Ubophone for conference calls or group calls?",
      answer: "Currently, Ubophone is optimized for one-on-one calls. We're working on conference calling features for future releases. For now, you can make multiple individual calls to connect with different parties."
    }
  ];

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <>
      <GlobalStyle />
      <Container>
        <Header>
          <Nav>
            <Logo>
              <LogoIcon />
              <span>Ubophone</span>
            </Logo>
            <NavMenu>
              <NavLink href="#home">Home</NavLink>
              {isLoggedIn ? (
                <>
                  <NavLink onClick={() => navigate('/dashboard')}>Dashboard</NavLink>
                  <CTAButton onClick={() => navigate('/phone')}>Open Dialer</CTAButton>
                </>
              ) : (
                <>
                  <NavLink onClick={() => navigate('/login')}>Login</NavLink>
                  <CTAButton onClick={() => navigate('/register')}>Sign Up Free</CTAButton>
                </>
              )}
            </NavMenu>
            <MobileMenuToggle onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <div className="icon icon-menu">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </MobileMenuToggle>
          </Nav>
        </Header>

        {/* Mobile Menu */}
        <MobileMenu className={mobileMenuOpen ? 'active' : ''}>
          <MobileMenuHeader>
            <Logo>
              <LogoIcon />
              <span>Ubophone</span>
            </Logo>
            <MobileCloseButton onClick={() => setMobileMenuOpen(false)}>
              ✕
            </MobileCloseButton>
          </MobileMenuHeader>
          <MobileMenuLinks>
            <MobileNavLink onClick={() => setMobileMenuOpen(false)}>Home</MobileNavLink>
            {isLoggedIn ? (
              <>
                <MobileNavLink onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}>Dashboard</MobileNavLink>
                <CTAButton onClick={() => { setMobileMenuOpen(false); navigate('/phone'); }} style={{width: '100%', marginTop: '24px'}}>Open Dialer</CTAButton>
              </>
            ) : (
              <>
                <MobileNavLink onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>Login</MobileNavLink>
                <CTAButton onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} style={{width: '100%', marginTop: '24px'}}>Sign Up Free</CTAButton>
              </>
            )}
          </MobileMenuLinks>
        </MobileMenu>

        <HeroSection id="home">
          <HeroContent>
            <Title>Make International Calls<br/>Right From Your Browser</Title>
            <Subtitle>
              Call clients, banks, government offices, or any number worldwide. 
              Pay only for what you use. No contracts or hidden fees.
            </Subtitle>
            
            <PricingHighlight>
              <PricingTitle>Call anyone in <CountryFlag>
                <div className="flag-container">
                  <div className="flag-item flag-usa"></div>
                  <div className="flag-item flag-uk"></div>
                  <div className="flag-item flag-canada"></div>
                  <div className="flag-item flag-australia"></div>
                  <div className="flag-item flag-germany"></div>
                  <div className="flag-item flag-france"></div>
                  <div className="flag-item flag-japan"></div>
                  <div className="flag-item flag-china"></div>
                  <div className="flag-item flag-india"></div>
                  <div className="flag-item flag-brazil"></div>
                  <div className="flag-item flag-usa"></div>
                </div>
              </CountryFlag> →</PricingTitle>
              <PricingText>From only 0.02 USD per minute!</PricingText>
              <PricingBadge>50x cheaper than your carrier</PricingBadge>
            </PricingHighlight>
          </HeroContent>
          
          <DialerWrapper>
            <PhoneStyleDialer />
          </DialerWrapper>
        </HeroSection>

        <HowItWorksSection id="how-it-works">
          <SectionContainer>
            <SectionTitle>How It Works</SectionTitle>
            
            <StepsContainer>
              <StepCard>
                <StepIcon><div className="icon icon-form"></div></StepIcon>
                <StepTitle>Sign Up</StepTitle>
                <StepDesc>Sign up in seconds with just your email - no phone verification needed</StepDesc>
                <StepFeatures>
                  <StepFeature>No authentication required</StepFeature>
                  <StepFeature>No phone numbers required</StepFeature>
                </StepFeatures>
              </StepCard>
              
              <StepArrow>→</StepArrow>
              
              <StepCard>
                <StepIcon><div className="icon icon-credit"></div></StepIcon>
                <StepTitle>Add Credits</StepTitle>
                <StepDesc>Purchase credits and only pay for the minutes you actually use</StepDesc>
                <StepFeatures>
                  <StepFeature>No subscriptions or recurring fees</StepFeature>
                  <StepFeature>Pay only for minutes you use</StepFeature>
                </StepFeatures>
              </StepCard>
              
              <StepArrow>→</StepArrow>
              
              <StepCard>
                <StepIcon><div className="icon icon-call"></div></StepIcon>
                <StepTitle>Call Anywhere</StepTitle>
                <StepDesc>Call any landline or institution worldwide directly from your browser</StepDesc>
                <StepFeatures>
                  <StepFeature>Available in all countries</StepFeature>
                  <StepFeature>Calls routed through a secure system</StepFeature>
                </StepFeatures>
              </StepCard>
            </StepsContainer>
            
            <div style={{ textAlign: 'center' }}>
              <GetStartedButton onClick={() => navigate(isLoggedIn ? '/dashboard' : '/register')}>
                Get started
              </GetStartedButton>
            </div>
          </SectionContainer>
        </HowItWorksSection>

        <FeaturesSection id="features">
          <SectionContainer>
            <SectionTitle>Features</SectionTitle>
            
            <FeaturesGrid>
              <FeatureCard>
                <FeatureIcon><div className="icon icon-globe"></div></FeatureIcon>
                <FeatureTitle>Call Anywhere, From Anywhere</FeatureTitle>
                <FeatureDesc>Make international calls to any country without restrictions, directly from your browser</FeatureDesc>
              </FeatureCard>
              <FeatureCard>
                <FeatureIcon><div className="icon icon-phone"></div></FeatureIcon>
                <FeatureTitle>No Country Restrictions</FeatureTitle>
                <FeatureDesc>Our service works globally, allowing you to connect with people and institutions worldwide</FeatureDesc>
              </FeatureCard>
              <FeatureCard>
                <FeatureIcon><div className="icon icon-lightning"></div></FeatureIcon>
                <FeatureTitle>No Apps or Subscriptions</FeatureTitle>
                <FeatureDesc>Start calling in 2 minutes directly from your browser without installing any apps or committing to subscriptions</FeatureDesc>
              </FeatureCard>
              <FeatureCard>
                <FeatureIcon><div className="icon icon-credit"></div></FeatureIcon>
                <FeatureTitle>Credit Based, No Subscription</FeatureTitle>
                <FeatureDesc>Pay only for what you use with our flexible credit system - no recurring fees or contracts</FeatureDesc>
              </FeatureCard>
              <FeatureCard>
                <FeatureIcon><div className="icon icon-dollar"></div></FeatureIcon>
                <FeatureTitle>Buy Phone Numbers</FeatureTitle>
                <FeatureDesc>Purchase virtual phone numbers from various countries</FeatureDesc>
              </FeatureCard>
              <FeatureCard>
                <FeatureIcon><div className="icon icon-users"></div></FeatureIcon>
                <FeatureTitle>Custom Caller ID</FeatureTitle>
                <FeatureDesc>Set your own caller ID for outgoing calls</FeatureDesc>
              </FeatureCard>
              <FeatureCard>
                <FeatureIcon><div className="icon icon-lock"></div></FeatureIcon>
                <FeatureTitle>Secure and Private</FeatureTitle>
                <FeatureDesc>All calls are encrypted and your data is protected</FeatureDesc>
              </FeatureCard>
              <FeatureCard>
                <FeatureIcon><div className="icon icon-phone"></div></FeatureIcon>
                <FeatureTitle>Receive Calls In Browser</FeatureTitle>
                <FeatureDesc>Accept incoming calls directly in your browser</FeatureDesc>
              </FeatureCard>
            </FeaturesGrid>
          </SectionContainer>
        </FeaturesSection>

        <ComparisonSection>
          <SectionContainer>
            <SectionTitle style={{ color: '#000' }}>Why Choose Ubophone?</SectionTitle>
            
            <ComparisonTable>
              <TableHeader>
                <FeatureLabel>Features</FeatureLabel>
                <CompanyLabel className="ubophone">Ubophone</CompanyLabel>
                <CompanyLabel>Google Voice</CompanyLabel>
                <CompanyLabel>Viber</CompanyLabel>
              </TableHeader>
              
              <TableRow>
                <FeatureName>
                  <FeatureNameTitle>Browser-Based</FeatureNameTitle>
                  <FeatureNameDesc>Make calls directly from your web browser, no apps required</FeatureNameDesc>
                </FeatureName>
                <Check className="yes">✓</Check>
                <Check className="yes">✓</Check>
                <Check className="no">✗</Check>
              </TableRow>
              
              <TableRow>
                <FeatureName>
                  <FeatureNameTitle>No Phone Authentication Required</FeatureNameTitle>
                  <FeatureNameDesc>Start calling immediately without verifying your phone number</FeatureNameDesc>
                </FeatureName>
                <Check className="yes">✓</Check>
                <Check className="no">✗</Check>
                <Check className="no">✗</Check>
              </TableRow>
              
              <TableRow>
                <FeatureName>
                  <FeatureNameTitle>Global Coverage</FeatureNameTitle>
                  <FeatureNameDesc>Call any country worldwide without restrictions</FeatureNameDesc>
                </FeatureName>
                <Check className="yes">✓</Check>
                <Check className="no">✗</Check>
                <Check className="yes">✓</Check>
              </TableRow>
              
              <TableRow>
                <FeatureName>
                  <FeatureNameTitle>Instant Setup</FeatureNameTitle>
                  <FeatureNameDesc>No waiting time or verification process</FeatureNameDesc>
                </FeatureName>
                <Check className="yes">✓</Check>
                <Check className="no">✗</Check>
                <Check className="no">✗</Check>
              </TableRow>
              
              <TableRow>
                <FeatureName>
                  <FeatureNameTitle>No Subscription Required</FeatureNameTitle>
                  <FeatureNameDesc>Pay only for what you use</FeatureNameDesc>
                </FeatureName>
                <Check className="yes">✓</Check>
                <Check className="yes">✓</Check>
                <Check className="no">✗</Check>
              </TableRow>
              
              <TableRow>
                <FeatureName>
                  <FeatureNameTitle>Competitive Rates</FeatureNameTitle>
                  <FeatureNameDesc>Best-in-class pricing for international calls</FeatureNameDesc>
                </FeatureName>
                <Check className="yes">✓</Check>
                <Check className="no">✗</Check>
                <Check className="no">✗</Check>
              </TableRow>
              
              <TableRow>
                <FeatureName>
                  <FeatureNameTitle>No Restrictions</FeatureNameTitle>
                  <FeatureNameDesc>No country or usage limitations</FeatureNameDesc>
                </FeatureName>
                <Check className="yes">✓</Check>
                <Check className="no">✗</Check>
                <Check className="no">✗</Check>
              </TableRow>
              
              <TableRow>
                <FeatureName>
                  <FeatureNameTitle>Per-Second Billing</FeatureNameTitle>
                  <FeatureNameDesc>More accurate billing with no 60-second rounding</FeatureNameDesc>
                </FeatureName>
                <Check className="yes">✓</Check>
                <Check className="no">✗</Check>
                <Check className="no">✗</Check>
              </TableRow>
            </ComparisonTable>
            
            <MobileFeatureList>
              <MobileFeatureCard>
                <h4>✓ Browser-Based Calling</h4>
                <p>Make calls directly from your web browser, no apps required</p>
                <span className="status">Ubophone Advantage</span>
              </MobileFeatureCard>
              
              <MobileFeatureCard>
                <h4>✓ No Phone Authentication</h4>
                <p>Start calling immediately without verifying your phone number</p>
                <span className="status">Ubophone Exclusive</span>
              </MobileFeatureCard>
              
              <MobileFeatureCard>
                <h4>✓ Global Coverage</h4>
                <p>Call any country worldwide without restrictions</p>
                <span className="status">Ubophone Advantage</span>
              </MobileFeatureCard>
              
              <MobileFeatureCard>
                <h4>✓ Instant Setup</h4>
                <p>No waiting time or verification process</p>
                <span className="status">Ubophone Exclusive</span>
              </MobileFeatureCard>
              
              <MobileFeatureCard>
                <h4>✓ No Subscription Required</h4>
                <p>Pay only for what you use</p>
                <span className="status">Ubophone Advantage</span>
              </MobileFeatureCard>
              
              <MobileFeatureCard>
                <h4>✓ Competitive Rates</h4>
                <p>Best-in-class pricing for international calls</p>
                <span className="status">Ubophone Exclusive</span>
              </MobileFeatureCard>
              
              <MobileFeatureCard>
                <h4>✓ No Restrictions</h4>
                <p>No country or usage limitations</p>
                <span className="status">Ubophone Exclusive</span>
              </MobileFeatureCard>
              
              <MobileFeatureCard>
                <h4>✓ Per-Second Billing</h4>
                <p>More accurate billing with no 60-second rounding</p>
                <span className="status">Ubophone Exclusive</span>
              </MobileFeatureCard>
            </MobileFeatureList>
          </SectionContainer>
        </ComparisonSection>

        <RateCalculatorSection>
          <RateCalculatorContainer>
            <RateCalculator />
          </RateCalculatorContainer>
        </RateCalculatorSection>

        <TestimonialsSection>
          <SectionContainer>
            <SectionTitle>What Our Users Say</SectionTitle>
            
            <TestimonialsGrid>
              <TestimonialCard>
                <QuoteIcon>"</QuoteIcon>
                <TestimonialText>
                  Ubophone has completely changed how we handle international business calls. 
                  The quality is crystal clear and the pricing is unbeatable. We've saved over 70% on our monthly phone bills!
                </TestimonialText>
                <TestimonialAuthor>
                  <AuthorAvatar bg="#000">JD</AuthorAvatar>
                  <AuthorInfo>
                    <AuthorName>John Davidson</AuthorName>
                    <AuthorTitle>CEO, TechStart Inc.</AuthorTitle>
                  </AuthorInfo>
                </TestimonialAuthor>
              </TestimonialCard>
              
              <TestimonialCard>
                <QuoteIcon>"</QuoteIcon>
                <TestimonialText>
                  As a freelancer working with global clients, Ubophone is a lifesaver. 
                  No more expensive international calling cards or poor quality VOIP services. It just works!
                </TestimonialText>
                <TestimonialAuthor>
                  <AuthorAvatar bg="#333">SM</AuthorAvatar>
                  <AuthorInfo>
                    <AuthorName>Sarah Mitchell</AuthorName>
                    <AuthorTitle>Freelance Consultant</AuthorTitle>
                  </AuthorInfo>
                </TestimonialAuthor>
              </TestimonialCard>
              
              <TestimonialCard>
                <QuoteIcon>"</QuoteIcon>
                <TestimonialText>
                  The browser-based calling is genius! No downloads, no installations, just instant connectivity. 
                  Perfect for our remote team spread across 5 continents.
                </TestimonialText>
                <TestimonialAuthor>
                  <AuthorAvatar bg="#1a1a1a">AK</AuthorAvatar>
                  <AuthorInfo>
                    <AuthorName>Alex Kim</AuthorName>
                    <AuthorTitle>Operations Manager, Global Solutions</AuthorTitle>
                  </AuthorInfo>
                </TestimonialAuthor>
              </TestimonialCard>
            </TestimonialsGrid>
            
            <TestimonialsStats>
              <StatItem>
                <StatValue>4.8/5</StatValue>
                <StatLabel>Average Rating</StatLabel>
              </StatItem>
              <StatDivider />
              <StatItem>
                <StatValue>64,739+</StatValue>
                <StatLabel>Happy Users</StatLabel>
              </StatItem>
              <StatDivider />
              <StatItem>
                <StatValue>180+</StatValue>
                <StatLabel>Countries Served</StatLabel>
              </StatItem>
            </TestimonialsStats>
          </SectionContainer>
        </TestimonialsSection>

        <FAQSection id="faq">
          <FAQContainer>
            <FAQTitle>Frequently Asked Questions</FAQTitle>
            <FAQList>
              {faqData.map((faq) => (
                <FAQItem key={faq.id} className={openFAQ === faq.id ? 'active' : ''}>
                  <FAQQuestion onClick={() => toggleFAQ(faq.id)}>
                    {faq.question}
                    <FAQIcon className={openFAQ === faq.id ? 'open' : ''}>+</FAQIcon>
                  </FAQQuestion>
                  <FAQAnswer isOpen={openFAQ === faq.id}>
                    <FAQAnswerText>{faq.answer}</FAQAnswerText>
                  </FAQAnswer>
                </FAQItem>
              ))}
            </FAQList>
          </FAQContainer>
        </FAQSection>

        <CTASection>
          <SectionContainer>
            <CTATitle>Ready to experience the Ubophone difference?</CTATitle>
            <CTASubtitle>Start making affordable international calls today with no setup, no subscriptions, and no restrictions.</CTASubtitle>
            <CTAButtonLight onClick={() => navigate(isLoggedIn ? '/buy-credits' : '/register')}>
              Try Ubophone Now
            </CTAButtonLight>
          </SectionContainer>
        </CTASection>

        <Footer>
          <FooterContent>
            <FooterText>&copy; 2024 Ubophone. All rights reserved.</FooterText>
            <FooterLinks>
              <FooterLink onClick={() => navigate('/privacy-policy')}>Privacy Policy</FooterLink>
              <FooterLink onClick={() => navigate('/terms-of-service')}>Terms of Service</FooterLink>
              <FooterLink onClick={() => navigate('/cookie-policy')}>Cookie Policy</FooterLink>
            </FooterLinks>
          </FooterContent>
        </Footer>
      </Container>
    </>
  );
};

export default MonochromeHomePage;