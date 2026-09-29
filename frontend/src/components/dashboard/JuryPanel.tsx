import React, { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { apiClient } from "../../api/client";
import type { JuryEvaluationResult, JurorVote } from "../../api/types";
import { Scale, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Database, FileText, Cpu, ExternalLink } from "lucide-react";

const PERSONA_CONFIGS = [
  {
    id: "skeptical",
    name: "Skeptical Juror",
    badge: "Anti-Manipulation",
    description: "Assumes manipulation until proven otherwise. Flags urgency, flattery, and unverifiable claims."
  },
  {
    id: "risk-averse",
    name: "Risk-Averse Juror",
    badge: "Capital Protection",
    description: "Weighs downside risk heavily. Prefers declining when evidence is incomplete or high-variance."
  },
  {
    id: "pragmatic",
    name: "Pragmatic Juror",
    badge: "Reputation & Evidence",
    description: "Weighs the counterparty's actual on-chain reputation and verified evidence over narrative framing."
  }
];

export const JuryPanel: React.FC = () => {
  const [caseId, setCaseId] = useState("JURY-DEMO-001");
  const [caseType, setCaseType] = useState<"payment_approval" | "claim_adjudication">("payment_approval");
  const [amount, setAmount] = useState("0.25");
  const [recipient, setRecipient] = useState("0x5D7C03A79570014e8cf335DCdBc9Fb87284Fdf4B");
  const [reason, setReason] = useState("Urgent infrastructure expansion payment requested by vendor");
  const [recordReceipts, setRecordReceipts] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JuryEvaluationResult | null>(null);

  const handleRunJury = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiClient.evaluateJuryCase({
        caseId: caseId.trim() || `CASE-${Date.now()}`,
        caseType,
        context: {
          amount,
          recipient,
          reason,
          counterparty: recipient
        },
        recordReceipts
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to execute AI Jury evaluation");
    } finally {
      setLoading(false);
    }
  };

  const getJurorVote = (personaId: string): JurorVote | undefined => {
    return result?.votes?.find((v) => v.persona.toLowerCase() === personaId.toLowerCase());
  };

  const calculateApproveCount = (): number => {
    if (!result || !result.votes) return 0;
    return result.votes.filter((v) => v.vote === "approve").length;
  };

  return (
    <Card variant="glow-cyan" className="p-6 relative overflow-hidden text-white shadow-2xl">
      {/* Decorative Glow Header Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-[var(--verixia-yellow)] to-amber-500 opacity-80" />

      {/* Panel Header */}
      <div className="border-b border-white/12 pb-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-[var(--verixia-yellow)]">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                AI Jury Protocol
                <Badge variant="cyan" className="text-[10px]">
                  Feature 1 Extension
                </Badge>
              </h2>
              <p className="text-xs text-white/60">
                Tri-persona concurrent LLM decision engine with majority voting & on-chain reasoning receipts
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-white/80 bg-black/80 px-3 py-1.5 rounded-md border border-white/12">
            <Cpu className="w-3.5 h-3.5 text-[var(--verixia-yellow)]" />
            <span>3 Jurors Concurrent</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Case Input Form */}
        <form onSubmit={handleRunJury} className="p-4 rounded-xl bg-black/80 border border-white/12 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--verixia-yellow)] flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>Deliberation Case Context</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Case Reference ID</label>
              <input
                type="text"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-md bg-black border border-white/15 text-white focus:outline-none focus:border-[var(--verixia-yellow)] font-mono"
                placeholder="JURY-DEMO-001"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Case Type</label>
              <select
                value={caseType}
                onChange={(e) => setCaseType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-md bg-black border border-white/15 text-white focus:outline-none focus:border-[var(--verixia-yellow)] font-mono"
              >
                <option value="payment_approval">payment_approval</option>
                <option value="claim_adjudication">claim_adjudication</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Amount (MST)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md bg-black border border-white/15 text-white focus:outline-none focus:border-[var(--verixia-yellow)] font-mono"
                placeholder="0.25"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Recipient / Counterparty Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md bg-black border border-white/15 text-white focus:outline-none focus:border-[var(--verixia-yellow)] font-mono text-[11px]"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Context / Pretext Narrative</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md bg-black border border-white/15 text-white focus:outline-none focus:border-[var(--verixia-yellow)]"
                placeholder="Describe transaction context..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center space-x-2 text-xs text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={recordReceipts}
                onChange={(e) => setRecordReceipts(e.target.checked)}
                className="rounded border-white/20 bg-black text-[var(--verixia-yellow)] focus:ring-0"
              />
              <span>Record On-Chain Reasoning Receipts (M8 MST Testnet)</span>
            </label>

            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--verixia-yellow)] text-black font-semibold hover:bg-yellow-300 text-xs px-5 py-2 transition-all shadow-[0_0_15px_rgba(223,255,0,0.2)]"
            >
              {loading ? "Deliberating..." : "Run AI Jury Deliberation"}
            </Button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3 Jurors Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PERSONA_CONFIGS.map((persona) => {
            const voteData = getJurorVote(persona.id);
            const isCompleted = result?.status === "COMPLETED" && voteData && !voteData.error;
            const isFailed = voteData?.error || (result?.status === "FAILED" && (!voteData || voteData.error));

            return (
              <div
                key={persona.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  loading
                    ? "border-yellow-400/40 bg-yellow-400/5 animate-pulse"
                    : isCompleted
                    ? voteData?.vote === "approve"
                      ? "border-emerald-500/40 bg-emerald-950/20"
                      : "border-red-500/40 bg-red-950/20"
                    : isFailed
                    ? "border-amber-500/40 bg-amber-950/20"
                    : "border-white/12 bg-black/80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">{persona.name}</span>
                    <Badge variant="neutral" className="text-[10px]">
                      {persona.badge}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-white/60 mb-3 leading-relaxed">{persona.description}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-white/12">
                  {loading ? (
                    <div className="flex items-center space-x-2 text-xs text-[var(--verixia-yellow)]">
                      <div className="w-2 h-2 rounded-full bg-[var(--verixia-yellow)] animate-ping" />
                      <span className="font-mono">Deliberating...</span>
                    </div>
                  ) : isCompleted ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/60">Vote:</span>
                        <Badge
                          variant={voteData?.vote === "approve" ? "emerald" : "red"}
                          className="text-xs px-2.5 py-0.5"
                        >
                          {voteData?.vote?.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-white/80 bg-black p-2.5 rounded-md border border-white/12 leading-relaxed italic">
                        "{voteData?.reasoning}"
                      </p>
                    </div>
                  ) : isFailed ? (
                    <div className="space-y-1">
                      <Badge variant="amber" className="text-[11px]">
                        Juror Incomplete / Error
                      </Badge>
                      <p className="text-[11px] text-amber-400/80">{voteData?.errorMessage || "Execution failed"}</p>
                    </div>
                  ) : (
                    <div className="text-[11px] text-white/50 font-mono flex items-center space-x-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                      <span>Ready for Case</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Verdict Banner Section */}
        {result && (
          <div className="space-y-4 pt-2">
            {result.status === "COMPLETED" ? (
              <div
                className={`p-5 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
                  result.verdict === "approve"
                    ? "border-emerald-500/50 bg-emerald-950/30 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                    : "border-red-500/50 bg-red-950/30 shadow-[0_0_25px_rgba(239,68,68,0.15)]"
                }`}
              >
                <div className="flex items-center space-x-4">
                  {result.verdict === "approve" ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <div className="text-xs uppercase font-bold tracking-wider text-white/60">Jury Majority Verdict</div>
                    <div className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                      VERDICT: {result.verdict?.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 font-mono text-xs">
                  <div className="px-3 py-1.5 rounded-lg bg-black border border-white/12 text-white/80">
                    Majority: <span className="text-[var(--verixia-yellow)] font-bold">{calculateApproveCount()} / 3</span> Votes
                  </div>
                  {result.persisted && (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Database className="w-3.5 h-3.5" />
                      <span>Persisted to Database</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-amber-500/50 bg-amber-950/30 flex items-center space-x-4">
                <ShieldAlert className="w-8 h-8 text-amber-400 flex-shrink-0" />
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-amber-300">Fail-Safe Protection Triggered</div>
                  <div className="text-xl font-bold text-white">JURY INCOMPLETE</div>
                  <p className="text-xs text-amber-200/80 mt-1">
                    Fewer than 3 valid juror responses were received ({result.votes?.filter((v) => !v.error).length || 0} / 3).
                    No vote was fabricated and no verdict was declared.
                  </p>
                </div>
              </div>
            )}

            {/* On-Chain Receipts Output Section */}
            {result.receipts && (
              <div className="p-4 rounded-xl bg-black/80 border border-white/12 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--verixia-yellow)] flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>On-Chain Reasoning Receipts (MST Testnet)</span>
                  </div>

                  <Badge
                    variant={result.receipts.receiptsStatus === "ALL_RECORDED" ? "emerald" : "amber"}
                    className="text-xs"
                  >
                    STATUS: {result.receipts.receiptsStatus}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {result.receipts.receipts.map((rcpt) => (
                    <div
                      key={rcpt.persona}
                      className="p-3 rounded-lg bg-black border border-white/12 flex flex-col md:flex-row md:items-center justify-between text-xs gap-2 font-mono"
                    >
                      <div>
                        <span className="font-bold text-white uppercase">{rcpt.persona}</span>
                        <span className="text-white/60 ml-2">[{rcpt.decisionCode === 0 ? "APPROVE" : "REJECT"}]</span>
                        <div className="text-[11px] text-white/50 truncate max-w-md">ID: {rcpt.receiptId}</div>
                      </div>

                      <div className="text-right">
                        {rcpt.status === "RECORDED" ? (
                          <div className="flex items-center space-x-2 text-emerald-400">
                            <span className="text-[11px] truncate max-w-xs">Tx: {rcpt.txHash}</span>
                            <a
                              href={`https://testnet.mstblockchain.com/tx/${rcpt.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 hover:text-white transition-colors"
                              title="View on Explorer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-amber-400 text-[11px]">Submission Failed: {rcpt.error || "RPC error"}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
