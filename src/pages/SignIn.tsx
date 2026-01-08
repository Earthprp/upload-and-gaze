import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ตรวจสอบว่ามี recovery token จาก URL หรือไม่ (เมื่อกดลิงก์จากอีเมล)
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setShowPasswordDialog(true);
    }
  }, []);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      
      toast.success("Password changed successfully! Please sign in with your new password.");
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
      
      // Clear the hash from URL
      window.location.hash = '';
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    } else {
      // Clear form fields
      setFormData({ email: "", password: "" });
      navigate("/analysis"); // เปลี่ยนเป็นหน้า dashboard ของคุณ
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <div className="flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-base font-semibold">
                  Password
                </Label>
                <button 
                  type="button" 
                  className="text-sm text-primary hover:underline"
                  onClick={() => setShowResetForm(true)}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12"
                required
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <p className="text-center text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          </form>

          {/* Password Reset Dialog */}
          {showResetForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-background p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Reset Password</h2>
                
                {resetSent ? (
                  <div className="space-y-4">
                    <p>Password reset email has been sent to {resetEmail}. Please check your inbox.</p>
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        setShowResetForm(false);
                        setResetSent(false);
                        setResetEmail('');
                      }}
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!resetEmail) {
                      setError('Please enter your email');
                      return;
                    }
                    
                    setLoading(true);
                    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                      redirectTo: `${window.location.origin}/signin`
                    });
                    setLoading(false);
                    
                    if (resetError) {
                      setError(resetError.message);
                    } else {
                      setResetSent(true);
                      setError(null);
                    }
                  }} className="space-y-4">
                    <p>Enter your email and we'll send you a link to reset your password.</p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="your@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="h-10"
                        required
                      />
                    </div>
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowResetForm(false);
                          setError(null);
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Change Password Dialog */}
          {showPasswordDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">Change Password</h2>
                <p className="text-sm text-muted-foreground mb-4">Enter your new password below.</p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="h-10"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowPasswordDialog(false);
                        setNewPassword("");
                        setConfirmPassword("");
                        window.location.hash = '';
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleChangePassword}
                      disabled={loading}
                    >
                      {loading ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
