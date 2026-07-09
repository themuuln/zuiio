import { z } from 'zod';
import type { EventTypeKey } from './dictionary';

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
  foul_type: z.enum(['shooting', 'non_shooting', 'offensive']).optional(),
});

export const SubstitutionPayload = z.object({
  in_player_id: z.string(),
  out_player_id: z.string(),
});

export const EmptyPayload = z.object({});

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

export function validateEvent(e: {
  event_type: EventTypeKey;
  payload: unknown;
}): { valid: boolean; errors?: string[] } {
  const schema = payloadSchemas[e.event_type];
  const result = schema.safeParse(e.payload);
  if (result.success) {
    return { valid: true };
  }
  return {
    valid: false,
    errors: result.error.issues.map(
      (i) => `${i.path.join('.')}: ${i.message}`,
    ),
  };
}
