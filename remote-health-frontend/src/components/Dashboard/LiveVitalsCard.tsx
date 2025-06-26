import React, { useState, useEffect } from 'react';
import { HeartIcon, BloodPressureIcon, ThermometerIcon, OxygenIcon } from '../icons';

interface LiveVital {
  id: string;
  name: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  normalRange: { min: number; max: number };
  trend: 'up' | 'down' | 'stable';
}

const LiveVitalsCard: React.FC = () => {
  const [vitals, setVitals] = useState<LiveVital[]>([
    {
      id: 'heartRate',
      name: 'Heart Rate',
      value: 72,
      unit: 'bpm',
      icon: <HeartIcon className="w-6 h-6" />,
      color: 'text-red-500',
      normalRange: { min: 60, max: 100 },
      trend: 'stable'
    },
    {
      id: 'bloodPressure',
      name: 'Blood Pressure',
      value: 120,
      unit: '/80 mmHg',
      icon: <BloodPressureIcon className="w-6 h-6" />,
      color: 'text-blue-500',
      normalRange: { min: 90, max: 140 },
      trend: 'stable'
    },
    {
      id: 'temperature',
      name: 'Temperature',
      value: 36.8,
      unit: '°C',
      icon: <ThermometerIcon className="w-6 h-6" />,
      color: 'text-orange-500',
      normalRange: { min: 36.5, max: 37.5 },
      trend: 'stable'
    },
    {
      id: 'oxygenSaturation',
      name: 'Oxygen Saturation',
      value: 98,
      unit: '%',
      icon: <OxygenIcon className="w-6 h-6" />,
      color: 'text-cyan-500',
      normalRange: { min: 95, max: 100 },
      trend: 'stable'
    }
  ]);

  const [heartbeatAnimation, setHeartbeatAnimation] = useState(false);
  const [currentHeartRate, setCurrentHeartRate] = useState(72);
  const [heartbeatIntensity, setHeartbeatIntensity] = useState('normal');

  // Realistic heartbeat animation based on heart rate
  useEffect(() => {
    const heartRate = vitals.find(v => v.id === 'heartRate')?.value || 72;
    setCurrentHeartRate(heartRate);
    
    // Determine animation intensity based on heart rate
    if (heartRate > 100) {
      setHeartbeatIntensity('critical');
    } else if (heartRate > 85) {
      setHeartbeatIntensity('elevated');
    } else if (heartRate < 60) {
      setHeartbeatIntensity('low');
    } else {
      setHeartbeatIntensity('normal');
    }

    // Dynamic heartbeat interval based on actual heart rate
    const beatInterval = 60000 / heartRate; // Convert BPM to milliseconds
    
    const heartbeatInterval = setInterval(() => {
      setHeartbeatAnimation(true);
      setTimeout(() => setHeartbeatAnimation(false), Math.min(beatInterval / 3, 150));
    }, beatInterval);

    return () => clearInterval(heartbeatInterval);
  }, [vitals]);

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(prev => prev.map(vital => {
        const baseValue = {
          heartRate: 72,
          bloodPressure: 120,
          temperature: 36.8,
          oxygenSaturation: 98
        }[vital.id] || vital.value;

        const variation = {
          heartRate: Math.random() * 10 - 5, // ±5
          bloodPressure: Math.random() * 6 - 3, // ±3
          temperature: Math.random() * 0.4 - 0.2, // ±0.2
          oxygenSaturation: Math.random() * 2 - 1 // ±1
        }[vital.id] || 0;

        const newValue = Number((baseValue + variation).toFixed(1));
        const previousValue = vital.value;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (newValue > previousValue + 0.1) trend = 'up';
        else if (newValue < previousValue - 0.1) trend = 'down';

        return {
          ...vital,
          value: newValue,
          trend
        };
      }));
    }, 2000); // Update every 2 seconds for more dynamic feel

    return () => clearInterval(interval);
  }, []);

  const isAbnormal = (vital: LiveVital) => {
    if (vital.id === 'bloodPressure') {
      return vital.value > 140 || vital.value < 90;
    }
    return vital.value > vital.normalRange.max || vital.value < vital.normalRange.min;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <>
      <style>{`
        @keyframes ecgScan {
          0% { transform: translateX(0); opacity: 0.8; }
          50% { opacity: 1; }
          100% { transform: translateX(800px); opacity: 0.3; }
        }
        
        .ecg-scan-line {
          animation: ecgScan 2s linear infinite;
        }
        
        .heartbeat-animation {
          animation: heartbeatPulse 1s ease-in-out infinite;
        }
        
        @keyframes heartbeatPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .pulse-glow-animation {
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
      {/* Header with heartbeat animation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center heartbeat-animation ${
            heartbeatAnimation ? 'pulse-glow-animation' : ''
          } ${
            heartbeatIntensity === 'critical' ? 'animate-pulse' : 
            heartbeatIntensity === 'elevated' ? 'animate-bounce' : 
            heartbeatIntensity === 'low' ? 'animate-pulse opacity-75' : ''
          }`}>
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
              <span>Live Patient Vitals</span>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  heartbeatIntensity === 'critical' ? 'bg-red-600' : 
                  heartbeatIntensity === 'elevated' ? 'bg-orange-500' : 
                  heartbeatIntensity === 'low' ? 'bg-blue-500' : 'bg-red-500'
                }`}></div>
                <div className="w-1 h-1 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1 h-1 bg-red-300 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </h3>
            <p className="text-sm text-gray-500">
              Real-time monitoring • HR: {currentHeartRate} bpm • Status: {heartbeatIntensity}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-600 font-medium">LIVE</span>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
            🔄 Updates every 2s
          </div>
        </div>
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {vitals.map((vital) => (
          <div 
            key={vital.id}
            className={`p-4 rounded-xl transition-all duration-300 hover:shadow-lg border-2 relative overflow-hidden ${
              isAbnormal(vital) 
                ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {/* Background pulse animation for heart rate */}
            {vital.id === 'heartRate' && (
              <div className={`absolute inset-0 bg-red-100 opacity-20 transition-opacity duration-100 ${
                heartbeatAnimation ? 'opacity-40' : 'opacity-20'
              }`}></div>
            )}
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${vital.color} bg-opacity-10 ${
                  vital.id === 'heartRate' ? 'heartbeat-animation' : ''
                } transition-transform duration-100`}>
                  <div className={vital.color}>
                    {vital.icon}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(vital.trend)}
                  <span className={`text-xs font-medium ${
                    isAbnormal(vital) ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {vital.trend}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">{vital.name}</h4>
                <div className="flex items-baseline space-x-1">
                  <span className={`text-2xl font-bold transition-colors duration-300 ${
                    isAbnormal(vital) ? 'text-red-600' : 'text-gray-800'
                  }`}>
                    {vital.value}
                  </span>
                  <span className="text-sm text-gray-500">{vital.unit}</span>
                </div>
                
                {/* Normal range indicator */}
                <div className="text-xs text-gray-400">
                  Normal: {vital.normalRange.min}-{vital.normalRange.max}{vital.unit.replace(/\/\d+\s*/, ' ')}
                </div>
                
                {isAbnormal(vital) && (
                  <div className="flex items-center space-x-1 mt-2 p-2 bg-red-100 rounded-lg">
                    <svg className="w-3 h-3 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs text-red-600 font-medium">⚠️ ABNORMAL - Requires Attention</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* ECG Wave Simulation */}
      <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
            <span>ECG Rhythm</span>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              heartbeatIntensity === 'critical' ? 'bg-red-500' : 
              heartbeatIntensity === 'elevated' ? 'bg-orange-500' : 
              heartbeatIntensity === 'low' ? 'bg-blue-500' : 'bg-green-500'
            }`}></div>
          </h4>
          <span className={`text-xs font-medium ${
            heartbeatIntensity === 'critical' ? 'text-red-600' : 
            heartbeatIntensity === 'elevated' ? 'text-orange-600' : 
            heartbeatIntensity === 'low' ? 'text-blue-600' : 'text-green-600'
          }`}>
            {heartbeatIntensity === 'critical' ? '⚠️ Critical' : 
             heartbeatIntensity === 'elevated' ? '⚡ Elevated' : 
             heartbeatIntensity === 'low' ? '🔽 Low' : '✅ Normal'} - {currentHeartRate} BPM
          </span>
        </div>
        <div className="relative h-16 bg-black rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-full relative">
              <svg className="w-full h-full" viewBox="0 0 800 64" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ecg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: '#10B981', stopOpacity: 0.9}} />
                    <stop offset="50%" style={{stopColor: '#22C55E', stopOpacity: 0.8}} />
                    <stop offset="100%" style={{stopColor: '#3B82F6', stopOpacity: 0.7}} />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                {/* Realistic ECG waveform with proper PQRST complex */}
                <path
                  d="M0,32 
                     L40,32 
                     L45,30 L50,32 L55,32 
                     L60,28 L65,32 L70,32 
                     L75,32 L78,20 L80,45 L82,8 L85,58 L88,32 L95,32 
                     L100,30 L105,34 L110,32 
                     L115,32 L120,32 
                     
                     L160,32 
                     L165,30 L170,32 L175,32 
                     L180,28 L185,32 L190,32 
                     L195,32 L198,20 L200,45 L202,8 L205,58 L208,32 L215,32 
                     L220,30 L225,34 L230,32 
                     L235,32 L240,32 
                     
                     L280,32 
                     L285,30 L290,32 L295,32 
                     L300,28 L305,32 L310,32 
                     L315,32 L318,20 L320,45 L322,8 L325,58 L328,32 L335,32 
                     L340,30 L345,34 L350,32 
                     L355,32 L360,32 
                     
                     L400,32 
                     L405,30 L410,32 L415,32 
                     L420,28 L425,32 L430,32 
                     L435,32 L438,20 L440,45 L442,8 L445,58 L448,32 L455,32 
                     L460,30 L465,34 L470,32 
                     L475,32 L480,32 
                     
                     L520,32 
                     L525,30 L530,32 L535,32 
                     L540,28 L545,32 L550,32 
                     L555,32 L558,20 L560,45 L562,8 L565,58 L568,32 L575,32 
                     L580,30 L585,34 L590,32 
                     L595,32 L600,32 
                     
                     L640,32 
                     L645,30 L650,32 L655,32 
                     L660,28 L665,32 L670,32 
                     L675,32 L678,20 L680,45 L682,8 L685,58 L688,32 L695,32 
                     L700,30 L705,34 L710,32 
                     L715,32 L800,32"
                  stroke="url(#ecg-gradient)"
                  strokeWidth="1.5"
                  fill="none"
                  filter="url(#glow)"
                  className={`transition-all duration-300 ${
                    heartbeatAnimation ? 'opacity-100' : 'opacity-80'
                  }`}
                />
                {/* Grid lines for realism */}
                <defs>
                  <pattern id="grid" width="20" height="8" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 8" fill="none" stroke="#1f2937" strokeWidth="0.3" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Moving scan line */}
                <line 
                  x1="0" y1="0" x2="0" y2="64" 
                  stroke="#10B981" 
                  strokeWidth="1" 
                  opacity="0.6"
                  className="animate-pulse"
                  style={{
                    animation: `ecgScan ${60000 / currentHeartRate}ms linear infinite`
                  }}
                >
                  <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="translate"
                    values="0,0;800,0;0,0"
                    dur={`${(60000 / currentHeartRate) / 1000}s`}
                    repeatCount="indefinite"
                  />
                </line>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Information */}
      <div className="p-3 bg-blue-50 rounded-xl">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-blue-700">
            🔄 Live monitoring active • 💓 Heartbeat synchronized • ⚡ Real-time updates
          </span>
        </div>
      </div>
    </div>
    </>
  );
};

export default LiveVitalsCard;
