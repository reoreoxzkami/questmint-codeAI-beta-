
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- credits
CREATE TABLE public.credits (
  user_id UUID PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 100,
  total_earned INTEGER NOT NULL DEFAULT 100,
  total_spent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credits_select_own" ON public.credits FOR SELECT USING (auth.uid() = user_id);

-- credit_transactions
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('earn','spend','bonus','refund')),
  description TEXT,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx_select_own" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_tx_user_created ON public.credit_transactions(user_id, created_at DESC);

-- generations
CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  prompt TEXT NOT NULL,
  response TEXT,
  model TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'fast',
  credits_spent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gen_select_own" ON public.generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gen_insert_own" ON public.generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gen_update_own" ON public.generations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "gen_delete_own" ON public.generations FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_gen_user_created ON public.generations(user_id, created_at DESC);

-- timestamp trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER credits_set_updated_at BEFORE UPDATE ON public.credits
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- new user trigger: creates profile + 100 credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  INSERT INTO public.credits (user_id, balance, total_earned)
  VALUES (NEW.id, 100, 100);
  INSERT INTO public.credit_transactions (user_id, amount, kind, description)
  VALUES (NEW.id, 100, 'bonus', 'Welcome bonus');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
