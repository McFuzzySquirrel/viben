export const TELEMETRY_ALLOWED = false as const;

export const PRIVACY_GUARDRAILS = [
  'No third-party telemetry or analytics SDKs.',
  'No ad-network integrations.',
  'No raw audio upload or storage.',
  'Local-only progress data for v1.',
] as const;
