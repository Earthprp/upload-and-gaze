import { Card } from "@/components/ui/card";
import { ProblemCard } from "@/components/ProblemCard";
import { Result } from "@/components/Result";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface ProblemDetail {
  title: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  possibleCauses: string[];
  treatments: string[];
}

const Analysis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, imageUrl } = location.state || {};
  const [problems, setProblems] = useState<ProblemDetail[]>([]);

  useEffect(() => {
    if (!data) {
      navigate('/');
      return;
    }

    // Map detected issues to problem cards with details
    const mappedProblems: ProblemDetail[] = data.detectedIssues.map((issue: string) => {
      // Default problem structure
      const problemDetail: ProblemDetail = {
        title: issue,
        severity: data.severity || 'moderate',
        description: `พบปัญหา ${issue} บนใบหน้า`,
        possibleCauses: ['ฮอร์โมน', 'ความเครียด', 'การทำความสะอาดไม่เพียงพอ'],
        treatments: ['ใช้ผลิตภัณฑ์ที่มี Salicylic Acid', 'หลีกเลี่ยงการสัมผัสใบหน้า', 'ทำความสะอาดหมอน 2 ครั้ง/สัปดาห์']
      };

      // Customize based on issue type
      if (issue.includes('สิว') || issue.includes('acne')) {
        problemDetail.possibleCauses = ['ฮอร์โมน', 'ความเครียด', 'การทำความสะอาดไม่เพียงพอ'];
        problemDetail.treatments = ['ใช้ผลิตภัณฑ์ที่มี Salicylic Acid', 'หลีกเลี่ยงการสัมผัสใบหน้า', 'ทำความสะอาดหมอนทุกสัปดาห์'];
      } else if (issue.includes('รอยดำ') || issue.includes('hyperpigmentation')) {
        problemDetail.possibleCauses = ['รอยแดงเป็นรอยดำ', 'การอักเสบผิวแดด'];
        problemDetail.treatments = ['ใช้ครีมกันแดดทุกวัน', 'ใช้ผลิตภัณฑ์ที่มี Vitamin C', 'พิจารณาการทำ Chemical Peel'];
      } else if (issue.includes('ตุ่ม') || issue.includes('Pustules')) {
        problemDetail.possibleCauses = ['เชื้อแบคทีเรีย', 'การอุดตันของรูขุมขน'];
        problemDetail.treatments = ['ใช้ครีมที่มีแอนติบาคทีเรีย', 'หลีกเลี่ยงการบีบหรือเกาตุ่ม'];
      }

      return problemDetail;
    });

    setProblems(mappedProblems);
  }, [data, navigate]);

  if (!data) {
    return null;
  }

  const formattedDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = new Date().toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit'
  });

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
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Cropped</h3>
              <div className="relative rounded-lg overflow-hidden border-2 border-border bg-muted aspect-square">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Cropped"
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
        </div>

        {/* Tabs */}
        <Tabs defaultValue="problems" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="problems">ปัญหา</TabsTrigger>
            <TabsTrigger value="recommendations">การดูแลและยารักษา</TabsTrigger>
            <TabsTrigger value="products">สถิตผิวและผลิตภัณฑ์</TabsTrigger>
          </TabsList>

          <TabsContent value="problems" className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">ปัญหาที่พบ</h2>
            <p className="text-muted-foreground mb-4">
              การวิเคราะห์และคำแนะนำที่ผ่าของคุณปัญหาผิว สิว และ จุดด่างดำ
            </p>
            {problems.map((problem, index) => (
              <ProblemCard key={index} {...problem} />
            ))}

            {problems.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">ไม่พบปัญหาผิวที่ต้องเฝ้าระวัง</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">สรุปและคำแนะนำเพิ่มเติม</h3>
              <ul className="space-y-3">
                {data.skincareRecommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex gap-3">
                    <span className="font-bold text-primary min-w-[1.5rem]">{index + 1}.</span>
                    <span className="text-sm leading-relaxed flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Result data={data} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analysis;
