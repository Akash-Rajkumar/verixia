import type {
  Agent,
  AgentTurnResult,
  ApiResponse,
  AttackResult,
  CharterRules,
  CharterStatus,
  Conversation,
  FeedbackEvent,
  Message,
  PublicConfig,
  ReasoningReceipt,
  Reputation,
  TransactionAttempt,
} from "./types"

export class ApiError extends Error {
  code: string
  details?: unknown

  constructor(code: string, message: string, details?: unknown) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.details = details
  }
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    const rawUrl =
      baseUrl ||
      (import.meta.env.VITE_API_BASE_URL as string) ||
      "http://localhost:3000"
    // Normalize base URL without trailing slash
    const cleanUrl = rawUrl.replace(/\/$/, "")
    this.baseUrl = cleanUrl.endsWith("/api/v1")
      ? cleanUrl
      : `${cleanUrl}/api/v1`
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const json: ApiResponse<T> = await response.json()

      if (!json.ok) {
        throw new ApiError(
          json.error.code || "UNKNOWN_ERROR",
          json.error.message || "API Request Failed",
          json.error.details
        )
      }

      return json.data
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err
      }
      throw new ApiError(
        "NETWORK_ERROR",
        err instanceof Error ? err.message : "Failed to connect to Verixia API",
        err
      )
    }
  }

  // CONFIG / HEALTH
  async getPublicConfig(): Promise<PublicConfig> {
    return this.request<PublicConfig>("/config/public")
  }

  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>("/health")
  }

  // AGENTS
  async getAgents(): Promise<Agent[]> {
    return this.request<Agent[]>("/agents")
  }

  async getAgent(id: string): Promise<Agent> {
    return this.request<Agent>(`/agents/${id}`)
  }

  // CHARTER
  async getCharterRules(): Promise<CharterRules> {
    return this.request<CharterRules>("/charter/rules")
  }

  async getCharterStatus(): Promise<CharterStatus> {
    return this.request<CharterStatus>("/charter/status")
  }

  async checkCharter(payload: {
    to: string
    amountWei: string
  }): Promise<{ ok: boolean; reasonCode: number; reason: string }> {
    return this.request<{ ok: boolean; reasonCode: number; reason: string }>(
      "/charter/check",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    )
  }

  async getCharterCounterparties(): Promise<
    { address: string; name: string; status: "allowed" | "denied" }[]
  > {
    return this.request<
      { address: string; name: string; status: "allowed" | "denied" }[]
    >("/charter/counterparties")
  }

  // CONVERSATIONS
  async createConversation(payload?: {
    goodAgentId?: string
    counterpartyAgentId?: string
  }): Promise<Conversation> {
    return this.request<Conversation>("/conversations", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    })
  }

  async getConversationMessages(id: string): Promise<Message[]> {
    return this.request<Message[]>(`/conversations/${id}/messages`)
  }

  // GOOD AGENT
  async createCounterpartyOffer(payload: {
    conversationId: string
    counterpartyAgentId: string
    amountWei: string
    description: string
  }): Promise<AgentTurnResult> {
    return this.request<AgentTurnResult>("/counterparty/offer", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async goodAgentRespond(payload: {
    conversationId: string
    senderAgentId: string
    content: string
  }): Promise<AgentTurnResult> {
    return this.request<AgentTurnResult>("/good-agent/respond", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  // BAD AGENT
  async getBadAgentAttacks(): Promise<
    {
      id: string
      attackType: "urgent_pretext" | "prompt_injection" | "fake_trust_claim"
      title: string
      description: string
    }[]
  > {
    return this.request<
      {
        id: string
        attackType: "urgent_pretext" | "prompt_injection" | "fake_trust_claim"
        title: string
        description: string
      }[]
    >("/bad-agent/attacks")
  }

  async runBadAgentAttack(payload: {
    conversationId: string
    attackType: "urgent_pretext" | "prompt_injection" | "fake_trust_claim"
    targetAmountWei?: string
  }): Promise<AttackResult> {
    return this.request<AttackResult>("/bad-agent/attack", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  // DEMO
  async runAttackSequence(payload: {
    conversationId: string
    attackTypes?: string[]
  }): Promise<{
    runs: AttackResult[]
    summary: {
      blocked: number
      declined: number
      succeeded: number
      errors: number
    }
  }> {
    return this.request<{
      runs: AttackResult[]
      summary: {
        blocked: number
        declined: number
        succeeded: number
        errors: number
      }
    }>("/demo/run-attack-sequence", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  // TRANSACTIONS
  async getTransactions(params?: {
    status?: string
    agentId?: string
    conversationId?: string
    limit?: number
    cursor?: string
  }): Promise<{ items: TransactionAttempt[]; nextCursor: string | null }> {
    const query = new URLSearchParams()
    if (params?.status) query.set("status", params.status)
    if (params?.agentId) query.set("agentId", params.agentId)
    if (params?.conversationId) query.set("conversationId", params.conversationId)
    if (params?.limit) query.set("limit", params.limit.toString())
    if (params?.cursor) query.set("cursor", params.cursor)

    const queryString = query.toString() ? `?${query.toString()}` : ""
    return this.request<{ items: TransactionAttempt[]; nextCursor: string | null }>(
      `/transactions${queryString}`
    )
  }

  async getTransaction(attemptId: string): Promise<TransactionAttempt> {
    return this.request<TransactionAttempt>(`/transactions/${attemptId}`)
  }

  // RECEIPTS
  async getReceipt(receiptId: string): Promise<ReasoningReceipt> {
    return this.request<ReasoningReceipt>(`/receipts/${receiptId}`)
  }

  async verifyReceipt(receiptId: string): Promise<{
    receiptId: string
    computedHash: string
    onChainHash: string
    verified: boolean
  }> {
    return this.request<{
      receiptId: string
      computedHash: string
      onChainHash: string
      verified: boolean
    }>(`/receipts/${receiptId}/verify`)
  }

  // REPUTATION
  async getReputation(): Promise<Reputation[]> {
    return this.request<Reputation[]>("/reputation")
  }

  async getReputationByAddress(address: string): Promise<Reputation> {
    return this.request<Reputation>(`/reputation/${address}`)
  }

  async getReputationFeedback(params?: {
    address?: string
    limit?: number
  }): Promise<FeedbackEvent[]> {
    const query = new URLSearchParams()
    if (params?.address) query.set("address", params.address)
    if (params?.limit) query.set("limit", params.limit.toString())

    const queryString = query.toString() ? `?${query.toString()}` : ""
    return this.request<FeedbackEvent[]>(`/reputation/feedback${queryString}`)
  }

  async submitReputationFeedback(payload: {
    subjectAddress: string
    axes: {
      competence: number
      honesty: number
      compliance: number
      reliability: number
    }
    stakeWei: string
  }): Promise<FeedbackEvent> {
    return this.request<FeedbackEvent>("/reputation/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  async disputeReputationFeedback(
    feedbackId: number,
    payload?: { reason?: string }
  ): Promise<FeedbackEvent> {
    return this.request<FeedbackEvent>(
      `/reputation/feedback/${feedbackId}/dispute`,
      {
        method: "POST",
        body: JSON.stringify(payload || {}),
      }
    )
  }

  // EVENTS
  async getEvents(params?: {
    sinceId?: string
    limit?: number
  }): Promise<
    {
      id: string
      type: string
      entityId: string
      payload: unknown
      createdAt: string
    }[]
  > {
    const query = new URLSearchParams()
    if (params?.sinceId) query.set("sinceId", params.sinceId)
    if (params?.limit) query.set("limit", params.limit.toString())

    const queryString = query.toString() ? `?${query.toString()}` : ""
    return this.request<
      {
        id: string
        type: string
        entityId: string
        payload: unknown
        createdAt: string
      }[]
    >(`/events${queryString}`)
  }
}

export const apiClient = new ApiClient()
