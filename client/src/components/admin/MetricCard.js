import React from 'react';
import styled from 'styled-components';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Card = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$isLoading', '$variant'].includes(prop),
})`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  position: relative;
  transition: all 0.3s ease;
  opacity: ${props => props.$isLoading ? 0.6 : 1};
  min-height: 180px;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
    min-height: 160px;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    min-height: 140px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 0.75rem;
    gap: 0.5rem;
  }
`;

const IconWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$color', '$size'].includes(prop),
})`
  width: ${props => props.$size === 'large' ? '4rem' : '3rem'};
  height: ${props => props.$size === 'large' ? '4rem' : '3rem'};
  border-radius: 50%;
  background: ${props => props.$color || '#FFC900'};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: ${props => props.$size === 'large' ? '3.5rem' : '2.75rem'};
    height: ${props => props.$size === 'large' ? '3.5rem' : '2.75rem'};
  }

  @media (max-width: 480px) {
    width: ${props => props.$size === 'large' ? '3rem' : '2.5rem'};
    height: ${props => props.$size === 'large' ? '3rem' : '2.5rem'};
  }
`;

const TrendIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$isPositive', '$size'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: ${props => props.$size === 'large' ? '1rem' : '0.875rem'};
  font-weight: 700;
  color: ${props => props.$isPositive ? '#059669' : '#dc2626'};
  white-space: nowrap;

  @media (max-width: 480px) {
    font-size: 0.75rem;
    align-self: flex-end;
  }
`;

const CardContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h3.withConfig({
  shouldForwardProp: (prop) => !['$size'].includes(prop),
})`
  font-size: ${props => props.$size === 'large' ? '1rem' : '0.875rem'};
  font-weight: 600;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;

  @media (max-width: 480px) {
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }
`;

const Value = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$size', '$isLoading'].includes(prop),
})`
  font-size: ${props => {
    if (props.$size === 'large') return '3rem';
    if (props.$size === 'medium') return '2.5rem';
    return '2.25rem';
  }};
  font-weight: 800;
  color: #0a0f2f;
  margin: 0;
  line-height: 1;
  flex: 1;
  display: flex;
  align-items: center;

  ${props => props.$isLoading && `
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
    height: 2rem;
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `}

  @media (max-width: 768px) {
    font-size: ${props => {
      if (props.$size === 'large') return '2.5rem';
      if (props.$size === 'medium') return '2rem';
      return '1.875rem';
    }};
  }

  @media (max-width: 480px) {
    font-size: ${props => {
      if (props.$size === 'large') return '2rem';
      if (props.$size === 'medium') return '1.75rem';
      return '1.5rem';
    }};
  }
`;

const Subtitle = styled.p.withConfig({
  shouldForwardProp: (prop) => !['$size'].includes(prop),
})`
  font-size: ${props => props.$size === 'large' ? '1rem' : '0.875rem'};
  color: #64748b;
  margin: 0.5rem 0 0 0;
  line-height: 1.4;

  @media (max-width: 480px) {
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
`;

const LoadingShimmer = styled.div`
  width: 100%;
  height: 1rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin: 0.25rem 0;

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = '#FFC900',
  size = 'medium',
  isLoading = false,
  formatValue = (val) => val,
  onClick,
  className,
  children
}) => {
  const isPositiveTrend = trend === 'up' || (typeof trendValue === 'number' && trendValue >= 0);
  const TrendIcon = isPositiveTrend ? ArrowUpRight : ArrowDownRight;

  const formatTrendValue = (val) => {
    if (typeof val === 'number') {
      return Math.abs(val).toFixed(1);
    }
    return val;
  };

  return (
    <Card 
      $isLoading={isLoading} 
      $variant={size}
      onClick={onClick}
      className={className}
    >
      <CardHeader>
        <IconWrapper $color={color} $size={size}>
          {React.cloneElement(icon, {
            size: size === 'large' ? 32 : size === 'medium' ? 24 : 20,
            color: 'white'
          })}
        </IconWrapper>
        
        {(trend || trendValue !== undefined) && !isLoading && (
          <TrendIndicator $isPositive={isPositiveTrend} $size={size}>
            <TrendIcon size={size === 'large' ? 20 : 16} />
            {trendValue !== undefined ? `${formatTrendValue(trendValue)}%` : trend}
          </TrendIndicator>
        )}
      </CardHeader>

      <CardContent>
        <Title $size={size}>{title}</Title>
        
        {isLoading ? (
          <LoadingShimmer />
        ) : (
          <Value $size={size} $isLoading={isLoading}>
            {formatValue(value)}
          </Value>
        )}

        {subtitle && !isLoading && (
          <Subtitle $size={size}>{subtitle}</Subtitle>
        )}

        {children}
      </CardContent>
    </Card>
  );
};

// Pre-configured metric card variants
export const RevenueCard = (props) => (
  <MetricCard
    {...props}
    color="#10b981"
    formatValue={(val) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: val >= 1000000 ? 'compact' : 'standard'
    }).format(val)}
  />
);

export const UserCard = (props) => (
  <MetricCard
    {...props}
    color="#3b82f6"
    formatValue={(val) => {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toString();
    }}
  />
);

export const CallCard = (props) => (
  <MetricCard
    {...props}
    color="#8b5cf6"
    formatValue={(val) => {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toString();
    }}
  />
);

export const PercentageCard = (props) => (
  <MetricCard
    {...props}
    color="#f59e0b"
    formatValue={(val) => `${val.toFixed(1)}%`}
  />
);

export const TimeCard = (props) => (
  <MetricCard
    {...props}
    color="#06b6d4"
    formatValue={(val) => {
      const hours = Math.floor(val / 3600);
      const minutes = Math.floor((val % 3600) / 60);
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }}
  />
);

export default MetricCard;