import {
  AtSign,
  Building2,
  Car,
  Database,
  GitBranch,
  Globe,
  MessageCircle,
  Palette,
  Percent,
  Settings2,
  Stethoscope,
  Tags,
  Wallet,
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
      value: "branches",
      title: t("sectionBranches"),
      description: t("sectionBranchesDesc"),
      icon: GitBranch,
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
      value: "payments",
      title: t("sectionPayments"),
      description: t("sectionPaymentsDesc"),
      icon: Wallet,
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
      value: "facebook",
      title: t("sectionFacebook"),
      description: t("sectionFacebookDesc"),
      icon: AtSign,
    },
    {
      value: "niche",
      title: t("sectionNiche"),
      description: t("sectionNicheDesc"),
      icon: Car,
    },
    {
      value: "businessType",
      title: t("sectionBusinessType"),
      description: t("sectionBusinessTypeDesc"),
      icon: Settings2,
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
