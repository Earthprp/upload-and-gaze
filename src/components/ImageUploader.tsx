import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import supabase from "@/lib/supabase";


interface SkinAnalysisData {
  skinType: string;
  conditionAssessment: string;
  detectedIssues: string[];
  detectionCounts: number;
  skincareRecommendations: string[];
  productRecommendations: {
    cleanser: string;
    treatment: string;
    moisturizer: string;
  };
  severity: 'mild' | 'moderate' | 'severe';
}

interface ImageUploaderProps {
  onAnalysisComplete?: (data: any) => void;
}

type SupabaseUploadResponse = {
  data: {
    path: string;
    id: string;
    fullPath: string;
  } | null;
  error: Error | null;
};

const ImageUploader = ({ onAnalysisComplete }: ImageUploaderProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [skinAnalysis, setSkinAnalysis] = useState<SkinAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadToSupabase = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error }: SupabaseUploadResponse = await supabase.storage
        .from('skin_image')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('skin_image')
        .getPublicUrl(filePath);

      if (urlData) {
        setSelectedImage(urlData.publicUrl);
        toast.success("Image uploaded successfully!");

        try {
          setIsAnalyzing(true);
          const response = await fetch('https://earthprp.app.n8n.cloud/webhook/f835b9ca-db4e-4e5b-ad56-68e544f5ae99', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              upload_data: {
                path: data.path,
                id: data.id,
                fullPath: data.fullPath
              },
              public_url: urlData.publicUrl,
              file_path: filePath,
              timestamp: new Date().toISOString()
            })
          });

          if (response.ok) {
            const responseData = await response.json();
            if (responseData && responseData.length > 0) {
              setSkinAnalysis(responseData[0]);
              if (onAnalysisComplete) {
                onAnalysisComplete(responseData[0]);
              }
              toast.success('Skin analysis completed!');
            } else {
              toast.error('No analysis data received');
            }
          } else {
            toast.error(`Analysis failed (${response.status})`);
          }
        } catch (error) {
          console.error('Webhook error:', error);
          toast.error('Error during analysis');
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to upload image to Supabase");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    uploadToSupabase(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setSkinAnalysis(null);
    setIsAnalyzing(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("Image removed");
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {!selectedImage ? (
        <Card
          className={`
            relative p-12 border-2 border-dashed transition-all duration-300 cursor-pointer
            hover:border-primary hover:shadow-glow bg-card
            ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : ""}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5">
              <Upload className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Upload an image
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Drag and drop your image here, or click to browse
              </p>
            </div>
            <Button
              variant="default"
              size="lg"
              className="mt-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                if (!isUploading) {
                  fileInputRef.current?.click();
                }
              }}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Choose Image
                </>
              )}
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card className="relative p-6 bg-card shadow-card">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Preview
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearImage}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-full h-auto max-h-[600px] object-contain"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!isUploading) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className="w-full"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Different Image
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Skin Analysis Data Display */}
          {skinAnalysis && (
            <Card className="p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Skin Analysis Results</h3>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Skin Type
                    </label>
                    <div className="p-3 bg-muted rounded-md border">
                      <span className="text-foreground">{skinAnalysis.skinType}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Condition Assessment
                    </label>
                    <div className="p-3 bg-muted rounded-md border min-h-[80px]">
                      <span className="text-foreground text-sm leading-relaxed">
                        {skinAnalysis.conditionAssessment}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Detected Issues ({skinAnalysis.detectionCounts})
                    </label>
                    <div className="p-3 bg-muted rounded-md border">
                      <div className="flex flex-wrap gap-2">
                        {skinAnalysis.detectedIssues.map((issue, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Skincare Recommendations
                    </label>
                    <div className="p-3 bg-muted rounded-md border min-h-[120px]">
                      <ul className="space-y-2 text-sm text-foreground">
                        {skinAnalysis.skincareRecommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary font-bold min-w-[1.5rem]">{index + 1}.</span>
                            <span className="flex-1">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Product Recommendations
                    </label>
                    <div className="p-3 bg-muted rounded-md border space-y-3">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Cleanser
                        </span>
                        <p className="text-sm text-foreground mt-1">
                          {skinAnalysis.productRecommendations.cleanser}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Treatment
                        </span>
                        <p className="text-sm text-foreground mt-1">
                          {skinAnalysis.productRecommendations.treatment}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Moisturizer
                        </span>
                        <p className="text-sm text-foreground mt-1">
                          {skinAnalysis.productRecommendations.moisturizer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Severity:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize
                    ${skinAnalysis.severity === 'severe' ? 'bg-red-100 text-red-800' :
                      skinAnalysis.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'}`}>
                    {skinAnalysis.severity}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Analysis Waiting State */}
          {isAnalyzing && (
            <Card className="relative p-12 border-2 border-dashed transition-all duration-300 bg-card">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="p-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    Analyzing your skin...
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Our AI is processing your image to provide personalized skincare recommendations
                  </p>
                </div>
              </div>
            </Card>
          )}

          {skinAnalysis && (
            <SkinAnalysisResult data={skinAnalysis} />
          )}
        </>
      )}
    </div>
  );
};

export default ImageUploader;
