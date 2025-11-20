import { AlertCircle } from "lucide-react";

const Disclaimer = () => {
  return (
    <div className="flex items-start gap-2 p-4 bg-muted/30 border border-muted rounded-lg">
      <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        Results are AI-generated estimates and may not be 100% accurate. For serious skin concerns, please consult a licensed dermatologist.
      </p>
    </div>
  );
};

export default Disclaimer;
