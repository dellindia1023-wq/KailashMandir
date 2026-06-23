import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Fingerprint, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useBiometricAuth, checkBiometricAvailability } from "@/hooks/useBiometricAuth";

interface PinSetupDialogProps {
  open: boolean;
  onClose: () => void;
  email: string;
  password: string;
}

const PinSetupDialog = ({ open, onClose, email, password }: PinSetupDialogProps) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [enableBiometric, setEnableBiometric] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [step, setStep] = useState<"ask" | "setup">("ask");
  const { setupPin } = useBiometricAuth();

  useEffect(() => {
    checkBiometricAvailability().then(setBiometricAvailable);
  }, []);

  const handleSetup = async () => {
    if (pin.length < 4 || pin.length > 6) {
      toast.error("PIN must be 4-6 digits");
      return;
    }
    if (!/^\d+$/.test(pin)) {
      toast.error("PIN must contain only numbers");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }

    await setupPin(pin, email, password, enableBiometric && biometricAvailable);
    toast.success("Quick login setup complete! 🔐");
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Quick Login Setup
          </DialogTitle>
          <DialogDescription>
            {step === "ask"
              ? "Set up a PIN for faster login next time. You can also use your device's biometric (fingerprint/face) to unlock."
              : "Create a 4-6 digit PIN for quick access."}
          </DialogDescription>
        </DialogHeader>

        {step === "ask" ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Fingerprint className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Enable quick unlock with PIN{biometricAvailable ? " and biometric authentication" : ""} for faster access to your account.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleSkip}>
                Skip
              </Button>
              <Button className="flex-1 bg-gradient-saffron text-primary-foreground" onClick={() => setStep("setup")}>
                Set Up PIN
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Enter PIN (4-6 digits)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="pl-10 text-center tracking-[0.5em] text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pin">Confirm PIN</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  className="pl-10 text-center tracking-[0.5em] text-lg"
                />
              </div>
            </div>

            {biometricAvailable && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-primary" />
                  <Label htmlFor="biometric-toggle" className="text-sm cursor-pointer">
                    Enable biometric unlock
                  </Label>
                </div>
                <Switch
                  id="biometric-toggle"
                  checked={enableBiometric}
                  onCheckedChange={setEnableBiometric}
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleSkip}>
                Skip
              </Button>
              <Button className="flex-1 bg-gradient-saffron text-primary-foreground" onClick={handleSetup}>
                Save PIN
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PinSetupDialog;
