import type { Channel, ChannelType } from "./types";

/**
 * Plugin descriptor for a messaging channel plugin.
 *
 * Each channel plugin (Telegram, Facebook, WhatsApp) exports its plugin
 * descriptor so the gateway middleware can discover and register it.
 */
export interface GatewayPlugin {
  /** Unique plugin identifier (e.g. "telegram", "messenger"). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Channel type this plugin handles. */
  channelType: ChannelType;
  /** Create a channel adapter instance. */
  createChannel(config?: Record<string, unknown>): Channel;
  /** Set of environment variable names this plugin requires. */
  requiredEnvVars?: string[];
}
