import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Contact = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const contactInfo = [
    { icon: MapPin, title: t("contact.templeAddress"), details: ["Kailash Mahadev Temple", "Near Kailash Gate, Agra", "Uttar Pradesh - 282001"] },
    { icon: Phone, title: t("contact.contactNumbers"), details: ["+91 88596-92841", "+91 88596-92841 (WhatsApp)"] },
    { icon: Mail, title: t("contact.emailAddress"), details: ["kailashmahadevagra@gmail.com", "kailashmahadevagra@gmail.com"] },
    { icon: Clock, title: t("contact.templeHours"), details: ["Daily: 4:00 AM - 10:00 PM", "Special Darshan: By Appointment"] },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in Name, Email, and Message");
      return;
    }
    setSending(true);
    setTimeout(() => {
      toast.success("Message sent successfully! We'll get back to you soon. 🙏");
      setFormData({ name: "", phone: "", email: "", subject: "", message: "" });
      setSending(false);
    }, 1500);
  };

  const handleGetDirections = () => {
    window.open("https://www.google.com/maps/search/Kailash+Mahadev+Temple+Agra", "_blank");
  };

  return (
    <section id="contact" className="py-10 md:py-24 bg-muted temple-pattern">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-16">
          <Badge className="mb-3 md:mb-4 bg-primary/10 text-primary border-primary/20">
            <Phone className="h-3 w-3 mr-1" />
            {t("contact.badge")}
          </Badge>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
            {t("contact.title")} <span className="text-gradient-sacred">{t("contact.titleHighlight")}</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">{t("contact.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-3 md:space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 md:gap-4">
              {contactInfo.map((item) => (
                <Card key={item.title} className="hover:shadow-lg transition-shadow active:scale-[0.98]">
                  <CardContent className="p-3 md:p-4 flex flex-col md:flex-row gap-2 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-saffron flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-foreground text-xs md:text-base mb-0.5 md:mb-1">{item.title}</h4>
                      {item.details.map((detail, idx) => (
                        <p key={idx} className="text-[11px] md:text-sm text-muted-foreground">{detail}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button className="w-full bg-gradient-saffron hover:opacity-90 text-primary-foreground active:scale-[0.97]" size="lg" onClick={handleGetDirections}>
              <Navigation className="h-4 w-4 mr-2" />
              {t("common.getDirections")}
            </Button>
          </div>

          {/* Map */}
          <div className="lg:col-span-1">
            <Card className="h-full overflow-hidden">
              <div className="w-full h-full min-h-[250px] md:min-h-[300px] lg:min-h-full bg-muted flex items-center justify-center">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3556.4!2d77.9356!3d27.2381!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3955eee8c3e8c3e8%3A0x0!2zMjfCsDE0JzE4LjkiTiA3N8KwNTYnMTAuMiJF!5e0!3m2!1sen!2sin!4v1713600000000!5m2!1sen!2sin"
                  width="100%" height="100%" style={{ border: 0, minHeight: "250px" }} allowFullScreen loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade" title="Kailash Mahadev Temple Location"
                  className="grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardContent className="p-4 md:p-6">
                <h3 className="font-heading font-semibold text-lg md:text-xl text-foreground mb-3 md:mb-4">{t("contact.sendUsMessage")}</h3>
                <form className="space-y-3 md:space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <Input placeholder={t("contact.yourName")} className="bg-background h-11" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    <Input placeholder={t("contact.phoneNumber")} className="bg-background h-11" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <Input type="email" placeholder={t("contact.emailPlaceholder")} className="bg-background h-11" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  <Input placeholder={t("contact.subject")} className="bg-background h-11" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
                  <Textarea placeholder={t("contact.yourMessage")} rows={3} className="bg-background resize-none" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
                  <Button type="submit" className="w-full bg-gradient-saffron hover:opacity-90 text-primary-foreground h-11 active:scale-[0.97]" disabled={sending}>
                    {sending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("common.sending")}</>) : (<><Mail className="h-4 w-4 mr-2" />{t("common.sendMessage")}</>)}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
