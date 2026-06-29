import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { isPinSetup, hasStoredCredentials } from "@/hooks/useBiometricAuth";
import PinSetupDialog from "@/components/PinSetupDialog";
import PinUnlockScreen from "@/components/PinUnlockScreen";
import SEOHead from "@/components/SEOHead";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters").max(100);

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  
  // PIN/Biometric state
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [lastLoginEmail, setLastLoginEmail] = useState("");
  const [lastLoginPassword, setLastLoginPassword] = useState("");
  
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  // Check if PIN unlock should be shown
  useEffect(() => {
    if (!authLoading && !user && isPinSetup() && hasStoredCredentials()) {
      setShowPinUnlock(true);
    }
  }, [authLoading, user]);

  // Redirect logged-in users to appropriate dashboard based on role
  useEffect(() => {
    if (!authLoading && !roleLoading && user) {
      switch (role) {
        case "super_admin":
        case "admin":
          navigate("/admin", { replace: true });
          break;
        case "priest":
          navigate("/priest", { replace: true });
          break;
        default:
          navigate("/dashboard", { replace: true });
      }
    }
  }, [user, authLoading, roleLoading, role, navigate]);

  const validateForm = (isSignUp: boolean) => {
    const newErrors: { email?: string; password?: string; name?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (isSignUp && fullName) {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;
    
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Welcome back! 🙏");
      // Offer PIN setup if not already configured
      if (!isPinSetup()) {
        setLastLoginEmail(email);
        setLastLoginPassword(password);
        setShowPinSetup(true);
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(true)) return;
    
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    
    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Account created successfully! Welcome to Kailash Mahadev Temple 🙏");
    }
  };

  const handlePinUnlock = async (unlockEmail: string, unlockPassword: string) => {
    setLoading(true);
    const { error } = await signIn(unlockEmail, unlockPassword);
    setLoading(false);
    
    if (error) {
      toast.error("Session expired. Please sign in with email & password.");
      setShowPinUnlock(false);
    } else {
      toast.success("Welcome back! 🙏");
    }
  };

  // Show loading while checking auth state
  if (authLoading || (user && roleLoading)) {
    return (
      <div className="min-h-screen bg-gradient-divine flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  // Show PIN unlock screen
  if (showPinUnlock) {
    return (
      <PinUnlockScreen
        onUnlock={handlePinUnlock}
        onSwitchToLogin={() => setShowPinUnlock(false)}
        loading={loading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-divine flex items-center justify-center p-4">
      <SEOHead
        title="Login & Sign Up"
        description="Devotee login for Kailash mandir agra (Kailash Mahadev Temple) — book pujas, donations, and manage your account."
        canonical="/auth"
        noindex
      />
      {/* Background Pattern */}
      <div className="absolute inset-0 temple-pattern opacity-30" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-2 border-gold/30 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-saffron flex items-center justify-center glow-saffron">
              <span className="text-3xl text-primary-foreground font-heading">ॐ</span>
            </div>
            <Badge className="mb-2 mx-auto bg-primary/10 text-primary">
              Devotee Account
            </Badge>
            <CardTitle className="font-heading text-2xl text-foreground">
              Kailash Mahadev Temple
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-saffron hover:opacity-90 text-primary-foreground"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setForgotEmail(email); }}
                    className="w-full text-sm text-primary hover:underline mt-2"
                  >
                    Forgot Password?
                  </button>
                </form>

                {/* Forgot Password Inline */}
                {forgotMode && (
                  <div className="mt-4 p-4 rounded-lg border bg-muted/50 space-y-3">
                    <p className="text-sm font-medium">Reset your password</p>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setForgotMode(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-saffron hover:opacity-90 text-primary-foreground"
                        disabled={forgotLoading}
                        onClick={async () => {
                          const valid = emailSchema.safeParse(forgotEmail);
                          if (!valid.success) {
                            toast.error("Please enter a valid email address");
                            return;
                          }
                          setForgotLoading(true);
                          const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                            redirectTo: `${window.location.origin}/reset-password?type=recovery`,
                          });
                          setForgotLoading(false);
                          if (error) {
                            toast.error(error.message);
                          } else {
                            toast.success("Password reset link sent! Check your email.");
                            setForgotMode(false);
                          }
                        }}
                      >
                        {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Link"}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-saffron hover:opacity-90 text-primary-foreground"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    By signing up, you agree to receive temple updates and newsletters
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* PIN Setup Dialog */}
      <PinSetupDialog
        open={showPinSetup}
        onClose={() => setShowPinSetup(false)}
        email={lastLoginEmail}
        password={lastLoginPassword}
      />
    </div>
  );
};

export default Auth;
