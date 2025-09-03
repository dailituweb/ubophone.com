import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { ChevronDown } from 'lucide-react';

const Container = styled.div`
  min-height: calc(100vh - 80px);
  background: #FAFAFA;
  padding: 1.5rem;
  padding-bottom: 2rem;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem calc(80px + env(safe-area-inset-bottom)) 0.5rem;
    min-height: calc(100vh - 60px);
  }
`;

const ContentWrapper = styled.div`
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 100%;
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
`;


const CalculatorContainer = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
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

  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #000;
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #000;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
`;

const SelectContainer = styled.div`
  position: relative;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  color: #000;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  appearance: none;
  
  &:focus {
    outline: none;
    border-color: #FFC900;
    box-shadow: 0 4px 12px rgba(255, 201, 0, 0.2);
  }

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  option {
    background: white;
    color: #000;
    font-weight: 500;
    padding: 0.5rem;
  }
`;

const SelectIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #000;
  pointer-events: none;

  svg {
    width: 16px;
    height: 16px;
  }
`;


const DurationPresets = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const PresetButton = styled.button`
  padding: 0.5rem 0.75rem;
  border-radius: 0;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  transition: all 0.3s ease;
  border: 2px solid #000;
  cursor: pointer;

  ${props => props.$active ? `
    background: #FFC900;
    color: #000;
  ` : `
    background: white;
    color: #000;

    &:hover {
      background: #FFC900;
    }
  `}
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  color: #000;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #FFC900;
    box-shadow: 0 4px 12px rgba(255, 201, 0, 0.2);
  }

  &::placeholder {
    color: #666;
    font-weight: 500;
  }
`;

const ResultContainer = styled.div`
  background: #FFC900;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  margin-top: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const CountryInfo = styled.div`
  margin-bottom: 1.5rem;
`;

const CountryFlag = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const CountryName = styled.h3`
  font-size: 1.25rem;
  font-weight: 800;
  color: #000;
  margin-bottom: 0.25rem;
  text-transform: uppercase;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const CountryRegion = styled.p`
  color: #666;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const RatesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const RateCard = styled.div`
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  padding: 1rem;
  text-align: center;
`;

const RateType = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const RateValue = styled.div`
  font-size: 1rem;
  font-weight: 800;
  color: #000;
`;

const CalculationResult = styled.div`
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const CallTypeDisplay = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const DurationDisplay = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 1rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const TotalCost = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #000;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
`;

const SavingsCard = styled.div`
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  padding: 1rem;
  text-align: center;
  color: #000;
  font-weight: 600;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #666;
  font-weight: 600;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #666;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  font-weight: 600;
`;

const RatesPage = () => {
  const [countries, setCountries] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [duration, setDuration] = useState('1');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 固定使用mobile类型，因为删除了通话类型选择
  const callType = 'mobile';

  // 预设时长选项（分钟）
  const durationPresets = [
    { value: '1', label: '1 min' },
    { value: '5', label: '5 min' },
    { value: '10', label: '10 min' },
    { value: '30', label: '30 min' },
    { value: '60', label: '1 hour' }
  ];

  // 获取费率数据
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('/api/calls/rates');
        const data = await response.json();
        setCountries(data);

        console.log(`✅ Loaded ${Object.keys(data).length} countries for rate calculation`);
      } catch (error) {
        console.error('Error fetching rates:', error);
      }
    };

    fetchRates();
  }, []);

  // 计算费用
  const calculateRate = useCallback(async () => {
    if (!duration || !selectedCountry) return;

    setLoading(true);
    try {
      const response = await fetch('/api/calls/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country: selectedCountry,
          duration: parseFloat(duration),
          unit: 'minutes',
          callType: callType
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.calculation);
      }
    } catch (error) {
      console.error('Error calculating rate:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCountry, duration, callType]);

  // 当选择的国家、时长或通话类型改变时重新计算
  useEffect(() => {
    if (selectedCountry && duration) {
      calculateRate();
    }
  }, [selectedCountry, duration, callType, calculateRate]);

  // 防止页面滚动重置的处理
  const handleDurationPresetClick = (value) => {
    // 保存当前滚动位置
    const currentScrollY = window.scrollY;
    
    setDuration(value);
    
    // 在下一个事件循环中恢复滚动位置
    setTimeout(() => {
      window.scrollTo(0, currentScrollY);
    }, 0);
  };


  return (
    <Container>
      <ContentWrapper>
        {/* Calculator */}
        <CalculatorContainer>
          {/* 国家选择 */}
          <FormGroup>
            <Label>Select Country</Label>
            <SelectContainer>
              <Select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                {Object.entries(countries)
                  .sort(([,a], [,b]) => a.name.localeCompare(b.name))
                  .map(([countryCode, countryData]) => (
                    <option key={countryCode} value={countryCode}>
                      {countryData.flag} {countryData.name}
                    </option>
                  ))}
              </Select>
              <SelectIcon>
                <ChevronDown />
              </SelectIcon>
            </SelectContainer>
          </FormGroup>


          {/* 时长选择 */}
          <FormGroup>
            <Label>Call Duration</Label>
            <DurationPresets>
              {durationPresets.map(preset => (
                <PresetButton
                  key={preset.value}
                  $active={duration === preset.value}
                  onClick={() => handleDurationPresetClick(preset.value)}
                >
                  {preset.label}
                </PresetButton>
              ))}
            </DurationPresets>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Custom duration (minutes)"
              min="0"
              step="0.1"
            />
          </FormGroup>

          {/* 计算结果 */}
          {loading ? (
            <LoadingContainer>
              Calculating...
            </LoadingContainer>
          ) : result ? (
            <ResultContainer>
              {/* 国家信息 */}
              <CountryInfo>
                <CountryFlag>{result.flag}</CountryFlag>
                <CountryName>{result.country}</CountryName>
                <CountryRegion>{result.region}</CountryRegion>
              </CountryInfo>

              {/* 费率显示 */}
              <RatesGrid>
                <RateCard>
                  <RateType>📱 Mobile Rate</RateType>
                  <RateValue>${result.rates.mobile.toFixed(4)}/min</RateValue>
                </RateCard>
                <RateCard>
                  <RateType>📞 Landline Rate</RateType>
                  <RateValue>${result.rates.landline.toFixed(4)}/min</RateValue>
                </RateCard>
              </RatesGrid>

              {/* 费用计算 */}
              <CalculationResult>
                <CallTypeDisplay>
                  {result.callType === 'mobile' ? '📱' : '📞'} {result.callType.charAt(0).toUpperCase() + result.callType.slice(1)} Call
                </CallTypeDisplay>
                <DurationDisplay>
                  {result.duration.billableMinutes} minute{result.duration.billableMinutes !== 1 ? 's' : ''}
                </DurationDisplay>
                <TotalCost>
                  {result.cost.formatted}
                </TotalCost>
              </CalculationResult>

              {/* 节省显示 */}
              {result.savings.applicable && result.savings.amount > 0 && (
                <SavingsCard>
                  💰 You save {result.savings.formatted} ({result.savings.percent}%) by choosing landline
                </SavingsCard>
              )}
            </ResultContainer>
          ) : (
            <EmptyState>
              <EmptyIcon>📊</EmptyIcon>
              <EmptyText>Select a country and duration to see rates</EmptyText>
            </EmptyState>
          )}
        </CalculatorContainer>
      </ContentWrapper>
    </Container>
  );
};

export default RatesPage;