import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Disclaimer from "@/components/Disclaimer";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface HistoryRecord {
  id: string;
  uploaded_at: string;
  user_id: string;
  image_url: string | null;
  skin_type: string | null;
  overall_assessment: string | null;
  detection_counts: number | null;
  overall_score: number | null;
  oiliness_level: number | null;
  hydration_level: number | null;
  tone_evenness: number | null;
  overall_severity: string | null;
}

const History = () => {
  const navigate = useNavigate();
  const [isSwapped, setIsSwapped] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestRecord, setLatestRecord] = useState<HistoryRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  // Get user session
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

  // Fetch history data
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('skin_analysis_history')
          .select('*')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false });

        if (error) {
          console.error('Error fetching history:', error);
        } else {
          setHistoryData(data || []);
          const latest = data && data.length > 0 ? data[0] : null;
          setLatestRecord(latest);
          setSelectedRecord(latest); // Initialize with latest record
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  // Prepare chart data from history
  const chartData = historyData.slice(0, 10).reverse().map((record) => ({
    date: new Date(record.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: record.overall_score || 0,
    hydration: record.hydration_level || 0,
    oiliness: record.oiliness_level || 0,
    tone: record.tone_evenness || 0
  }));

  // Show message for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/upload')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>

          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-10 h-10 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-3">Sign In Required</h2>
                <p className="text-muted-foreground mb-6">
                  There is no history to see. Please sign up to keep your history and track your skin health progress over time.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/signup')} size="lg">
                  Sign Up
                </Button>
                <Button onClick={() => navigate('/signin')} variant="outline" size="lg">
                  Sign In
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/upload')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Upload
        </Button>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Skin History</h1>
          <div className="flex gap-3">
            <Button variant="outline" className="text-sm">
              {historyData.length} Records
            </Button>
            <Button variant="outline" className="text-sm" disabled>
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
                <h2 className="text-xl font-semibold">
                  {selectedRecord?.id === latestRecord?.id ? 'Latest Analysis' : 'Selected Analysis'}
                </h2>
                {/* <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-primary">
                    {selectedRecord?.overall_score || 0}%
                  </span>
                </div> */}
              </div>

              {/* Chart */}
              <div className="bg-primary/5 rounded-lg p-4 mb-6 h-64">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                      domain={[0, 100]}
                      ticks={[0, 20, 40, 60, 80, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        color: 'hsl(var(--foreground))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                      formatter={(value: number) => `${value}%`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(142 76% 36%)" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(142 76% 36%)', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Skin Health"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="hydration" 
                      stroke="hsl(217 91% 60%)" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(217 91% 60%)', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Hydration"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="oiliness" 
                      stroke="hsl(45 93% 47%)" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(45 93% 47%)', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Oiliness"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tone" 
                      stroke="hsl(280 65% 60%)" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(280 65% 60%)', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Tone Evenness"
                    />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Skin Health</h3>
                  <p className="text-3xl font-bold text-green-600">{selectedRecord?.overall_score || 0}%</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Hydration</h3>
                  <p className="text-3xl font-bold text-green-600">{selectedRecord?.hydration_level || 0}%</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Oiliness</h3>
                  <p className="text-3xl font-bold text-green-600">{selectedRecord?.oiliness_level || 0}%</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tone Evenness</h3>
                  <p className="text-3xl font-bold text-green-600">{selectedRecord?.tone_evenness || 0}%</p>
                </div>
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold mb-2">Overall Assessment</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedRecord?.overall_assessment || 'No assessment available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Image Comparison */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {selectedRecord?.id === latestRecord?.id ? 'Latest Image' : 'Image Comparison'}
              </h2>
              
              {selectedRecord?.id === latestRecord?.id ? (
                // Show only latest image when it's selected
                selectedRecord?.image_url ? (
                  <div className="relative rounded-lg overflow-hidden bg-muted aspect-[3/4]">
                    <img 
                      src={selectedRecord.image_url} 
                      alt="Latest analysis" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3">
                      <p className="text-sm font-semibold">
                        {new Date(selectedRecord.uploaded_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs">{selectedRecord.skin_type} • {selectedRecord.overall_score}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden bg-muted aspect-[3/4] flex items-center justify-center">
                    <p className="text-muted-foreground">No image available</p>
                  </div>
                )
              ) : (
                // Show comparison when different record is selected
                <div className="grid grid-cols-2 gap-4">
                  {/* Latest Image */}
                  <div>
                    <p className="text-sm font-semibold mb-2 text-primary">Latest</p>
                    {latestRecord?.image_url ? (
                      <div className="relative rounded-lg overflow-hidden bg-muted aspect-[3/4]">
                        <img 
                          src={latestRecord.image_url} 
                          alt="Latest analysis" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                          <p className="text-xs font-semibold">
                            {new Date(latestRecord.uploaded_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs">{latestRecord.overall_score}%</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden bg-muted aspect-[3/4] flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">No image</p>
                      </div>
                    )}
                  </div>

                  {/* Selected Image */}
                  <div>
                    <p className="text-sm font-semibold mb-2 text-green-600">Selected</p>
                    {selectedRecord?.image_url ? (
                      <div className="relative rounded-lg overflow-hidden bg-muted aspect-[3/4]">
                        <img 
                          src={selectedRecord.image_url} 
                          alt="Selected analysis" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                          <p className="text-xs font-semibold">
                            {new Date(selectedRecord.uploaded_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs">{selectedRecord.overall_score}%</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden bg-muted aspect-[3/4] flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">No image</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comparison Stats */}
              {selectedRecord?.id !== latestRecord?.id && latestRecord && selectedRecord && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                  <h3 className="text-sm font-semibold mb-3">Comparison</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Skin Health</p>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{latestRecord.overall_score || 0}%</span>
                        <span className="text-muted-foreground">←</span>
                        <span className="font-semibold">{selectedRecord.overall_score || 0}%</span>
                        <span className={`text-xs font-semibold ${
                          (latestRecord.overall_score || 0) > (selectedRecord.overall_score || 0) 
                            ? 'text-green-600' 
                            : (latestRecord.overall_score || 0) < (selectedRecord.overall_score || 0)
                            ? 'text-red-600'
                            : 'text-muted-foreground'
                        }`}>
                          {(latestRecord.overall_score || 0) > (selectedRecord.overall_score || 0) 
                            ? `+${(latestRecord.overall_score || 0) - (selectedRecord.overall_score || 0)}%`
                            : (latestRecord.overall_score || 0) < (selectedRecord.overall_score || 0)
                            ? `${(latestRecord.overall_score || 0) - (selectedRecord.overall_score || 0)}%`
                            : '0%'
                          }
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Issues</p>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{latestRecord.detection_counts || 0}</span>
                        <span className="text-muted-foreground">←</span>
                        <span className="font-semibold">{selectedRecord.detection_counts || 0}</span>
                        <span className={`text-xs font-semibold ${
                          (latestRecord.detection_counts || 0) < (selectedRecord.detection_counts || 0) 
                            ? 'text-green-600' 
                            : (latestRecord.detection_counts || 0) > (selectedRecord.detection_counts || 0)
                            ? 'text-red-600'
                            : 'text-muted-foreground'
                        }`}>
                          {(latestRecord.detection_counts || 0) < (selectedRecord.detection_counts || 0) 
                            ? `${(latestRecord.detection_counts || 0) - (selectedRecord.detection_counts || 0)}`
                            : (latestRecord.detection_counts || 0) > (selectedRecord.detection_counts || 0)
                            ? `${(latestRecord.detection_counts || 0) - (selectedRecord.detection_counts || 0)}`
                            : '0'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      Loading history...
                    </td>
                  </tr>
                ) : historyData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No history records found. Start by analyzing your skin!
                    </td>
                  </tr>
                ) : (
                  historyData.map((record) => (
                    <tr key={record.id} className="border-b last:border-0">
                      <td className="py-4 px-4">
                        {new Date(record.uploaded_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-4 font-semibold">{record.overall_score || 0}%</td>
                      <td className="py-4 px-4 text-muted-foreground max-w-md">
                        <div className="line-clamp-2">
                          {record.overall_assessment || 'No assessment available'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Button 
                          variant={selectedRecord?.id === record.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            // Scroll to top to see the updated details
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          {selectedRecord?.id === record.id ? "Viewing" : "View"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="mt-8">
          <Disclaimer />
        </div>
      </div>
    </div>
  );
};

export default History;
