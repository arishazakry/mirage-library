import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import AboutUsDialog from "@/components/AboutUsDialog";

export default function HomePage() {
  const t = useTranslations("HomePage");
  return (
    <div>
      <h1>{t("welcome_message")}</h1>
      <Link href="/about">{t("about")}</Link>
      <AboutUsDialog />
    </div>
  );
}
