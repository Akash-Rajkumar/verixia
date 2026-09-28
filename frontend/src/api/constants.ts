export const REASON_CODES = {
  0: "OK",
  1: "EXCEEDS_MAX_PER_TX",
  2: "EXCEEDS_DAILY_CAP",
  3: "COUNTERPARTY_DENIED",
  4: "COUNTERPARTY_NOT_ALLOWED",
  5: "REQUIRES_HUMAN_APPROVAL",
  6: "INSUFFICIENT_BALANCE",
} as const

export const CHARTER_CHECK_ORDER = [3, 4, 1, 2, 5, 6] as const

export const DECISIONS = {
  0: "BLOCKED",
  1: "EXECUTED",
  2: "DECLINED_BY_AGENT",
} as const

export const ATTACK_TYPES = [
  "urgent_pretext",
  "prompt_injection",
  "fake_trust_claim",
] as const

export type AttackType = (typeof ATTACK_TYPES)[number]

export const REPUTATION_AXES = [
  "competence",
  "honesty",
  "compliance",
  "reliability",
] as const

export type ReputationAxis = (typeof REPUTATION_AXES)[number]

export const REASON_CODE_LABELS: Record<number, string> = {
  0: "OK",
  1: "EXCEEDS_MAX_PER_TX",
  2: "EXCEEDS_DAILY_CAP",
  3: "COUNTERPARTY_DENIED",
  4: "COUNTERPARTY_NOT_ALLOWED",
  5: "REQUIRES_HUMAN_APPROVAL",
  6: "INSUFFICIENT_BALANCE",
}

export const REASON_CODE_HUMAN_TEXT: Record<number, string> = {
  0: "Check passed cleanly",
  1: "Per-transaction spending limit exceeded",
  2: "Daily cumulative spending cap reached",
  3: "Counterparty is explicitly denied",
  4: "Counterparty is not on the allow-list",
  5: "Transaction amount requires human approval threshold",
  6: "Insufficient account balance for transaction",
}

export const ATTACK_TYPE_HUMAN_LABELS: Record<string, string> = {
  urgent_pretext: "Urgent Pretext Attack",
  prompt_injection: "Direct Prompt Injection",
  fake_trust_claim: "Fake Trust Claim",
}

export const DECISION_LABELS: Record<number, string> = {
  0: "BLOCKED BY CHARTER",
  1: "EXECUTED ON-CHAIN",
  2: "DECLINED BY AGENT",
}
