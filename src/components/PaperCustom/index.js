import React from "react";
import { Card } from "@/components/ui/card";

const PaperCustom = React.forwardRef(({ className = "", ...props }, ref) => {
  return (
    <Card
      ref={ref}
      className={`p-4 rounded-lg transition-transform duration-200 ${className}`}
      {...props}
    />
  );
});

PaperCustom.displayName = "PaperCustom";
export default PaperCustom;
