-- Additive Migration: AI Jury Verdicts Table
-- File: 0002_jury_insurance.sql

CREATE TABLE IF NOT EXISTS jury_verdicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type text NOT NULL CHECK (case_type IN ('payment_approval', 'claim_adjudication')),
  case_ref_id text NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('approve', 'reject')),
  votes jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE jury_verdicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to jury_verdicts"
  ON jury_verdicts FOR SELECT
  TO anon
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE jury_verdicts;
