import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode } from "lucide-react";

interface DonationQRCodeProps {
  upiId?: string;
  payeeName?: string;
}

const DonationQRCode = ({
  upiId = "kailashmahadev@upi",
  payeeName = "Shri Kailash Mahadev Temple",
}: DonationQRCodeProps) => {
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&cu=INR`;

  return (
    <Card className="text-center border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-saffron/5">
      <CardHeader className="pb-2">
        <Badge className="mx-auto mb-2 bg-primary/10 text-primary border-primary/20">
          <QrCode className="h-3 w-3 mr-1" /> Quick Donate
        </Badge>
        <CardTitle className="font-heading text-lg">Scan & Donate via UPI</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <QRCodeSVG
            value={upiUrl}
            size={180}
            bgColor="#ffffff"
            fgColor="#1a1a1a"
            level="H"
            includeMargin={false}
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{payeeName}</p>
          <p className="text-xs text-muted-foreground">UPI: {upiId}</p>
          <p className="text-xs text-muted-foreground">
            Scan with any UPI app (Google Pay, PhonePe, Paytm)
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DonationQRCode;
