import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import Navbar from "@/components/Navbar";
import supabase from "@/lib/supabase";


const SignUp = () => {
  const navigate = useNavigate();
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    age: "",
    gender: ""
  });

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   // Handle sign up logic here
  //   console.log("Sign up:", formData);
  // };
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const { username, email, password, age, gender } = formData;

    // เรียก Supabase signUp
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: username,
          age: age,
          gender: gender,
       }, 
      },
    });

    if (error) {
      console.error("❌ Sign up error:", error.message);
      alert(error.message);
      return;
    }

    console.log("✅ Sign up success:", data);

    // Insert age and gender to profiles table when user signs up
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          age: parseInt(age) || null,
          gender: gender || null,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("❌ Failed to save age and gender:", profileError.message);
      } else {
        console.log("✅ Age and gender saved successfully");
      }
    }

    alert("Sign up success! ");

    // ไปหน้า Sign In
    navigate("/signin");
  } catch (err) {
    console.error("Unexpected error:", err);
  }
};


  const handleAcceptPrivacy = () => {
    if (checkboxChecked) {
      setPrivacyAccepted(true);
      setShowPrivacyDialog(false);
    }
  };

  const handleDeclinePrivacy = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyDialog && !privacyAccepted} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-primary">
              นโยบายความเป็นส่วนตัว
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6 text-foreground">
              <section>
                <h2 className="text-xl font-semibold text-primary mb-3">การเก็บรวบรวมข้อมูลส่วนบุคคล</h2>
                <p className="text-muted-foreground mb-4">
                  เพื่อให้คุณได้รับการวิเคราะห์ผิวที่แม่นยำและเหมาะสมกับคุณมากที่สุด เราจำเป็นต้องเก็บข้อมูลดังต่อไปนี้:
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-2">ข้อมูลที่เราขอเก็บ</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><span className="font-medium text-foreground">เพศ</span> - เพื่อปรับการวิเคราะห์ตามลักษณะผิวที่แตกต่างกันตามเพศ</li>
                  <li><span className="font-medium text-foreground">อายุ</span> - เพื่อประเมินสภาพผิวตามช่วงวัยและให้คำแนะนำที่เหมาะสม</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-2">วัตถุประสงค์การใช้ข้อมูล</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>วิเคราะห์สภาพผิวได้แม่นยำยิ่งขึ้นตามช่วงวัยและเพศ</li>
                  <li>แนะนำวิธีดูแลผิวที่เหมาะสมกับคุณ</li>
                  <li>ปรับปรุงและพัฒนาระบบวิเคราะห์ให้ดีขึ้น</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-2">การรักษาความปลอดภัย</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>ข้อมูลของคุณจะถูกจัดเก็บอย่างปลอดภัย</li>
                  <li>เราไม่แชร์ข้อมูลส่วนบุคคลของคุณกับบุคคลที่สาม</li>
                  <li>คุณสามารถขอดูหรือลบข้อมูลของคุณได้ทุกเมื่อ</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-2">สิทธิ์ของคุณ</h3>
                <p className="text-muted-foreground mb-2">คุณมีสิทธิ์:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>ขอเข้าถึงข้อมูลส่วนบุคคลของคุณ</li>
                  <li>ขอแก้ไขข้อมูลที่ไม่ถูกต้อง</li>
                </ul>
              </section>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">หมายเหตุ:</span> การให้ข้อมูลเหล่านี้เป็นความสมัครใจ แต่จะช่วยให้การวิเคราะห์ผิวของคุณแม่นยำและเหมาะสมมากขึ้น
                </p>
              </div>
            </div>
          </ScrollArea>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="privacy-accept" 
                checked={checkboxChecked}
                onCheckedChange={(checked) => setCheckboxChecked(checked as boolean)}
              />
              <label 
                htmlFor="privacy-accept" 
                className="text-sm cursor-pointer"
              >
                ฉันได้อ่านและยอมรับนโยบายความเป็นส่วนตัว
              </label>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleDeclinePrivacy}>
                ไม่ยอมรับ
              </Button>
              <Button 
                onClick={handleAcceptPrivacy}
                disabled={!checkboxChecked}
              >
                ยอมรับและดำเนินการต่อ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-2">
              Create Account
            </h1>
            <p className="text-muted-foreground">
              Join us today and get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base font-semibold">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="h-12"
                required
              />
            </div>

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
              <Label htmlFor="password" className="text-base font-semibold">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12"
                required
              />
              <p className="text-sm text-muted-foreground">
                Must contain 8+ characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age" className="text-base font-semibold">
                Age
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="h-12"
                required
                min="1"
                max="120"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-base font-semibold">
                Gender
              </Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })} required>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base"
            >
              Sign Up
            </Button>

            <p className="text-center text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/signin")}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
