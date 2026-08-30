import React from "react";
import { CheckCircle2, ImageIcon, VideoIcon, FileText } from "lucide-react";

interface Props {
  item: any; // CompletionMediaItem
}

export default function CompletionMediaPreview({ item }: Props) {
  const { media_type, url, caption, approval_status } = item;

  const renderMedia = () => {
    if (media_type === "photo") {
      return (
        <img src={url} alt={caption || "Completion photo"} className="h-40 w-full rounded-lg object-cover" />
      );
    }

    if (media_type === "video") {
      return (
        <video controls className="h-40 w-full rounded-lg bg-black">
          <source src={url} />
          Your browser does not support the video tag.
        </video>
      );
    }

    // certificate or other
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <div>
            <div className="font-medium">Certificate</div>
            {caption && <div className="text-xs text-muted-foreground">{caption}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View</a>
          <a href={url} download className="text-xs">Download</a>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div className="text-sm font-medium">{media_type === "certificate" ? "Certificate Uploaded" : media_type === "photo" ? "Photo Uploaded" : "Video Uploaded"}</div>
        </div>
        <div className="text-xs text-muted-foreground">{approval_status === "approved" ? "Approved" : approval_status}</div>
      </div>
      <div className="mt-3">{renderMedia()}</div>
      {caption && <div className="mt-2 text-xs text-muted-foreground">{caption}</div>}
    </div>
  );
}
