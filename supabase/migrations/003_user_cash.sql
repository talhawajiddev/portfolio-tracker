-- Set default demo cash to 0 (users deposit their own paper cash)
ALTER TABLE public.portfolios
  ALTER COLUMN cash SET DEFAULT 0;
