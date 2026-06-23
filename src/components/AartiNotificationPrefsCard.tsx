import { Bell, BellOff, BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AARTI_LIST, useAartiNotificationPrefs } from "@/hooks/useAartiNotificationPrefs";
import { useLanguage } from "@/contexts/LanguageContext";

const AARTI_TRANSLATION_KEYS: Record<string, string> = {
  "Mangla Aarti": "manglaAarti",
  "Shringar Darshan": "shringarDarshan",
  "Bhog Aarti": "bhogAarti",
  "Raj Bhog Aarti": "rajBhogAarti",
  "Sandhya Aarti": "sandhyaAarti",
  "Shayan Aarti": "shayanAarti",
};

const AartiNotificationPrefsCard = () => {
  const { prefs, toggleAarti, enableAll, disableAll, enabledCount } = useAartiNotificationPrefs();
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            {t("aartiPrefs.title")}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {enabledCount}/{AARTI_LIST.length} {t("aartiPrefs.enabled")}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {t("aartiPrefs.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        {AARTI_LIST.map((aarti) => (
          <div
            key={aarti.key}
            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {prefs[aarti.key] ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t(`aartiPrefs.${AARTI_TRANSLATION_KEYS[aarti.key]}`)}
                </p>
                <p className="text-xs text-muted-foreground">{aarti.time}</p>
              </div>
            </div>
            <Switch
              checked={prefs[aarti.key]}
              onCheckedChange={() => toggleAarti(aarti.key)}
              aria-label={`Toggle alerts for ${aarti.label}`}
            />
          </div>
        ))}

        <div className="flex gap-2 pt-3 border-t border-border mt-2">
          <Button variant="outline" size="sm" onClick={enableAll} className="flex-1">
            {t("aartiPrefs.enableAll")}
          </Button>
          <Button variant="outline" size="sm" onClick={disableAll} className="flex-1">
            {t("aartiPrefs.disableAll")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AartiNotificationPrefsCard;
