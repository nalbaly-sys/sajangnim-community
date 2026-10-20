# 사장님도 퇴근합니다

자영업 사장님들이 가게 운영 경험과 고민을 나누는 커뮤니티 프로젝트입니다.

## 프로젝트 진행 현황

- **완료:** 1~11단계
- **다음 작업:** 게시글 본문 수정 UI + 페이지네이션 정리
- **작업 원칙:** 실제 코드와 Supabase 동작을 확인한 뒤 한 단계씩 진행합니다. 기존 기능과 디자인을 불필요하게 깨뜨리지 않고, 구현 후 실제 사용자 테스트를 거쳐 완료 처리합니다.

## 전체 작업 순서 (1~17단계)

| 단계 | 작업 | 주요 내용 | 진행 상태 |
|---|---|---|---|
| 1 | 회원 시스템 | 이메일 회원가입·로그인·로그아웃, 이메일 인증, Google·Kakao 로그인, Supabase Auth, 프로필·닉네임·업종, 로그인 상태 유지 | 완료 |
| 2 | 기본 게시글 | 게시글 작성·목록·상세, 조회수, 카테고리·업종, 익명 작성, 본인 글 삭제, 삭제 상태 처리 | 완료 |
| 3 | 댓글 | 댓글 작성·목록 갱신, 익명 댓글, 본인 댓글 수정·삭제, 작성자 확인, 삭제 댓글 처리 | 완료 |
| 4 | 공감 반응 | ❤️ 😂 😭 😡 💪 반응, 등록·취소, 중복 방지, 반응 수와 내 반응 표시 | 완료 |
| 5 | 신고 | 회원용 신고 기능, 신고 사유 선택, 중복 신고 방지, 신고 데이터 저장 | 완료 |
| 6 | 검색 | 제목·본문·카테고리·업종 기준 검색 | 완료 |
| 7 | 게시판·카테고리 | 오늘의 고충, 웃픈 장사썰, 사장님 하소연, 장사 노하우, 사장님 위로, 자유게시판 및 업종별 하위 분류 | 완료 |
| 8 | 회원 마이페이지 | 프로필·닉네임·업종 수정, 내 게시글·댓글·공감한 글, 계정 관련 기능 | 완료 |
| 9 | PC·모바일 UI 다듬기 | 화면 크기별 레이아웃, 버튼·입력창·모달·게시글·댓글 가독성, 모바일 사용성 점검 | 완료 |
| 10 | 관리자 시스템 | 신고·게시글·댓글·회원 관리, 관리자 통합검색, 상태 한글화, 숨김·삭제·복구, 원문 즉시 조치, 회원 활동 상세 | 완료 |
| 11 | 관리자 보안 | 관리자 권한 검증, 핵심 테이블 RLS, 최소 권한, 관리자 RPC/함수 검증, 일반회원 우회 테스트 | **완료** |
| 12 | 공지·운영 페이지 | 공지사항, 상단 고정, 이벤트, 이용규칙, 개인정보처리방침, 이용약관 | 예정 |
| 13 | 알림 | 댓글·공감 등 주요 활동 알림과 읽음 상태 | 예정 |
| 14 | 이미지 업로드 | Supabase Storage 연동, 파일 형식·용량 제한, 업로드 권한 및 보안 처리 | 예정 |
| 15 | SEO | 페이지 제목·설명, 공유 미리보기, 검색엔진 노출에 필요한 기본 설정 | 예정 |
| 16 | AdSense | 광고 정책 및 콘텐츠 요건 점검, 광고 위치·코드 적용, 승인 준비 | 예정 |
| 17 | 최종 보안·개인정보 점검 | RLS·API 키·관리자 권한·스토리지·XSS·스팸 방지·개인정보처리방침 등 최종 확인 | 예정 |

## 1. 실행

```bat
cd D:\sajangnim-community
git pull origin main
py -m http.server 3000
```

브라우저: **http://localhost:3000**

수정 후에는 `git pull origin main` 후 브라우저에서 `Ctrl + F5`로 강력 새로고침합니다.

> Git 충돌이 발생하면 임의로 `git reset --hard`를 실행하지 말고 `git status`와 오류 메시지를 먼저 확인합니다.

## 2. 현재 주요 기능

### 회원
- 이메일 회원가입·로그인·로그아웃
- Google OAuth 로그인
- Kakao OAuth 로그인
- 프로필, 닉네임, 업종
- 마이페이지
- 내 게시글·댓글·공감 활동

### 게시글
- 작성·목록·상세
- 카테고리·업종
- 익명 작성
- 조회수
- 마이페이지에서 본인 글 수정 가능
- **게시글 본문 상세의 작성자용 수정 버튼은 아직 없음 — 다음 작업에서 추가**
- 상태: `ACTIVE / HIDDEN / DELETED`

### 댓글
- 작성·수정·삭제
- 익명 댓글
- 신고
- 관리자 숨김·삭제·복구
- 상태: `ACTIVE / HIDDEN / DELETED`

### 공감
- ❤️ 공감
- 😂 웃김
- 😭 나도 겪음
- 😡 열받음
- 💪 힘내세요

### 신고
- 게시글 신고
- 댓글 신고
- 중복 신고 방지
- 신고 상태: `PENDING / REJECTED / RESOLVED`
- 관리자 화면에서는 `접수중 / 기각 / 처리완료` 한글 표시
- 신고 대상 상태와 신고 처리 상태를 구분 표시

## 3. 관리자 시스템 — 10단계 완료

현재 구현:
- 관리자 대시보드
- 신고/게시글/댓글/회원 관리
- 관리자 통합검색
- 상태 한글화 및 색상 배지
- 신고 대상 원문 확인
- 게시글/댓글 상세 즉시 숨김·삭제·복구
- 회원 활동 상세
- 신고/게시글/댓글 100건 페이지네이션
- 회원 100명 페이지네이션
- 역할/상태/업종 필터 및 회원 검색
- 서버 전체 통합검색

> **다음 페이지네이션 정리에서 관리자 신고/게시글/댓글/회원 목록을 페이지당 20개로 변경 예정.**

## 4. 관리자 전용 Supabase RPC

- `admin_get_report_target`
- `admin_set_report_target_status`
- `admin_list_comments`
- `admin_list_post_comments`
- `admin_page_reports`
- `admin_page_posts`
- `admin_page_comments`
- `admin_unified_search`
- `admin_page_members`

관리자용 RPC는 `SECURITY DEFINER`를 사용하고 함수 내부에서 `auth.uid()`, 관리자/운영자 역할, ACTIVE 상태를 검사합니다. 관리자 RPC의 `anon` 실행권한은 회수했고 브라우저 일반회원이 호출해도 함수 내부 관리자 검증에서 차단됩니다.

## 5. 11단계 관리자 보안 — 완료

### 1차 — 관리자 함수/프로필 보안

`supabase-step11-security-hardening.sql`

- `public.is_active_admin()` 공통 관리자 판별 함수
- `profiles.role/status` 보호 트리거
- 관리자 RPC `PUBLIC/anon` 실행권한 회수
- `SECURITY DEFINER + search_path=""` 확인

### 2차 — RLS 감사

`supabase-step11-rls-audit.sql`

감사에서 `posts`, `profiles`, `reactions`의 RLS가 비활성이고 `anon/authenticated`에 과도한 테이블 권한이 있음을 확인했습니다.

### 3차 — 주요 테이블 RLS 하드닝

`supabase-step11-rls-hardening.sql`

- `profiles/posts/comments/reports/reactions` 핵심 5개 테이블 RLS 활성 확인
- `posts/profiles/reactions` 최소 권한 적용
- 게시글 공개 조회 유지
- 게시글 작성은 로그인 회원 본인 `user_id + ACTIVE`만 허용
- 게시글 수정/소프트삭제는 DB 보호 트리거로 작성자 권한 검증
- 공개 조회수는 `view_count +1` 변경만 허용
- 프로필은 본인 닉네임·업종·소개 수정만 허용
- 브라우저에서 `profiles.role/status` 직접 변경 차단
- 공감은 공개 조회, 등록/취소는 로그인 회원 본인만 허용
- 신고 INSERT는 본인 `reporter_id + PENDING`으로 제한
- 관리자 숨김/삭제 데이터 조회는 관리자 검증을 거침

### 실제 검증 완료

- 핵심 5개 테이블 RLS 모두 `true` 확인
- 비로그인/일반회원/관리자 기존 사이트 기능 정상 확인
- 일반회원이 자신의 `profiles.role`을 `ADMIN`으로 직접 변경 시도 → **HTTP 403 차단 확인**
- 일반회원이 `admin_page_members` 관리자 RPC 직접 호출 시도 → **HTTP 403 차단 확인**
- 관리자 RPC `anon` 실행권한 없음 확인
- 관리자 함수 `SECURITY DEFINER + search_path=""` 확인
- `config.js`에는 브라우저용 publishable/anon 키만 있고 `service_role` 키는 두지 않음

## 6. 보안 원칙

- Supabase anon/publishable 키는 브라우저용 공개 키입니다.
- `service_role` 키, OAuth client secret, 비밀번호 등 비밀정보를 GitHub나 `config.js`에 저장하지 않습니다.
- 관리자 메뉴가 화면에 안 보이는 것은 보안이 아닙니다. 실제 권한은 DB에서 차단해야 합니다.
- RLS 오류가 발생해도 RLS를 끄거나 전체 공개 정책을 추가하지 않습니다.
- `SECURITY DEFINER` 함수는 내부 관리자 검증과 고정 `search_path`가 필수입니다.
- 일반 회원이 자기 프로필을 수정할 수 있어도 `role/status`는 DB 레벨에서 보호합니다.
- 테이블 권한(GRANT)과 RLS 정책을 함께 최소화합니다.

## 7. 11단계 다음 작업 순서

1. **게시글 본문 상세에 본인 작성글 `수정` 버튼 추가**
2. **마이페이지 `내가 작성한 게시글` 페이지당 5개 페이지네이션**
3. **마이페이지 `내가 작성한 댓글` 페이지당 5개 페이지네이션**
4. **관리자 회원목록 → 회원선택 → 회원정보에서 최근 게시글 5개 표시**
5. **관리자 회원목록 → 회원선택 → 회원정보에서 최근 댓글 5개 표시**
6. **관리자 신고/게시글/댓글/회원 페이지네이션을 페이지당 20개로 조정**

추후 별도 보안/회원관리 작업:
- 관리자 상태 변경 감사 로그
- 회원 경고 이력
- 관리자 강제탈퇴 서버 기능
- 마이페이지 회원탈퇴 및 Auth 사용자 삭제
- 탈퇴 회원 게시글/댓글 보존·익명화 정책

## 8. 프로젝트 파일

- `index.html` — 페이지 구조
- `style.css` — 전체 UI 스타일
- `app.js` — 회원·게시글·댓글·공감·신고·관리자 기본 기능
- `config.js` — Supabase 클라이언트 설정 및 관리자 보완 스크립트 로드
- `admin-comment-fix.js` — 관리자 신고/댓글 조회 및 통합검색 보완
- `admin-ui-actions.js` — 관리자 상태 한글화·색상 및 상세 즉시 조치 UI
- `admin-member-detail-fix.js` — 회원 상세 역할/상태 한글화
- `admin-pagination-search.js` — 신고/게시글/댓글 페이지네이션 및 서버 전체검색
- `admin-members-pagination.js` — 회원 페이지네이션 및 필터/검색
- `supabase-admin-pagination-search.sql` — 신고/게시글/댓글/전체검색 관리자 RPC
- `supabase-admin-members-pagination.sql` — 회원목록 관리자 RPC
- `supabase-step11-security-hardening.sql` — 11단계 1차 관리자 함수/프로필 보안
- `supabase-step11-rls-audit.sql` — 11단계 2차 RLS/GRANT/정책 감사
- `supabase-step11-rls-hardening.sql` — 11단계 3차 주요 테이블 RLS/최소권한 하드닝

## 9. 기본 테스트 체크리스트

- [x] 게시글 작성·조회
- [x] 비로그인 게시글 조회수 증가
- [x] 댓글 작성·수정·삭제
- [x] 공감 반응 등록·취소
- [x] 게시글·댓글 신고
- [x] 마이페이지 프로필 수정
- [x] 관리자 신고/게시글/댓글/회원 관리
- [x] 관리자 통합검색/페이지네이션
- [x] 일반회원 role 직접 변경 차단
- [x] 일반회원 관리자 RPC 직접 호출 차단

## 10. GitHub 저장소

https://github.com/nalbaly-sys/sajangnim-community
