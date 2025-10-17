import { Card } from "@/components/ui/card";
import { ProblemCard } from "@/components/ProblemCard";
import { Result } from "@/components/Result";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Clock, Sun, Moon, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface ProblemDetail {
  title: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  possibleCauses: string[];
  treatments: string[];
}

type AnalysisData = {
  skinType: string;
  overallAssessment: string;
  detectedIssues: Array<{
    issueName: string;
    severity: string; // 'low' | 'medium' | 'high' (หรืออื่นๆ)
    affectedArea?: string;
    possibleCauses: string[];
    recommendedSolutions: string[];
  }>;
  detectionCounts?: number;
  skincareRecommendations?: string[];
  productRecommendations?: {
    cleanser?: string;
    treatment?: string;
    moisturizer?: string;
    sunscreen?: string;
  };
  dailyRoutines?: {
    morningRoutine?: string[];
    nightRoutine?: string[];
  };
  overallSeverity?: string;
  timestamp?: string;
};

const mapSeverity = (s: string): 'mild' | 'moderate' | 'severe' => {
  const key = (s || '').toLowerCase().trim();
  if (key === 'low' || key === 'mild' || key === 'slight') return 'mild';
  if (key === 'medium' || key === 'moderate') return 'moderate';
  return 'severe'; // high/severe/unknown -> severe
};

const Analysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, imageUrl } = location.state || {};
  const [problems, setProblems] = useState<ProblemDetail[]>([]);

  // ป้องกันกรณี data ไม่มี ให้ redirect กลับหน้าแรก
  useEffect(() => {
    if (!data) {
      navigate('/');
      return;
    }

    const analysis: AnalysisData = data;

    const issues = Array.isArray(analysis.detectedIssues)
      ? analysis.detectedIssues
      : [];

    const mappedProblems: ProblemDetail[] = issues.map((issue) => {
      const title = issue.issueName || 'ปัญหาผิว';
      const severity = mapSeverity(issue.severity || analysis.overallSeverity || 'moderate');
      const areaText = issue.affectedArea ? `บริเวณ: ${issue.affectedArea}` : '';
      const descSummary = analysis.overallAssessment
        ? analysis.overallAssessment.split(' ').slice(0, 24).join(' ') + (analysis.overallAssessment.split(' ').length > 24 ? '...' : '')
        : '';
      const description = [areaText, descSummary].filter(Boolean).join(' • ') || `พบปัญหา ${title} บนใบหน้า`;

      return {
        title,
        severity,
        description,
        possibleCauses: issue.possibleCauses || [],
        treatments: issue.recommendedSolutions || []
      };
    });

    setProblems(mappedProblems);
  }, [data, navigate]);

  if (!data) return null;

  const analysis: AnalysisData = data;

  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
    []
  );

  const formattedTime = useMemo(
    () =>
      new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      }),
    []
  );

  // เตรียมข้อมูลจาก JSON สำหรับแท็บ recommendations
  const morningSteps = analysis.dailyRoutines?.morningRoutine ?? [
    "ล้างหน้าด้วยเจลล้างหน้าที่อ่อนโยน",
    "ทาเซรั่มที่มี Niacinamide (ถ้าใช้)",
    "ลงมอยส์เจอไรเซอร์เนื้อบางเบา",
    "ทาครีมกันแดด SPF50+ PA+++"
  ];

  const nightSteps = analysis.dailyRoutines?.nightRoutine ?? [
    "ล้างเครื่องสำอางด้วยคลีนซิ่งออยล์หรือบาล์ม (หากแต่งหน้าหรือทาครีมกันแดด)",
    "ล้างหน้าซ้ำด้วยคลีนเซอร์ที่มี BHA",
    "ทาเซรั่มรักษาสิว (เช่น Retinoid อ่อนๆ หรือ Niacinamide) หรือแต้มสิวเฉพาะจุดด้วย Benzoyl Peroxide",
    "ทามอยส์เจอไรเซอร์ที่ให้ความชุ่มชื้นได้ดีขึ้นเพื่อการฟื้นฟูผิวในเวลากลางคืน"
  ];

  const lifestyleTips = analysis.skincareRecommendations ?? [
    "ดื่มน้ำอย่างน้อย 8 แก้วต่อวัน",
    "นอนหลับพักผ่อนให้เพียงพอ 7-8 ชั่วโมง",
    "หลีกเลี่ยงอาหารทอด ของหวาน และนมมากเกินไป",
    "ออกกำลังกายอย่างสม่ำเสมอ",
    "จัดการความเครียดด้วยสมาธิหรือโยคะ"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับหน้าแรก
        </Button>

        {/* Analysis Images Section */}
        <Card className="p-6 mb-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Analysis Images</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Original</h3>
              <div className="relative rounded-lg overflow-hidden border-2 border-border bg-muted aspect-square">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Detected</h3>
              <div className="relative rounded-lg overflow-hidden border-2 border-border bg-muted aspect-square">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Detected"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Title and Meta Info */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-3">ผลการวิเคราะห์ผิวของคุณ</h1>
          <p className="text-sm text-muted-foreground mb-2">
            ประเภทผิว: {analysis.skinType} • ระดับภาพรวม: {mapSeverity(analysis.overallSeverity)}
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>ผู้เข้าชม: Guest</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>วันที่: {formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>เวลา: {formattedTime}</span>
            </div>
          </div>
          {analysis.overallAssessment && (
            <p className="mt-4 text-muted-foreground max-w-3xl mx-auto">
              {analysis.overallAssessment}
            </p>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="problems" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="problems">ปัญหา</TabsTrigger>
            <TabsTrigger value="recommendations">การดูแลและรักษา</TabsTrigger>
            <TabsTrigger value="products">สกินแคร์และผลิตภัณฑ์</TabsTrigger>
          </TabsList>

          <TabsContent value="problems" className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">ปัญหาที่พบ ({analysis.detectionCounts ?? problems.length})</h2>
            <p className="text-muted-foreground mb-6">
              การวิเคราะห์และคำแนะนำสำหรับปัญหาผิวตามภาพล่าสุด
            </p>

            <div className="grid gap-4">
              {problems.map((problem, index) => (
                <ProblemCard key={`problem-${index}`} {...problem} />
              ))}
            </div>

            {problems.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">ไม่พบปัญหาผิวที่ต้องเฝ้าระวัง</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">การดูแลและรักษา</h2>
              <p className="text-sm text-muted-foreground">
                ขั้นตอนการดูแลผิวประจำวันและคำแนะนำการใช้ชีวิต
              </p>
            </div>

            {/* Morning Routine - ใช้ข้อมูลจาก JSON */}
            <Card className="p-6 bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200/50">
              <div className="flex items-center gap-2 mb-4">
                <Sun className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold">ขั้นตอนเช้า</h3>
              </div>
              <div className="space-y-3">
                {morningSteps.map((text, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/70 dark:bg-background/50 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-semibold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Evening Routine - ใช้ข้อมูลจาก JSON */}
            <Card className="p-6 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50">
              <div className="flex items-center gap-2 mb-4">
                <Moon className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">ขั้นตอนเย็น</h3>
              </div>
              <div className="space-y-3">
                {nightSteps.map((text, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/70 dark:bg-background/50 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Lifestyle Recommendations - ใช้ข้อมูลจาก JSON */}
            <Card className="p-6 bg-green-50/50 dark:bg-green-950/20 border-green-200/50">
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">คำแนะนำการใช้ชีวิต</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {lifestyleTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-white/70 dark:bg-background/50 rounded-lg">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Weekly Schedule (ตัวอย่างคงเดิม) */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5" />
                <h3 className="text-lg font-semibold">ตารางเลือกใช้</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"].map((day) => (
                        <th key={day} className="p-2 text-center font-medium">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <td key={day} className="p-2">
                          <div className="space-y-1">
                            <div className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-center">
                              เช้า: ปกติ
                            </div>
                            <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-center">
                              {day % 2 === 0 ? "เย็น: ปกติ" : "เย็น: BHA"}
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Products/สถิตผิวและผลิตภัณฑ์ */}
          <TabsContent value="products">
            {/* ส่ง data ตรงๆ เข้า <Result /> ตามเดิม */}
            <Result data={data} />
            {/* ถ้าต้องการแสดงสรุปผลิตภัณฑ์ด้วย สามารถดึงจาก analysis.productRecommendations ได้ */}
            {analysis.productRecommendations && (
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Cleanser</h4>
                  <p className="text-sm text-muted-foreground">{analysis.productRecommendations.cleanser}</p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Treatment</h4>
                  <p className="text-sm text-muted-foreground">{analysis.productRecommendations.treatment}</p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Moisturizer</h4>
                  <p className="text-sm text-muted-foreground">{analysis.productRecommendations.moisturizer}</p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Sunscreen</h4>
                  <p className="text-sm text-muted-foreground">{analysis.productRecommendations.sunscreen}</p>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analysis;
