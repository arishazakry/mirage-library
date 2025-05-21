"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { HardDriveUpload } from "lucide-react";

export default function UploadButton({ onUpload }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      await onUpload(file);
      setUploading(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploading(false);
    }
    e.target.value = null;
  };

  return (
    <>
      <input
        type="file"
        accept="*"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        className="mr-2"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <HardDriveUpload />
        {uploading ? "Uploading..." : "Import"}
      </Button>
    </>
  );
}
