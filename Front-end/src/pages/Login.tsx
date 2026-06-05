import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, User, Loader2, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const Login = () => {
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<"login" | "register" | "forgot">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { login, register } = useAuth();

  const handleRegisterSubmit = async () => {
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }
    
    setIsLoggingIn(true);
    setError("");
    setSuccess("");
    
    try {
      await register(username.trim(), password);
      setSuccess("Registration successful! Please sign in.");
      setView("login");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Registration failed. Try a different username.");
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
      setError("Please fill in all fields");
      return;
    }
    
    setIsLoggingIn(true);
    setError("");
    setSuccess("");

    try {
      await login(username.trim(), password);
      setSuccess("Login successful!");
    } catch (err: any) {
      setError(err.message || "Invalid username or password.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      setError("Please enter your username first.");
      return;
    }

    setIsResetting(true);
    setError("");
    setSuccess("");

    try {
      setSuccess("Password reset simulation: contact your system administrator.");
    } catch (err: any) {
      setError("Failed to process request.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans relative">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src="/logo.jpg" 
              alt="SMS Admin" 
              className="h-20 w-20 rounded-full object-cover shadow-lg border-2 border-primary/20" 
              onError={(e) => {
                // Fallback icon if logo image fails to load
                (e.target as any).src = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=200&auto=format&fit=crop";
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Stock Management System</h1>
            <p className="text-xs text-muted-foreground mt-1">SMS Full Database Integration</p>
          </div>
        </div>

        <form onSubmit={handleLoginSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
          {error && (
            <div className="text-xs font-semibold text-destructive bg-destructive/5 border border-destructive/10 rounded-md p-3 text-center animate-in fade-in duration-300">
              {error}
            </div>
          )}
          {success && (
            <div className="text-xs font-semibold text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 rounded-md p-3 text-center animate-in fade-in duration-300">
              {success}
            </div>
          )}
          
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); setSuccess(""); }}
                placeholder="Enter username"
                className="h-10 pl-10 text-xs bg-muted/20"
                disabled={isLoggingIn || isResetting}
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
                    onClick={() => { setView("forgot"); setError(""); setSuccess(""); }}
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
                  onChange={(e) => { setPassword(e.target.value); setError(""); setSuccess(""); }}
                  placeholder="••••••••"
                  className="h-10 pl-10 pr-10 text-xs bg-muted/20"
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

          <div className="space-y-2 pt-2">
            <Button type="submit" className="w-full h-10 text-xs font-bold" disabled={isLoggingIn || isResetting}>
              {isLoggingIn || isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {view === "login" ? "Sign In" : view === "register" ? "Sign Up" : "Request Reset"}
            </Button>
            
            <div className="flex justify-between items-center text-[11px] font-medium pt-2">
              {view === "login" ? (
                <span>
                  Don't have an account?{" "}
                  <button 
                    type="button" 
                    onClick={() => { setView("register"); setError(""); setSuccess(""); }}
                    className="text-primary font-bold hover:underline"
                  >
                    Create Account
                  </button>
                </span>
              ) : (
                <button 
                  type="button" 
                  onClick={() => { setView("login"); setError(""); setSuccess(""); }}
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
      </div>
    </div>
  );
};

export default Login;
