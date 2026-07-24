import * as Haptics from "expo-haptics";

/** Trigger a light impact on card press / tap */
export function lightImpact() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Trigger a medium impact on significant actions (submit, nav) */
export function mediumImpact() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Trigger success feedback on completion */
export function successFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Trigger error feedback */
export function errorFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Wrapper: call haptics + the original onPress */
export function withHaptic<T extends (...args: never[]) => void>(
  fn: T | undefined,
  style: "light" | "medium" = "light",
): ((...args: Parameters<T>) => void) | undefined {
  if (!fn) return undefined;
  return ((...args: Parameters<T>) => {
    if (style === "light") lightImpact();
    else mediumImpact();
    fn(...args);
  }) as (...args: Parameters<T>) => void;
}
