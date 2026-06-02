import {
  Building2,
  Car,
  Database,
  Globe,
  MessageCircle,
  Palette,
  Percent,
  Stethoscope,
  Tags,
} from "lucide-react";

export function getSettingsSections(t: (key: string) => string) {
  return [
    {
      value: "general",
      title: t("sectionGeneral"),
      description: t("sectionGeneralDesc"),
      icon: Building2,
    },
    {
      value: "appearance",
      title: t("sectionAppearance"),
      description: t("sectionAppearanceDesc"),
      icon: Palette,
    },
    {
      value: "commission",
      title: t("sectionCommission"),
      description: t("sectionCommissionDesc"),
      icon: Percent,
    },
    {
      value: "pricing",
      title: t("sectionPricing"),
      description: t("sectionPricingDesc"),
      icon: Tags,
    },
    {
      value: "diagnosis",
      title: t("sectionDiagnosis"),
      description: t("sectionDiagnosisDesc"),
      icon: Stethoscope,
    },
    {
      value: "telegram",
      title: t("sectionTelegram"),
      description: t("sectionTelegramDesc"),
      icon: MessageCircle,
    },
    {
      value: "niche",
      title: t("sectionNiche"),
      description: t("sectionNicheDesc"),
      icon: Car,
    },
    {
      value: "sharing",
      title: t("sectionSharing"),
      description: t("sectionSharingDesc"),
      icon: Globe,
    },
    {
      value: "export",
      title: t("sectionExport"),
      description: t("sectionExportDesc"),
      icon: Database,
    },
  ] as const;
}

export type SettingsSection = ReturnType<typeof getSettingsSections>[number];
