import { Card } from "@/components/ui/card";
import { ProblemCard } from "@/components/ProblemCard";
import { Result } from "@/components/Result";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Clock, Sun, Moon, Check } from "lucide-react";
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

    // Ensure detectedIssues exists and is an array
    const issues = Array.isArray(data.detectedIssues) 
      ? data.detectedIssues 
      : (typeof data.detectedIssues === 'string' ? [data.detectedIssues] : []);

    // Map detected issues to problem cards with details
    const mappedProblems: ProblemDetail[] = issues.map((issue: any) => {
      // Convert issue to string to ensure we can use string methods
      const issueStr = String(issue);
      
      // Default problem structure
      const problemDetail: ProblemDetail = {
        title: issueStr,
        severity: data.severity || 'moderate',
        description: `พบปัญหา ${issueStr} บนใบหน้า`,
        possibleCauses: ['ฮอร์โมน', 'ความเครียด', 'การทำความสะอาดไม่เพียงพอ'],
        treatments: ['ใช้ผลิตภัณฑ์ที่มี Salicylic Acid', 'หลีกเลี่ยงการสัมผัสใบหน้า', 'ทำความสะอาดหมอน 2 ครั้ง/สัปดาห์']
      };

      // Customize based on issue type
      if (issueStr.includes('สิว') || issueStr.includes('acne')) {
        problemDetail.possibleCauses = ['ฮอร์โมน', 'ความเครียด', 'การทำความสะอาดไม่เพียงพอ'];
        problemDetail.treatments = ['ใช้ผลิตภัณฑ์ที่มี Salicylic Acid', 'หลีกเลี่ยงการสัมผัสใบหน้า', 'ทำความสะอาดหมอนทุกสัปดาห์'];
      } else if (issueStr.includes('รอยดำ') || issueStr.includes('hyperpigmentation')) {
        problemDetail.possibleCauses = ['รอยแดงเป็นรอยดำ', 'การอักเสบผิวแดด'];
        problemDetail.treatments = ['ใช้ครีมกันแดดทุกวัน', 'ใช้ผลิตภัณฑ์ที่มี Vitamin C', 'พิจารณาการทำ Chemical Peel'];
      } else if (issueStr.includes('ตุ่ม') || issueStr.includes('Pustules')) {
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
            <p className="text-muted-foreground mb-6">
              การวิเคราะห์และคำแนะนำสำหรับปัญหาผิว สิว และ จุดด่างดำ
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

            {/* Morning Routine */}
            <Card className="p-6 bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200/50">
              <div className="flex items-center gap-2 mb-4">
                <Sun className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold">ขั้นตอนเช้า</h3>
              </div>
              <div className="space-y-3">
                {[
                  { step: 1, title: "ล้างหน้าด้วยโฟมล้างหน้า", product: "Gentle Cleanser", time: "1-2 นาที" },
                  { step: 2, title: "ใช้โทนเนอร์ปรับสมดุลผิว", product: "Balancing Toner", time: "30 วินาที" },
                  { step: 3, title: "ทา Vitamin C Serum", product: "Antioxidant Serum", time: "1 นาที" },
                  { step: 4, title: "ทาครีมบำรุงผิว", product: "Moisturizer", time: "1 นาที" },
                  { step: 5, title: "ทาครีมกันแดด SPF 30+", product: "Sunscreen", time: "1 นาที" }
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 p-3 bg-white/70 dark:bg-background/50 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-semibold flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.product}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Evening Routine */}
            <Card className="p-6 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50">
              <div className="flex items-center gap-2 mb-4">
                <Moon className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">ขั้นตอนเย็น</h3>
              </div>
              <div className="space-y-3">
                {[
                  { step: 1, title: "ล้างเครื่องสำอาง (ถ้ามี)", product: "Makeup Remover", time: "2 นาที" },
                  { step: 2, title: "ล้างหน้าด้วยโฟมทำความสะอาด", product: "Deep Cleanser", time: "2 นาที" },
                  { step: 3, title: "ใช้ BHA (พันธนาที)", product: "Salicylic Acid", time: "คู่คำ 10 นาที" },
                  { step: 4, title: "ทาครีมบำรุงผิวกลางคืน", product: "Night Moisturizer", time: "1 นาที" }
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 p-3 bg-white/70 dark:bg-background/50 rounded-lg">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.product}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Lifestyle Recommendations */}
            <Card className="p-6 bg-green-50/50 dark:bg-green-950/20 border-green-200/50">
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">คำแนะนำการใช้ชีวิต</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  "ดื่มน้ำอย่างน้อย 8 แก้วต่อวัน",
                  "นอนหลับพักผ่อนให้เพียงพอ 7-8 ชั่วโมง",
                  "หลีกเลี่ยงอาหารทอด ของหวาน และนมมากเกินไป",
                  "ออกกำลังกายอย่างสม่ำเสมอ",
                  "จัดการความเครียดด้วยสมาธิหรือโยคะ"
                ].map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-white/70 dark:bg-background/50 rounded-lg">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Weekly Schedule */}
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

          <TabsContent value="products">
            <Result data={data} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analysis;
