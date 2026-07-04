export type ContactStatus = "subscribed" | "unsubscribed";
export type ContactGender = "female" | "male" | "unknown";

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: ContactGender;
  language: string;
  status: ContactStatus;
  subscribedAt: string;
  contactTime: string;
  avatarUrl: string;
  tags: string[];
  subscriptionLists: string[];
  optedInThrough: string;
  pausedAutomations: boolean;
  psid: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactListResponse {
  contacts: Contact[];
  total: number;
}

