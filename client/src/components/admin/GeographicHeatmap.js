import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Globe, 
  Download,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const HeatmapContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  background: ${props => props.$theme.cardBackground};
  border: 3px solid ${props => props.$theme.borderColor};
  border-radius: 0;
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #0a0f2f;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    width: 100%;
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const FilterSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 2px solid #000;
  border-radius: 0;
  font-weight: 600;
  background: white;
  color: #0a0f2f;
  cursor: pointer;
  min-width: 120px;

  &:focus {
    outline: none;
    background: #FFC900;
  }

  @media (max-width: 480px) {
    font-size: 0.875rem;
    padding: 0.375rem 0.5rem;
    min-width: 100px;
  }
`;

const ActionButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$variant', '$loading'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return '#FFC900';
      case 'secondary': return '#f8fafc';
      default: return 'white';
    }
  }};
  border: 2px solid #000;
  border-radius: 0;
  font-weight: 600;
  color: #0a0f2f;
  cursor: ${props => props.$loading ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;

  &:hover {
    transform: ${props => props.$loading ? 'none' : 'translate(-1px, -1px)'};
    box-shadow: ${props => props.$loading ? 'none' : '1px 1px 0 #000'};
  }

  svg {
    animation: ${props => props.$loading ? 'spin 1s linear infinite' : 'none'};
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
    
    span {
      display: none;
    }
  }
`;

const MapContainer = styled.div`
  flex: 1;
  min-height: 400px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    min-height: 350px;
  }

  @media (max-width: 480px) {
    min-height: 300px;
  }
`;

const WorldMap = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: url("data:image/svg+xml,%3Csvg width='800' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23cbd5e1' fill-opacity='0.4'%3E%3Cpath d='M120 50h80v40h-80zM220 80h100v60h-100zM340 70h120v50h-120zM480 90h100v40h-100zM100 150h90v50h-90zM210 180h110v60h-110zM340 160h80v70h-80zM440 140h120v80h-120zM580 170h100v50h-100z'/%3E%3C/g%3E%3C/svg%3E") center/contain no-repeat;
`;

const HeatPoint = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$intensity', '$x', '$y'].includes(prop),
})`
  position: absolute;
  left: ${props => props.$x}%;
  top: ${props => props.$y}%;
  width: ${props => Math.max(8, props.$intensity * 2)}px;
  height: ${props => Math.max(8, props.$intensity * 2)}px;
  background: radial-gradient(circle, 
    rgba(255, 201, 0, ${props => Math.min(1, props.$intensity / 100)}) 0%,
    rgba(255, 201, 0, 0.3) 50%,
    transparent 100%
  );
  border-radius: 50%;
  animation: pulse 2s infinite;
  cursor: pointer;
  transform: translate(-50%, -50%);

  &:hover {
    z-index: 10;
    transform: translate(-50%, -50%) scale(1.2);
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
`;

const Tooltip = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$visible', '$x', '$y'].includes(prop),
})`
  position: absolute;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  pointer-events: none;
  z-index: 1000;
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translate(-50%, -100%);
  transition: opacity 0.2s ease;
  white-space: nowrap;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
    padding: 0.5rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e2e8f0;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
    margin-top: 1.25rem;
    padding-top: 1.25rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
`;

const StatCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1rem;
  text-align: center;

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.25rem;

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 0.7rem;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #FFC900;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Mock geographic data - in production, this would come from your API
const mockGeographicData = [
  { country: 'United States', lat: 39.8283, lng: -98.5795, calls: 2547, users: 892, revenue: 15420 },
  { country: 'United Kingdom', lat: 55.3781, lng: -3.4360, calls: 1834, users: 643, revenue: 11280 },
  { country: 'Canada', lat: 56.1304, lng: -106.3468, calls: 1205, users: 421, revenue: 7890 },
  { country: 'Australia', lat: -25.2744, lng: 133.7751, calls: 987, users: 354, revenue: 6540 },
  { country: 'Germany', lat: 51.1657, lng: 10.4515, calls: 1456, users: 512, revenue: 9870 },
  { country: 'France', lat: 46.2276, lng: 2.2137, calls: 1123, users: 389, revenue: 7650 },
  { country: 'Japan', lat: 36.2048, lng: 138.2529, calls: 1789, users: 634, revenue: 12340 },
  { country: 'Brazil', lat: -14.2350, lng: -51.9253, calls: 854, users: 298, revenue: 5430 },
  { country: 'India', lat: 20.5937, lng: 78.9629, calls: 2134, users: 756, revenue: 8900 },
  { country: 'South Korea', lat: 35.9078, lng: 127.7669, calls: 967, users: 342, revenue: 6780 }
];

function GeographicHeatmap() {
  const { theme } = useTheme();
  const [geoData, setGeoData] = useState(mockGeographicData);
  const [filteredData, setFilteredData] = useState(mockGeographicData);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

  const fetchGeographicData = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, fetch from your API
      // const headers = adminAuthService.getAuthHeaders();
      // const response = await fetch('/api/admin/dashboard/geographic', { headers });
      // const data = await response.json();
      // setGeoData(data.data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGeoData(mockGeographicData);
    } catch (error) {
      console.error('Geographic data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGeographicData();
  }, [fetchGeographicData]);

  useEffect(() => {
    let filtered = geoData;
    
    switch (filter) {
      case 'high-volume':
        filtered = geoData.filter(item => item.calls > 1500);
        break;
      case 'high-revenue':
        filtered = geoData.filter(item => item.revenue > 10000);
        break;
      case 'emerging':
        filtered = geoData.filter(item => item.calls < 1000);
        break;
      default:
        filtered = geoData;
    }
    
    setFilteredData(filtered);
  }, [geoData, filter]);

  // Convert lat/lng to screen coordinates (simplified projection)
  const getScreenPosition = (lat, lng) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const handlePointHover = (event, data) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      data
    });
  };

  const handlePointLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, data: null });
  };

  const handleExport = () => {
    const csvContent = [
      ['Country', 'Calls', 'Users', 'Revenue'],
      ...filteredData.map(item => [item.country, item.calls, item.users, item.revenue])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'geographic_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalStats = filteredData.reduce(
    (acc, item) => ({
      calls: acc.calls + item.calls,
      users: acc.users + item.users,
      revenue: acc.revenue + item.revenue,
      countries: acc.countries + 1
    }),
    { calls: 0, users: 0, revenue: 0, countries: 0 }
  );

  return (
    <HeatmapContainer $theme={theme}>
      <Header>
        <Title>
          <Globe size={24} />
          Geographic Distribution
        </Title>
        <Controls>
          <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Regions</option>
            <option value="high-volume">High Volume</option>
            <option value="high-revenue">High Revenue</option>
            <option value="emerging">Emerging Markets</option>
          </FilterSelect>
          <ActionButton onClick={fetchGeographicData} $loading={isLoading}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </ActionButton>
          <ActionButton onClick={handleExport} $variant="secondary">
            <Download size={16} />
            <span>Export</span>
          </ActionButton>
        </Controls>
      </Header>

      <MapContainer>
        {isLoading && (
          <LoadingOverlay>
            <LoadingSpinner />
            <div>Loading geographic data...</div>
          </LoadingOverlay>
        )}
        
        <WorldMap>
          {filteredData.map((item, index) => {
            const position = getScreenPosition(item.lat, item.lng);
            const intensity = Math.max(10, (item.calls / Math.max(...geoData.map(d => d.calls))) * 100);
            
            return (
              <HeatPoint
                key={index}
                $x={position.x}
                $y={position.y}
                $intensity={intensity}
                onMouseEnter={(e) => handlePointHover(e, item)}
                onMouseLeave={handlePointLeave}
              />
            );
          })}
        </WorldMap>

        <Tooltip
          $visible={tooltip.visible}
          $x={tooltip.x}
          $y={tooltip.y}
        >
          {tooltip.data && (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {tooltip.data.country}
              </div>
              <div>Calls: {tooltip.data.calls.toLocaleString()}</div>
              <div>Users: {tooltip.data.users.toLocaleString()}</div>
              <div>Revenue: ${tooltip.data.revenue.toLocaleString()}</div>
            </div>
          )}
        </Tooltip>
      </MapContainer>

      <StatsGrid>
        <StatCard>
          <StatValue>{totalStats.countries}</StatValue>
          <StatLabel>Countries</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{totalStats.calls.toLocaleString()}</StatValue>
          <StatLabel>Total Calls</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{totalStats.users.toLocaleString()}</StatValue>
          <StatLabel>Active Users</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>${totalStats.revenue.toLocaleString()}</StatValue>
          <StatLabel>Revenue</StatLabel>
        </StatCard>
      </StatsGrid>
    </HeatmapContainer>
  );
}

export default GeographicHeatmap;