"use client";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress"; // optional if using progress bar

export function ExportProgress({ isLoading }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + Math.random() * 10;
          return next < 95 ? next : 95; // simulate until 95%
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setProgress(100); // complete when done
      const timeout = setTimeout(() => setProgress(0), 1000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return (
    isLoading && (
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
        <Loader2 className="animate-spin w-4 h-4" />
        <span>Preparing export file...</span>
        <Progress value={progress} className="w-[150px]" />
      </div>
    )
  );
}
