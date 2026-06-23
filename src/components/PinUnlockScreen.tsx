import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Fingerprint, Lock, LogIn, Loader2, X, KeyRound, ArrowLeft } from "lucide-react";
import { useBiometricAuth, isBiometricEnabled, clearBiometricData } from "@/hooks/useBiometricAuth";
import { supabase } from "@/integrations/supabase/client";

interface PinUnlockScreenProps {
  onUnlock: (email: string, password: string) => void;
  onSwitchToLogin: () => void;
  loading: boolean;
}

const PinUnlockScreen = ({ onUnlock, onSwitchToLogin, loading }: PinUnlockScreenProps) => {
  const [pin, setPin] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const { verifyPin, triggerBiometric, setupPin, loading: bioLoading } = useBiometricAuth();

  useEffect(() => {
    setBiometricAvailable(isBiometricEnabled());
  }, []);

  useEffect(() => {
    if (biometricAvailable) {
      handleBiometricUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricAvailable]);

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      toast.error("Enter your PIN");
      return;
    }
    const creds = await verifyPin(pin);
    if (!creds) {
      toast.error("Incorrect PIN");
      setPin("");
      return;
    }
    onUnlock(creds.email, creds.password);
  };

  const handleBiometricUnlock = async () => {
    const success = await triggerBiometric();
    if (!success) {
      toast.error("Biometric verification failed. Please use your PIN.");
      return;
    }
    toast.info("Biometric verified! Enter your PIN to complete login.");
  };

  const handleClearAndSwitch = () => {
    clearBiometricData();
    onSwitchToLogin();
  };

  if (showForgotPin) {
    return (
      <ForgotPinFlow
        onBack={() => setShowForgotPin(false)}
        onReset={(email, password, newPin) => {
          setupPin(newPin, email, password, isBiometricEnabled());
          toast.success("PIN reset successfully! 🔐");
          setShowForgotPin(false);
          setPin("");
        }}
        onSwitchToLogin={onSwitchToLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-divine flex items-center justify-center p-4">
      <div className="absolute inset-0 temple-pattern opacity-30" />
      <div className="relative z-10 w-full max-w-md">
        <Card className="border-2 border-gold/30 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-saffron flex items-center justify-center glow-saffron">
              <span className="text-3xl text-primary-foreground font-heading">ॐ</span>
            </div>
            <Badge className="mb-2 mx-auto bg-primary/10 text-primary">
              Quick Unlock
            </Badge>
            <CardTitle className="font-heading text-2xl text-foreground">
              Welcome Back
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                  className="pl-10 text-center tracking-[0.5em] text-lg"
                  autoFocus
                />
              </div>
              <div className="text-right">
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-primary p-0 h-auto"
                  onClick={() => setShowForgotPin(true)}
                >
                  Forgot PIN?
                </Button>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-saffron hover:opacity-90 text-primary-foreground"
              onClick={handlePinSubmit}
              disabled={loading || pin.length < 4}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              {loading ? "Signing in..." : "Unlock with PIN"}
            </Button>

            {biometricAvailable && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleBiometricUnlock}
                disabled={bioLoading}
              >
                {bioLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Fingerprint className="h-5 w-5 mr-2 text-primary" />
                )}
                Use Biometric
              </Button>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={onSwitchToLogin}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign in with Email instead
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive/70 hover:text-destructive"
                onClick={handleClearAndSwitch}
              >
                <X className="h-4 w-4 mr-2" />
                Remove Quick Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function ForgotPinFlow({
  onBack,
  onReset,
  onSwitchToLogin,
}: {
  onBack: () => void;
  onReset: (email: string, password: string, newPin: string) => void;
  onSwitchToLogin: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    if (!email || !password) {
      toast.error("Enter your email and password.");
      return;
    }
    setVerifying(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error("Invalid email or password.");
        return;
      }
      // Sign out immediately — we only needed to verify credentials
      await supabase.auth.signOut();
      setVerified(true);
      toast.success("Identity verified! Set your new PIN.");
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPin = () => {
    if (newPin.length < 4 || newPin.length > 6) {
      toast.error("PIN must be 4-6 digits.");
      return;
    }
    if (!/^\d+$/.test(newPin)) {
      toast.error("PIN must contain only numbers.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match.");
      return;
    }
    onReset(email, password, newPin);
  };

  return (
    <div className="min-h-screen bg-gradient-divine flex items-center justify-center p-4">
      <div className="absolute inset-0 temple-pattern opacity-30" />
      <div className="relative z-10 w-full max-w-md">
        <Card className="border-2 border-gold/30 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-heading text-xl text-foreground">
              Reset Your PIN
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {verified
                ? "Create a new 4-6 digit PIN."
                : "Verify your identity with email & password."}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {!verified ? (
              <>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  />
                </div>
                <Button
                  className="w-full bg-gradient-saffron text-primary-foreground"
                  onClick={handleVerify}
                  disabled={verifying}
                >
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                  {verifying ? "Verifying..." : "Verify Identity"}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>New PIN (4-6 digits)</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    className="text-center tracking-[0.5em] text-lg"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New PIN</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    className="text-center tracking-[0.5em] text-lg"
                  />
                </div>
                <Button
                  className="w-full bg-gradient-saffron text-primary-foreground"
                  onClick={handleResetPin}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Reset PIN
                </Button>
              </>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to PIN Unlock
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onSwitchToLogin}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign in with Email instead
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PinUnlockScreen;
