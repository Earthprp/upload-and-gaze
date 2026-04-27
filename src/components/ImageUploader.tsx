import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import supabase from "@/lib/supabase";
import heic2any from "heic2any";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Function to convert HEIC to JPEG
const convertHeicToJpeg = async (file: File): Promise<File> => {
  // Check if file is HEIC/HEIF
  const isHeic = file.type === "image/heic" || 
                 file.type === "image/heif" || 
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');
  
  if (!isHeic) {
    return file; // Return original if not HEIC
  }

  try {
    // Convert HEIC to JPEG
    const convertedBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9
    });

    // heic2any might return Blob or Blob[]
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    // Create new File from converted blob
    const jpegFile = new File(
      [blob], 
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      { type: "image/jpeg", lastModified: Date.now() }
    );
    
    return jpegFile;
  } catch (error) {
    console.error("HEIC conversion error:", error);
    toast.error("Failed to convert HEIC image. Please try another format.");
    throw error;
  }
};

// Function to auto-adjust brightness and contrast for optimal facial analysis
const autoAdjustImage = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Calculate average brightness and histogram
  let totalBrightness = 0;
  let histogram = new Array(256).fill(0);
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;
    histogram[Math.floor(brightness)]++;
  }
  const avgBrightness = totalBrightness / (data.length / 4);
  // Optimal brightness: 100-120 (out of 255)
  const targetBrightness = 110;
  
  // Calculate adjustment factor - more aggressive for bright images
  let brightnessAdjust = targetBrightness - avgBrightness;
  
  // If image is too bright (>140), apply stronger reduction
  if (avgBrightness > 140) {
    brightnessAdjust *= 0.8; 
  }
  // If image is too dark (<80), apply stronger increase
  else if (avgBrightness < 80) {
    brightnessAdjust *= 1.3; // 30% more aggressive
  }
  // Adjust contrast based on brightness distribution
  let contrast = 1.15;
  if (avgBrightness > 140) {
    contrast = 1.3; // Increase contrast more for bright images
  } else if (avgBrightness < 80) {
    contrast = 1.2; // Moderate contrast for dark images
  }
  
  console.log('🎨 Image Adjustment:', {
    originalBrightness: Math.round(avgBrightness),
    targetBrightness,
    adjustment: Math.round(brightnessAdjust),
    contrast,
    status: avgBrightness > 160 ? 'Too Bright' : avgBrightness < 100 ? 'Too Dark' : 'OK'
  });
  // Apply brightness and contrast adjustment
  for (let i = 0; i < data.length; i += 4) {
    // Adjust each RGB channel
    for (let j = 0; j < 3; j++) {
      let value = data[i + j];
      // Apply contrast (centered around 128)
      value = ((value - 128) * contrast) + 128;
      // Apply brightness
      value = value + brightnessAdjust;
      // Clamp to 0-255
      data[i + j] = Math.max(0, Math.min(255, value));
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

// Function to detect face and return bounding box coordinates
const detectAndGetFace = async (file: File): Promise<{ detected: boolean; boundingBox?: { x: number; y: number; width: number; height: number } }> => {
  return new Promise(async (resolve) => {
    try {
      // Dynamically import MediaPipe
      const { FaceDetection } = await import('@mediapipe/face_detection');
      
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = async () => {
        try {
          // Create canvas to process image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.warn('Cannot get canvas context');
            URL.revokeObjectURL(url);
            resolve({ detected: true });
            return;
          }

          ctx.drawImage(img, 0, 0);
          
          // Initialize MediaPipe Face Detection
          const faceDetection = new FaceDetection({
            locateFile: (file) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
            }
          });

          faceDetection.setOptions({
            model: 'short',
            minDetectionConfidence: 0.5
          });

          let detectionResult: { detected: boolean; boundingBox?: { x: number; y: number; width: number; height: number } } = { detected: false };

          faceDetection.onResults((results) => {
            if (results.detections && results.detections.length > 0) {
              const detection = results.detections[0];
              const box = detection.boundingBox;
              detectionResult = {
                detected: true,
                boundingBox: {
                  x: box.xCenter - box.width / 2,
                  y: box.yCenter - box.height / 2,
                  width: box.width,
                  height: box.height
                }
              };
              console.log('Face detected at:', detectionResult.boundingBox);
            } else {
              console.log('No face detected');
            }
          });

          await faceDetection.send({ image: canvas });
          
          URL.revokeObjectURL(url);
          faceDetection.close();
          resolve(detectionResult);
        } catch (error) {
          console.error('Face detection error:', error);
          URL.revokeObjectURL(url);
          resolve({ detected: true }); // Allow through on error
        }
      };

      img.onerror = () => {
        console.error('Image load error');
        URL.revokeObjectURL(url);
        resolve({ detected: true });
      };

      img.src = url;
    } catch (error) {
      console.error('MediaPipe import error:', error);
      resolve({ detected: true }); // Allow through if MediaPipe fails to load
    }
  });
};

// Function to crop image to center on face with padding
const cropFaceToCenter = (file: File, boundingBox: { x: number; y: number; width: number; height: number }): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      // Calculate crop area to fit face perfectly in green oval guide (55% width, 75% height)
      const faceWidth = boundingBox.width * img.width;
      const faceHeight = boundingBox.height * img.height;
      const faceCenterX = (boundingBox.x + boundingBox.width / 2) * img.width;
      const faceCenterY = (boundingBox.y + boundingBox.height / 2) * img.height;
      
      // Oval guide is 55% width, 75% height of preview
      // Face should fill ~70% of the oval (leaving some margin)
      // So crop should be: face size / 0.7 / oval percentage
      const ovalFillRatio = 0.7; // Face fills 70% of oval
      const cropWidth = (faceWidth / ovalFillRatio) / 0.55; // Oval is 55% of image width
      const cropHeight = (faceHeight / ovalFillRatio) / 0.75; // Oval is 75% of image height
      
      // Calculate crop position (centered on face)
      let cropX = faceCenterX - cropWidth / 2;
      let cropY = faceCenterY - cropHeight / 2;
      
      // Ensure crop area is within image bounds
      cropX = Math.max(0, Math.min(cropX, img.width - cropWidth));
      cropY = Math.max(0, Math.min(cropY, img.height - cropHeight));
      
      // Adjust if crop exceeds image boundaries
      const finalCropWidth = Math.min(cropWidth, img.width - cropX);
      const finalCropHeight = Math.min(cropHeight, img.height - cropY);
      
      // Set canvas to crop size
      canvas.width = finalCropWidth;
      canvas.height = finalCropHeight;
      
      // Draw cropped image
      ctx.drawImage(
        img,
        cropX, cropY, finalCropWidth, finalCropHeight,
        0, 0, finalCropWidth, finalCropHeight
      );
      
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          URL.revokeObjectURL(url);
          resolve(croppedFile);
        } else {
          URL.revokeObjectURL(url);
          resolve(file);
        }
      }, 'image/jpeg', 0.95);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    
    img.src = url;
  });
};

// ─── Image Quality Gate ─────────────────────────────────────────────────────
const BLUR_THRESHOLD = 80;   // Laplacian variance < this → blurry
const BRIGHT_MIN     = 90;   // Avg brightness < this → too dark
const BRIGHT_MAX     = 170;  // Avg brightness > this → too bright

const checkImageQuality = (file: File): Promise<{ pass: boolean; blurFail: boolean; brightnessFail: boolean; reasons: string[]; blur: number; brightness: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Downsample for speed
      const scale = Math.min(1, 400 / Math.max(img.width, img.height));
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Convert to grayscale
      const gray = new Float32Array(width * height);
      let totalBright = 0;
      for (let i = 0; i < width * height; i++) {
        const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
        gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBright += gray[i];
      }
      const avgBrightness = totalBright / (width * height);

      // Laplacian variance (kernel: [0,1,0,1,-4,1,0,1,0])
      const kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
      let lapSum = 0, lapSumSq = 0, lapCount = 0;
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let v = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              v += gray[(y + dy) * width + (x + dx)] * kernel[(dy + 1) * 3 + (dx + 1)];
            }
          }
          lapSum += v;
          lapSumSq += v * v;
          lapCount++;
        }
      }
      const lapMean = lapSum / lapCount;
      const lapVariance = lapSumSq / lapCount - lapMean * lapMean;

      const blurReasons: string[] = [];
      const brightnessReasons: string[] = [];
      if (lapVariance < BLUR_THRESHOLD)
        blurReasons.push(`ภาพเบลอเกินไป (blur score: ${lapVariance.toFixed(1)} < ${BLUR_THRESHOLD})`);
      if (avgBrightness < BRIGHT_MIN)
        brightnessReasons.push(`ภาพมืดเกินไป (brightness: ${avgBrightness.toFixed(1)}) — ระบบจะปรับแสงให้อัตโนมัติ`);
      if (avgBrightness > BRIGHT_MAX)
        brightnessReasons.push(`ภาพสว่างเกินไป (brightness: ${avgBrightness.toFixed(1)}) — ระบบจะปรับแสงให้อัตโนมัติ`);

      const reasons = [...blurReasons, ...brightnessReasons];
      console.log('🔍 Quality Gate:', { blur: lapVariance.toFixed(1), brightness: avgBrightness.toFixed(1), blurReasons, brightnessReasons });
      resolve({ pass: blurReasons.length === 0 && brightnessReasons.length === 0, blurFail: blurReasons.length > 0, brightnessFail: brightnessReasons.length > 0, reasons, blur: lapVariance, brightness: avgBrightness });
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ pass: true, blurFail: false, brightnessFail: false, reasons: [], blur: 0, brightness: 0 }); };
    img.src = url;
  });
};

// Function to resize image to max 1024x768 while maintaining aspect ratio
const resizeImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const MAX_WIDTH = 1024;
    const MAX_HEIGHT = 768;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      const aspectRatio = width / height;
      
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        if (aspectRatio > MAX_WIDTH / MAX_HEIGHT) {
          // Width is the limiting factor
          width = MAX_WIDTH;
          height = Math.round(MAX_WIDTH / aspectRatio);
        } else {
          // Height is the limiting factor
          height = MAX_HEIGHT;
          width = Math.round(MAX_HEIGHT * aspectRatio);
        }
      }
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Use better image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        // Auto-adjust brightness and contrast for optimal facial analysis
        autoAdjustImage(canvas, ctx);
        // Convert to blob and create new file
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            URL.revokeObjectURL(url);
            resolve(resizedFile);
          } else {
            URL.revokeObjectURL(url);
            resolve(file); 
          }
        }, 'image/jpeg', 0.9);
      } else {
        URL.revokeObjectURL(url);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fallback to original
    };

    img.src = url;
  });
};

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
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [showAnnotated, setShowAnnotated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [skinAnalysis, setSkinAnalysis] = useState<SkinAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showNoFaceDialog, setShowNoFaceDialog] = useState(false);
  const [showQualityWarning, setShowQualityWarning] = useState(false);
  const [qualityWarningMsg, setQualityWarningMsg] = useState<string[]>([]);
  const [showBrightnessWarning, setShowBrightnessWarning] = useState(false);
  const [brightnessWarningMsg, setBrightnessWarningMsg] = useState<string[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
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
          toast.info("Analyzing skin...");

          // 🔹 Fetch user profile data (age and gender)
          let userAge = null;
          let userGender = null;
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('age, gender')
              .eq('id', user.id)
              .single();
            
            if (profile) {
              userAge = profile.age;
              userGender = profile.gender;
            }
          }

          // 🔹 Prepare both requests
          const formData = new FormData();
          formData.append("file_path", filePath);
          formData.append("threshold", "0.03");

          // 🔹 Run n8n webhook and FastAPI detection in PARALLEL ⚡
          const [n8nResponse, detectResponse] = await Promise.all([
            // 1. n8n webhook for skin analysis
            fetch("http://localhost:5678/webhook/f835b9ca-db4e-4e5b-ad56-68e544f5ae99", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                upload_data: {
                  path: data.path,
                  id: data.id,
                  fullPath: data.fullPath,
                },
                public_url: urlData.publicUrl,
                file_path: filePath,
                age: userAge,
                gender: userGender,
                timestamp: new Date().toISOString(),
              }),
            }),
            // 2. FastAPI for skin detection (runs simultaneously)
            fetch("http://localhost:8000/api/detect-skin", {
              method: "POST",
              body: formData,
            })
          ]);

          // Check n8n response
          if (!n8nResponse.ok) {
            throw new Error(`n8n analysis failed (${n8nResponse.status})`);
          }

          // Parse both responses
          const [n8nData, detectResult] = await Promise.all([
            n8nResponse.json(),
            detectResponse.json()
          ]);

          console.log("✅ n8n result:", n8nData);
          console.log("🎯 Detection result:", detectResult);

          if (detectResult.status !== "success") {
            toast.error("Skin detection failed");
            return;
          }

          // 🔹 Store annotated image for preview
          if (detectResult.annotated_image_base64) {
            setAnnotatedImage(`data:image/jpeg;base64,${detectResult.annotated_image_base64}`);
          }

          // 🔹 Combine results from both APIs
          const combinedResult = {
            ...n8nData,
            annotated_image_base64: detectResult.annotated_image_base64,
            roboflow_predictions: detectResult.predictions,
          };

          toast.success("Skin analysis + detection completed!");

          // 🔹 Navigate to analysis page with results
          navigate("/analysis", {
            state: {
              data: combinedResult,
              imageUrl: urlData.publicUrl, // original
              annotatedImage: detectResult.annotated_image_base64, // with bounding boxes
            },
          });

        } catch (error) {
          console.error("❌ Error in analysis flow:", error);
          toast.error("Error during analysis process");
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

  const handleImageSelect = async (file: File) => {
    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith('.heic') && !file.name.toLowerCase().endsWith('.heif')) {
      toast.error("Please select an image file");
      return;
    }

    try {
      // Convert HEIC to JPEG if needed
      let processedFile = file;
      if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        toast.info("Converting HEIC image...");
        processedFile = await convertHeicToJpeg(file);
      }
      
      // ✅ Detect Face FIRST - reject immediately if no face found
      toast.info("Detecting face...");
      const faceResult = await detectAndGetFace(processedFile);

      if (!faceResult.detected) {
        setShowNoFaceDialog(true);
        return;
      }

      // Face detected! Auto-crop to center face if bounding box is available
      let finalFile = processedFile;
      if (faceResult.boundingBox) {
        toast.info("Cropping to center face...");
        finalFile = await cropFaceToCenter(processedFile, faceResult.boundingBox);
      }

      // Quality Gate check
      toast.info("Checking image quality...");
      const quality = await checkImageQuality(finalFile);
      if (quality.blurFail) {
        setQualityWarningMsg(quality.reasons.filter(r => r.includes('เบลอ')));
        setPendingFile(finalFile);
        const imageUrl = URL.createObjectURL(finalFile);
        setSelectedImage(imageUrl);
        setShowQualityWarning(true);
        return;
      }
      // Show preview with overlay
      setPendingFile(finalFile);
      const imageUrl = URL.createObjectURL(finalFile);
      setSelectedImage(imageUrl);

      if (quality.brightnessFail) {
        setBrightnessWarningMsg(quality.reasons.filter(r => !r.includes('เบลอ')));
        setShowBrightnessWarning(true);
      } else {
        toast.success("พบใบหน้าแล้ว! กรุณาตรวจสอบตำแหน่งในกรอบ");
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
    }
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;

    try {
      toast.info("Optimizing image brightness and contrast...");
      
      // Resize and auto-adjust the image before uploading
      const resizedFile = await resizeImage(pendingFile);
      
      // Upload the resized image
      await uploadToSupabase(resizedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
      setIsUploading(false);
    }
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
    setAnnotatedImage(null);
    setShowAnnotated(false);
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
                  {showAnnotated && annotatedImage ? "Detected Skin" : "Preview"}
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
                  src={showAnnotated && annotatedImage ? annotatedImage : selectedImage}
                  alt={showAnnotated && annotatedImage ? "Detected Skin" : "Preview"}
                  className="w-full h-auto max-h-[600px] object-contain"
                />
                
                {/* Face Guide Overlay on Preview */}
                {!isAnalyzing && !showAnnotated && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative" style={{ width: '55%', height: '75%' }}>
                      {/* Oval Face Guide */}
                      <div className="absolute inset-0 border-4 border-green-500/60 rounded-[50%] shadow-lg">
                        <div className="absolute inset-0 border-2 border-dashed border-green-400/80 rounded-[50%]"></div>
                      </div>
                      {/* Corner markers */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-green-500"></div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-green-500"></div>
                      <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-0.5 bg-green-500"></div>
                      <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-0.5 bg-green-500"></div>
                    </div>
                    {/* Instruction text */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm text-center">
                      จัดตำแหน่งใบหน้าให้อยู่ในกรอบสีเขียว
                      <br />
                      เพื่อผลการวิเคราะห์ผิวหน้าได้อย่างแม่นยำ
                    </div>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin" />
                      <p>Analyzing skin...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle button for annotated image */}
              {annotatedImage && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAnnotated(!showAnnotated)}
                    className="w-full max-w-xs"
                  >
                    {showAnnotated ? "Show Original" : "Show Detected Skin"}
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                {pendingFile && !isUploading && !annotatedImage ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedImage(null);
                        setPendingFile(null);
                      }}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      ยกเลิก
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleConfirmUpload}
                      className="w-full bg-gradient-to-r from-primary to-accent"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      ยืนยันและอัปโหลด
                    </Button>
                  </>
                ) : (
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
                )}
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

        </>
      )}

      {/* Brightness Warning Dialog */}
      <AlertDialog open={showBrightnessWarning} onOpenChange={setShowBrightnessWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ แสงไม่เหมาะสม</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <ul className="list-disc list-inside space-y-1 mb-3">
                  {brightnessWarningMsg.map((msg, i) => (
                    <li key={i} className="text-sm font-medium">{msg}</li>
                  ))}
                </ul>
                <p className="text-sm">ระบบจะปรับแสงให้อัตโนมัติ คุณสามารถดำเนินการต่อหรือเลือกรูปใหม่ได้</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                setShowBrightnessWarning(false);
                setSelectedImage(null);
                setPendingFile(null);
              }}
            >
              เลือกรูปใหม่
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setShowBrightnessWarning(false);
                toast.success("พบใบหน้าแล้ว! ระบบจะปรับแสงให้อัตโนมัติ");
              }}
            >
              ดำเนินการต่อ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Quality Warning Dialog */}
      <AlertDialog open={showQualityWarning} onOpenChange={setShowQualityWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ คุณภาพภาพไม่ผ่านเกณฑ์</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-2">พบปัญหาดังนี้:</p>
                <ul className="list-disc list-inside space-y-1">
                  {qualityWarningMsg.map((msg, i) => (
                    <li key={i} className="text-sm text-destructive font-medium">{msg}</li>
                  ))}
                </ul>
                <p className="mt-3 text-sm">แนะนำให้ถ่ายรูปใหม่ในที่แสงพอเหมาะและกล้องนิ่ง</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowQualityWarning(false);
                setSelectedImage(null);
                setPendingFile(null);
              }}
            >
              เลือกรูปใหม่
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No Face Detected Alert Dialog */}
      <AlertDialog open={showNoFaceDialog} onOpenChange={setShowNoFaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ไม่พบใบหน้าในรูปภาพ</AlertDialogTitle>
            <AlertDialogDescription>
              กรุณาอัปโหลดรูปภาพที่มีใบหน้าชัดเจน เพื่อให้ระบบสามารถวิเคราะห์ผิวหน้าได้อย่างแม่นยำ
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNoFaceDialog(false)}>
              เข้าใจแล้ว
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImageUploader;