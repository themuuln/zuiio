export interface ScimName {
  givenName?: string;
  familyName?: string;
  formatted?: string;
}

export interface ScimEmail {
  value: string;
  primary?: boolean;
}

export interface ScimMeta {
  resourceType: string;
  created: string;
  lastModified: string;
  location: string;
}

export interface ScimUser {
  schemas: string[];
  id: string;
  userName: string;
  name?: ScimName;
  displayName?: string;
  emails?: ScimEmail[];
  active?: boolean;
  groups?: Array<{ value: string; $ref?: string; display?: string }>;
  meta?: ScimMeta;
}

export interface ScimGroup {
  schemas: string[];
  id: string;
  displayName: string;
  members?: Array<{ value: string; $ref?: string; display?: string }>;
  meta?: ScimMeta;
}
