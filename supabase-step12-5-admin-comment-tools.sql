-- ============================================================
-- STEP 12.5 관리자 댓글 스레드 보완
-- 이미 Supabase 플러그인으로 운영 DB에 적용된 내용을 재현용으로 기록합니다.
-- ============================================================

BEGIN;

-- A. 관리자 댓글 페이지 RPC에 대댓글 식별 필드 포함
CREATE OR REPLACE FUNCTION public.admin_page_comments(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 100,
  p_status text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $$
DECLARE
  v_page integer := GREATEST(COALESCE(p_page,1),1);
  v_size integer := LEAST(GREATEST(COALESCE(p_page_size,100),1),100);
  v_offset integer;
  v_total bigint;
  v_rows jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id=(SELECT auth.uid())
      AND p.role IN ('ADMIN','MODERATOR')
      AND p.status='ACTIVE'
  ) THEN
    RAISE EXCEPTION '관리자 권한이 없습니다.' USING ERRCODE='42501';
  END IF;

  v_offset := (v_page-1)*v_size;

  SELECT count(*) INTO v_total
  FROM public.comments c
  WHERE p_status IS NULL OR upper(p_status)='ALL' OR c.status=upper(p_status);

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC),'[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT
      c.id,c.post_id,c.user_id,c.content,c.status,c.created_at,c.is_anonymous,
      c.parent_comment_id,c.reply_to_user_id
    FROM public.comments c
    WHERE p_status IS NULL OR upper(p_status)='ALL' OR c.status=upper(p_status)
    ORDER BY c.created_at DESC
    OFFSET v_offset LIMIT v_size
  ) x;

  RETURN jsonb_build_object('page',v_page,'page_size',v_size,'total',v_total,'rows',v_rows);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_page_comments(integer,integer,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_page_comments(integer,integer,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_page_comments(integer,integer,text) TO authenticated, service_role;

-- B. 기존 SECURITY DEFINER 함수의 anon 직접 실행권한 회수
REVOKE ALL ON FUNCTION public.admin_hide_comment(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_hide_comment(bigint) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_hide_comment(bigint) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_my_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $$
BEGIN
  INSERT INTO public.profiles (id,nickname,business_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname','사장님' || substr(NEW.id::text,1,6)),
    NEW.raw_user_meta_data->>'business_type'
  );
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

REVOKE ALL ON FUNCTION public.is_active_content_moderator() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_content_moderator() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_active_content_moderator() TO authenticated, service_role;

COMMIT;
