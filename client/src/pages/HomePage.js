import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Globe, 
  CreditCard, 
  Shield, 
  Headphones, 
  Phone, 
  DollarSign, 
  Clock, 
  Lock,
  Gift,
  Star,
  CheckCircle,
  Award,
  Timer,
  Check,
  X,
  ChevronDown,
  Monitor,
  Wifi,
  Settings,
  BarChart3
} from 'lucide-react';
import Dialer from '../components/Dialer';
import { useAuth } from '../context/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  background: #0a0f2f;
`;

const HeroSection = styled.div`
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
    min-height: calc(100vh - 60px);
  }
`;

const FeaturesSection = styled.div`
  padding: 4rem 2rem;
  background: #ffffff;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const FeaturesContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const FeaturesTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;
  color: #000000;

  @media (max-width: 768px) {
    font-size: 2rem;
  }

  @media (max-width: 480px) {
    font-size: 1.7rem;
  }
`;

const FeaturesSubtitle = styled.p`
  font-size: 1.2rem;
  color: #666;
  text-align: center;
  margin-bottom: 3rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const FeatureCard = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 2rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: #FFC900;
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(255, 201, 0, 0.1);
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem;
  }
`;

const FeatureIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 0;
  background: #FFC900;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  margin-bottom: 1.5rem;
  border: 3px solid #000000;

  svg {
    width: 28px;
    height: 28px;
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 600;
  color: #000000;
  margin-bottom: 0.75rem;
`;

const FeatureDescription = styled.p`
  color: #666;
  line-height: 1.6;
  font-size: 1rem;
`;

const CTASection = styled.div`
  text-align: center;
  padding: 2rem;
  background: #FFC900;
  border: 3px solid #000000;
  border-radius: 0;
`;

const CTATitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 600;
  color: #000000;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.3rem;
  }
`;

const CTADescription = styled.p`
  color: #000000;
  margin-bottom: 2rem;
  font-size: 1.1rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 0.95rem;
  }
`;

const CTAButton = styled.button`
  padding: 1rem 2.5rem;
  background: #000000;
  border: 3px solid #000000;
  border-radius: 0;
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 768px) {
    padding: 0.875rem 2rem;
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
  }
`;

// 社会认同和信任信号
const TrustSection = styled.div`
  padding: 3rem 2rem;
  background: #ffffff;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const TrustContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const StatCard = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 2rem 1rem;
  text-align: center;

  @media (max-width: 768px) {
    padding: 1.5rem 0.75rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem 0.5rem;
  }
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #FFC900;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }

  @media (max-width: 480px) {
    font-size: 1.7rem;
  }
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
`;

const TestimonialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }
`;

const TestimonialCard = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
  text-align: left;
`;

const TestimonialText = styled.p`
  color: #666;
  font-style: italic;
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const TestimonialAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const AuthorAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 0;
  background: #FFC900;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  font-weight: 600;
  border: 3px solid #000000;
`;

const AuthorInfo = styled.div``;

const AuthorName = styled.div`
  color: #000000;
  font-weight: 600;
  font-size: 0.9rem;
`;

const AuthorTitle = styled.div`
  color: #666;
  font-size: 0.8rem;
`;

const StarRating = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
`;

// 紧迫感和稀缺性
const UrgencySection = styled.div`
  background: #ffffff;
  border: 3px solid #ef4444;
  border-radius: 0;
  padding: 1.5rem;
  margin: 2rem 0;
  text-align: center;
`;

const UrgencyTitle = styled.h3`
  color: #ef4444;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const UrgencyText = styled.p`
  color: #666;
  font-size: 0.9rem;
`;

// 风险消除
const GuaranteeSection = styled.div`
  background: #FFC900;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 2rem;
  text-align: center;
  margin: 2rem 0;
`;

const GuaranteeTitle = styled.h3`
  color: #000000;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const GuaranteeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const GuaranteeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #000000;
`;

// 竞品对比图表
const ComparisonSection = styled.div`
  margin: 3rem 0;
`;

const ComparisonChart = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`;

const ComparisonHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  background: #0a0f2f;
  padding: 1.5rem 2rem;
  border-bottom: 3px solid #000000;
  
  @media (max-width: 768px) {
    grid-template-columns: 2fr 1fr 1fr 1fr;
    padding: 1rem;
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }
`;

const HeaderTitle = styled.div`
  color: #ffffff;
  font-weight: 700;
  font-size: 1.1rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const CompetitorName = styled.div`
  color: #FFC900;
  font-weight: 700;
  font-size: 1.1rem;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const OtherCompetitor = styled.div`
  color: #9ca3af;
  font-weight: 600;
  font-size: 1rem;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const ComparisonRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  padding: 1.5rem 2rem;
  border-bottom: 3px solid #000000;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }

  &:nth-child(even) {
    background: #f0f0f0;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.5rem;
  }
`;

const FeatureInfo = styled.div`
  text-align: left;
`;

const FeatureName = styled.div`
  color: #000000;
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const FeatureDesc = styled.div`
  color: #666;
  font-size: 0.85rem;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const ComparisonIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CheckIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 0;
  background: #FFC900;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  border: 3px solid #000000;
  
  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 480px) {
    width: 24px;
    height: 24px;

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const CrossIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 0;
  background: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  border: 3px solid #000000;
  
  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 480px) {
    width: 24px;
    height: 24px;

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const PricingInfo = styled.div`
  text-align: center;
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
  
  &.highlight {
    color: #FFC900;
    font-weight: 700;
  }
  
  &.expensive {
    color: #ef4444;
    font-weight: 600;
  }
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
  color: #000000;

  @media (max-width: 768px) {
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
    margin-bottom: 1.25rem;
  }
`;

// 特征展示部分
const HighlightSection = styled.div`
  padding: 4rem 2rem;
  background: #0a0f2f;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const HighlightContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const HighlightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
`;

const HighlightCard = styled.div`
  text-align: center;
  padding: 2rem 1rem;

  @media (max-width: 768px) {
    padding: 1.5rem 0.75rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem 0.5rem;
  }
`;

const HighlightIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 0;
  background: #FFC900;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 30px rgba(255, 201, 0, 0.3);
  border: 3px solid #000000;

  svg {
    width: 36px;
    height: 36px;
  }
`;

const HighlightTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.75rem;
`;

const HighlightDesc = styled.p`
  color: #ffffff;
  line-height: 1.6;
  font-size: 0.95rem;
`;

// FAQ部分
const FAQSection = styled.div`
  padding: 4rem 2rem;
  background: #ffffff;

  @media (max-width: 768px) {
    padding: 2rem 1rem;
  }
`;

const FAQContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const FAQList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FAQItem = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: #FFC900;
  }
`;

const FAQQuestion = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$isOpen'].includes(prop),
})`
  width: 100%;
  padding: 1.5rem 2rem;
  background: none;
  border: none;
  color: #000000;
  font-size: 1.1rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;

  &:hover {
    color: #FFC900;
  }

  svg {
    width: 20px;
    height: 20px;
    color: #FFC900;
    transition: transform 0.3s ease;
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  }

  @media (max-width: 768px) {
    padding: 1.25rem 1.5rem;
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    padding: 1rem 1.25rem;
    font-size: 0.95rem;
  }
`;

const FAQAnswer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$isOpen'].includes(prop),
})`
  padding: ${props => props.$isOpen ? '0 2rem 1.5rem 2rem' : '0'};
  max-height: ${props => props.$isOpen ? '200px' : '0'};
  overflow: hidden;
  transition: all 0.3s ease;
  color: #666;
  line-height: 1.6;
  font-size: 0.95rem;

  @media (max-width: 768px) {
    padding: ${props => props.$isOpen ? '0 1.5rem 1.25rem 1.5rem' : '0'};
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    padding: ${props => props.$isOpen ? '0 1.25rem 1rem 1.25rem' : '0'};
    font-size: 0.85rem;
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  max-width: 1200px;
  width: 100%;
  align-items: center;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  @media (max-width: 768px) {
    gap: 1.5rem;
  }

  @media (max-width: 480px) {
    gap: 1rem;
  }
`;

const LeftSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const MainHeading = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.1;
  color: #FFC900;

  @media (max-width: 968px) {
    font-size: 3rem;
  }

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }

  @media (max-width: 480px) {
    font-size: 2rem;
    line-height: 1.2;
  }
`;

const Description = styled.p`
  font-size: 1.2rem;
  color: #ffffff;
  line-height: 1.6;
  max-width: 500px;

  @media (max-width: 968px) {
    max-width: 100%;
  }

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: #0a0f2f;
  border: 3px solid #000000;
  border-radius: 0;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  max-width: fit-content;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(10, 15, 47, 0.3);
  }

  svg {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 968px) {
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    padding: 0.875rem 1.75rem;
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
  }
`;

const HeroPricingInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PriceTag = styled.div`
  font-size: 1rem;
  color: #FFC900;
  font-weight: 600;
`;

const CompareTag = styled.div`
  background: #0a0f2f;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 500;
  max-width: fit-content;
  margin: 0;
  text-align: center;
  border: 3px solid #000000;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
    padding: 0.2rem 0.6rem;
    margin: 0 auto;
  }
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
    margin: 0 auto;
  }
`;

const RightSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DialerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.75rem;
  max-width: 100%;
  
  /* 确保拨号器在较小屏幕上能完全显示 */
  @media (max-width: 968px) {
    padding: 0.5rem;
  }
  
  @media (max-width: 768px) {
    padding: 0.25rem;
  }
  
  @media (max-width: 480px) {
    padding: 0;
  }
`;

const FlagContainer = styled.span`
  display: inline-block;
  font-size: 1.2rem;
  margin-right: 0.5rem;
  animation: slideUp 0.5s ease-in-out;
  
  @keyframes slideUp {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState(null);
  const [currentFlagIndex, setCurrentFlagIndex] = useState(0);

  // 国旗数据
  const flags = ['🇺🇸', '🇨🇳', '🇯🇵', '🇬🇧', '🇩🇪', '🇫🇷', '🇨🇦', '🇦🇺', '🇧🇷', '🇮🇳', '🇰🇷', '🇮🇹', '🇪🇸', '🇷🇺', '🇳🇱', '🇸🇪'];

  // 每2秒切换国旗
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFlagIndex((prevIndex) => (prevIndex + 1) % flags.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [flags.length]);


  const handleGetStarted = () => {
    if (user) {
      // User is logged in, scroll to dialer or show some action
      const dialerSection = document.querySelector('.dialer-container');
      if (dialerSection) {
        dialerSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/register');
    }
  };

  const features = [
    {
      icon: <Globe />,
      title: "Pure Browser-Based Calling",
      description: "No downloads required! Make and receive calls instantly with just a browser. Get started in 2 minutes without apps, plugins, or subscriptions."
    },
    {
      icon: <CreditCard />,
      title: "Flexible Pay-As-You-Go Credits",
      description: "Prepaid credit system with no hidden fees. Pay only for what you use - no monthly fees, contracts, or commitments. Transparent and controllable spending."
    },
    {
      icon: <DollarSign />,
      title: "Global Coverage + Ultra-Low Rates",
      description: "Connect to 220+ countries and regions. US calls from just $0.02/minute - up to 50x cheaper than traditional carriers."
    },
    {
      icon: <Phone />,
      title: "Two-Way Browser Calling",
      description: "Not just outbound calls! Receive incoming calls directly in your browser without additional devices or number forwarding."
    },
    {
      icon: <Shield />,
      title: "Custom Caller ID & Virtual Numbers",
      description: "Purchase virtual numbers from various countries and set custom Caller IDs to enhance professionalism and connection rates."
    },
    {
      icon: <Clock />,
      title: "Real-Time Credits & Call Details",
      description: "Monitor credit balance, call duration, and cost details in real-time. Auto-recharge available to prevent call interruptions."
    },
    {
      icon: <Headphones />,
      title: "24/7 Multilingual Support",
      description: "Round-the-clock customer service in 20+ languages. Most inquiries are answered within hours."
    },
    {
      icon: <Lock />,
      title: "Privacy & Security",
      description: "All calls are SSL encrypted. We don't store user content and strictly protect personal and business data."
    },
    {
      icon: <Gift />,
      title: "Free First Call Experience",
      description: "New users get one free call to test quality and workflow before making any investment."
    }
  ];

  const stats = [
    { number: "150K+", label: "Happy Customers" },
    { number: "98.7%", label: "Call Success Rate" },
    { number: "220+", label: "Countries Covered" },
    { number: "24/7", label: "Customer Support" },
    { number: "$2.8M", label: "Saved by Customers" }
  ];

  const testimonials = [
    {
              text: "Ubophone saved our company over $15,000 in international calling costs last year. The quality is amazing and setup took literally 2 minutes.",
      author: "Sarah Chen",
      title: "CEO, TechStartup Inc.",
      rating: 5,
      avatar: "SC"
    },
    {
              text: "As a consultant working with global clients, I need reliable international calling. Ubophone has never let me down - crystal clear calls every time.",
      author: "Marcus Johnson",
      title: "Business Consultant",
      rating: 5,
      avatar: "MJ"
    },
    {
              text: "The virtual numbers feature is a game-changer for our sales team. Our conversion rate increased by 40% after implementing Ubophone.",
      author: "Elena Rodriguez",
      title: "Sales Director, GlobalCorp",
      rating: 5,
      avatar: "ER"
    }
  ];

  const guarantees = [
    { icon: <CheckCircle />, text: "99.9% Uptime Guarantee" },
    { icon: <Timer />, text: "30-Day Money Back" },
    { icon: <Shield />, text: "Enterprise Security" },
    { icon: <Award />, text: "24/7 Priority Support" }
  ];

  const highlights = [
    {
      icon: <Monitor />,
      title: "Browser-Based Technology",
      description: "Advanced WebRTC technology enables crystal-clear calls directly from your browser without any downloads or installations."
    },
    {
      icon: <Wifi />,
      title: "Global Network Infrastructure",
      description: "Our worldwide network of premium carriers ensures reliable connections and superior call quality to 220+ countries."
    },
    {
      icon: <Settings />,
      title: "Enterprise-Grade Features",
      description: "Virtual numbers, custom caller IDs, call recording, and advanced analytics designed for business professionals."
    },
    {
      icon: <BarChart3 />,
      title: "Real-Time Analytics",
      description: "Comprehensive call analytics, cost tracking, and detailed reporting to help you optimize your communication strategy."
    }
  ];

  const faqs = [
    {
      question: "How does Ubophone work without downloading any software?",
      answer: "Ubophone uses advanced WebRTC technology built into modern browsers. Simply visit our website, create an account, and start calling immediately. No downloads, plugins, or software installations required!"
    },
    {
      question: "What are the call rates for international calls?",
      answer: "Our rates start from just $0.02/minute for US calls and vary by destination. We offer some of the most competitive rates in the industry - typically 50x cheaper than traditional carriers. You can view detailed rates for all countries on our pricing page."
    },
    {
      question: "Do I need to verify my phone number to use the service?",
      answer: "No! Unlike most other services, Ubophone doesn't require phone number verification. You can start making calls immediately after creating your account and adding credits."
    },
    {
      question: "Can I receive calls on Ubophone?",
      answer: "Yes! Ubophone supports both outbound and inbound calls. You can purchase virtual numbers from various countries to receive calls directly in your browser."
    },
    {
      question: "How does the credit system work?",
      answer: "Ubophone uses a prepaid credit system. Add credits to your account and pay only for what you use. There are no monthly fees, contracts, or hidden charges. Credits never expire and you can add more anytime."
    },
    {
      question: "Is Ubophone secure for business calls?",
      answer: "Absolutely! All calls are encrypted using SSL/TLS protocols. We don't store call content and comply with enterprise security standards. Your privacy and data security are our top priorities."
    },
    {
      question: "Which countries can I call with Ubophone?",
      answer: "Ubophone supports calls to 220+ countries and territories worldwide. Unlike many competitors, we have no geographic restrictions or blocked destinations."
    },
    {
      question: "Can I use Ubophone on mobile devices?",
      answer: "Yes! Ubophone works on any device with a modern browser - desktop, laptop, tablet, or smartphone. The interface automatically adapts to your device for the best experience."
    },
    {
      question: "What if I'm not satisfied with the service?",
      answer: "We offer a 30-day money-back guarantee. If you're not completely satisfied with Ubophone, contact our support team for a full refund of your unused credits."
    },
    {
      question: "How quickly can I start making calls?",
      answer: "You can start calling within 2 minutes! Simply register, add credits to your account, and start dialing. No waiting periods, verification processes, or setup delays."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <Container>
      <HeroSection>
        <MainContent>
          <LeftSection>
            <MainHeading>
              Make International Calls Right From Your Browser
            </MainHeading>
            
            <Description>
              Call clients, banks, government offices, or any number worldwide. 
              Pay only for what you use. No contracts or hidden fees.
            </Description>

            <ActionButton onClick={handleGetStarted}>
              Call anyone in{' '}
              <FlagContainer key={currentFlagIndex}>
                {flags[currentFlagIndex]}
              </FlagContainer>
              {' '}→
            </ActionButton>

            <HeroPricingInfo>
              <PriceTag>From only 0.02 USD per minute!</PriceTag>
              <CompareTag>50x cheaper than your carrier</CompareTag>
            </HeroPricingInfo>
          </LeftSection>

          <RightSection>
            <DialerWrapper className="dialer-container">
              <Dialer />
            </DialerWrapper>
          </RightSection>
        </MainContent>
      </HeroSection>

      {/* Social Proof & Trust Signals */}
      <TrustSection>
        <TrustContainer>
          <SectionTitle>Trusted by 150,000+ Users Worldwide</SectionTitle>
          
          <StatsRow>
            {stats.map((stat, index) => (
              <StatCard key={index}>
                <StatNumber>{stat.number}</StatNumber>
                <StatLabel>{stat.label}</StatLabel>
              </StatCard>
            ))}
          </StatsRow>

          <TestimonialsGrid>
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index}>
                <StarRating>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="#FFC900" color="#FFC900" />
                  ))}
                </StarRating>
                <TestimonialText>"{testimonial.text}"</TestimonialText>
                <TestimonialAuthor>
                  <AuthorAvatar>{testimonial.avatar}</AuthorAvatar>
                  <AuthorInfo>
                    <AuthorName>{testimonial.author}</AuthorName>
                    <AuthorTitle>{testimonial.title}</AuthorTitle>
                  </AuthorInfo>
                </TestimonialAuthor>
              </TestimonialCard>
            ))}
          </TestimonialsGrid>
        </TrustContainer>
      </TrustSection>

      <FeaturesSection>
        <FeaturesContainer>
          <FeaturesTitle>Why Choose Ubophone?</FeaturesTitle>
          <FeaturesSubtitle>
            Our advantages make international calling simple, affordable, and professional
          </FeaturesSubtitle>
          
          <FeaturesGrid>
            {features.map((feature, index) => (
              <FeatureCard key={index}>
                <FeatureIcon>
                  {feature.icon}
                </FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </FeaturesGrid>

          {/* Competitive Comparison Chart */}
          <ComparisonSection>
            <SectionTitle>Why Choose Ubophone?</SectionTitle>
            <ComparisonChart>
              <ComparisonHeader>
                <HeaderTitle>Features</HeaderTitle>
                <CompetitorName>Ubophone</CompetitorName>
                <OtherCompetitor>Google Voice</OtherCompetitor>
                <OtherCompetitor>Skype</OtherCompetitor>
              </ComparisonHeader>
              
              <ComparisonRow>
                <FeatureInfo>
                  <FeatureName>Browser-Based</FeatureName>
                  <FeatureDesc>Make calls directly from your web browser, no apps required</FeatureDesc>
                </FeatureInfo>
                <ComparisonIcon>
                  <CheckIcon><Check /></CheckIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CheckIcon><Check /></CheckIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CrossIcon><X /></CrossIcon>
                </ComparisonIcon>
              </ComparisonRow>

              <ComparisonRow>
                <FeatureInfo>
                  <FeatureName>No Phone Authentication Required</FeatureName>
                  <FeatureDesc>Start calling immediately without verifying your phone number</FeatureDesc>
                </FeatureInfo>
                <ComparisonIcon>
                  <CheckIcon><Check /></CheckIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CrossIcon><X /></CrossIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CrossIcon><X /></CrossIcon>
                </ComparisonIcon>
              </ComparisonRow>

              <ComparisonRow>
                <FeatureInfo>
                  <FeatureName>Global Coverage</FeatureName>
                  <FeatureDesc>Call any country worldwide without restrictions</FeatureDesc>
                </FeatureInfo>
                <ComparisonIcon>
                  <CheckIcon><Check /></CheckIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CrossIcon><X /></CrossIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CheckIcon><Check /></CheckIcon>
                </ComparisonIcon>
              </ComparisonRow>

              <ComparisonRow>
                <FeatureInfo>
                  <FeatureName>Instant Setup</FeatureName>
                  <FeatureDesc>No waiting time or verification process</FeatureDesc>
                </FeatureInfo>
                <ComparisonIcon>
                  <CheckIcon><Check /></CheckIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CrossIcon><X /></CrossIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CrossIcon><X /></CrossIcon>
                </ComparisonIcon>
              </ComparisonRow>

              <ComparisonRow>
                <FeatureInfo>
                  <FeatureName>No Subscription Required</FeatureName>
                  <FeatureDesc>Pay only for what you use</FeatureDesc>
                </FeatureInfo>
                <ComparisonIcon>
                  <CheckIcon><Check /></CheckIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CheckIcon><Check /></CheckIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CrossIcon><X /></CrossIcon>
                </ComparisonIcon>
              </ComparisonRow>

              <ComparisonRow>
                <FeatureInfo>
                  <FeatureName>Competitive Rates</FeatureName>
                  <FeatureDesc>Best-in-class pricing for international calls</FeatureDesc>
                </FeatureInfo>
                <ComparisonIcon>
                  <CheckIcon><Check /></CheckIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CrossIcon><X /></CrossIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CrossIcon><X /></CrossIcon>
                </ComparisonIcon>
              </ComparisonRow>

              <ComparisonRow>
                <FeatureInfo>
                  <FeatureName>No Restrictions</FeatureName>
                  <FeatureDesc>No country or usage limitations</FeatureDesc>
                </FeatureInfo>
                <ComparisonIcon>
                  <CheckIcon><Check /></CheckIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CrossIcon><X /></CrossIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CrossIcon><X /></CrossIcon>
                </ComparisonIcon>
              </ComparisonRow>

              <ComparisonRow>
                <FeatureInfo>
                  <FeatureName>Per-Second Billing</FeatureName>
                  <FeatureDesc>More accurate billing with no 60-second rounding</FeatureDesc>
                </FeatureInfo>
                <ComparisonIcon>
                  <CheckIcon><Check /></CheckIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CrossIcon><X /></CrossIcon>
                </ComparisonIcon>
                <ComparisonIcon>
                  <CrossIcon><X /></CrossIcon>
                </ComparisonIcon>
              </ComparisonRow>

              <ComparisonRow>
                <FeatureInfo>
                  <FeatureName>Pricing Model</FeatureName>
                  <FeatureDesc></FeatureDesc>
                </FeatureInfo>
                <PricingInfo className="highlight">
                  Pay-as-you-go with competitive rates
                </PricingInfo>
                <PricingInfo>
                  Free for US calls, international rates apply
                </PricingInfo>
                <PricingInfo className="expensive">
                  Subscription + per-minute rates
                </PricingInfo>
              </ComparisonRow>
            </ComparisonChart>
          </ComparisonSection>

          {/* Urgency & Scarcity */}
          <UrgencySection>
            <UrgencyTitle>🔥 Limited Time: Double Your First Purchase</UrgencyTitle>
            <UrgencyText>
              New users get 100% bonus credits on their first purchase (up to $50). 
              This month only - 2,847 users have already claimed this offer.
            </UrgencyText>
          </UrgencySection>

          {/* Risk Removal */}
          <GuaranteeSection>
            <GuaranteeTitle>Our 100% Risk-Free Promise</GuaranteeTitle>
            <GuaranteeGrid>
              {guarantees.map((guarantee, index) => (
                <GuaranteeItem key={index}>
                  {guarantee.icon}
                  <span>{guarantee.text}</span>
                </GuaranteeItem>
              ))}
            </GuaranteeGrid>
          </GuaranteeSection>

          <CTASection>
            <CTATitle>Ready to Start Saving on International Calls?</CTATitle>
            <CTADescription>
              Join 150,000+ satisfied customers. Get your free call + double credits bonus today!
            </CTADescription>
            <CTAButton onClick={handleGetStarted}>
              {user ? 'Claim Your Bonus & Start Calling' : 'Get Free Call + Double Bonus'}
            </CTAButton>
          </CTASection>
        </FeaturesContainer>
      </FeaturesSection>

      {/* Technology Highlights */}
      <HighlightSection>
        <HighlightContainer>
          <SectionTitle>Powered by Advanced Technology</SectionTitle>
          <HighlightGrid>
            {highlights.map((highlight, index) => (
              <HighlightCard key={index}>
                <HighlightIcon>
                  {highlight.icon}
                </HighlightIcon>
                <HighlightTitle>{highlight.title}</HighlightTitle>
                <HighlightDesc>{highlight.description}</HighlightDesc>
              </HighlightCard>
            ))}
          </HighlightGrid>
        </HighlightContainer>
      </HighlightSection>

      {/* FAQ Section */}
      <FAQSection>
        <FAQContainer>
          <SectionTitle>Frequently Asked Questions</SectionTitle>
          <FAQList>
            {faqs.map((faq, index) => (
              <FAQItem key={index}>
                <FAQQuestion 
                  $isOpen={openFAQ === index}
                  onClick={() => toggleFAQ(index)}
                >
                  {faq.question}
                  <ChevronDown />
                </FAQQuestion>
                <FAQAnswer $isOpen={openFAQ === index}>
                  {faq.answer}
                </FAQAnswer>
              </FAQItem>
            ))}
          </FAQList>
        </FAQContainer>
      </FAQSection>
    </Container>
  );
}

export default HomePage; 