import { Card } from "@/components/ui/card";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";

interface ProblemCardProps {
  title: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  possibleCauses: string[];
  treatments: string[];
}

export const ProblemCard = ({ title, severity, description, possibleCauses, treatments }: ProblemCardProps) => {
  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return {
          bgColor: 'bg-red-50/60',
          borderColor: 'border-red-200/50',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          badgeColor: 'bg-red-100 text-red-700',
          label: 'ระดับ: รุนแรง'
        };
      case 'moderate':
        return {
          bgColor: 'bg-orange-50/60',
          borderColor: 'border-orange-200/50',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          badgeColor: 'bg-yellow-100 text-yellow-700',
          label: 'ระดับ: ปานกลาง'
        };
      default:
        return {
          bgColor: 'bg-emerald-50/60',
          borderColor: 'border-emerald-200/50',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          badgeColor: 'bg-emerald-100 text-emerald-700',
          label: 'ระดับ: เล็กน้อย'
        };
    }
  };

  const config = getSeverityConfig(severity);

  return (
    <Card className={`p-6 ${config.bgColor} ${config.borderColor} border`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-full ${config.iconBg} flex-shrink-0`}>
          <AlertTriangle className={`w-6 h-6 ${config.iconColor}`} />
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
