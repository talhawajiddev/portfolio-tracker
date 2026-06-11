-- ============================================================
-- PSX Demo Trader — Analytics migration
-- Run AFTER schema.sql in Supabase → SQL Editor
-- Safe to run on existing database (additive only)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equity NUMERIC(16, 2) NOT NULL,
  cash NUMERIC(16, 2) NOT NULL,
  invested NUMERIC(16, 2) NOT NULL DEFAULT 0,
  pnl NUMERIC(16, 2) NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_time
  ON public.portfolio_snapshots(user_id, recorded_at DESC);

ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own snapshots" ON public.portfolio_snapshots;
DROP POLICY IF EXISTS "Admins read all snapshots" ON public.portfolio_snapshots;
DROP POLICY IF EXISTS "Users insert own snapshots" ON public.portfolio_snapshots;

CREATE POLICY "Users read own snapshots"
  ON public.portfolio_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all snapshots"
  ON public.portfolio_snapshots FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users insert own snapshots"
  ON public.portfolio_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.portfolio_snapshots TO authenticated;
