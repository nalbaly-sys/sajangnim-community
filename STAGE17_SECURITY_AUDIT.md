# Stage 17 최종 보안·개인정보 점검

기준일: 2026-10-22

## 현재 상태

- 코드/DB 보강: 완료
- 로컬 브라우저 회귀 테스트: 완료
- Vercel 운영 배포 최종 확인: 대기
- Stage 17 최종 완료 조건: 운영 URL에서 최신 배포 반영 후 동일 회귀 테스트 통과

## 1. 익명 게시글/댓글 작성자 UUID 보호 — 완료

- `posts_public_safe`, `comments_public_safe` 공개 조회 View 사용
- 공개 View에서 `user_id`, `reply_to_user_id` 제거
- 본인 여부는 `is_mine` boolean으로 제공
- 익명 원본 행 직접 SELECT는 작성자 본인/관리자만 허용
- 일반 게시글 목록/검색, 익명 게시글 상세, 댓글/대댓글을 안전 조회 경로로 전환
- 익명 게시글 조회수는 `increment_active_post_view()` RPC 사용
- 댓글 신고는 UUID 대신 `is_mine` 기준

검증:
- anon 원본 익명 게시글 직접 조회 0건
- 안전 View 익명 게시글 조회 정상
- anon 원본 익명 댓글 직접 조회 0건
- 안전 View 익명 댓글 조회 정상
- 브라우저에서 익명 게시글/상세/이미지/댓글/대댓글/공감/신고 정상

## 2. XSS / HTML / 링크 / 이미지 렌더링 보안 — 완료

- DOMPurify 기반 allowlist 유지
- 외부 이미지 제거
- Supabase `post-images` 공개 경로 이미지만 허용
- 링크는 http/https/mailto만 허용
- `noopener noreferrer nofollow` 적용
- 저장 데이터에서 script/onerror/onload/javascript 의심 패턴 0건 확인
- 외부 이미지/비정상 링크 패턴 0건 확인

## 3. Storage 공개 이미지 및 삭제 정책 — 완료

- `post-images` public bucket 유지
- 본인 UUID 폴더 업로드/삭제만 허용
- JPG/JPEG/PNG/WEBP/GIF만 허용, SVG 제외
- 장당 최대 5MB
- 작성 취소/편집 제거 이미지 정리
- `DELETED` 게시글은 복구 가능성을 위해 연결 이미지 유지
- 실제 Storage 객체 3개 모두 게시글에서 사용 중, 진짜 고아 이미지 0개
- 작성 화면에 민감정보 이미지 업로드 금지 안내 추가
- 회원 탈퇴 전 본인 Storage 이미지 삭제 후 계정 삭제하도록 보강

## 4. 스팸 / 도배 / 과도한 신고 방지 — 완료

DB 레벨 제한:
- 게시글: 최소 10초 간격, 10분 최대 10개
- 댓글/대댓글: 최소 2초 간격, 10분 최대 40개
- 신고: 최소 3초 간격, 1시간 최대 20개
- `private.rate_limit_events` 사용
- 사용자+행동별 advisory transaction lock 사용
- posts/comments/reports trigger 생성 및 연속 요청 차단 테스트 완료

## 5. 개인정보처리방침 / 이용약관 최종화 — 완료

확정 운영정보:
- 운영자 표시명: `사장님도 퇴근합니다`
- 개인정보/서비스 문의: `nalbaly@gmail.com`
- 시행일: `2026-10-22`
- Supabase 프로젝트 리전: 서울 `ap-northeast-2`

최종 구현:
- 공유 모달 구조를 확인한 뒤 `openOperatingDoc()` 자체를 최종 문서 경로로 override
- `privacy`는 항상 최종 개인정보처리방침 표시
- `terms`는 항상 최종 이용약관 표시
- `rules`는 기존 이용규칙 유지
- `광고·쿠키 안내`는 항상 최종 개인정보처리방침을 직접 열도록 고정
- 푸터에 운영자/문의 이메일 표시
- 과거 AdSense 준비용 초안 부록 재삽입 차단

로컬 브라우저 회귀 테스트 결과:
1. 첫 화면 멈춤 없음 — 정상
2. 개인정보처리방침 클릭 — 정상
3. 닫기 — 정상
4. 이용약관 클릭 — 정상
5. 광고·쿠키 안내 — 정상
6. 푸터 운영자/이메일 — 정상
7. 개인정보처리방침/이용약관 초안 문구 제거 — 정상
8. 이용규칙 후 광고·쿠키 안내 — 정상
9. 이용약관 후 광고·쿠키 안내 — 정상

## 6. Vercel 보안 헤더 — 코드 적용 완료

`vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Stage 17 완료 판정

현재 **코드/DB/로컬 회귀 테스트는 모두 완료**되었습니다.

남은 마지막 확인은 Vercel 운영 URL `https://sajangnim-community.vercel.app/`에 최신 `main` 배포가 반영된 뒤, 로컬에서 통과한 운영문서/기본 기능 회귀 테스트를 운영 환경에서도 확인하는 것입니다.

운영 배포 확인 후 이상 없으면 Stage 17 및 전체 1~17단계를 최종 완료 처리합니다.
