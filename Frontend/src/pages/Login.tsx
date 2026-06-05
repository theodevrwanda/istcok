import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, User, Loader2, Sun, Moon, Package, BarChart3, ClipboardCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const Login = () => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [view, setView] = useState<"login" | "register" | "forgot">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { login, register } = useAuth();

  // Reset password states
  const [isUserVerified, setIsUserVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegisterSubmit = async () => {
    if (!username || !password) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    
    setIsLoggingIn(true);
    
    try {
      await register(username.trim(), password);
      toast({ title: "Registration Successful!", description: "Please sign in to your new account." });
      setView("login");
      setPassword("");
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message || "Registration failed. Try a different username.", variant: "destructive" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (view === "register") {
      await handleRegisterSubmit();
      return;
    }
    if (view === "forgot") {
      await handleForgotPassword();
      return;
    }

    if (!username || !password) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    
    setIsLoggingIn(true);

    try {
      await login(username.trim(), password);
      toast({ title: "Login Successful", description: "Welcome back to SMS!" });
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message || "Invalid username or password.", variant: "destructive" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      toast({ title: "Required", description: "Please enter your username.", variant: "destructive" });
      return;
    }

    setIsResetting(true);

    try {
      if (!isUserVerified) {
        // Step 1: Verify user exists
        const res: any = await api.post("/auth/verify-username", { user_name: username.trim() });
        if (res.exists) {
          setIsUserVerified(true);
          toast({ title: "Username Verified", description: "Please set your new password below." });
        }
      } else {
        // Step 2: Reset password
        if (!newPassword || !confirmPassword) {
          toast({ title: "Missing fields", description: "Please enter and confirm your new password.", variant: "destructive" });
          setIsResetting(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
          setIsResetting(false);
          return;
        }

        await api.post("/auth/reset-password", {
          user_name: username.trim(),
          password: newPassword
        });

        toast({ title: "Password Updated", description: "Your password has been changed successfully. Redirecting to login..." });
        setTimeout(() => {
          setView("login");
          setIsUserVerified(false);
          setUsername("");
          setNewPassword("");
          setConfirmPassword("");
        }, 2000);
      }
    } catch (err: any) {
      toast({ title: "Request Failed", description: err.message || "Failed to process request.", variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

  const features = [
    { icon: Package, title: "Stock Tracking", desc: "Real-time inventory monitoring" },
    { icon: BarChart3, title: "Reports & Analytics", desc: "Detailed movement insights" },
    { icon: ClipboardCheck, title: "Audit Trail", desc: "Full transaction history" },
    { icon: ShieldCheck, title: "Secure Access", desc: "JWT encrypted sessions" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background decorative glow elements */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl -z-10 animate-pulse" style={{ animationDuration: "6s" }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-3xl -z-10 animate-pulse" style={{ animationDuration: "8s" }} />

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Center login card */}
      <div className="w-full max-w-[400px] bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] space-y-6 animate-in fade-in zoom-in-95 duration-300 relative">
        {/* Logo and branding */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src="/sms-logo.png"
              alt="SMS Logo"
              className="w-12 h-12 rounded-xl object-cover shadow-md border border-border/50"
            />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-lg font-black text-foreground tracking-tight">SMS Control</h1>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black">Stock Management</p>
          </div>
          <div className="space-y-1 pt-1.5">
            <h2 className="text-xs font-bold text-foreground">
              {view === "login" ? "Welcome back" : view === "register" ? "Create operator account" : "Reset Password"}
            </h2>
            <p className="text-[10px] text-muted-foreground font-semibold">
              {view === "login"
                ? "Enter your credentials to access the stock dashboard."
                : view === "register"
                ? "Register a new operator account to get started."
                : "Enter your username to request a password reset."}
            </p>
          </div>
        </div>

        {/* Action Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="h-10 pl-9 text-xs bg-muted/20 border-border/60 rounded-xl"
                disabled={isLoggingIn || isResetting || (view === "forgot" && isUserVerified)}
              />
            </div>
          </div>

          {view !== "forgot" && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Password</Label>
                {view === "login" && (
                  <button 
                    type="button" 
                    onClick={() => { setView("forgot"); }}
                    className="text-[9px] font-black uppercase tracking-wider text-indigo-500 hover:underline underline-offset-4"
                    disabled={isLoggingIn}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 pl-9 pr-9 text-xs bg-muted/20 border-border/60 rounded-xl"
                  disabled={isLoggingIn}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoggingIn}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Reset password inputs */}
          {view === "forgot" && isUserVerified && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="h-10 pl-9 pr-9 text-xs bg-muted/20 border-border/60 rounded-xl"
                    disabled={isResetting}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isResetting}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="h-10 pl-9 pr-9 text-xs bg-muted/20 border-border/60 rounded-xl"
                    disabled={isResetting}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isResetting}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Button type="submit" className="w-full h-10 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoggingIn || isResetting}>
              {isLoggingIn || isResetting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
              {view === "login" 
                ? "Sign In" 
                : view === "register" 
                ? "Sign Up" 
                : !isUserVerified 
                ? "Verify Username" 
                : "Reset Password"}
            </Button>
            
            {view === "login" && (
              <div className="flex justify-between items-center text-[11px] font-medium pt-1">
                <button 
                  type="button" 
                  onClick={() => { 
                    setView("register"); 
                  }}
                  className="w-full text-center text-indigo-500 font-bold hover:underline py-1 text-[10px]"
                >
                  Create Account
                </button>
              </div>
            )}

            {view !== "login" && (
              <div className="flex justify-between items-center text-[11px] font-medium pt-1">
                <button 
                  type="button" 
                  onClick={() => { 
                    setView("login"); 
                    setIsUserVerified(false); 
                    setNewPassword(""); 
                    setConfirmPassword(""); 
                  }}
                  className="w-full text-center text-indigo-500 font-bold hover:underline py-1 text-[10px]"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Feature strip footer */}
        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/40">
          {features.slice(0, 2).map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-xl bg-muted/20 dark:bg-muted/10 border border-border/40"
            >
              <f.icon className="h-3 w-3 text-indigo-500 shrink-0" />
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">{f.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
