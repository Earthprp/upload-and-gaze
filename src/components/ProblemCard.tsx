import { Card } from "@/components/ui/card";
import { Info, CheckCircle } from "lucide-react";

interface ProblemCardProps {
  title: string;
  severity: 'perfect' | 'mild' | 'moderate' | 'severe';
  description: string;
  possibleCauses: string[];
  treatments: string[];
}

const SevereFaceIcon = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none"/>
    <circle cx="35" cy="40" r="5" fill="currentColor"/>
    <circle cx="65" cy="40" r="5" fill="currentColor"/>
    <line x1="30" y1="35" x2="40" y2="30" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    <line x1="60" y1="30" x2="70" y2="35" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    <path d="M 35 70 Q 50 55 65 70" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none"/>
    <line x1="62" y1="42" x2="62" y2="52" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const ModerateFaceIcon = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none"/>
    <circle cx="35" cy="40" r="5" fill="currentColor"/>
    <circle cx="65" cy="40" r="5" fill="currentColor"/>
    <line x1="35" y1="65" x2="65" y2="65" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

const MildFaceIcon = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none"/>
    <circle cx="35" cy="40" r="5" fill="currentColor"/>
    <circle cx="65" cy="40" r="5" fill="currentColor"/>
    <path d="M 35 65 Q 50 75 65 65" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none"/>
  </svg>
);

const PerfectFaceIcon = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none"/>
    <circle cx="35" cy="40" r="6" fill="currentColor"/>
    <circle cx="65" cy="40" r="6" fill="currentColor"/>
    <path d="M 30 60 Q 50 80 70 60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none"/>
  </svg>
);

export const ProblemCard = ({ title, severity, description, possibleCauses, treatments }: ProblemCardProps) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'perfect':
        return {
          bgColor: 'bg-blue-50/60',
          borderColor: 'border-blue-200/50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          badgeColor: 'bg-blue-100 text-blue-700',
          label: 'ระดับ: สมบูรณ์แบบ',
          Icon: PerfectFaceIcon
        };
      case 'severe':
        return {
          bgColor: 'bg-red-50/60',
          borderColor: 'border-red-200/50',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          badgeColor: 'bg-red-100 text-red-700',
          label: 'ระดับ: รุนแรง',
          Icon: SevereFaceIcon
        };
      case 'moderate':
        return {
          bgColor: 'bg-orange-50/60',
          borderColor: 'border-orange-200/50',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          badgeColor: 'bg-yellow-100 text-yellow-700',
          label: 'ระดับ: ปานกลาง',
          Icon: ModerateFaceIcon
        };
      default:
        return {
          bgColor: 'bg-emerald-50/60',
          borderColor: 'border-emerald-200/50',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          badgeColor: 'bg-emerald-100 text-emerald-700',
          label: 'ระดับ: เล็กน้อย',
          Icon: MildFaceIcon
        };
    }
  };

  const config = getSeverityConfig(severity);
  const IconComponent = config.Icon;

  return (
    <Card className={`p-6 ${config.bgColor} ${config.borderColor} border`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-full ${config.iconBg} flex-shrink-0`}>
          <div className={config.iconColor}>
            <IconComponent />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-xl">{title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="bg-blue-50/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium">สาเหตุที่เป็นไปได้</h4>
          </div>
          <ul className="space-y-2">
            {possibleCauses.map((cause, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-blue-600 mt-0.5">•</span>
                <span className="flex-1">{cause}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-green-50/50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-medium">วิธีการแก้ไข</h4>
          </div>
          <ul className="space-y-2">
            {treatments.map((treatment, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-green-600 mt-0.5">•</span>
                <span className="flex-1">{treatment}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};
