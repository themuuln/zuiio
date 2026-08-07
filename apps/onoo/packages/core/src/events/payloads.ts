import { z } from "zod";
import {
  type EventTypeKey,
  isEventAllowedByRuleset,
  type RulesetEventDictionary,
} from "./dictionary";

// --- Per-event-type payload schemas ---

export const ShotMadePayload = z.object({
  assisted_by: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

export const ShotMissedPayload = z.object({
  blocked_by: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

export const TurnoverPayload = z.object({
  stolen_by: z.string().optional(),
});

export const FoulPersonalPayload = z.object({
  fouled_player: z.string().optional(),
  foul_type: z.enum(["shooting", "non_shooting", "offensive"]).optional(),
});

export const SubstitutionPayload = z.object({
  in_player_id: z.string(),
  out_player_id: z.string(),
});

export const EmptyPayload = z.object({});

export const VoidEventPayload = z.object({
  event_id: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});

export const ReplacementEventPayload = z.object({
  supersedes_event_id: z.string().uuid(),
  operation_id: z.string().uuid(),
});

export const SourceSubmissionPayload = z.object({
  source_type: z.enum([
    "tracker_journal",
    "official_score_sheet",
    "manual_box_score",
    "import",
  ]),
  evidence_url: z.string().url().optional(),
  rights_confirmed: z.boolean(),
  normalized_payload: z.record(z.string(), z.unknown()),
  confidence: z.number().min(0).max(1).optional(),
  idempotency_key: z.string().uuid(),
});

export const TrackerSessionPayload = z.object({
  tracker_session_id: z.string().uuid(),
  operation_id: z.string().uuid(),
  local_seq: z.number().int().positive(),
});

// --- Discriminated map: event type → payload schema ---

const payloadSchemas = {
  shot_2pt_made: ShotMadePayload,
  shot_2pt_missed: ShotMissedPayload,
  shot_3pt_made: ShotMadePayload,
  shot_3pt_missed: ShotMissedPayload,
  ft_made: ShotMadePayload,
  ft_missed: ShotMissedPayload,
  rebound_off: EmptyPayload,
  rebound_def: EmptyPayload,
  rebound_team: EmptyPayload,
  steal: EmptyPayload,
  block: EmptyPayload,
  turnover: TurnoverPayload,
  foul_personal: FoulPersonalPayload,
  foul_technical: EmptyPayload,
  substitution: SubstitutionPayload,
  timeout: EmptyPayload,
  period_start: EmptyPayload,
  period_end: EmptyPayload,
  game_start: EmptyPayload,
  game_end: EmptyPayload,
} as const;

// --- Validation function ---

export interface ValidateEventOptions {
  /** When provided, rejected event types not in the ruleset vocabulary. */
  ruleset?: RulesetEventDictionary;
}

export function validateEvent(
  e: { event_type: EventTypeKey; payload: unknown },
  options?: ValidateEventOptions,
): { valid: boolean; errors?: string[] } {
  // 1. Ruleset vocabulary gate
  if (
    options?.ruleset &&
    !isEventAllowedByRuleset(e.event_type, options.ruleset)
  ) {
    return {
      valid: false,
      errors: [
        `event_type "${e.event_type}" is not enabled in ruleset "${options.ruleset.version}"`,
      ],
    };
  }

  // 2. Payload shape validation
  const schema = payloadSchemas[e.event_type];
  const result = schema.safeParse(e.payload);
  if (result.success) {
    return { valid: true };
  }
  return {
    valid: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}
