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
    <div className="min-h-screen bg-background flex font-sans relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* LEFT SIDE — Splash Hero Image */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Background image */}
        <img
          src="/stock-hero.png"
          alt="Stock Management Warehouse"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-teal-900/60" />
        
        {/* Animated floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-64 h-64 rounded-full bg-teal-400/5 -top-20 -left-20 animate-pulse" style={{ animationDuration: "4s" }} />
          <div className="absolute w-96 h-96 rounded-full bg-cyan-400/5 bottom-10 -right-20 animate-pulse" style={{ animationDuration: "6s" }} />
          <div className="absolute w-48 h-48 rounded-full bg-emerald-400/5 top-1/2 left-1/3 animate-pulse" style={{ animationDuration: "5s" }} />
        </div>

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Top: Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/sms-logo.png"
              alt="SMS Logo"
              className="w-11 h-11 rounded-xl object-cover shadow-md border border-slate-200/50"
            />
            <div>
              <h2 className="text-white font-black text-base tracking-tight">SMS</h2>
              <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">Stock Management</p>
            </div>
          </div>

          {/* Center hero text */}
          <div className="space-y-6 max-w-lg">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 backdrop-blur-sm">

              <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
                Manage Your
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">
                  Stock Inventory
                </span>
              </h1>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                Track every item received and issued. Full audit trail with real-time analytics and reporting.
              </p>
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center shrink-0">
                    <f.icon className="h-4 w-4 text-teal-300" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">{f.title}</p>
                    <p className="text-white/40 text-[10px]">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-[10px] text-white/40 font-medium">Accuracy</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">24/7</p>
              <p className="text-[10px] text-white/40 font-medium">Monitoring</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">JWT</p>
              <p className="text-[10px] text-white/40 font-medium">Encrypted</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile branding */}
          <div className="text-center space-y-4 lg:hidden">
            <div className="flex justify-center">
              <img
                src="/sms-logo.png"
                alt="SMS Logo"
                className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-slate-200/50"
              />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock Management System</h1>
            <p className="text-slate-500 text-xs">Sign in to manage your inventory</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block space-y-2">
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {view === "login" ? "Welcome back" : view === "register" ? "Create account" : "Reset password"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {view === "login"
                ? "Enter your credentials to access the stock dashboard."
                : view === "register"
                ? "Register a new operator account to get started."
                : "Enter your username to request a password reset."}
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="h-10 pl-10 text-xs bg-muted/20 rounded-lg"
                  disabled={isLoggingIn || isResetting || (view === "forgot" && isUserVerified)}
                />
              </div>
            </div>

            {view !== "forgot" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Password</Label>
                  {view === "login" && (
                    <button 
                      type="button" 
                      onClick={() => { setView("forgot"); }}
                      className="text-[10px] font-bold text-primary hover:underline underline-offset-4"
                      disabled={isLoggingIn}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 pl-10 pr-10 text-xs bg-muted/20 rounded-lg"
                    disabled={isLoggingIn}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isLoggingIn}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Stage 2 Password Inputs for Reset Flow */}
            {view === "forgot" && isUserVerified && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="h-10 pl-10 pr-10 text-xs bg-muted/20 rounded-lg"
                      disabled={isResetting}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isResetting}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="h-10 pl-10 pr-10 text-xs bg-muted/20 rounded-lg"
                      disabled={isResetting}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isResetting}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Button type="submit" className="w-full h-10 text-xs font-bold rounded-lg" disabled={isLoggingIn || isResetting}>
                {isLoggingIn || isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {view === "login" 
                  ? "Sign In" 
                  : view === "register" 
                  ? "Sign Up" 
                  : !isUserVerified 
                  ? "Verify Username" 
                  : "Reset Password"}
              </Button>
              
              <div className="flex justify-between items-center text-[11px] font-medium pt-2">
                {view === "login" ? (
                  <span>
                    Don't have an account?{" "}
                    <button 
                      type="button" 
                      onClick={() => { setView("register"); }}
                      className="text-primary font-bold hover:underline"
                    >
                      Create Account
                    </button>
                  </span>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => { 
                      setView("login"); 
                      setIsUserVerified(false); 
                      setNewPassword(""); 
                      setConfirmPassword(""); 
                    }}
                    className="w-full text-center text-primary font-bold hover:underline py-1"
                  >
                    Back to Sign In
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-[10px] text-center text-muted-foreground pt-2 font-medium">
               Registered personnel session tracking is active.
            </p>
          </form>

          {/* Mobile-only feature strip */}
          <div className="lg:hidden grid grid-cols-2 gap-2">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border"
              >
                <f.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-[10px] font-bold text-muted-foreground">{f.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
