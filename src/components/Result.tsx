import { Card } from "@/components/ui/card";

interface AnalysisData {
  skinType: string;
  conditionAssessment: string;
  detectedIssues: string;
  detectionCounts: number;
  skincareRecommendations: string[];
  productRecommendations: {
    cleanser: string;
    treatment: string;
    moisturizer: string;
  };
  severity: string;
}

export const Result = ({ data }: { data: AnalysisData }) => {
  const getSeverityColor = (severity?: string) => {
    const severityLower = severity?.toLowerCase() || 'moderate';
    switch (severityLower) {
      case 'severe':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mild':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Skin Analysis Results</h2>
        <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getSeverityColor(data.severity)}`}>
          Severity: {(data.severity || 'moderate').toUpperCase()}
        </span>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-4">
          <Card className="p-5 shadow-md">
            <h3 className="font-semibold text-primary mb-2">Skin Type</h3>
            <p className="text-sm leading-relaxed">{data.skinType}</p>
          </Card>
          
          <Card className="p-5 shadow-md">
            <h3 className="font-semibold text-primary mb-2">Condition Assessment</h3>
            <p className="text-sm leading-relaxed">{data.conditionAssessment}</p>
          </Card>

          <Card className="p-5 shadow-md">
            <h3 className="font-semibold text-primary mb-2">
              Detected Issues ({data.detectionCounts})
            </h3>
            <p className="text-sm leading-relaxed">{data.detectedIssues}</p>
          </Card>
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          <Card className="p-5 shadow-md">
            <h3 className="font-semibold text-primary mb-3">Product Recommendations</h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Cleanser
                </h4>
                <p className="text-sm leading-relaxed">{data.productRecommendations.cleanser}</p>
              </div>
              <div className="border-t pt-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Treatment
                </h4>
                <p className="text-sm leading-relaxed">{data.productRecommendations.treatment}</p>
              </div>
              <div className="border-t pt-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Moisturizer
                </h4>
                <p className="text-sm leading-relaxed">{data.productRecommendations.moisturizer}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Skincare Recommendations - Full Width */}
      <Card className="p-5 shadow-md">
        <h3 className="font-semibold text-primary mb-3">Skincare Recommendations</h3>
        <ol className="space-y-3">
          {data.skincareRecommendations.map((rec, index) => (
            <li key={index} className="flex gap-3">
              <span className="font-bold text-primary min-w-[1.5rem]">{index + 1}.</span>
              <span className="text-sm leading-relaxed flex-1">{rec}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
};
