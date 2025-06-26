import React from 'react';
import { Link } from 'react-router-dom';
import { 
  SummaryUsersIcon, 
  SummaryAnomaliesIcon, 
  SummaryAlertsIcon, 
  SummaryHealthRecordsIcon 
} from '../icons';

interface EnhancedSummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  change?: number;
  icon: React.ReactNode;
  bgColorFrom: string;
  bgColorTo: string;
  textColor: string;
  linkTo?: string;
  additionalInfo?: { label: string; value: string | number }[];
}

const EnhancedSummaryCard: React.FC<EnhancedSummaryCardProps> = ({ 
  title, 
  value, 
  subtitle,
  change, 
  icon, 
  bgColorFrom,
  bgColorTo,
  textColor,
  linkTo,
  additionalInfo = []
}) => {
  const CardContent = () => (
    <div className={`bg-gradient-to-br ${bgColorFrom} ${bgColorTo} shadow-xl rounded-2xl p-6 text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer group relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-300"></div>
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors duration-300 group-hover:scale-110 transform">
            {icon}
          </div>
          {change !== undefined && (
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              change >= 0 ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'
            }`}>
              <div className="flex items-center space-x-1">
                {change >= 0 ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{Math.abs(change)}%</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">{title}</h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">{value}</span>
          </div>
          <p className="text-sm text-white/70 font-medium">{subtitle}</p>
        </div>

        {additionalInfo.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="grid grid-cols-2 gap-3">
              {additionalInfo.map((info, index) => (
                <div key={index} className="text-center">
                  <p className="text-xs text-white/60 uppercase tracking-wide">{info.label}</p>
                  <p className="text-sm font-bold text-white">{info.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {linkTo && (
          <div className="mt-4 flex items-center text-white/80 group-hover:text-white transition-colors duration-300">
            <span className="text-sm font-medium">View Details</span>
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="block">
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
};

interface DashboardSummaryCardsProps {
  totalPatients: number;
  criticalAlerts: number;
  anomalies: number;
  healthRecords: number;
  userRole: string;
}

const DashboardSummaryCards: React.FC<DashboardSummaryCardsProps> = ({
  totalPatients,
  criticalAlerts,
  anomalies,
  healthRecords,
  userRole
}) => {
  const getPatientSummaryCards = () => [
    {
      title: "Health Records",
      value: healthRecords,
      subtitle: "Total medical records",
      change: 12,
      icon: <SummaryHealthRecordsIcon className="w-8 h-8" />,
      bgColorFrom: "from-emerald-500",
      bgColorTo: "to-teal-600",
      textColor: "text-emerald-600",
      linkTo: "/health-records",
      additionalInfo: [
        { label: "This Month", value: 3 },
        { label: "Last Updated", value: "2 days ago" }
      ]
    },
    {
      title: "Active Alerts",
      value: criticalAlerts,
      subtitle: "Notifications requiring attention",
      change: criticalAlerts > 0 ? -8 : 0,
      icon: <SummaryAlertsIcon className="w-8 h-8" />,
      bgColorFrom: "from-amber-500",
      bgColorTo: "to-orange-600",
      textColor: "text-amber-600",
      linkTo: "/alerts",
      additionalInfo: [
        { label: "Critical", value: Math.floor(criticalAlerts * 0.3) },
        { label: "Warnings", value: criticalAlerts - Math.floor(criticalAlerts * 0.3) }
      ]
    },
    {
      title: "Warning Alerts",
      value: anomalies,
      subtitle: "Alerts requiring monitoring",
      change: anomalies > 0 ? 5 : 0,
      icon: <SummaryAnomaliesIcon className="w-8 h-8" />,
      bgColorFrom: "from-red-500",
      bgColorTo: "to-pink-600",
      textColor: "text-red-600",
      linkTo: "/anomalies",
      additionalInfo: [
        { label: "This Week", value: Math.max(0, anomalies - 2) },
        { label: "Resolved", value: 8 }
      ]
    },
    {
      title: "Vitals Monitoring",
      value: "Active",
      subtitle: "Continuous health tracking",
      icon: <SummaryUsersIcon className="w-8 h-8" />,
      bgColorFrom: "from-blue-500",
      bgColorTo: "to-indigo-600",
      textColor: "text-blue-600",
      linkTo: "/vitals-history",
      additionalInfo: [
        { label: "Readings Today", value: 24 },
        { label: "Last Reading", value: "2 min ago" }
      ]
    }
  ];

  const getDoctorAdminSummaryCards = () => [
    {
      title: "Total Patients",
      value: totalPatients,
      subtitle: "Registered in the system",
      change: 15,
      icon: <SummaryUsersIcon className="w-8 h-8" />,
      bgColorFrom: "from-blue-500",
      bgColorTo: "to-indigo-600",
      textColor: "text-blue-600",
      linkTo: "/patients",
      additionalInfo: [
        { label: "Active", value: Math.floor(totalPatients * 0.85) },
        { label: "New This Week", value: 5 }
      ]
    },
    {
      title: "Critical Alerts",
      value: criticalAlerts,
      subtitle: "Requiring immediate attention",
      change: criticalAlerts > 0 ? -12 : 0,
      icon: <SummaryAlertsIcon className="w-8 h-8" />,
      bgColorFrom: "from-amber-500",
      bgColorTo: "to-orange-600",
      textColor: "text-amber-600",
      linkTo: "/alerts",
      additionalInfo: [
        { label: "Urgent", value: Math.floor(criticalAlerts * 0.4) },
        { label: "Pending Review", value: Math.floor(criticalAlerts * 0.6) }
      ]
    },
    {
      title: "Warning Alerts",
      value: anomalies,
      subtitle: "Warnings across all patients",
      change: 8,
      icon: <SummaryAnomaliesIcon className="w-8 h-8" />,
      bgColorFrom: "from-red-500",
      bgColorTo: "to-pink-600",
      textColor: "text-red-600",
      linkTo: "/anomalies",
      additionalInfo: [
        { label: "Under Review", value: Math.floor(anomalies * 0.7) },
        { label: "Resolved Today", value: 3 }
      ]
    },
    {
      title: "Health Records",
      value: healthRecords,
      subtitle: "Total records managed",
      change: 22,
      icon: <SummaryHealthRecordsIcon className="w-8 h-8" />,
      bgColorFrom: "from-emerald-500",
      bgColorTo: "to-teal-600",
      textColor: "text-emerald-600",
      linkTo: "/health-records",
      additionalInfo: [
        { label: "Updated Today", value: 12 },
        { label: "Pending Review", value: 7 }
      ]
    }
  ];

  const cards = userRole === 'PATIENT' ? getPatientSummaryCards() : getDoctorAdminSummaryCards();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <EnhancedSummaryCard
          key={`${card.title}-${index}`}
          {...card}
        />
      ))}
    </div>
  );
};

export default DashboardSummaryCards;
