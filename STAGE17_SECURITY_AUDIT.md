# Stage 17 최종 보안·개인정보 점검

기준일: 2026-10-21

## 현재 확인 완료

- `public` 핵심 테이블 RLS 활성 확인
  - profiles
  - posts
  - comments
  - reactions
  - comment_reactions
  - reports
  - notifications
  - notices
  - events
- 브라우저 `config.js`에는 Supabase publishable key만 존재하고 `service_role` 키 없음
- 관리자/보안 관련 `SECURITY DEFINER` 함수의 `search_path=""` 확인
- 트리거 전용 보안 함수는 일반 authenticated 사용자에게 EXECUTE 권한이 노출되지 않음
- notifications는 본인 알림 조회 및 `is_read` 업데이트만 허용
- post-images 버킷 파일 제한 5MB 및 JPEG/PNG/WEBP/GIF MIME 제한 확인
- 게시글 리치 HTML은 DOMPurify 기반 허용 태그/속성 제한 및 외부 이미지 URL 제거 로직 사용

## 이번 단계에서 보강 완료

- Vercel 공통 보안 헤더 추가 (`vercel.json`)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 익명 게시글/댓글 작성자 UUID 보호

구현:
- `posts_public_safe` 공개 조회 View 추가
- `comments_public_safe` 공개 조회 View 추가
- 공개 View에는 `user_id`, `reply_to_user_id`를 포함하지 않음
- 본인 여부는 UUID 대신 `is_mine` boolean으로 제공
- 익명 게시글/댓글의 원본 테이블 직접 SELECT는 작성자 본인 또는 관리자만 허용하도록 RLS 보강
- 일반 게시글 목록/검색, 익명 게시글 상세, 댓글/대댓글 목록을 안전 View 기반으로 전환
- 익명 게시글 조회수 증가는 `increment_active_post_view()` RPC로 처리
- 댓글 신고 시 작성자 UUID 대신 `is_mine`으로 본인 신고 여부 판정
- `anonymous-privacy-hardening.js` 추가
- `supabase-step17-anonymous-privacy.sql` 기록

DB 검증:
- anon 역할에서 원본 `posts`의 익명 ACTIVE 행 직접 조회 결과: 0건
- anon 역할에서 `posts_public_safe` 익명 ACTIVE 행 조회 결과: 11건
- anon 역할에서 원본 `comments`의 익명 ACTIVE 행 직접 조회 결과: 0건
- anon 역할에서 `comments_public_safe` 익명 ACTIVE 행 조회 결과: 19건
- 안전 View 컬럼 목록에 `user_id`, `reply_to_user_id` 없음 확인

상태:
- DB 적용 및 SQL 검증 완료
- GitHub 코드 적용 완료
- Vercel 브라우저 회귀 테스트 필요

## 추가 보강 필요

### 1. 개인정보처리방침/이용약관 초안 상태

현재 운영문서에 초안 문구가 남아 있다.
최종 공개 전 아래 실제 운영정보를 확정해야 한다.

- 운영자 또는 사업자 표시명
- 개인정보 문의 연락처
- 계정 탈퇴 시 개인정보/작성 콘텐츠 처리 기준
- 데이터 보유기간
- Supabase/Google/Kakao 및 광고 서비스 관련 처리 내용

실제 운영자 정보는 임의로 작성하지 않는다.

### 2. Storage 공개 이미지 정책

`post-images`는 게시글 본문에 이미지를 공개 표시하기 위해 public bucket으로 운용 중이다.
업로드/삭제는 본인 UUID 폴더만 가능하지만 공개 URL을 아는 사용자는 이미지를 조회할 수 있다.

확인할 운영 원칙:
- 게시글 공개 이미지로 계속 사용할 경우 현재 방식 유지 가능
- 삭제 게시글 이미지의 정리 정책 확인
- 민감정보 이미지 업로드 금지 안내 강화

### 3. 스팸/남용 방지

현재 인증/RLS/신고 기능은 존재하나, 서비스 규모 증가 시 아래 보강을 검토한다.

- 게시글/댓글 작성 빈도 제한
- 반복 신고/도배 방지
- 비정상 트래픽 모니터링
- CAPTCHA/Turnstile 등 추가 검증 필요 여부

## Stage 17 진행 순서

1. 익명 콘텐츠 식별자 노출 구조 수정 — DB/코드 적용 완료, 브라우저 테스트 필요
2. XSS/HTML/링크/이미지 경로 재검증
3. Storage 삭제 및 민감정보 정책 점검
4. 스팸/남용 방지 기준 확정
5. 개인정보처리방침/이용약관 최종화
6. 실제 배포 환경 회귀 테스트
7. Stage 17 완료 처리
