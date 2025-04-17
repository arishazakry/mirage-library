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
  GalleryThumbnails,
  Languages,
  LayoutDashboard,
  Moon,
  Redo,
  Sun,
  Undo,
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
import "./index.css";
import ShareButton from "../ShareButton";
import ExportButton from "../ExportButton";

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
      <div className="h-dvh w-dvw flex flex-col items-center justify-center overflow-hidden">
        <div className="w-full flex items-center justify-between p-2 ">
          <div className="flex items-center space-x-4 text-sm">
            <div className="image-container">
              <div className="bg-gradient w-full h-full rounded-lg absolute top-0 left-0"></div>
              <Image
                src={require("@/assets/logo.png")}
                width={150}
                height={60}
                alt="mirage-logo"
                // className="m-1 invert dark:invert-0 -hue-rotate-180 dark:hue-rotate-0"
              />
            </div>
            <Toggle
              onClick={() =>
                theme === "dark" ? setTheme("light") : setTheme("dark")
              }
            >
              {theme === "dark" ? <Moon /> : <Sun />}
            </Toggle>
            <Link href="/gallery" className="text-sm" target="_blank">
              <Button variant="ghost" size="icon">
                <GalleryThumbnails />
              </Button>
            </Link>
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
            <Separator orientation="vertical" className={"h-5"} />
            <Button variant="ghost" size="icon">
              <Undo />
            </Button>
            <Button variant="ghost" size="icon">
              <Redo />
            </Button>
          </div>
          <div className="flex gap-2">
            <AdvancedFilter />
            <ExportButton />
            <ShareButton />
          </div>
        </div>
        <div className="flex-grow w-full">
          <DynamicLayout />
        </div>
      </div>
    </ReduxProvider>
  );
}
