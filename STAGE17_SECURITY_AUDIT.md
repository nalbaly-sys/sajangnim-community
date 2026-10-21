# Stage 17 최종 보안·개인정보 점검

기준일: 2026-10-22

## 최종 상태

**Stage 17 완료**

로컬 회귀 테스트와 Vercel 운영 배포 테스트까지 정상 확인했다.

## 완료 항목

- `public` 핵심 테이블 RLS 활성 재확인
- 브라우저 `config.js`에 Supabase publishable key만 존재하고 `service_role` 키 없음 확인
- 관리자/보안 관련 `SECURITY DEFINER` 함수의 `search_path=""` 확인
- 트리거 전용 보안 함수의 일반 authenticated 실행 노출 차단 확인
- notifications 본인 조회/읽음 처리 권한 확인
- Vercel 공통 보안 헤더 적용
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 익명 게시글/댓글 작성자 UUID 보호 — 완료

- `posts_public_safe`, `comments_public_safe` 공개 조회 View 사용
- 공개 View에서 `user_id`, `reply_to_user_id` 제거
- 본인 여부는 `is_mine` boolean으로 제공
- 익명 콘텐츠 원본 테이블 직접 SELECT는 작성자 본인 또는 관리자만 허용하도록 RLS 보강
- 일반 게시글 목록/검색, 익명 게시글 상세, 댓글/대댓글 목록을 안전 조회 경로로 전환
- 익명 게시글 조회수는 `increment_active_post_view()` RPC 사용
- 댓글 신고는 작성자 UUID 대신 `is_mine`으로 본인 신고 여부 판정

DB 검증:
- anon 역할 원본 `posts` 익명 ACTIVE 직접 조회: 0건
- anon 역할 `posts_public_safe` 익명 ACTIVE 조회: 11건
- anon 역할 원본 `comments` 익명 ACTIVE 직접 조회: 0건
- anon 역할 `comments_public_safe` 익명 ACTIVE 조회: 19건
- 안전 View 컬럼에 `user_id`, `reply_to_user_id` 없음 확인

브라우저 검증:
- 익명 게시글 목록/상세/이미지 정상
- 익명 댓글/대댓글 정상
- 댓글 공감/신고 정상

### XSS / HTML / 링크 / 이미지 렌더링 보안 — 완료

- DOMPurify 기반 허용 태그/속성 제한
- 익명/일반 게시글 렌더링 정책 통일
- 링크는 `http://`, `https://`, `mailto:`만 허용
- 링크에 `target="_blank"`, `rel="noopener noreferrer nofollow"` 강제
- 이미지는 Supabase `post-images` 공개 경로만 허용
- 외부 이미지 URL 제거
- 이미지 `loading="lazy"`, `referrerpolicy="no-referrer"`
- 허용 Quill class와 제한된 색상/배경/정렬/글자크기만 유지

DB 저장 데이터 검사:
- `<script>`, `onerror`, `onload`, `javascript:` 의심 패턴: 0건
- 외부 이미지 URL 패턴: 0건
- 비정상 링크 프로토콜 패턴: 0건

### Storage 공개 이미지 및 삭제 정책 — 완료

- `post-images` public bucket 유지
- 로그인 사용자 본인 UUID 폴더만 업로드/삭제 가능
- jpg/jpeg/png/webp/gif만 허용, SVG 금지
- 장당 최대 5MB
- 작성 취소 시 초안 이미지 정리
- 게시글 편집에서 제거한 이미지 정리
- `DELETED` 게시글은 복구 가능성을 위해 연결 이미지 유지
- 진짜 고아 이미지만 정리 대상으로 운영
- 작성 화면에 민감정보 이미지 업로드 금지 경고 추가

실데이터 확인:
- post-images 총 객체: 3개
- ACTIVE 게시글 참조: 3개
- 진짜 고아 이미지: 0개

회원 탈퇴:
- Storage 본인 이미지 선삭제
- Storage 삭제 실패 시 계정 삭제 중단
- 이후 `delete_my_account()`로 Auth 계정 및 FK cascade 데이터 삭제

### 스팸 / 도배 / 과도한 신고 방지 — 완료

DB 레벨 제한:
- 게시글: 최소 10초 간격, 10분 최대 10개
- 댓글/대댓글: 최소 2초 간격, 10분 최대 40개
- 신고: 최소 3초 간격, 1시간 최대 20개
- 제한 기록은 `private.rate_limit_events`에 저장
- 사용자+행동별 PostgreSQL advisory transaction lock 적용
- `supabase-step17-rate-limits.sql` 기록

검증:
- 연속 호출 두 번째 요청 차단 확인
- posts/comments/reports rate limit trigger 생성 확인

### 개인정보처리방침 / 이용약관 최종화 — 완료

확정 운영정보:
- 운영자 표시명: `사장님도 퇴근합니다`
- 개인정보/서비스 문의: `nalbaly@gmail.com`
- 시행일: `2026-10-22`
- Supabase 프로젝트 리전: 서울 `ap-northeast-2`

구현:
- 기존 초안 문구를 실제 운영 기준 최종 문서로 교체
- 회원 탈퇴 시 계정·프로필·작성 콘텐츠·반응·신고·알림·게시글 이미지 삭제 정책 반영
- Supabase, Vercel, Google/Kakao 로그인, Google AdSense 및 쿠키 안내 반영
- 익명 기능 일반 사용자 식별자 비공개 원칙 명시
- 푸터 운영자 및 문의 이메일 표시
- 공용 `#operatingDocModal` 구조에 맞춰 `openOperatingDoc()` 최종 문서 경로로 오버라이드
- `광고·쿠키 안내`는 개인정보처리방침 최종본을 안정적으로 열도록 수정

브라우저 검증:
- 개인정보처리방침 최종본 정상
- 이용약관 최종본 정상
- 초안 문구 제거 확인
- 광고·쿠키 안내 정상
- 이용규칙/이용약관을 거친 뒤에도 광고·쿠키 안내 정상
- 푸터 운영자/문의 이메일 정상

## 최종 회귀 테스트

로컬 `http://localhost:3000/`:
- 정상 작동 확인

Vercel 운영 배포 `https://sajangnim-community.vercel.app/`:
- 최신 배포 반영 확인
- 운영 환경에서 주요 Stage 17 기능 정상 작동 확인

## 결론

Stage 17 최종 보안·개인정보 점검 완료.

프로젝트 로드맵 **1~17단계 전체 완료**.