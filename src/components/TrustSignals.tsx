import { CheckCircle, Clock, Shield, Users, MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TrustSignals = () => {
  return (
    <section className="py-10 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
            <Shield className="h-3 w-3 mr-1" />
            Verified Information
          </Badge>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
            Official & Trustworthy <span className="text-gradient-sacred">Temple Portal</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Kailash Mahadev Temple Agra's official website providing accurate, verified visitor information and services
          </p>
        </div>

        {/* Trust Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {/* Verified Timings */}
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Verified Timings</h3>
                  <p className="text-sm text-muted-foreground">
                    Temple timings verified daily by official priests. Live darshan available 24/7.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authorized Information Portal */}
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Authorized Portal</h3>
                  <p className="text-sm text-muted-foreground">
                    Officially supported by Kailash Mahadev Temple Trust, Agra.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secure Booking */}
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Secure Booking</h3>
                  <p className="text-sm text-muted-foreground">
                    Encrypted puja booking with guaranteed transaction security.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Support */}
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Community Trusted</h3>
                  <p className="text-sm text-muted-foreground">
                    Trusted by thousands of devotees for accurate temple information and services.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Located in Agra */}
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Agra, India</h3>
                  <p className="text-sm text-muted-foreground">
                    Officially located in Sikandra, Agra, Uttar Pradesh, India.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Direct Support */}
          <Card className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Direct Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Contact temple staff directly for authentic visitor guidance and help.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Official Statement */}
        <Card className="mt-8 md:mt-12 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-heading font-semibold text-foreground mb-2 text-lg">
                  Official Website Statement
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  This is the <strong>official website of Kailash Mahadev Temple Agra</strong> and is supported by the 
                  temple trust and management. All information regarding temple timings, festivals, puja services, and 
                  visitor guidance is verified and updated regularly. For inquiries or support, please use our contact 
                  form or visit the temple in person. Last updated: April 2026.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default TrustSignals;
