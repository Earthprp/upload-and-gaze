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
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          badgeColor: 'bg-red-100 text-red-800',
          label: 'ปัญหารุนแรง'
        };
      case 'moderate':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          badgeColor: 'bg-yellow-100 text-yellow-800',
          label: 'ปัญหาปานกลาง'
        };
      default:
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          badgeColor: 'bg-green-100 text-green-800',
          label: 'ปัญหาเล็กน้อย'
        };
    }
  };

  const config = getSeverityConfig(severity);

  return (
    <Card className={`p-5 ${config.bgColor} ${config.borderColor} border-2`}>
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className={`w-6 h-6 ${config.iconColor} flex-shrink-0 mt-1`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeColor}`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-medium">สามารถเป็นไปได้</h4>
          </div>
          <ul className="space-y-1.5">
            {possibleCauses.map((cause, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-1">•</span>
                <span className="flex-1">{cause}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <h4 className="text-sm font-medium">วิธีการแก้ไข</h4>
          </div>
          <ul className="space-y-1.5">
            {treatments.map((treatment, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-green-600 mt-1">•</span>
                <span className="flex-1">{treatment}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
};
