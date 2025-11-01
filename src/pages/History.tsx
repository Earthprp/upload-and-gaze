import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

const mockHistoryData = [
  { date: "Sep 16", score: 65 },
  { date: "Jun 8", score: 72 },
  { date: "Sep 25", score: 74 },
  { date: "Sept", score: 82 }
];

const mockTableData = [
  { date: "Oct 19, 2025", score: "82%", concerns: "No promintment", hasCompare: false },
  { date: "Sep 15, 2025", score: "74%", concerns: "Rough texture", hasCompare: true },
  { date: "Jul 23, 2025", score: "72%", concerns: "Dryness", hasCompare: false },
  { date: "May 10, 2025", score: "65%", concerns: "Spots", hasCompare: true }
];

const History = () => {
  const navigate = useNavigate();
  const [isSwapped, setIsSwapped] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/analysis')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Analysis
        </Button>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Skin History</h1>
          <div className="flex gap-3">
            <Button variant="outline" className="text-sm">
              2025-03-20 to 2025-10 18
            </Button>
            <Button variant="outline" className="text-sm">
              Export
            </Button>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="p-8 mb-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Side - Chart */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Before</h2>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-primary">82%</span>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setIsSwapped(!isSwapped)}
                  >
                    Swap
                  </Button>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-primary/5 rounded-lg p-4 mb-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockHistoryData}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                      formatter={(value: any) => [`${value}%`, 'Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Skin Health</h3>
                  <p className="text-3xl font-bold text-green-600">82%</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Moisture</h3>
                  <p className="text-3xl font-bold text-green-600">70%</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Oil</h3>
                  <p className="text-3xl font-bold text-green-600">55%</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Oil</h3>
                  <p className="text-3xl font-bold text-green-600">50%</p>
                </div>
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold mb-2">Spots</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-2xl font-bold">15</p>
                    <p className="text-2xl font-bold text-red-600">-33</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Image Comparison */}
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="relative rounded-lg overflow-hidden bg-muted aspect-[3/4] mb-2">
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <p className="text-sm">Oct 19, 2025</p>
                        <p className="text-xs">Skin Health</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Oct 19, 2025</p>
                    <p className="text-sm text-muted-foreground">Skin Health</p>
                  </div>
                </div>
                <div>
                  <div className="relative rounded-lg overflow-hidden bg-muted aspect-[3/4] mb-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                    >
                      Clear Compare
                    </Button>
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <p className="text-sm">Sep 15, 2025</p>
                        <p className="text-xs">Skin Health</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Sep 15, 2025</p>
                    <p className="text-sm text-muted-foreground">Skin Health</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* History Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-semibold">Date</th>
                  <th className="text-left py-4 px-4 font-semibold">Overall Score</th>
                  <th className="text-left py-4 px-4 font-semibold">Key Concerns</th>
                  <th className="text-left py-4 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockTableData.map((row, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-4 px-4">{row.date}</td>
                    <td className="py-4 px-4 font-semibold">{row.score}</td>
                    <td className="py-4 px-4 text-muted-foreground">{row.concerns}</td>
                    <td className="py-4 px-4">
                      {row.hasCompare ? (
                        <Button variant="outline" size="sm">
                          Compare
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default History;
