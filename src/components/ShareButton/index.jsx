import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { Copy, Share, Share2 } from "lucide-react";
import { Input } from "../ui/input";
import useGetShortenLink from "@/store/useGetShortenLink";

const ShareButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const getShortenLink = useGetShortenLink();
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsProcessing(true);
      getShortenLink()
        .then((d) => {
          setUrl(d);
        })
        .catch((e) => {
          setUrl("");
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  };

  return (
    <div>
      <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button onClick={handleToggle} className="btn btn-primary">
            <Share2 />
            Share
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="p-2 flex">
            <Input variant="outlined" value={url} className="bg-background" />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(url);
              }}
              loading={isProcessing}
            >
              <Copy />
              Copy
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ShareButton;
