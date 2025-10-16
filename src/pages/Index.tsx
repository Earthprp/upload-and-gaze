import ImageUploader from "@/components/ImageUploader";
import { Result } from "@/components/Result";
import { useState } from "react";

const Index = () => {
  const [analysisData, setAnalysisData] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Skin Analysis
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your image for personalized skincare recommendations
          </p>
        </div>
        
        <ImageUploader onAnalysisComplete={setAnalysisData} />
        
        {analysisData && <Result data={analysisData} />}
      </div>
    </div>
  );
};

export default Index;
