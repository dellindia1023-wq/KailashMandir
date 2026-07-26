import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CampaignRenderer from "@/components/campaigns/CampaignRenderer";
import { useCampaigns, type CampaignContext } from "@/hooks/useCampaigns";

interface CampaignSlotProps {
  locationKey: string;
  pageType: string;
  category?: string;
  tags?: string[];
  searchQuery?: string;
}

const CampaignSlot = ({ locationKey, pageType, category, tags, searchQuery }: CampaignSlotProps) => {
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
  const campaign = campaigns[0];

  if (!campaign) return null;
  return <CampaignRenderer campaign={campaign} />;
};

export default CampaignSlot;
