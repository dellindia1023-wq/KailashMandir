import SEOHead from "@/components/SEOHead";

/** Blocks indexing of login, dashboard, and admin routes */
const PrivateAreaSEO = ({ title = "Account" }: { title?: string }) => (
  <SEOHead
    title={title}
    description="Private account area — Kailash Mahadev Temple Agra."
    noindex
  />
);

export default PrivateAreaSEO;
