import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Fingerprint, Lock, ShieldCheck, ShieldOff, KeyRound } from "lucide-react";
import {
  isPinSetup,
  isBiometricEnabled,
  clearBiometricData,
  checkBiometricAvailability,
  useBiometricAuth,
} from "@/hooks/useBiometricAuth";

interface SecuritySettingsCardProps {
  userEmail: string;
}

const SecuritySettingsCard = ({ userEmail }: SecuritySettingsCardProps) => {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricOn, setBiometricOn] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [changePinOpen, setChangePinOpen] = useState(false);

  const refreshState = () => {
    setPinEnabled(isPinSetup());
    setBiometricOn(isBiometricEnabled());
  };

  useEffect(() => {
    refreshState();
    checkBiometricAvailability().then(setBiometricAvailable);
  }, []);

  const handleRemovePin = () => {
    clearBiometricData();
    refreshState();
    toast.success("Quick login has been removed.");
  };

  const handleBiometricToggle = (enabled: boolean) => {
    localStorage.setItem("kmt_biometric_enabled", enabled ? "true" : "false");
    setBiometricOn(enabled);
    toast.success(enabled ? "Biometric unlock enabled." : "Biometric unlock disabled.");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Security & Quick Login
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* PIN Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">PIN Quick Login</p>
                <p className="text-xs text-muted-foreground">
                  {pinEnabled ? "PIN is set up for quick access" : "Not configured"}
                </p>
              </div>
            </div>
            <Badge variant={pinEnabled ? "default" : "secondary"}>
              {pinEnabled ? "Active" : "Off"}
            </Badge>
          </div>

          {pinEnabled && (
            <div className="flex gap-2 ml-13">
              <Button variant="outline" size="sm" onClick={() => setChangePinOpen(true)}>
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Change PIN
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleRemovePin}>
                <ShieldOff className="h-3.5 w-3.5 mr-1.5" />
                Remove
              </Button>
            </div>
          )}

          {!pinEnabled && (
            <Button variant="outline" size="sm" onClick={() => setChangePinOpen(true)} className="ml-13">
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              Set Up PIN
            </Button>
          )}

          <Separator />

          {/* Biometric Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Fingerprint className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Biometric Unlock</p>
                <p className="text-xs text-muted-foreground">
                  {biometricAvailable
                    ? "Use fingerprint or face to verify identity"
                    : "Not supported on this device"}
                </p>
              </div>
            </div>
            <Switch
              checked={biometricOn}
              onCheckedChange={handleBiometricToggle}
              disabled={!pinEnabled || !biometricAvailable}
            />
          </div>

          {!biometricAvailable && (
            <p className="text-xs text-muted-foreground ml-13">
              Your device or browser doesn't support biometric authentication.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Change/Set PIN Dialog */}
      <ChangePinDialog
        open={changePinOpen}
        onClose={() => { setChangePinOpen(false); refreshState(); }}
        userEmail={userEmail}
        isChange={pinEnabled}
        biometricEnabled={biometricOn && biometricAvailable}
      />
    </>
  );
};

function ChangePinDialog({
  open,
  onClose,
  userEmail,
  isChange,
  biometricEnabled,
}: {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  isChange: boolean;
  biometricEnabled: boolean;
}) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [password, setPassword] = useState("");
  const { setupPin, verifyPin } = useBiometricAuth();

  const reset = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setPassword("");
  };

  const handleSave = async () => {
    // Validate current PIN if changing
    if (isChange) {
      const creds = await verifyPin(currentPin);
      if (!creds) {
        toast.error("Current PIN is incorrect.");
        return;
      }
    }

    if (!password || password.length < 6) {
      toast.error("Enter your account password to set up PIN.");
      return;
    }

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

    await setupPin(newPin, userEmail, password, biometricEnabled);
    toast.success(isChange ? "PIN changed successfully! 🔐" : "PIN set up successfully! 🔐");
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <KeyRound className="h-5 w-5 text-primary" />
            {isChange ? "Change PIN" : "Set Up PIN"}
          </DialogTitle>
          <DialogDescription>
            {isChange
              ? "Enter your current PIN and choose a new one."
              : "Create a 4-6 digit PIN for quick login. You'll also need your account password."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isChange && (
            <div className="space-y-2">
              <Label>Current PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                className="text-center tracking-[0.5em] text-lg"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Account Password</Label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

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

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button className="flex-1 bg-gradient-saffron text-primary-foreground" onClick={handleSave}>
              {isChange ? "Change PIN" : "Save PIN"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SecuritySettingsCard;
