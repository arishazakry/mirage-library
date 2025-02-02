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

export default function AboutUsDialog() {
  const [open, setOpen] = useState(false);

  // Show the dialog when the page loads
  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* About Us Button */}
      <DialogTrigger asChild>
        <Button variant="outline">About Us</Button>
      </DialogTrigger>

      {/* Dialog Content */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About Us</DialogTitle>
          <DialogDescription>
            Welcome to our platform! We specialize in building modern web
            applications with Next.js.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
