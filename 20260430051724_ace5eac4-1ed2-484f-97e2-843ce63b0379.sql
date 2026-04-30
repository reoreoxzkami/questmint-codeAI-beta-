
CREATE TABLE public.generation_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES public.generations(id) ON DELETE SET NULL,
  rating TEXT NOT NULL CHECK (rating IN ('good','bad')),
  comment TEXT,
  prompt TEXT,
  tier TEXT,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_feedback_user ON public.generation_feedback(user_id, created_at DESC);
ALTER TABLE public.generation_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback_select_own" ON public.generation_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "feedback_insert_own" ON public.generation_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback_delete_own" ON public.generation_feedback FOR DELETE USING (auth.uid() = user_id);
