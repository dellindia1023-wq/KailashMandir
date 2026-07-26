import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Phone, MessageCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { incrementCampaignImpression, incrementCampaignClick } from "@/hooks/useCampaigns";
import type { Campaign } from "@/lib/campaigns";

interface CampaignRendererProps {
  campaign: Campaign;
}

const iconForType = (type: string) => {
  switch (type) {
    case "phone":
      return <Phone className="h-4 w-4" />;
    case "whatsapp":
      return <MessageCircle className="h-4 w-4" />;
    case "payment":
      return <CreditCard className="h-4 w-4" />;
    default:
      return <ExternalLink className="h-4 w-4" />;
  }
};

const CampaignRenderer = ({ campaign }: CampaignRendererProps) => {
  useEffect(() => {
    if (!campaign?.id) return;
    incrementCampaignImpression(campaign.id);
  }, [campaign?.id]);

  const backgroundStyle = campaign.content?.image_url
    ? { backgroundImage: `url(${campaign.content.image_url})` }
    : { backgroundColor: campaign.content?.background_color || "#f7f0e8" };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
      <div className="absolute inset-0 opacity-80 bg-cover bg-center" style={backgroundStyle} />
      <div className="relative z-10 p-6 md:p-10 bg-background/80 backdrop-blur-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {campaign.content?.badge && (
              <Badge className="bg-gold/10 text-gold border-gold/20 mb-2">{campaign.content.badge}</Badge>
            )}
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{campaign.content?.headline || campaign.name}</h2>
            {campaign.description && (
              <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">{campaign.description}</p>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground">Priority {campaign.priority ?? 0}</div>
        </div>

        {campaign.content?.message && (
          <p className="text-sm md:text-base text-foreground/90 max-w-3xl mb-6">{campaign.content.message}</p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {(campaign.ctas || []).map((cta) => {
            const isExternal = cta.url.startsWith("http") || cta.type === "external";
            const target = cta.open_new_tab ? "_blank" : "_self";
            const buttonContent = (
              <span className="inline-flex items-center gap-2">
                {iconForType(cta.type)}
                {cta.label}
              </span>
            );

            const handleClick = () => {
              if (!campaign.id) return;
              incrementCampaignClick(campaign.id);
            };

            if (isExternal) {
              return (
                <a
                  key={cta.id}
                  href={cta.url}
                  target={target}
                  rel={cta.open_new_tab ? "noreferrer noopener" : undefined}
                  onClick={handleClick}
                  className="w-full sm:w-auto"
                >
                  <Button variant="secondary" className="w-full sm:w-auto">
                    {buttonContent}
                  </Button>
                </a>
              );
            }

            return (
              <Link key={cta.id} to={cta.url} onClick={handleClick} className="w-full sm:w-auto">
                <Button variant="secondary" className="w-full sm:w-auto">
                  {buttonContent}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CampaignRenderer;
