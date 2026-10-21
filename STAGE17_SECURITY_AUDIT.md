# Stage 17 최종 보안·개인정보 점검

기준일: 2026-10-22

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

### 익명 게시글/댓글 작성자 UUID 보호 — 완료

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

브라우저 회귀 테스트:
- 익명 게시글 목록 정상
- 익명 게시글 상세/이미지 정상
- 익명 댓글/대댓글 정상
- 댓글 공감/신고 정상

### XSS / HTML / 링크 / 이미지 렌더링 보안 — 완료

확인 및 보강:
- 일반 리치 게시글 렌더러는 DOMPurify + 게시글 전용 allowlist 사용 확인
- 익명 게시글 렌더러가 DOMPurify 기본 설정만 사용하던 차이를 보강
- `rich-content-security-hardening.js` 추가
- 익명/일반 렌더링 모두 허용 태그/속성 정책을 동일하게 강제
- 링크는 `http://`, `https://`, `mailto:`만 허용
- 링크에 `target="_blank"`, `rel="noopener noreferrer nofollow"` 강제
- 이미지는 Supabase `post-images` 공개 경로만 허용
- 외부 이미지 URL 제거
- 이미지에 `loading="lazy"`, `referrerpolicy="no-referrer"` 적용
- 허용 Quill class와 제한된 색상/배경/정렬/글자크기 스타일만 유지

DB 저장 데이터 검사:
- `<script>`, `onerror`, `onload`, `javascript:` 의심 패턴: 0건
- 외부 이미지 URL 패턴: 0건
- 비정상 링크 프로토콜 패턴: 0건

### Storage 공개 이미지 및 삭제 정책 — 완료

정책/동작:
- `post-images`는 게시글 본문 공개 이미지를 위한 public bucket으로 유지
- 업로드는 로그인 사용자의 본인 UUID 폴더만 가능
- jpg/jpeg/png/webp/gif만 허용, SVG 금지
- 장당 최대 5MB
- 삭제도 본인 UUID 폴더만 가능
- 작성 취소 시 업로드한 초안 이미지는 정리
- 게시글 편집에서 제거한 이미지는 정리
- 게시글 `DELETED`는 관리자 복구가 가능한 소프트 삭제이므로 연결 이미지는 유지
- 어떤 게시글에도 연결되지 않는 진짜 고아 이미지만 정리 대상으로 봄
- 작성 화면에 신분증·계좌번호·전화번호·주소·고객정보 등 민감정보 이미지 업로드 금지 경고 추가

실데이터 확인:
- post-images 총 객체: 3개
- ACTIVE 게시글 참조: 3개
- 어떤 게시글에도 참조되지 않는 진짜 고아 이미지: 0개

회원 탈퇴 보강:
- `delete_my_account()`는 `auth.users` 삭제 후 FK cascade로 프로필·게시글·댓글·공감·댓글공감·신고·관련 알림을 삭제함
- Storage 객체는 DB cascade 대상이 아니므로 `account-delete-storage-cleanup.js` 추가
- 탈퇴 전에 본인 `post-images/<UUID>/` 파일을 Storage API로 삭제
- Storage 삭제 실패 시 계정 삭제를 중단하여 탈퇴 후 공개 이미지가 남는 상황을 방지

### 스팸 / 도배 / 과도한 신고 방지 — 완료

DB 레벨 제한:
- 게시글: 최소 10초 간격, 10분 최대 10개
- 댓글/대댓글: 최소 2초 간격, 10분 최대 40개
- 신고: 최소 3초 간격, 1시간 최대 20개
- 제한 기록은 API 비공개 `private.rate_limit_events`에 저장
- 브라우저에서 직접 조회/조작 불가
- 사용자+행동별 PostgreSQL advisory transaction lock으로 동시 요청 우회 완화
- `supabase-step17-rate-limits.sql` 기록

검증:
- 연속 호출 테스트에서 두 번째 요청 차단 확인
- posts/comments/reports 3개 trigger 생성 확인

### 개인정보처리방침 / 이용약관 최종화 — 코드 적용 완료

확정 운영정보:
- 운영자 표시명: `사장님도 퇴근합니다`
- 개인정보/서비스 문의: `nalbaly@gmail.com`
- 시행일: `2026-10-22`
- Supabase 프로젝트 리전: 서울 `ap-northeast-2`

구현:
- `legal-docs-finalization.js` 추가
- 기존 개인정보처리방침/이용약관의 “초안”, “추후 확정” 안내를 실제 서비스 운영 기준 문구로 대체
- 회원 탈퇴 시 계정·프로필·작성 콘텐츠·반응·신고·알림·게시글 이미지 삭제 정책 반영
- Supabase, Vercel, Google/Kakao 로그인, Google AdSense 사용 내용 반영
- Google 광고 설정 및 쿠키 안내 반영
- 익명 기능의 일반 사용자 식별자 비공개 / 운영상 필요한 권한 확인 범위 명시
- 푸터에 운영자 및 문의 이메일 표시
- `final-legal-adsense-guard.js`로 과거 AdSense 준비용 “최종 확인 예정” 부록이 다시 붙는 현상 방지
- 문의 이메일은 `legal-docs-finalization.js`의 `CONTACT_EMAIL` 한 곳을 수정하면 변경 가능

상태:
- GitHub 코드 적용 완료
- Vercel 배포 후 개인정보처리방침/이용약관/푸터 브라우저 회귀 테스트 필요

## Stage 17 남은 작업

1. 익명 콘텐츠 식별자 노출 구조 수정 — 완료
2. XSS/HTML/링크/이미지 경로 재검증 — 완료
3. Storage 삭제 및 민감정보 정책 점검 — 완료
4. 스팸/남용 방지 기준 확정 — 완료
5. 개인정보처리방침/이용약관 최종화 — 코드 적용 완료, 브라우저 확인 필요
6. 실제 배포 환경 최종 회귀 테스트
7. Stage 17 완료 처리
