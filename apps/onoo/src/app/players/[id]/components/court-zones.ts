/**
 * Basketball half-court shot zone definitions for the heatmap.
 * Each zone has an SVG shape and weights for estimating shot distribution
 * when real tracking data is unavailable.
 */
export interface CourtZone {
  id: string;
  type: "path" | "circle";
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  label: string;
  /** Estimated weight for 2-point distribution in this zone. */
  weight2pt: number;
  /** Estimated weight for 3-point distribution in this zone. */
  weight3pt: number;
}

/**
 * Standard basketball half-court zones (600×550 viewBox).
 * Zones are ordered from paint outward.
 */
export const COURT_ZONES: CourtZone[] = [
  // Paint / Restricted Area
  {
    id: "paint",
    type: "circle",
    cx: 300,
    cy: 460,
    r: 60,
    label: "Paint",
    weight2pt: 0.4,
    weight3pt: 0,
  },
  // Left block
  {
    id: "block-left",
    type: "circle",
    cx: 230,
    cy: 430,
    r: 35,
    label: "Left Block",
    weight2pt: 0.1,
    weight3pt: 0,
  },
  // Right block
  {
    id: "block-right",
    type: "circle",
    cx: 370,
    cy: 430,
    r: 35,
    label: "Right Block",
    weight2pt: 0.1,
    weight3pt: 0,
  },
  // Mid-range left
  {
    id: "mid-left",
    type: "circle",
    cx: 180,
    cy: 350,
    r: 40,
    label: "Mid-Range Left",
    weight2pt: 0.08,
    weight3pt: 0,
  },
  // Mid-range right
  {
    id: "mid-right",
    type: "circle",
    cx: 420,
    cy: 350,
    r: 40,
    label: "Mid-Range Right",
    weight2pt: 0.08,
    weight3pt: 0,
  },
  // Mid-range top
  {
    id: "mid-top",
    type: "circle",
    cx: 300,
    cy: 300,
    r: 40,
    label: "Mid-Range Top",
    weight2pt: 0.06,
    weight3pt: 0,
  },
  // Left wing 3
  {
    id: "three-left",
    type: "circle",
    cx: 120,
    cy: 380,
    r: 40,
    label: "Left Wing 3",
    weight2pt: 0,
    weight3pt: 0.25,
  },
  // Right wing 3
  {
    id: "three-right",
    type: "circle",
    cx: 480,
    cy: 380,
    r: 40,
    label: "Right Wing 3",
    weight2pt: 0,
    weight3pt: 0.25,
  },
  // Top of key 3
  {
    id: "three-top",
    type: "circle",
    cx: 300,
    cy: 180,
    r: 40,
    label: "Top of Key 3",
    weight2pt: 0,
    weight3pt: 0.3,
  },
  // Left corner 3
  {
    id: "three-corner-left",
    type: "circle",
    cx: 50,
    cy: 500,
    r: 30,
    label: "Left Corner 3",
    weight2pt: 0,
    weight3pt: 0.1,
  },
  // Right corner 3
  {
    id: "three-corner-right",
    type: "circle",
    cx: 550,
    cy: 500,
    r: 30,
    label: "Right Corner 3",
    weight2pt: 0,
    weight3pt: 0.1,
  },
];
