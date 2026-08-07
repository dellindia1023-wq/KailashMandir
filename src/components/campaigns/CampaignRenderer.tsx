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

  const donationAmount = (campaign.content as any)?.default_full_amount;
  const customAmountUrl = "/donate";
  const fullAmountUrl = donationAmount ? `/donate?amount=${donationAmount}` : "/donate";

  const backgroundStyle = campaign.content?.background_color || "#f7f0e8";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
      <div className="relative z-10 bg-background/80 backdrop-blur-sm">
        {campaign.content?.image_url ? (
          <div className="w-full overflow-hidden rounded-t-3xl">
            <img src={campaign.content.image_url} alt={campaign.content.headline || campaign.name} className="w-full h-44 object-cover" />
          </div>
        ) : (
          <div className="h-6 w-full" style={{ backgroundColor: backgroundStyle }} />
        )}
        <div className="p-6 md:p-10">
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

        {/* Donation-specific visuals: icon, gallery, progress */}
        {(campaign.type || "").toLowerCase() === "donation" || (campaign.content as any)?.target_amount ? (
          <div className="mb-4">
            <div className="flex items-center gap-4 mb-3">
              {(campaign.content as any)?.icon ? (
                <img src={(campaign.content as any).icon} alt="icon" className="h-10 w-10 rounded-full object-cover" />
              ) : null}
              <div className="flex-1">
                {typeof (campaign.content as any)?.target_amount === "number" ? (
                  <div className="text-sm text-muted-foreground">Target: ₹{(campaign.content as any).target_amount.toLocaleString()}</div>
                ) : null}
                <div className="text-sm text-muted-foreground">Raised: ₹{campaign.analytics?.donation_amount ?? 0}</div>
                {typeof (campaign.content as any)?.target_amount === "number" ? (
                  <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="h-2 bg-primary"
                      style={{ width: `${Math.min(100, Math.round(((campaign.analytics?.donation_amount || 0) / ((campaign.content as any).target_amount || 1)) * 100))}%` }}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {(campaign.content as any)?.gallery && Array.isArray((campaign.content as any).gallery) && (campaign.content as any).gallery.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto mb-4">
                {((campaign.content as any).gallery as string[]).slice(0, 5).map((src, i) => (
                  <img key={i} src={src} alt={`gallery-${i}`} className="h-16 w-24 object-cover rounded-md" />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {/* Donation-specific rendering: two CTAs (Full amount, Custom amount) */}
          {(campaign.type || "").toLowerCase() === "donation" || donationAmount ? (
            (() => {
              const handleClick = () => { if (campaign.id) incrementCampaignClick(campaign.id); };

              return (
                <>
                  <Link to={fullAmountUrl} onClick={handleClick} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto" style={{ backgroundColor: (campaign.content as any)?.button_color || undefined }}>
                      <span className="inline-flex items-center gap-2">{iconForType("payment")} Donate Full Amount</span>
                    </Button>
                  </Link>

                  <Link to={customAmountUrl} onClick={handleClick} className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <span className="inline-flex items-center gap-2">{iconForType("payment")} Donate Custom Amount</span>
                    </Button>
                  </Link>
                </>
              );
            })()
          ) : (
            (campaign.ctas || []).map((cta) => {
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

              const variant = cta.type === "payment" ? "default" : "secondary";

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
                    <Button variant={variant} className="w-full sm:w-auto">
                      {buttonContent}
                    </Button>
                  </a>
                );
              }

              return (
                <Link key={cta.id} to={cta.url} onClick={handleClick} className="w-full sm:w-auto">
                  <Button variant={variant} className="w-full sm:w-auto">
                    {buttonContent}
                  </Button>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  </section>
  );
};

export default CampaignRenderer;
