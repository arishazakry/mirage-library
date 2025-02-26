"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import AboutUsDialog from "@/components/AboutUsDialog";
import DynamicLayout from "@/components/DynamicLayout";
import ReduxProvider from "../ReduxProvider";
import { Toggle } from "../ui/toggle";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import Image from "next/image";
import AdvancedFilter from "../FilterPanel";

export default function HomePage() {
  const t = useTranslations("HomePage");
  const { setTheme, theme } = useTheme();
  return (
    <ReduxProvider>
      <div className="h-dvh w-dvw flex flex-col items-center justify-center">
        <div className="w-full bg-primary-foreground flex items-center">
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
          <AdvancedFilter />
        </div>
        <div className="flex-grow w-full">
          <DynamicLayout />
        </div>
      </div>
    </ReduxProvider>
  );
}
