-- ============================================================
-- STEP 11 관리자 보안 3차: 주요 테이블 RLS 하드닝
--
-- 점검에서 확인된 상태:
--   comments  : RLS ON
--   reports   : RLS ON
--   posts     : RLS OFF  -> 이 파일에서 활성화
--   profiles  : RLS OFF  -> 이 파일에서 활성화
--   reactions : RLS OFF  -> 이 파일에서 활성화
--
-- 목표:
-- 1) posts / profiles / reactions RLS 활성화
-- 2) anon / authenticated의 과도한 테이블 권한 최소화
-- 3) 게시글/프로필은 본인만 수정 가능
-- 4) 공개 조회수 증가는 허용하되 다른 사람 글 변조는 트리거에서 차단
-- 5) reactions는 공개 집계 조회 + 로그인 회원 본인 반응 등록/취소만 허용
-- 6) reports INSERT는 반드시 PENDING으로만 접수
-- 7) 관리자 SECURITY DEFINER RPC는 기존대로 RLS와 별개로 내부 관리자 검증
--
-- Supabase SQL Editor에서 전체 실행하세요.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- A. profiles role/status 보호 트리거 보강
-- SQL Editor(postgres) / service_role은 서버 관리 작업을 허용하고,
-- 브라우저 authenticated 사용자는 ACTIVE 관리자만 role/status 변경을 허용합니다.
-- 이후 브라우저에는 role/status UPDATE 컬럼 권한 자체를 주지 않습니다.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.status IS DISTINCT FROM OLD.status THEN

    -- SQL Editor / 서버 관리 컨텍스트
    IF session_user = 'postgres' OR (SELECT auth.role()) = 'service_role' THEN
      RETURN NEW;
    END IF;

    -- 로그인 관리자/운영자
    IF NOT public.is_active_admin() THEN
      RAISE EXCEPTION '역할 또는 계정 상태를 변경할 권한이 없습니다.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_security_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_profile_security_fields() FROM anon;
REVOKE ALL ON FUNCTION public.protect_profile_security_fields() FROM authenticated;

-- ------------------------------------------------------------
-- B. posts UPDATE 보호 트리거
-- anon/다른 회원: ACTIVE 게시글의 view_count를 정확히 +1 하는 변경만 허용
-- 작성자: 자신의 ACTIVE 게시글에서 title/content/updated_at/status만 변경 가능
-- 관리자: 관리자 RPC/관리자 세션에서 상태 조치 가능
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_post_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  -- SQL Editor / service_role 서버 작업
  IF session_user = 'postgres' OR (SELECT auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- ACTIVE 관리자/운영자
  IF v_uid IS NOT NULL AND public.is_active_admin() THEN
    RETURN NEW;
  END IF;

  -- 누구나 허용되는 변경: ACTIVE 게시글 조회수만 정확히 1 증가
  IF OLD.status = 'ACTIVE'
     AND NEW.status = OLD.status
     AND COALESCE(NEW.view_count, 0) = COALESCE(OLD.view_count, 0) + 1
     AND (to_jsonb(NEW) - ARRAY['view_count']) = (to_jsonb(OLD) - ARRAY['view_count']) THEN
    RETURN NEW;
  END IF;

  -- 작성자 본인의 정상 게시글 수정/소프트 삭제
  IF v_uid IS NOT NULL
     AND OLD.user_id = v_uid
     AND NEW.user_id = OLD.user_id
     AND OLD.status = 'ACTIVE'
     AND NEW.status IN ('ACTIVE','DELETED')
     AND (to_jsonb(NEW) - ARRAY['title','content','updated_at','status'])
         = (to_jsonb(OLD) - ARRAY['title','content','updated_at','status']) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION '게시글을 수정할 권한이 없습니다.'
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION public.protect_post_updates() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_post_updates() FROM anon;
REVOKE ALL ON FUNCTION public.protect_post_updates() FROM authenticated;

DROP TRIGGER IF EXISTS trg_protect_post_updates ON public.posts;
CREATE TRIGGER trg_protect_post_updates
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.protect_post_updates();

-- ------------------------------------------------------------
-- C. RLS 활성화
-- ------------------------------------------------------------
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- D. posts 정책
-- ------------------------------------------------------------
DROP POLICY IF EXISTS posts_select_active ON public.posts;
DROP POLICY IF EXISTS posts_select_own ON public.posts;
DROP POLICY IF EXISTS posts_select_admin ON public.posts;
DROP POLICY IF EXISTS posts_insert_own ON public.posts;
DROP POLICY IF EXISTS posts_update_active ON public.posts;

CREATE POLICY posts_select_active
ON public.posts
FOR SELECT
TO anon, authenticated
USING (status = 'ACTIVE');

CREATE POLICY posts_select_own
ON public.posts
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY posts_select_admin
ON public.posts
FOR SELECT
TO authenticated
USING (public.is_active_admin());

CREATE POLICY posts_insert_own
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND status = 'ACTIVE'
);

-- 실제 변경 가능 컬럼/주체는 protect_post_updates 트리거가 한 번 더 검증합니다.
CREATE POLICY posts_update_active
ON public.posts
FOR UPDATE
TO anon, authenticated
USING (status = 'ACTIVE')
WITH CHECK (status IN ('ACTIVE','DELETED'));

-- ------------------------------------------------------------
-- E. profiles 정책
-- 일반회원: 자기 프로필 조회/수정
-- 관리자: 전체 프로필 조회
-- role/status 컬럼은 아래 GRANT에서 브라우저 UPDATE 권한 자체를 주지 않음
-- ------------------------------------------------------------
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_select_admin
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_active_admin());

CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- ------------------------------------------------------------
-- F. reactions 정책
-- 반응 수는 비로그인도 조회 가능
-- 등록/취소는 로그인 회원 본인 행만 가능
-- ------------------------------------------------------------
DROP POLICY IF EXISTS reactions_select_all ON public.reactions;
DROP POLICY IF EXISTS reactions_insert_own ON public.reactions;
DROP POLICY IF EXISTS reactions_delete_own ON public.reactions;

CREATE POLICY reactions_select_all
ON public.reactions
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY reactions_insert_own
ON public.reactions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_id
      AND p.status = 'ACTIVE'
  )
);

CREATE POLICY reactions_delete_own
ON public.reactions
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- ------------------------------------------------------------
-- G. reports INSERT 정책 강화
-- 일반회원은 자기 reporter_id + PENDING 신고만 새로 만들 수 있습니다.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS reports_insert_own ON public.reports;

CREATE POLICY reports_insert_own
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
  reporter_id = (SELECT auth.uid())
  AND status = 'PENDING'
  AND target_type IN ('POST','COMMENT')
);

-- ------------------------------------------------------------
-- H. comments 관리자 전체 조회 정책 추가
-- 관리자 회원 상세/운영 화면에서 HIDDEN/DELETED도 안전하게 조회 가능
-- ------------------------------------------------------------
DROP POLICY IF EXISTS comments_select_admin ON public.comments;

CREATE POLICY comments_select_admin
ON public.comments
FOR SELECT
TO authenticated
USING (public.is_active_admin());

-- ------------------------------------------------------------
-- I. 과도한 테이블 권한 제거 후 필요한 권한만 재부여
-- RLS + 컬럼 GRANT + 보호 트리거를 함께 사용합니다.
-- ------------------------------------------------------------

-- posts
REVOKE ALL ON TABLE public.posts FROM anon;
REVOKE ALL ON TABLE public.posts FROM authenticated;
GRANT SELECT ON TABLE public.posts TO anon, authenticated;
GRANT UPDATE (view_count) ON TABLE public.posts TO anon;
GRANT INSERT (user_id,category,business_type,title,content,is_anonymous,view_count,status)
  ON TABLE public.posts TO authenticated;
GRANT UPDATE (title,content,updated_at,status,view_count)
  ON TABLE public.posts TO authenticated;

-- profiles
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.profiles FROM authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (nickname,business_type,introduction)
  ON TABLE public.profiles TO authenticated;

-- reactions
REVOKE ALL ON TABLE public.reactions FROM anon;
REVOKE ALL ON TABLE public.reactions FROM authenticated;
GRANT SELECT ON TABLE public.reactions TO anon, authenticated;
GRANT INSERT (post_id,user_id,reaction_type)
  ON TABLE public.reactions TO authenticated;
GRANT DELETE ON TABLE public.reactions TO authenticated;

-- reports도 불필요한 DELETE/TRUNCATE 등이 생기지 않도록 명시적으로 최소화
REVOKE ALL ON TABLE public.reports FROM anon;
REVOKE ALL ON TABLE public.reports FROM authenticated;
GRANT SELECT ON TABLE public.reports TO authenticated;
GRANT INSERT (target_type,target_id,reporter_id,reason,detail,status)
  ON TABLE public.reports TO authenticated;
GRANT UPDATE (status) ON TABLE public.reports TO authenticated;

-- comments는 기존 동작에 필요한 권한만 유지
REVOKE ALL ON TABLE public.comments FROM anon;
REVOKE ALL ON TABLE public.comments FROM authenticated;
GRANT SELECT ON TABLE public.comments TO anon, authenticated;
GRANT INSERT (post_id,user_id,content,is_anonymous,status)
  ON TABLE public.comments TO authenticated;
GRANT UPDATE (content,status) ON TABLE public.comments TO authenticated;

COMMIT;

-- ------------------------------------------------------------
-- J. 실행 후 핵심 상태 한 번에 확인
-- ------------------------------------------------------------
WITH rls AS (
  SELECT jsonb_agg(jsonb_build_object(
    'table_name', c.relname,
    'rls_enabled', c.relrowsecurity
  ) ORDER BY c.relname) AS data
  FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public'
    AND c.relname IN ('profiles','posts','comments','reports','reactions')
), grants AS (
  SELECT jsonb_agg(jsonb_build_object(
    'table_name',table_name,
    'grantee',grantee,
    'privilege_type',privilege_type
  ) ORDER BY table_name,grantee,privilege_type) AS data
  FROM information_schema.role_table_grants
  WHERE table_schema='public'
    AND table_name IN ('profiles','posts','comments','reports','reactions')
    AND grantee IN ('anon','authenticated')
), policies AS (
  SELECT jsonb_agg(jsonb_build_object(
    'table_name',tablename,
    'policy_name',policyname,
    'cmd',cmd,
    'roles',roles,
    'qual',qual,
    'with_check',with_check
  ) ORDER BY tablename,cmd,policyname) AS data
  FROM pg_policies
  WHERE schemaname='public'
    AND tablename IN ('profiles','posts','comments','reports','reactions')
)
SELECT jsonb_pretty(jsonb_build_object(
  'rls',COALESCE((SELECT data FROM rls),'[]'::jsonb),
  'grants',COALESCE((SELECT data FROM grants),'[]'::jsonb),
  'policies',COALESCE((SELECT data FROM policies),'[]'::jsonb)
)) AS step11_rls_result;
