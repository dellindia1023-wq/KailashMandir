import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock3, MapPin } from "lucide-react";

interface KundliData {
  id: string;
  title: string;
  birth_name: string | null;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  kundli_data: any;
}

interface KundliCompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kundliA: KundliData;
  kundliB: KundliData;
}

const fields = [
  { key: "rashi", label: "Rashi" },
  { key: "nakshatra", label: "Nakshatra" },
  { key: "lagna", label: "Lagna" },
];

const textSections = [
  { key: "personality", label: "Personality" },
  { key: "career", label: "Career" },
  { key: "marriage", label: "Marriage" },
];

const CompareRow = ({
  label,
  valA,
  valB,
}: {
  label: string;
  valA: string;
  valB: string;
}) => {
  const match = valA && valB && valA === valB;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
      <div className="rounded-lg bg-muted/50 p-3 text-center">
        <p className="font-semibold text-foreground text-sm">{valA || "—"}</p>
      </div>
      <div className="flex flex-col items-center justify-center min-w-[70px]">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {match && (
          <Badge variant="outline" className="mt-1 text-[10px] border-green-500/40 text-green-600">
            Match
          </Badge>
        )}
      </div>
      <div className="rounded-lg bg-muted/50 p-3 text-center">
        <p className="font-semibold text-foreground text-sm">{valB || "—"}</p>
      </div>
    </div>
  );
};

const BirthDetail = ({ kundli }: { kundli: KundliData }) => (
  <div className="space-y-1.5 text-sm text-muted-foreground">
    <p className="font-heading font-semibold text-foreground truncate">{kundli.title}</p>
    <p className="text-xs">{kundli.birth_name || "Devotee"}</p>
    <div className="flex items-center gap-1.5">
      <Calendar className="h-3 w-3 text-primary" />
      <span>
        {new Date(kundli.birth_date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </span>
    </div>
    <div className="flex items-center gap-1.5">
      <Clock3 className="h-3 w-3 text-primary" />
      <span>{kundli.birth_time}</span>
    </div>
    <div className="flex items-center gap-1.5">
      <MapPin className="h-3 w-3 text-primary" />
      <span className="truncate">{kundli.birth_place}</span>
    </div>
  </div>
);

const KundliCompareDialog = ({
  open,
  onOpenChange,
  kundliA,
  kundliB,
}: KundliCompareDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Compare Kundlis</DialogTitle>
          <DialogDescription>
            Side-by-side comparison of two birth charts
          </DialogDescription>
        </DialogHeader>

        {/* Birth details header */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
          <div className="rounded-lg border border-border p-3">
            <BirthDetail kundli={kundliA} />
          </div>
          <div className="flex items-center text-muted-foreground font-bold text-lg">vs</div>
          <div className="rounded-lg border border-border p-3">
            <BirthDetail kundli={kundliB} />
          </div>
        </div>

        {/* Core astrology comparison */}
        <div className="space-y-3">
          <h4 className="font-heading font-semibold text-foreground">Core Astrology</h4>
          {fields.map((f) => (
            <CompareRow
              key={f.key}
              label={f.label}
              valA={kundliA.kundli_data?.[f.key] || ""}
              valB={kundliB.kundli_data?.[f.key] || ""}
            />
          ))}
        </div>

        {/* Lucky items comparison */}
        {["luckyGems", "luckyColors", "luckyNumbers"].map((key) => {
          const labelMap: Record<string, string> = {
            luckyGems: "💎 Lucky Gems",
            luckyColors: "🎨 Lucky Colors",
            luckyNumbers: "🔢 Lucky Numbers",
          };
          const valsA: string[] = kundliA.kundli_data?.[key] || [];
          const valsB: string[] = kundliB.kundli_data?.[key] || [];
          if (!valsA.length && !valsB.length) return null;
          return (
            <div key={key} className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
              <div className="flex flex-wrap gap-1">
                {valsA.map((v, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                ))}
              </div>
              <p className="text-xs font-medium text-muted-foreground text-center min-w-[70px]">
                {labelMap[key]}
              </p>
              <div className="flex flex-wrap gap-1">
                {valsB.map((v, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                ))}
              </div>
            </div>
          );
        })}

        {/* Text sections comparison */}
        {textSections.map((sec) => {
          const textA = kundliA.kundli_data?.[sec.key];
          const textB = kundliB.kundli_data?.[sec.key];
          if (!textA && !textB) return null;
          return (
            <div key={sec.key} className="space-y-2">
              <h4 className="font-heading font-semibold text-foreground">{sec.label}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-primary mb-1">{kundliA.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{textA || "—"}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-primary mb-1">{kundliB.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{textB || "—"}</p>
                </div>
              </div>
            </div>
          );
        })}
      </DialogContent>
    </Dialog>
  );
};

export default KundliCompareDialog;
