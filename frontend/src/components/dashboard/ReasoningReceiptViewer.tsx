import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  ExternalLink,
  Cpu,
  Hash,
  Sparkles,
  RefreshCw,
  Database,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Code2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { truncateHash, truncateAddress, formatNativeAmount, copyToClipboard } from "@/lib/format"
import { api } from "@/api"
import type { PublicConfig, ReasoningReceipt, TransactionAttempt, BlockchainTransactionDetails } from "@/api/types"

export interface ReasoningReceiptViewerProps {
  config: PublicConfig | null
  selectedAttempt?: TransactionAttempt | null
}

export const ReasoningReceiptViewer: React.FC<ReasoningReceiptViewerProps> = ({
  config,
  selectedAttempt,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  const [fetchedReceipt, setFetchedReceipt] = useState<ReasoningReceipt | null>(null)
  const [fetchingReceipt, setFetchingReceipt] = useState<boolean>(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean
    computedHash: string
    onChainHash: string
  } | null>(null)

  // Blockchain transaction details state
  const [txDetails, setTxDetails] = useState<BlockchainTransactionDetails | null>(null)
  const [fetchingTxDetails, setFetchingTxDetails] = useState<boolean>(false)
  const [txDetailsError, setTxDetailsError] = useState<string | null>(null)

  const [showRawDetails, setShowRawDetails] = useState<boolean>(false)

  // Direct receipt from selected attempt or dynamically fetched receipt
  const receipt: ReasoningReceipt | null = selectedAttempt?.receipt || fetchedReceipt || null

  const targetTxHash = selectedAttempt?.txHash || receipt?.onChainTxHash || null

  // Fetch ReasoningReceipt when selectedAttempt has receiptId but no embedded receipt object
  const fetchReceipt = useCallback(async () => {
    setFetchedReceipt(null)
    setFetchError(null)

    const receiptId = selectedAttempt?.receiptId
    if (
      !selectedAttempt?.receipt &&
      receiptId &&
      receiptId !== "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      setFetchingReceipt(true)
      try {
        const rcpt = await api.getReceipt(receiptId)
        setFetchedReceipt(rcpt)
        setFetchError(null)
      } catch (err: unknown) {
        setFetchedReceipt(null)
        setFetchError(err instanceof Error ? err.message : "Reasoning receipt could not be retrieved from on-chain contract.")
      } finally {
        setFetchingReceipt(false)
      }
    } else {
      setFetchingReceipt(false)
    }
  }, [selectedAttempt?.receipt, selectedAttempt?.receiptId])

  // Fetch Blockchain Transaction details whenever targetTxHash changes
  const fetchTxDetails = useCallback(async () => {
    setTxDetails(null)
    setTxDetailsError(null)

    if (targetTxHash && /^0x[0-9a-fA-F]{64}$/.test(targetTxHash.trim())) {
      setFetchingTxDetails(true)
      try {
        const details = await api.getBlockchainTransaction(targetTxHash.trim())
        setTxDetails(details)
        setTxDetailsError(null)
      } catch (err: unknown) {
        setTxDetails(null)
        setTxDetailsError(err instanceof Error ? err.message : "Failed to load transaction details from MST Testnet.")
      } finally {
        setFetchingTxDetails(false)
      }
    } else {
      setFetchingTxDetails(false)
    }
  }, [targetTxHash])

  useEffect(() => {
    fetchReceipt()
  }, [fetchReceipt])

  useEffect(() => {
    fetchTxDetails()
  }, [fetchTxDetails])

  const handleCopy = async (text: string, key: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  // Verification check calling API abstraction
  const handleVerify = async () => {
    if (!receipt) return
    setVerifying(true)
    setVerificationResult(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const res = await api.verifyReceipt(receipt.receiptId)
      setVerificationResult({
        verified: res.verified,
        computedHash: res.computedHash,
        onChainHash: res.onChainHash,
      })
    } catch (err) {
      console.error("Receipt verification failed:", err)
      setVerificationResult({
        verified: false,
        computedHash: receipt.reasoningHash,
        onChainHash: "0xMISMATCH_UNVERIFIED",
      })
    } finally {
      setVerifying(false)
    }
  }

  const explorerBaseUrl = config?.explorerUrl || "https://testnet.mstscan.com"
  const currentTxHash = targetTxHash || receipt?.onChainTxHash
  const mstScanUrl = currentTxHash
    ? `${explorerBaseUrl.replace(/\/$/, "")}/tx/${currentTxHash}`
    : null

  // 1. NO TRANSACTION SELECTED STATE
  if (!selectedAttempt) {
    return (
      <Card className="w-full bg-[#050505] border-white/10 shadow-2xl p-8 flex flex-col items-center justify-center text-center h-[580px] rounded-2xl">
        <FileCheck2 className="w-12 h-12 text-[#dfff00] animate-pulse mb-3" />
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          SELECT A TRANSACTION IN THE LEDGER
        </h3>
        <p className="text-xs text-white/50 max-w-sm mt-2 leading-relaxed">
          Click any transaction row in the ledger to inspect its cryptographic reasoning receipt and MST Testnet transaction details.
        </p>
      </Card>
    )
  }

  // 2. RECEIPT FETCHING STATE
  if (fetchingReceipt) {
    return (
      <Card className="w-full bg-[#050505] border-white/10 shadow-2xl p-8 flex flex-col items-center justify-center text-center h-[580px] rounded-2xl">
        <Cpu className="w-10 h-10 text-[#dfff00] animate-spin mb-3" />
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          FETCHING ON-CHAIN RECEIPT...
        </h3>
        <p className="text-xs text-white/50 max-w-sm mt-1 font-mono">
          Querying ReasoningReceipts contract for ID {truncateHash(selectedAttempt.receiptId || "", 10, 8)}...
        </p>
      </Card>
    )
  }

  // 3. RECEIPT LOOKUP FAILED STATE (Receipt ID existed on attempt, but contract / network fetch failed)
  if (!receipt && fetchError && selectedAttempt.receiptId && selectedAttempt.receiptId !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
    return (
      <Card className="w-full bg-[#050505] border-red-500/30 shadow-2xl p-6 flex flex-col items-center justify-center text-center h-[580px] rounded-2xl space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/40 flex items-center justify-center">
          <AlertOctagon className="w-6 h-6 text-red-400 animate-pulse" />
        </div>
        <div>
          <Badge variant="red" className="text-xs font-bold py-0.5 px-2.5 mb-2">
            LOOKUP ERROR
          </Badge>
          <h3 className="text-base font-bold font-mono text-white uppercase tracking-wider">
            RECEIPT LOOKUP FAILED
          </h3>
          <p className="text-xs text-white/70 max-w-md mt-2 leading-relaxed font-sans">
            A reasoning receipt ID is attached to this attempt, but the record could not be retrieved from the blockchain contract.
          </p>
        </div>

        <div className="p-3 bg-black border border-white/15 rounded-xl font-mono text-xs text-left w-full max-w-md space-y-1">
          <div className="flex justify-between items-center text-white/50 text-[10px]">
            <span>Receipt ID Attached:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopy(selectedAttempt.receiptId!, "failRcptId")}
              className="p-1 h-5 text-[10px] text-white/70 hover:text-[#dfff00]"
            >
              {copiedKey === "failRcptId" ? <Check className="w-3 h-3 text-[#dfff00]" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
          <p className="text-[#dfff00] font-bold break-all">
            {selectedAttempt.receiptId}
          </p>
          <div className="text-[11px] text-red-400/90 pt-1 border-t border-white/10">
            Error: {fetchError}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={fetchReceipt}
            className="gap-2 font-mono text-xs bg-black text-white hover:bg-[#dfff00] hover:text-black border border-[#dfff00]/70 shadow-[0_0_15px_rgba(223,255,0,0.15)]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Receipt Lookup
          </Button>
        </div>
      </Card>
    )
  }

  // 4. NO ON-CHAIN RECEIPT STATE (No receipt ID attached to attempt)
  if (!receipt) {
    return (
      <Card className="w-full bg-[#050505] border-white/10 shadow-2xl p-6 flex flex-col items-center justify-center text-center h-[580px] rounded-2xl space-y-3">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-white/40" />
        </div>
        <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
          NO ON-CHAIN RECEIPT
        </h3>
        <p className="text-xs text-white/50 max-w-sm leading-relaxed font-sans">
          This transaction attempt did not record an on-chain reasoning receipt.
        </p>
        <p className="text-[11px] font-mono text-white/30 pt-2">
          Attempt ID: {selectedAttempt.id} • Status: {selectedAttempt.status.toUpperCase()}
        </p>
      </Card>
    )
  }

  const rf = receipt.reasoningFull
  const isBlocked = receipt.decisionLabel === "BLOCKED"
  const isExecuted = receipt.decisionLabel === "EXECUTED"

  const signals = rf?.manipulationSignals || []
  const rationaleText = rf?.rationale || receipt.reasoningSummary
  const repChecked = rf?.reputationChecked
  const modelInfo = rf?.model || { provider: "gemini", name: "gemini-2.5-flash", fellBack: false }

  return (
    <Card
      className="w-full bg-black border-white/15 shadow-2xl p-5 flex flex-col h-[580px] overflow-hidden rounded-2xl"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/12 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-black border border-[#dfff00]/60 flex items-center justify-center shadow-[0_0_18px_rgba(223,255,0,0.2)]">
            <Sparkles className="w-5 h-5 text-[#dfff00]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Reasoning Receipt Viewer
              </h3>
              <Badge variant="cyan" className="text-[10px] py-0 px-1.5">
                ON-CHAIN PROOF
              </Badge>
            </div>
            <p className="text-[11px] text-white/50 font-mono">
              Receipt ID: {truncateHash(receipt.receiptId, 10, 8)}
            </p>
          </div>
        </div>

        {/* Decision Badge Header */}
        <div className="flex items-center gap-2">
          {isBlocked && (
            <Badge variant="red" className="text-xs py-1 px-3 gap-1 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-[#dfff00]" />
              BLOCKED BY CHARTER
            </Badge>
          )}
          {isExecuted && (
            <Badge variant="emerald" className="text-xs py-1 px-3 gap-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              EXECUTED ON-CHAIN
            </Badge>
          )}
          {!isBlocked && !isExecuted && (
            <Badge variant="amber" className="text-xs py-1 px-3 gap-1 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-white/80" />
              DECLINED BY AGENT
            </Badge>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/20">
        
        {/* 1. DECISION SUMMARY AUDIT BOX */}
        <div className="p-3.5 bg-[#0a0a0a] border border-white/12 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
            Executive Decision Summary
          </span>
          <p className="text-xs font-semibold text-white leading-relaxed font-sans">
            {receipt.reasoningSummary}
          </p>
        </div>

        {/* 2. MANIPULATION SIGNALS */}
        <div className="space-y-1.5 font-mono">
          <span className="text-[10px] text-white/50 uppercase tracking-wider block">
            Detected Manipulation Signals
          </span>
          <div className="flex flex-wrap gap-1.5">
            {signals.length > 0 ? (
              signals.map((signal, idx) => (
                <Badge key={idx} variant="red" className="text-[10px] py-0.5 px-2 gap-1">
                  <AlertOctagon className="w-3 h-3 text-[#dfff00]" />
                  {signal}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-white font-bold bg-black border border-white/30 px-2.5 py-1 rounded-md inline-block shadow-[0_0_12px_rgba(255,255,255,0.08)]">
                ✓ NO MANIPULATION SIGNALS DETECTED
              </span>
            )}
          </div>
        </div>

        {/* 3. RATIONALE */}
        <div className="p-3 bg-[#0a0a0a] border border-white/12 rounded-xl space-y-1 font-sans">
          <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block">
            Agent Rationale
          </span>
          <p className="text-xs text-white/80 leading-relaxed">
            {rationaleText}
          </p>
        </div>

        {/* 4. REPUTATION CHECK & MODEL METADATA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          
          {/* Reputation Check */}
          <div className="p-3 bg-[#0a0a0a] border border-white/12 rounded-xl space-y-1">
            <span className="text-[10px] text-white/50 uppercase block">Reputation Verification</span>
            {repChecked?.enabled ? (
              <div className="space-y-1 text-[11px]">
                <div className="text-white">Feedback Count: {repChecked.feedbackCount}</div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-white/70">
                  <span>Comp: {repChecked.axes?.competence ?? "NO DATA"}</span>
                  <span>Hon: {repChecked.axes?.honesty ?? "NO DATA"}</span>
                  <span>Compl: {repChecked.axes?.compliance ?? "NO DATA"}</span>
                  <span>Rel: {repChecked.axes?.reliability ?? "NO DATA"}</span>
                </div>
              </div>
            ) : (
              <span className="text-white/40 italic">REPUTATION CHECK DISABLED</span>
            )}
          </div>

          {/* Model Info */}
          <div className="p-3 bg-[#0a0a0a] border border-white/12 rounded-xl space-y-1">
            <span className="text-[10px] text-white/50 uppercase block">AI Model Metadata</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Cpu className="w-3.5 h-3.5 text-[#dfff00]" />
              <span>{modelInfo.provider.toUpperCase()} ({modelInfo.name})</span>
            </div>
            {modelInfo.fellBack && (
              <Badge variant="cyan" className="text-[9px] py-0 px-1 mt-1">
                FELL BACK TO OLLAMA
              </Badge>
            )}
          </div>

        </div>

        {/* 5. REASONING HASH & ON-CHAIN VERIFICATION PROOF */}
        <div className="p-3.5 bg-[#050505] border border-white/15 rounded-xl space-y-3 font-mono text-xs">
          
          <div className="flex items-center justify-between">
            <span className="text-white/70 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-[#dfff00]" /> Cryptographic Reasoning Hash:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[#dfff00] font-bold">{truncateHash(receipt.reasoningHash, 10, 8)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(receipt.reasoningHash, "reasoningHash")}
                className="p-1 h-6 text-white/70 hover:text-[#dfff00]"
              >
                {copiedKey === "reasoningHash" ? <Check className="w-3.5 h-3.5 text-[#dfff00]" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* Verification Controls & Visual Status */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <Button
              variant="primary"
              size="md"
              isLoading={verifying}
              onClick={handleVerify}
              className="w-full sm:w-auto font-mono text-xs font-bold gap-2 py-2 px-4 bg-black text-white hover:bg-[#dfff00] hover:text-black border border-[#dfff00]/70 shadow-[0_0_20px_rgba(223,255,0,0.18)]"
            >
              <ShieldCheck className="w-4 h-4" />
              {verifying ? "COMPUTING HASH MATCH..." : "VERIFY ON-CHAIN"}
            </Button>

            <AnimatePresence mode="wait">
              {verificationResult?.verified === true && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 text-[#dfff00] font-bold text-xs bg-black border border-[#dfff00]/60 px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(223,255,0,0.2)]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#dfff00]" />
                  RECEIPT VERIFIED ✓
                </motion.div>
              )}

              {verificationResult?.verified === false && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1.5 text-white font-bold text-xs bg-black border border-[#dfff00] px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(223,255,0,0.25)] animate-pulse"
                >
                  <AlertTriangle className="w-4 h-4 text-[#dfff00]" />
                  HASH MISMATCH ⚠
                </motion.div>
              )}
            </AnimatePresence>

            {mstScanUrl && (
              <a
                href={mstScanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#dfff00] hover:underline"
              >
                MSTScan Explorer <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

        </div>

        {/* ================================================== */}
        {/* PART 3 — READ-ONLY MST TRANSACTION DETAILS PANEL  */}
        {/* ================================================== */}
        {currentTxHash && (
          <div className="p-4 bg-[#050505] border border-white/15 rounded-xl space-y-4 font-mono text-xs mt-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/12 pb-2.5">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#dfff00]" />
                <span className="font-bold text-white uppercase tracking-wider text-xs">
                  BLOCKCHAIN TRANSACTION (MST TESTNET)
                </span>
              </div>

              {txDetails && (
                <Badge
                  variant={txDetails.status === "SUCCESS" ? "emerald" : txDetails.status === "FAILED" ? "red" : "amber"}
                  className="text-[10px] py-0.5 px-2 font-bold"
                >
                  {txDetails.status}
                </Badge>
              )}
            </div>

            {fetchingTxDetails && (
              <div className="flex items-center justify-center gap-2 py-6 text-white/50">
                <RefreshCw className="w-4 h-4 animate-spin text-[#dfff00]" />
                <span>Loading on-chain MST transaction details...</span>
              </div>
            )}

            {txDetailsError && !fetchingTxDetails && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs flex justify-between items-center">
                <span>Failed to fetch transaction details: {txDetailsError}</span>
                <Button variant="ghost" size="sm" onClick={fetchTxDetails} className="h-6 text-xs text-white">
                  Retry
                </Button>
              </div>
            )}

            {txDetails && !fetchingTxDetails && (
              <div className="space-y-4">
                
                {/* Compact Grid of Transaction Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  
                  {/* Transaction Hash */}
                  <div className="p-2.5 bg-black border border-white/10 rounded-lg col-span-1 sm:col-span-2 flex items-center justify-between gap-2">
                    <span className="text-white/50 shrink-0">Tx Hash:</span>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[#dfff00] font-bold truncate">{currentTxHash}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(currentTxHash, "txHash")}
                        className="p-1 h-5 text-white/60 hover:text-[#dfff00] shrink-0"
                      >
                        {copiedKey === "txHash" ? <Check className="w-3 h-3 text-[#dfff00]" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>

                  {/* Method */}
                  <div className="p-2.5 bg-black border border-white/10 rounded-lg flex justify-between items-center">
                    <span className="text-white/50">Method:</span>
                    <span className="text-white font-bold">{txDetails.method}</span>
                  </div>

                  {/* Block Number & Confirmations */}
                  <div className="p-2.5 bg-black border border-white/10 rounded-lg flex justify-between items-center">
                    <span className="text-white/50">Block:</span>
                    <span className="text-white font-bold">
                      {txDetails.blockNumber ? `#${txDetails.blockNumber} (${txDetails.confirmations} confs)` : "Pending"}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="p-2.5 bg-black border border-white/10 rounded-lg flex justify-between items-center">
                    <span className="text-white/50">Timestamp:</span>
                    <span className="text-white font-bold">
                      {txDetails.timestamp ? new Date(txDetails.timestamp * 1000).toLocaleString() : "N/A"}
                    </span>
                  </div>

                  {/* From Address */}
                  <div className="p-2.5 bg-black border border-white/10 rounded-lg flex justify-between items-center">
                    <span className="text-white/50">From:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-white">{truncateAddress(txDetails.from, 6, 4)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(txDetails.from, "txFrom")}
                        className="p-0.5 h-4 text-white/60 hover:text-[#dfff00]"
                      >
                        {copiedKey === "txFrom" ? <Check className="w-3 h-3 text-[#dfff00]" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>

                  {/* To Address */}
                  <div className="p-2.5 bg-black border border-white/10 rounded-lg flex justify-between items-center">
                    <span className="text-white/50">To / Contract:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-white">{txDetails.to ? truncateAddress(txDetails.to, 6, 4) : "Contract Creation"}</span>
                      {txDetails.to && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(txDetails.to!, "txTo")}
                          className="p-0.5 h-4 text-white/60 hover:text-[#dfff00]"
                        >
                          {copiedKey === "txTo" ? <Check className="w-3 h-3 text-[#dfff00]" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Native MST Value */}
                  <div className="p-2.5 bg-black border border-white/10 rounded-lg flex justify-between items-center">
                    <span className="text-white/50">Native Value:</span>
                    <span className="text-[#dfff00] font-bold">
                      {formatNativeAmount(txDetails.valueWei, 18, "MST")}
                    </span>
                  </div>

                  {/* Transaction Fee */}
                  <div className="p-2.5 bg-black border border-white/10 rounded-lg flex justify-between items-center">
                    <span className="text-white/50">Tx Fee:</span>
                    <span className="text-white">
                      {formatNativeAmount(txDetails.transactionFeeWei, 18, "MST")}
                    </span>
                  </div>

                  {/* Gas Price */}
                  <div className="p-2.5 bg-black border border-white/10 rounded-lg flex justify-between items-center">
                    <span className="text-white/50">Gas Price:</span>
                    <span className="text-white">
                      {formatNativeAmount(txDetails.gasPriceWei, 9, "Gwei")}
                    </span>
                  </div>

                  {/* Gas Used / Limit */}
                  <div className="p-2.5 bg-black border border-white/10 rounded-lg flex justify-between items-center">
                    <span className="text-white/50">Gas Used / Limit:</span>
                    <span className="text-white">
                      {txDetails.gasUsed} / {txDetails.gasLimit}
                    </span>
                  </div>

                  {/* Nonce */}
                  <div className="p-2.5 bg-black border border-white/10 rounded-lg flex justify-between items-center">
                    <span className="text-white/50">Nonce:</span>
                    <span className="text-white font-bold">{txDetails.nonce}</span>
                  </div>

                </div>

                {/* TOKEN TRANSFERS SUBSECTION */}
                <div className="p-3 bg-black border border-white/12 rounded-lg space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-white/60 font-bold uppercase">
                    <Layers className="w-3.5 h-3.5 text-[#dfff00]" />
                    Token Transfers
                  </div>
                  {txDetails.tokenTransfers.length > 0 ? (
                    <div className="space-y-1.5 text-[11px]">
                      {txDetails.tokenTransfers.map((tf, idx) => (
                        <div key={idx} className="p-2 bg-[#0a0a0a] border border-white/10 rounded flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="cyan" className="text-[9px] py-0 px-1">
                              {tf.type.toUpperCase()}
                            </Badge>
                            <span className="text-white">{truncateAddress(tf.from, 6, 4)}</span>
                            <ArrowRight className="w-3 h-3 text-white/40" />
                            <span className="text-white">{truncateAddress(tf.to, 6, 4)}</span>
                          </div>
                          <span className="text-[#dfff00] font-bold">
                            {formatNativeAmount(tf.amountWei, 18, tf.asset || "TOKENS")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-white/40 italic py-1">
                      No token transfers detected
                    </div>
                  )}
                </div>

                {/* CONTRACT EVENT LOGS SUBSECTION */}
                {txDetails.contractEvents.length > 0 && (
                  <div className="p-3 bg-black border border-white/12 rounded-lg space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#dfff00] font-bold uppercase">
                      <Code2 className="w-3.5 h-3.5 text-[#dfff00]" />
                      Decoded Contract Event ({txDetails.contractEvents[0].eventName})
                    </div>
                    {txDetails.contractEvents.map((evt, idx) => (
                      <div key={idx} className="p-2.5 bg-[#0a0a0a] border border-white/10 rounded space-y-1 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Event:</span>
                          <span className="text-white font-bold">{evt.eventName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Receipt ID:</span>
                          <span className="text-[#dfff00] truncate max-w-[200px]">{evt.args.receiptId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Reasoning Hash:</span>
                          <span className="text-[#dfff00] truncate max-w-[200px]">{evt.args.reasoningHash}</span>
                        </div>
                        {evt.args.summary && (
                          <div className="pt-1 border-t border-white/10 text-white/80">
                            <span className="text-white/40 block text-[10px]">Summary:</span>
                            {String(evt.args.summary)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* RAW LOGS / ADVANCED TECHNICAL INSPECTION */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => setShowRawDetails(!showRawDetails)}
                    className="flex items-center gap-1.5 text-[11px] text-white/60 hover:text-[#dfff00] transition-colors"
                  >
                    {showRawDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{showRawDetails ? "Hide Raw Logs / Advanced" : "Show Raw Logs / Advanced"}</span>
                  </button>

                  {showRawDetails && (
                    <div className="mt-2 p-3 bg-black border border-white/10 rounded-lg max-h-48 overflow-y-auto">
                      <pre className="text-[10px] text-white/70 font-mono whitespace-pre-wrap">
                        {JSON.stringify(txDetails.rawLogs, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Explorer Action Footer */}
                {mstScanUrl && (
                  <div className="pt-2 flex justify-end">
                    <a
                      href={mstScanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black border border-[#dfff00]/60 text-[#dfff00] hover:bg-[#dfff00] hover:text-black font-bold text-xs transition-all shadow-[0_0_12px_rgba(223,255,0,0.15)]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View on MSTScan Explorer
                    </a>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>
    </Card>
  )
}
