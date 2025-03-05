"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import AboutUsDialog from "@/components/AboutUsDialog";
import DynamicLayout from "@/components/DynamicLayout";
import ReduxProvider from "../ReduxProvider";
import { Toggle } from "../ui/toggle";
import { useTheme } from "next-themes";
import {
  AArrowDown,
  AArrowUp,
  ALargeSmall,
  Languages,
  LayoutDashboard,
  Moon,
  Sun,
} from "lucide-react";
import Image from "next/image";
import AdvancedFilter from "../FilterPanel";
import { Button } from "../ui/button";
import { useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HomePage() {
  const t = useTranslations("HomePage");
  const { setTheme, theme } = useTheme();
  const [layoutItems, setLayoutItems] = useState({
    earth: { key: "Earth View", val: true, disable: true },
    eventList: { key: "Event List", val: true },
    eventDetail: { key: "Event Details", val: true },
    eventMap: { key: "Event List Map", val: true },
    mediaDetail: { key: "Listen", val: true },
    eventSelectedList: { key: "Selected Events", val: true },
    eventListDetail: { key: "Event List Visualization", val: true },
  });
  return (
    <ReduxProvider>
      <div className="h-dvh w-dvw flex flex-col items-center justify-center">
        <div className="w-full bg-primary-foreground flex items-center justify-between p-2">
          <div className="flex items-center">
            <Image
              src={require("@/assets/logo.png")}
              width={150}
              height={60}
              alt="mirage-logo"
              className="m-1 invert dark:invert-0 -hue-rotate-180 dark:hue-rotate-0"
            />
            <Toggle
              onClick={() =>
                theme === "dark" ? setTheme("light") : setTheme("dark")
              }
            >
              {theme === "dark" ? <Moon /> : <Sun />}
            </Toggle>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <LayoutDashboard />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <h4 className="font-medium leading-none">Layout</h4>
                <Separator className="my-2" />
                <div className="grid gap-4">
                  {Object.entries(layoutItems).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <Label>{value.key}</Label>
                      <Checkbox checked={value.val} />
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon">
              <AArrowDown />
            </Button>
            <Button variant="ghost" size="icon">
              <AArrowUp />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger variant="ghost" size="icon">
                <Languages />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>{t("langue")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>English</DropdownMenuItem>
                <DropdownMenuItem>German</DropdownMenuItem>
                <DropdownMenuItem>Vietnamese</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex">
            <AdvancedFilter />
          </div>
        </div>
        <div className="flex-grow w-full">
          <DynamicLayout />
        </div>
      </div>
    </ReduxProvider>
  );
}
