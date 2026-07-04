export type AutomationStatus = "live" | "draft" | "off";

export interface Automation {
  id: string;
  name: string;
  status: AutomationStatus;
  runs: number;
  ctr: number;
  modifiedAt: string;
  trigger: "keyword" | "default" | "button" | "ref";
  triggerState: "active" | "inactive";
  keywords: string[];
  folder: string;
}

