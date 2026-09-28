export interface Agent {
  id: string
  name: string
  role: "good" | "bad" | "counterparty"
  walletAddress: string
  modelProvider: "gemini" | "ollama" | null
  isDemoSeed: boolean
  isActive: boolean
  createdAt: string
}

export interface Conversation {
  id: string
  title: string
  status: "open" | "closed"
  goodAgentId: string
  counterpartyAgentId: string
  createdAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderAgentId: string
  recipientAgentId: string
  messageType: "offer" | "reply" | "attack" | "system"
  attackType:
    | "urgent_pretext"
    | "prompt_injection"
    | "fake_trust_claim"
    | null
  content: string
  createdAt: string
}

export interface TransactionAttempt {
  id: string
  conversationId: string
  triggerMessageId: string
  agentId: string
  counterpartyAddress: string
  amountWei: string

  status:
    | "proposed"
    | "executed"
    | "blocked"
    | "declined"
    | "failed"

  blockReasonCode: number | null
  blockReason: string | null

  txHash: string | null
  chainId: number
  receiptId: string | null

  attackType:
    | "urgent_pretext"
    | "prompt_injection"
    | "fake_trust_claim"
    | null

  verificationTier: "standard"

  reputationSnapshot: unknown

  charterPrecheck: {
    ok: boolean
    reasonCode: number
  }

  createdAt: string
  updatedAt: string

  receipt: ReasoningReceipt | null
}

export interface ReasoningFull {
  version: 1
  attemptId: string
  conversationId: string
  triggerMessageId: string
  counterpartyAddress: string
  requestedAmountWei: string

  reputationChecked: {
    enabled: boolean

    axes: {
      competence: number | null
      honesty: number | null
      compliance: number | null
      reliability: number | null
    }

    feedbackCount: number
  }

  charterPrecheck: {
    ok: boolean
    reasonCode: number
  }

  manipulationSignals: string[]

  decision:
    | "EXECUTE"
    | "DECLINE"
    | "PROPOSED_BUT_BLOCKED"

  rationale: string

  model: {
    provider: "gemini" | "ollama"
    name: string
    fellBack: boolean
  }

  timestamp: string
}

export interface ReasoningReceipt {
  id: string
  attemptId: string
  receiptId: string
  reasoningHash: string
  reasoningSummary: string
  reasoningFull: ReasoningFull
  decision: 0 | 1 | 2

  decisionLabel:
    | "BLOCKED"
    | "EXECUTED"
    | "DECLINED_BY_AGENT"

  onChainTxHash: string | null
  blockNumber: number | null
  createdAt: string
}

export interface Reputation {
  address: string
  registered: boolean
  feedbackCount: number

  axes: {
    competence: number | null
    honesty: number | null
    compliance: number | null
    reliability: number | null
  }

  syncedAt: string
  source: "chain"
}

export interface FeedbackEvent {
  id: string
  feedbackId: number
  subjectAddress: string
  authorAddress: string

  axes: {
    competence: number
    honesty: number
    compliance: number
    reliability: number
  }

  stakeWei: string

  status:
    | "active"
    | "disputed"
    | "upheld"
    | "slashed"

  txHash: string | null
  evidenceHash: string | null
  disputeTxHash: string | null
  createdAt: string
  updatedAt: string
}

export interface CharterRules {
  maxPerTxWei: string
  dailyCapWei: string
  humanApprovalThresholdWei: string
  allowListEnabled: boolean
  contractAddress: string
}

export interface CharterStatus {
  windowStart: string
  spentInWindowWei: string
  remainingInWindowWei: string
  balanceWei: string
}

export interface AgentTurnResult {
  incomingMessage: Message
  reply: Message
  attempt: TransactionAttempt | null

  modelUsed: {
    provider: "gemini" | "ollama"
    name: string
    fellBack: boolean
  }
}

export interface AttackResult {
  attackRun: {
    id: string

    attackType:
      | "urgent_pretext"
      | "prompt_injection"
      | "fake_trust_claim"

    outcome:
      | "blocked_by_charter"
      | "declined_by_agent"
      | "succeeded"
      | "error"
  }

  attackMessage: Message
  reply: Message
  attempt: TransactionAttempt | null

  modelUsed: {
    provider: "gemini" | "ollama"
    name: string
    fellBack: boolean
  }
}

export interface PublicConfig {
  chainId: number
  explorerUrl: string
  contracts: {
    SpendingCharter: string
    ReputationRegistry: string
    ReasoningReceipts: string
  }
  modelProvider: "gemini" | "ollama"
  features: {
    reputation: boolean
    stakeSlash: boolean
    tiered: boolean
  }
  constants: {
    reasonCodes: Record<number, string>
    decisions: Record<number, string>
  }
}

export interface ApiErrorPayload {
  code: string
  message: string
  details?: unknown
}

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorPayload }
