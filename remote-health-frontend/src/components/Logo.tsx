import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
  linkTo?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  showText = true, 
  className = '', 
  linkTo = '/dashboard' 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const iconSizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-7 h-7',
    large: 'w-10 h-10'
  };

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl'
  };

  const LogoContent = () => (
    <div className={`flex items-center space-x-3 group ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-emerald-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden`}>
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Medical cross with heart icon */}
        <svg className={`${iconSizeClasses[size]} text-white relative z-10`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m3-3H9" />
        </svg>
        
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:animate-pulse"></div>
      </div>
      
      {showText && (
        <div>
          <h2 className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-emerald-600 via-blue-700 to-purple-700 bg-clip-text text-transparent group-hover:from-emerald-500 group-hover:via-blue-600 group-hover:to-purple-600 transition-all duration-300`}>
            Remote Health Monitor
          </h2>
          <p className="text-sm text-gray-500 font-medium">Healthcare Management System</p>
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="block">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
};

export default Logo;
