# 사장님도 퇴근합니다

자영업 사장님들이 가게 운영 경험과 고민을 나누는 커뮤니티 프로젝트입니다.

## 프로젝트 진행 현황

- **완료:** 1~10단계
- **현재 진행:** 11단계 — 관리자 보안/RLS 하드닝
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
| 11 | 관리자 보안 | 관리자 권한 검증, RLS 정책 점검·보완, 관리자 전용 RPC·함수 검증, 서버 측 권한 경계 정리 | **진행 중 — 3차 RLS 하드닝 SQL 작성 완료** |
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
- 본인 글 수정/삭제 관련 처리
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

## 4. 관리자 전용 Supabase RPC

기존 함수:
- `admin_get_report_target`
- `admin_set_report_target_status`
- `admin_list_comments`
- `admin_list_post_comments`

페이지네이션/검색 함수:
- `admin_page_reports`
- `admin_page_posts`
- `admin_page_comments`
- `admin_unified_search`
- `admin_page_members`

관리자용 신규 RPC는 `SECURITY DEFINER`를 사용하고 함수 내부에서 다음 조건을 검사합니다.
- `auth.uid()`와 일치하는 프로필
- `role IN ('ADMIN','MODERATOR')`
- `status = 'ACTIVE'`

관리자 RPC의 `anon` 실행권한은 회수했고 `authenticated`만 실행 가능하도록 정리했습니다.

## 5. 11단계 관리자 보안

### 1차 — 관리자 함수/프로필 보안

`supabase-step11-security-hardening.sql`

주요 내용:

1. `public.is_active_admin()` 공통 관리자 판별 함수
2. `profiles.role/status` 보호 트리거
3. 관리자 RPC `PUBLIC`/`anon` 실행권한 회수
4. `SECURITY DEFINER + search_path=""` 점검

### 2차 — RLS 감사

`supabase-step11-rls-audit.sql`

감사 결과 확인된 상태:

- `comments` — RLS 활성
- `reports` — RLS 활성
- `posts` — **RLS 비활성 확인**
- `profiles` — **RLS 비활성 확인**
- `reactions` — **RLS 비활성 확인**
- `posts/profiles/reactions`에 `anon/authenticated` 과도한 테이블 권한이 존재함을 확인

### 3차 — 주요 테이블 RLS 하드닝

`supabase-step11-rls-hardening.sql`

이 SQL은 다음을 수행합니다.

1. `posts`, `profiles`, `reactions` RLS 활성화
2. `anon/authenticated`의 불필요한 `TRUNCATE/TRIGGER/REFERENCES/DELETE/UPDATE` 등 권한 회수
3. 게시글 공개 조회는 유지
4. 게시글 작성은 로그인 회원 본인 `user_id + ACTIVE`만 허용
5. 게시글 수정/소프트삭제는 작성자 본인만 허용
6. 공개 조회수 증가는 `view_count +1` 변경만 허용하고 다른 필드 변조는 DB 트리거에서 차단
7. 관리자/서비스 작업은 별도 관리자 검증으로 허용
8. 프로필은 본인 조회/본인 닉네임·업종·소개 수정만 허용
9. 관리자만 전체 프로필 조회 가능
10. 브라우저에는 `profiles.role/status` UPDATE 컬럼 권한을 주지 않음
11. 공감은 전체 조회 가능, 등록/취소는 로그인 회원 본인만 허용
12. 신고 신규 INSERT는 반드시 `reporter_id = auth.uid()` 및 `status = PENDING`으로 제한
13. 관리자에게 숨김/삭제 댓글 전체 조회 정책 추가
14. 실행 후 핵심 RLS/GRANT/POLICY 상태를 JSON으로 출력

### 11단계 완료 조건

- [ ] `profiles/posts/comments/reports/reactions` RLS 모두 활성화
- [ ] 비로그인 사용자가 게시글/댓글/반응 공개 조회 가능
- [ ] 비로그인 사용자가 게시글/프로필/반응 데이터를 임의 수정할 수 없음
- [ ] 로그인 회원이 자기 게시글 작성/수정/삭제 가능
- [ ] 로그인 회원이 다른 회원 게시글을 수정/삭제할 수 없음
- [ ] 로그인 회원이 자기 프로필 닉네임/업종/소개 수정 가능
- [ ] 로그인 회원이 `profiles.role/status` 변경 불가
- [ ] 공감 등록/취소가 본인 행에서만 가능
- [ ] 신고 INSERT가 `PENDING`만 허용
- [ ] 일반 회원이 관리자 전용 RPC 직접 호출 시 권한 오류
- [ ] 관리자 화면 신고/게시글/댓글/회원 기능 정상
- [ ] 관리자 통합검색/페이지네이션 정상
- [ ] 관리자 SECURITY DEFINER 함수에 고정 `search_path` 설정
- [ ] 관리자 RPC `anon/PUBLIC` 실행권한 없음

## 6. 보안 원칙

- Supabase anon/publishable 키는 브라우저용 공개 키입니다.
- `service_role` 키, OAuth client secret, 비밀번호 등 비밀정보를 GitHub나 `config.js`에 저장하지 않습니다.
- 관리자 메뉴가 화면에 안 보이는 것은 보안이 아닙니다. 실제 권한은 DB에서 차단해야 합니다.
- RLS 오류가 발생해도 RLS를 끄거나 전체 공개 정책을 추가하지 않습니다.
- `SECURITY DEFINER` 함수는 내부 관리자 검증과 고정 `search_path`가 필수입니다.
- 일반 회원이 자기 프로필을 수정할 수 있어도 `role/status`는 DB 레벨에서 보호합니다.
- 테이블 권한(GRANT)과 RLS 정책을 함께 최소화합니다.

## 7. 이후 보안 작업

11단계 후반에서 다음을 검토합니다.

1. 일반회원/비로그인 실제 브라우저 우회 테스트
2. 관리자 상태 변경 감사 로그
3. 회원 경고 이력 테이블 및 관리자 경고 기능
4. 관리자 강제탈퇴 서버 기능
5. 마이페이지 회원탈퇴 정책과 Auth 사용자 삭제 방식
6. 탈퇴 회원 게시글/댓글 익명 보존 여부

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
- `supabase-step11-rls-hardening.sql` — **11단계 3차 주요 테이블 RLS/최소권한 하드닝**

## 9. 기본 테스트 체크리스트

- [ ] 이메일 로그인·로그아웃
- [ ] Google 로그인
- [ ] Kakao 로그인
- [ ] 게시글 작성·조회
- [ ] 게시글 수정·삭제
- [ ] 비로그인 게시글 조회수 증가
- [ ] 댓글 작성·수정·삭제
- [ ] 공감 반응 등록·취소
- [ ] 게시글·댓글 신고
- [ ] 마이페이지 프로필 수정
- [ ] 관리자 신고/게시글/댓글/회원 관리
- [ ] 관리자 목록 페이지 이동/필터
- [ ] 관리자 통합검색
- [ ] 회원 목록 및 회원 상세
- [ ] PC·모바일 화면

## 10. GitHub 저장소

https://github.com/nalbaly-sys/sajangnim-community
