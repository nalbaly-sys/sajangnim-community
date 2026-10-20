-- ============================================================
-- STEP 11 관리자 보안 1차 하드닝
-- 목적
-- 1) 일반 회원이 profiles.role / profiles.status 를 직접 바꾸는 우회 차단
-- 2) 관리자 판별 공통 함수 제공
-- 3) 관리자용 함수 실행권한 정리 (anon 명시적 차단)
-- 4) 현재 RLS / 정책 / 함수 보안상태 점검
--
-- Supabase SQL Editor에서 전체 실행하세요.
-- ============================================================

-- ------------------------------------------------------------
-- 1. 공통 관리자 판별 함수
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('ADMIN','MODERATOR')
      AND p.status = 'ACTIVE'
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated;

-- ------------------------------------------------------------
-- 2. profiles.role / status 보호 트리거
-- 일반 회원은 닉네임/업종/소개 등 자기 프로필 필드를 수정할 수 있어도
-- role/status 변경은 거부됩니다.
-- 관리자/운영자 ACTIVE 계정만 role/status 변경을 통과할 수 있습니다.
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

DROP TRIGGER IF EXISTS trg_protect_profile_security_fields
ON public.profiles;

CREATE TRIGGER trg_protect_profile_security_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_security_fields();

-- ------------------------------------------------------------
-- 3. 현재까지 사용하는 관리자 RPC 실행권한 재정리
-- PUBLIC뿐 아니라 Supabase에서 남아 있을 수 있는 anon 직접 권한도 명시적으로 회수합니다.
-- 존재하는 함수만 처리합니다.
-- ------------------------------------------------------------
DO $$
DECLARE
  f regprocedure;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'admin_get_report_target',
        'admin_set_report_target_status',
        'admin_list_comments',
        'admin_list_post_comments',
        'admin_page_reports',
        'admin_page_posts',
        'admin_page_comments',
        'admin_page_members',
        'admin_unified_search'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;
END;
$$;

-- ------------------------------------------------------------
-- 4. 중요 테이블에서 RLS가 켜져 있는지 확인
-- 결과의 rls_enabled가 모두 true인지 확인합니다.
-- ------------------------------------------------------------
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles','posts','comments','reports','reactions')
ORDER BY c.relname;

-- ------------------------------------------------------------
-- 5. 현재 RLS 정책 목록
-- 정책명이 아니라 qual / with_check 내용을 확인하는 것이 중요합니다.
-- ------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles','posts','comments','reports','reactions')
ORDER BY tablename, cmd, policyname;

-- ------------------------------------------------------------
-- 6. 관리자 함수 SECURITY DEFINER / search_path / ACL 점검
-- 정상 기대값:
-- - prosecdef = true
-- - config = {search_path=""}
-- - 관리자 RPC acl에는 authenticated=X 가 있고 anon=X 는 없어야 함
-- - protect_profile_security_fields는 anon/authenticated 직접 실행권한이 없어야 함
-- ------------------------------------------------------------
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  p.proconfig AS config,
  p.proacl AS acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_active_admin',
    'protect_profile_security_fields',
    'admin_get_report_target',
    'admin_set_report_target_status',
    'admin_list_comments',
    'admin_list_post_comments',
    'admin_page_reports',
    'admin_page_posts',
    'admin_page_comments',
    'admin_page_members',
    'admin_unified_search'
  )
ORDER BY p.proname;
