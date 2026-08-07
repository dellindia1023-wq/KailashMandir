import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CampaignRenderer from "@/components/campaigns/CampaignRenderer";
import { useCampaigns, type CampaignContext } from "@/hooks/useCampaigns";

interface CampaignCollectionProps {
  locationKey: string;
  pageType: string;
  category?: string;
  tags?: string[];
  searchQuery?: string;
}

const CampaignCollection = ({ locationKey, pageType, category, tags, searchQuery }: CampaignCollectionProps) => {
  const { user } = useAuth();
  const location = useLocation();

  const context: CampaignContext = useMemo(
    () => ({
      path: location.pathname,
      pageType,
      location: locationKey,
      isLoggedIn: Boolean(user),
      device: typeof navigator !== "undefined" && /Mobi|Android|Tablet/i.test(navigator.userAgent) ? "mobile" : "desktop",
      category,
      tags,
      searchQuery,
      customRoute: location.pathname,
    }),
    [location.pathname, pageType, locationKey, user, category, tags, searchQuery],
  );

  const { data: campaigns = [] } = useCampaigns(context);

  if (!campaigns || campaigns.length === 0) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {campaigns.map((campaign) => (
        <CampaignRenderer key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
};

export default CampaignCollection;
