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

function mstToWeiString(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return "0"
  const str = String(val).trim()
  if (!str || str === "0") return "0"

  if (/^\d{10,}$/.test(str)) {
    return str
  }

  const parts = str.split(".")
  const integerPart = parts[0] || "0"
  let fractionalPart = parts[1] || ""

  if (fractionalPart.length > 18) {
    fractionalPart = fractionalPart.slice(0, 18)
  } else {
    fractionalPart = fractionalPart.padEnd(18, "0")
  }

  const combined = (integerPart === "0" ? "" : integerPart) + fractionalPart
  const trimmed = combined.replace(/^0+/, "")
  return trimmed || "0"
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    const rawUrl =
      baseUrl ||
      (import.meta.env.VITE_API_BASE_URL as string) ||
      "http://localhost:4000/api/v1"
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
    const raw = await this.request<any>("/config/public")
    return {
      chainId: Number(raw.mstChainId || raw.chainId || 91562037),
      mstChainId: raw.mstChainId || raw.chainId || "91562037",
      explorerUrl: raw.mstExplorerUrl || raw.explorerUrl || "https://testnet.mstblockchain.com",
      mstExplorerUrl: raw.mstExplorerUrl || raw.explorerUrl || "https://testnet.mstblockchain.com",
      contracts: {
        SpendingCharter: raw.charterAddress || (raw.contracts && raw.contracts.SpendingCharter) || "0xbD4c07Adb44e8ff2030faBcf0c4543067bA95E69",
        ReputationRegistry: raw.registryAddress || (raw.contracts && raw.contracts.ReputationRegistry) || "0xcE3bfbfC140AdD1a6A7eD1b1Aa571d0314f3Fb95",
        ReasoningReceipts: raw.receiptsAddress || (raw.contracts && raw.contracts.ReasoningReceipts) || "0x9acDE9ACf72aE5AEc94430B357ce0531C0FFaae1",
      },
      modelProvider: raw.modelProvider || "gemini",
      features: raw.features || { reputation: false, stakeSlash: false, tiered: false },
      constants: raw.constants || { reasonCodes: {} }
    }
  }

  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>("/health")
  }

  // AGENTS
  async getAgents(): Promise<Agent[]> {
    try {
      return await this.request<Agent[]>("/agents")
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "NOT_IMPLEMENTED" || err.message.includes("not implemented"))
      ) {
        return []
      }
      throw err
    }
  }

  async getAgent(id: string): Promise<Agent> {
    return this.request<Agent>(`/agents/${id}`)
  }

  // CHARTER
  async getCharterRules(): Promise<CharterRules> {
    try {
      const raw = await this.request<any>("/charter/rules")
      let contractAddress = raw.contractAddress || raw.charterAddress || ""
      if (!contractAddress) {
        try {
          const cfg = await this.getPublicConfig()
          contractAddress = cfg.contracts.SpendingCharter
        } catch (e) {}
      }

      return {
        maxPerTxWei: mstToWeiString(raw.maxPerTxWei || raw.maxPerTx),
        dailyCapWei: mstToWeiString(raw.dailyCapWei || raw.dailyCap),
        humanApprovalThresholdWei: mstToWeiString(raw.humanApprovalThresholdWei || raw.humanApprovalThreshold),
        allowListEnabled: Boolean(raw.allowListEnabled),
        contractAddress: contractAddress || "0xbD4c07Adb44e8ff2030faBcf0c4543067bA95E69"
      }
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "NOT_IMPLEMENTED" || err.message.includes("not implemented"))
      ) {
        return {
          maxPerTxWei: "0",
          dailyCapWei: "0",
          humanApprovalThresholdWei: "0",
          allowListEnabled: false,
          contractAddress: "0x0000000000000000000000000000000000000000"
        }
      }
      throw err
    }
  }

  async getCharterStatus(): Promise<CharterStatus> {
    try {
      const raw = await this.request<any>("/charter/status")
      return {
        windowStart: String(raw.windowStart || "0"),
        spentInWindowWei: mstToWeiString(raw.spentInWindowWei || raw.spentInWindow),
        remainingInWindowWei: mstToWeiString(raw.remainingInWindowWei || raw.remainingInWindow),
        balanceWei: mstToWeiString(raw.balanceWei || raw.balance)
      }
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "NOT_IMPLEMENTED" || err.message.includes("not implemented"))
      ) {
        return {
          windowStart: "0",
          spentInWindowWei: "0",
          remainingInWindowWei: "0",
          balanceWei: "0"
        }
      }
      throw err
    }
  }

  async checkCharter(payload: {
    to: string
    amountWei: string
  }): Promise<{ ok: boolean; reasonCode: number; reason: string }> {
    return this.request<{ ok: boolean; reasonCode: number; reason: string }>(
      "/charter/check",
      {
        method: "POST",
        body: JSON.stringify({
          toAddress: payload.to,
          amount: payload.amountWei,
        }),
      }
    )
  }

  async getCharterCounterparties(): Promise<
    { address: string; name: string; status: "allowed" | "denied" }[]
  > {
    try {
      return await this.request<
        { address: string; name: string; status: "allowed" | "denied" }[]
      >("/charter/counterparties")
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "NOT_IMPLEMENTED" || err.message.includes("not implemented"))
      ) {
        return []
      }
      throw err
    }
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
    try {
      return await this.request<Message[]>(`/conversations/${id}/messages`)
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "NOT_IMPLEMENTED" || err.message.includes("not implemented"))
      ) {
        return []
      }
      throw err
    }
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
    counterparty?: string
    amountWei?: string
  }): Promise<AgentTurnResult> {
    return this.request<AgentTurnResult>("/good-agent/respond", {
      method: "POST",
      body: JSON.stringify({
        conversationId: payload.conversationId,
        sender: payload.senderAgentId,
        content: payload.content,
        counterparty: payload.counterparty,
        amountWei: payload.amountWei,
      }),
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
    const rawData = await this.request<{
      conversationId: string
      attacks: Array<{
        attackType: "urgent_pretext" | "prompt_injection" | "fake_trust_claim"
        attack: {
          id: string
          attackType: string
          title: string
          message: string
          sender?: string
        }
        defense: {
          turnId: string
          attemptId: string | null
          decision: "BLOCKED" | "EXECUTED" | "DECLINED_BY_AGENT" | "DECLINED"
          replyText: string
          charterReasonCode: number
          reasoningHash: string | null
          receiptId: string | null
          txHash: string | null
          amountWei?: string
          counterparty?: string
          error?: {
            code: string
            message: string
          } | null
          modelUsed?: {
            provider: "gemini" | "ollama"
            name: string
            fellBack: boolean
          }
        }
      }>
    }>("/demo/run-attack-sequence", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    const runs: AttackResult[] = (rawData.attacks || []).map((item, idx) => {
      const isBlocked = item.defense?.decision === "BLOCKED"
      const isExecuted = item.defense?.decision === "EXECUTED"
      const outcome = isBlocked
        ? "blocked_by_charter"
        : isExecuted
        ? "succeeded"
        : "declined_by_agent"

      const attemptStatus = isBlocked
        ? "blocked"
        : isExecuted
        ? "executed"
        : "declined"

      const rawReason = item.defense?.charterReasonCode
      const reasonCode = (rawReason !== undefined && rawReason !== null) ? rawReason : 0

      const errObj = item.defense?.error
      const errorCode = errObj?.code || null
      const errorMessage = errObj?.message || null

      const timestamp = Date.now()
      const attackMsgId = `msg-atk-${timestamp}-${idx}`
      const replyMsgId = `msg-def-${timestamp}-${idx}`
      const attemptId = item.defense?.attemptId || item.defense?.turnId || `att-${timestamp}-${idx}`

      const attempt: TransactionAttempt | null = item.defense
        ? {
            id: attemptId,
            conversationId: rawData.conversationId || payload.conversationId || "conv-demo-01",
            triggerMessageId: attackMsgId,
            agentId: "good_agent",
            counterpartyAddress: item.defense.counterparty || "0x9999999999999999999999999999999999999999",
            amountWei: item.defense.amountWei || "500000000000000000",
            status: attemptStatus,
            blockReasonCode: isBlocked && reasonCode > 0 ? reasonCode : (isBlocked ? 0 : null),
            blockReason: item.defense.replyText || null,
            txHash: item.defense.txHash || null,
            chainId: 91562037,
            receiptId: item.defense.receiptId || null,
            attackType: item.attackType,
            verificationTier: "standard",
            reputationSnapshot: null,
            charterPrecheck: {
              ok: !isBlocked,
              reasonCode: reasonCode,
            },
            errorCode,
            errorMessage,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            receipt: item.defense.reasoningHash
              ? {
                  id: item.defense.receiptId || `rcpt-${timestamp}-${idx}`,
                  attemptId: attemptId,
                  receiptId: item.defense.receiptId || `rcpt-${timestamp}-${idx}`,
                  reasoningHash: item.defense.reasoningHash,
                  reasoningSummary: item.defense.replyText || "",
                  reasoningFull: null as any,
                  decision: isBlocked ? 0 : isExecuted ? 1 : 2,
                  decisionLabel: isBlocked
                    ? "BLOCKED"
                    : isExecuted
                    ? "EXECUTED"
                    : "DECLINED_BY_AGENT",
                  onChainTxHash: item.defense.txHash || null,
                  blockNumber: null,
                  createdAt: new Date().toISOString(),
                }
              : null,
          }
        : null

      return {
        attackRun: {
          id: `run-${timestamp}-${idx}`,
          attackType: item.attackType,
          outcome,
        },
        attackMessage: {
          id: attackMsgId,
          conversationId: rawData.conversationId || payload.conversationId || "conv-demo-01",
          senderAgentId: item.attack?.sender || "bad_agent",
          recipientAgentId: "good_agent",
          messageType: "attack",
          attackType: item.attackType,
          content: item.attack?.message || "",
          createdAt: new Date().toISOString(),
        },
        reply: {
          id: replyMsgId,
          conversationId: rawData.conversationId || payload.conversationId || "conv-demo-01",
          senderAgentId: "good_agent",
          recipientAgentId: item.attack?.sender || "bad_agent",
          messageType: "reply",
          attackType: null,
          content: item.defense?.replyText || "",
          createdAt: new Date().toISOString(),
        },
        attempt,
        modelUsed: item.defense?.modelUsed || {
          provider: "gemini",
          name: "gemini-2.5-flash",
          fellBack: false,
        },
      }
    })

    const summary = {
      blocked: runs.filter((r) => r.attackRun.outcome === "blocked_by_charter").length,
      declined: runs.filter((r) => r.attackRun.outcome === "declined_by_agent").length,
      succeeded: runs.filter((r) => r.attackRun.outcome === "succeeded").length,
      errors: runs.filter((r) => r.attackRun.outcome === "error").length,
    }

    return { runs, summary }
  }

  // TRANSACTIONS
  async getTransactions(params?: {
    status?: string
    agentId?: string
    conversationId?: string
    limit?: number
    cursor?: string
  }): Promise<{ items: TransactionAttempt[]; nextCursor: string | null }> {
    try {
      const query = new URLSearchParams()
      if (params?.status) query.set("status", params.status)
      if (params?.agentId) query.set("agentId", params.agentId)
      if (params?.conversationId) query.set("conversationId", params.conversationId)
      if (params?.limit) query.set("limit", params.limit.toString())
      if (params?.cursor) query.set("cursor", params.cursor)

      const queryString = query.toString() ? `?${query.toString()}` : ""
      return await this.request<{ items: TransactionAttempt[]; nextCursor: string | null }>(
        `/transactions${queryString}`
      )
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "NOT_IMPLEMENTED" || err.message.includes("not implemented"))
      ) {
        return { items: [], nextCursor: null }
      }
      throw err
    }
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
    try {
      return await this.request<Reputation[]>("/reputation")
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "NOT_IMPLEMENTED" || err.message.includes("not implemented"))
      ) {
        return []
      }
      throw err
    }
  }

  async getReputationByAddress(address: string): Promise<Reputation> {
    try {
      return await this.request<Reputation>(`/reputation/${address}`)
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "NOT_IMPLEMENTED" || err.message.includes("not implemented"))
      ) {
        return {
          address,
          registered: false,
          feedbackCount: 0,
          axes: { competence: null, honesty: null, compliance: null, reliability: null },
          syncedAt: new Date().toISOString(),
          source: "chain",
        }
      }
      throw err
    }
  }

  async getReputationFeedback(params?: {
    address?: string
    limit?: number
  }): Promise<FeedbackEvent[]> {
    try {
      const query = new URLSearchParams()
      if (params?.address) query.set("address", params.address)
      if (params?.limit) query.set("limit", params.limit.toString())

      const queryString = query.toString() ? `?${query.toString()}` : ""
      return await this.request<FeedbackEvent[]>(`/reputation/feedback${queryString}`)
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "NOT_IMPLEMENTED" || err.message.includes("not implemented"))
      ) {
        return []
      }
      throw err
    }
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
    try {
      const query = new URLSearchParams()
      if (params?.sinceId) query.set("sinceId", params.sinceId)
      if (params?.limit) query.set("limit", params.limit.toString())

      const queryString = query.toString() ? `?${query.toString()}` : ""
      return await this.request<
        {
          id: string
          type: string
          entityId: string
          payload: unknown
          createdAt: string
        }[]
      >(`/events${queryString}`)
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "NOT_IMPLEMENTED" || err.message.includes("not implemented"))
      ) {
        return []
      }
      throw err
    }
  }
  // JURY
  async evaluateJuryCase(payload: {
    caseId: string
    caseType: "payment_approval" | "claim_adjudication"
    context?: Record<string, unknown>
    recordReceipts?: boolean
  }): Promise<import("./types").JuryEvaluationResult> {
    return this.request<import("./types").JuryEvaluationResult>("/jury/evaluate", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }
}

export const apiClient = new ApiClient()
