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

export const SETTINGS_SECTIONS = [
  {
    value: "general",
    title: "General",
    description:
      "Basic business information and default values for new invoices.",
    icon: Building2,
  },
  {
    value: "appearance",
    title: "Appearance",
    description:
      "Customize colors, theme, and interface density to match your brand.",
    icon: Palette,
  },
  {
    value: "commission",
    title: "Commission Rules",
    description: "Configure how mechanics earn commissions on work orders.",
    icon: Percent,
  },
  {
    value: "pricing",
    title: "Pricing Rules",
    description:
      "Auto-adjust part and service prices based on vehicle type, class, and fuel type.",
    icon: Tags,
  },
  {
    value: "diagnosis",
    title: "Diagnosis Labels",
    description:
      "Manage reusable labels for work order complaints (e.g., engine, brake, electrical).",
    icon: Stethoscope,
  },
  {
    value: "telegram",
    title: "Telegram Bot",
    description:
      "Connect your Telegram to get service reminder summaries and revenue reports.",
    icon: MessageCircle,
  },
  {
    value: "niche",
    title: "Vehicle Niche",
    description:
      "Show only the vehicle brands and models your workshop services.",
    icon: Car,
  },
  {
    value: "sharing",
    title: "Data Sharing",
    description:
      "Control whether other organizations can view your customer and vehicle data.",
    icon: Globe,
  },
  {
    value: "export",
    title: "Data & Export",
    description: "Download your data or run database backups.",
    icon: Database,
  },
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];
