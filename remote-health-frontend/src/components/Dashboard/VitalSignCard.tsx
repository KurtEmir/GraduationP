import React from 'react';

interface VitalSignCardProps {
  title: string;
  value: number | string | undefined;
  unit: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
  normalRange?: string;
  isAbnormal?: boolean;
}

const VitalSignCard: React.FC<VitalSignCardProps> = ({
  title,
  value,
  unit,
  icon,
  color = 'blue',
  trend = 'stable',
  normalRange,
  isAbnormal = false
}) => {
  const getColorClasses = (color: string) => {
    if (isAbnormal) {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    
    switch (color) {
      case 'red':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'blue':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'stable':
      default:
        return '→';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getColorClasses(color)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon && <div className="mr-2">{icon}</div>}
          <div>
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
            <div className="flex items-center mt-1">
              <span className="text-2xl font-bold">{value ?? '-'}</span>
              <span className="text-sm ml-1">{unit}</span>
            </div>
            {normalRange && (
              <div className="text-xs text-gray-500 mt-1">
                Normal: {normalRange}
              </div>
            )}
          </div>
        </div>
        <div className="text-lg">
          {getTrendIcon(trend)}
        </div>
      </div>
    </div>
  );
};

export default VitalSignCard;
