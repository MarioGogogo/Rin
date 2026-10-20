export const HOME_VERSION_OPTIONS = ["v1", "v2"] as const;

export type HomeVersion = (typeof HOME_VERSION_OPTIONS)[number];

export function normalizeHomeVersion(value: string): HomeVersion {
  return HOME_VERSION_OPTIONS.includes(value as HomeVersion) ? (value as HomeVersion) : "v1";
}
