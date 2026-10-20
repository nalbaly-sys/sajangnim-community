-- 관리자 회원목록 100명 페이지네이션 + 역할/상태/업종/닉네임·ID 검색
-- Supabase SQL Editor에서 전체 실행

CREATE OR REPLACE FUNCTION public.admin_page_members(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 100,
  p_role text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_business_type text DEFAULT NULL,
  p_query text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_page integer := GREATEST(COALESCE(p_page,1),1);
  v_size integer := LEAST(GREATEST(COALESCE(p_page_size,100),1),100);
  v_offset integer;
  v_total bigint;
  v_rows jsonb;
  q text := trim(COALESCE(p_query,''));
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
  FROM public.profiles p
  WHERE (p_role IS NULL OR upper(p_role)='ALL' OR p.role=upper(p_role))
    AND (p_status IS NULL OR upper(p_status)='ALL' OR p.status=upper(p_status))
    AND (p_business_type IS NULL OR p_business_type='' OR upper(p_business_type)='ALL' OR p.business_type=p_business_type)
    AND (
      q=''
      OR COALESCE(p.nickname,'') ILIKE '%'||q||'%'
      OR p.id::text ILIKE '%'||q||'%'
    );

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.nickname NULLS LAST, x.id), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT p.id,p.nickname,p.business_type,p.role,p.status
    FROM public.profiles p
    WHERE (p_role IS NULL OR upper(p_role)='ALL' OR p.role=upper(p_role))
      AND (p_status IS NULL OR upper(p_status)='ALL' OR p.status=upper(p_status))
      AND (p_business_type IS NULL OR p_business_type='' OR upper(p_business_type)='ALL' OR p.business_type=p_business_type)
      AND (
        q=''
        OR COALESCE(p.nickname,'') ILIKE '%'||q||'%'
        OR p.id::text ILIKE '%'||q||'%'
      )
    ORDER BY p.nickname NULLS LAST, p.id
    OFFSET v_offset LIMIT v_size
  ) x;

  RETURN jsonb_build_object('page',v_page,'page_size',v_size,'total',v_total,'rows',v_rows);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_page_members(integer,integer,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_page_members(integer,integer,text,text,text,text) TO authenticated;
