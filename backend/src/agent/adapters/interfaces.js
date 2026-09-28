/**
 * @typedef {Object} ModelGenerateParams
 * @property {string} prompt
 * @property {string} [systemInstruction]
 * @property {number} [temperature]
 * @property {number} [maxTokens]
 */

/**
 * @typedef {Object} ModelGenerateResult
 * @property {string} text
 * @property {string} provider
 * @property {string} model
 * @property {boolean} fallbackUsed
 */

/**
 * @typedef {Object} ReputationScores
 * @property {number} competence
 * @property {number} honesty
 * @property {number} compliance
 * @property {number} reliability
 */

/**
 * @typedef {Object} CharterCheckResult
 * @property {boolean} allowed
 * @property {number} reasonCode
 */

/**
 * @typedef {Object} CharterAttemptResult
 * @property {boolean} executed
 * @property {number} reasonCode
 * @property {string} [txHash]
 */

/**
 * @typedef {Object} CreateAttemptParams
 * @property {string} [attemptId]
 * @property {string} agent
 * @property {string} [counterparty]
 * @property {string} [amountWei]
 * @property {string} status // 'proposed' | 'executed' | 'blocked' | 'declined' | 'failed'
 */

/**
 * @typedef {Object} SubmitReceiptParams
 * @property {string} receiptId
 * @property {string} agent
 * @property {string} [counterparty]
 * @property {string} [amountWei]
 * @property {number} decisionCode // 0 (BLOCKED), 1 (EXECUTED), 2 (DECLINED_BY_AGENT)
 * @property {string} reasoningHash
 * @property {string} summary
 */

/**
 * @typedef {Object} IModelAdapter
 * @property {(params: ModelGenerateParams) => Promise<ModelGenerateResult>} generate
 */

/**
 * @typedef {Object} IReputationAdapter
 * @property {(counterparty: string) => Promise<ReputationScores|null>} getReputation
 */

/**
 * @typedef {Object} ISpendingCharterAdapter
 * @property {(to: string, amountWei: string) => Promise<CharterCheckResult>} checkPayment
 * @property {(to: string, amountWei: string, receiptId: string) => Promise<CharterAttemptResult>} attemptPayment
 */

/**
 * @typedef {Object} ITransactionAttemptStore
 * @property {(params: CreateAttemptParams) => Promise<{ attemptId: string }>} createAttempt
 * @property {(attemptId: string, updates: Object) => Promise<void>} updateAttemptStatus
 */

/**
 * @typedef {Object} IReasoningReceiptAdapter
 * @property {(params: SubmitReceiptParams) => Promise<{ receiptId: string, txHash?: string }>} submitReceipt
 */

/**
 * @typedef {Object} IEventStoreAdapter
 * @property {(event: Object) => Promise<{ eventId: string }>} storeIncomingEvent
 * @property {(eventId: string, turnResult: Object) => Promise<void>} storeReply
 */

/**
 * @typedef {Object} GoodAgentAdapters
 * @property {IModelAdapter} model
 * @property {ISpendingCharterAdapter} [charter]
 * @property {IReputationAdapter} [reputation]
 * @property {ITransactionAttemptStore} [attemptStore]
 * @property {IReasoningReceiptAdapter} [receipt]
 * @property {IEventStoreAdapter} [eventStore]
 */

export {};
