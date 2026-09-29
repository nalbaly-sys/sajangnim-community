/* ==================================================
   SUPABASE 설정
   ⚠️ 아래 값은 주인님의 Supabase 프로젝트 값으로 교체
================================================== */

const SUPABASE_CONFIG = {
  url:"https://djadqsfdrrihkswplzcn.supabase.co",
  anonKey:"sb_publishable_V1jgdKFkLK735lCgiOYAuw_48iMYs3V"
};


/* ==================================================
   SUPABASE 클라이언트
================================================== */

const supabaseClient = window.supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);