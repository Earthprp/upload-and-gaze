import ImageUploader from "@/components/ImageUploader";
import { Result } from "@/components/Result";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Skin Analysis
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your image for personalized skincare recommendations
          </p>
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/history')}
              className="gap-2"
            >
              <History className="w-4 h-4" />
              View History
            </Button>
          </div>
        </div>
        
        <ImageUploader onAnalysisComplete={setAnalysisData} />
        
        {analysisData && <Result data={analysisData} />}
      </div>
    </div>
    </div>
  );
};

export default Index;
