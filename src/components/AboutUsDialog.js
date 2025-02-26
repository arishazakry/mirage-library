"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function AboutUsDialog() {
  const t = useTranslations("HomePage");
  const [open, setOpen] = useState(false);

  // Show the dialog when the page loads
  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* About Us Button */}
      <DialogTrigger asChild>
        <Button variant="ghost">{t("about")}</Button>
      </DialogTrigger>

      {/* Dialog Content */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("about")}</DialogTitle>
          <DialogDescription>{t("welcome_message")}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
