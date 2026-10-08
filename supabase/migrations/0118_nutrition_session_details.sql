-- The nutritionist session type (0117) reused the generic day_notes field
-- like Conversation does -- the coach wants it to be its own style of log
-- instead, with fields specific to nutrition coaching (eating patterns,
-- goals, recommendations, challenges, follow-ups) rather than one big
-- notes box. Stored as a single jsonb object so the shape can change
-- later without another migration; null for every non-nutritionist
-- session, and for nutritionist sessions logged before this existed.
alter table public.sessions
  add column if not exists nutrition_details jsonb;
