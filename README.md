# 사장님도 퇴근합니다

자영업 사장님들이 가게 운영 경험과 고민을 나누는 커뮤니티 프로젝트입니다.

## 프로젝트 진행 현황

- **완료:** 1~16단계
- **진행 중:** 17단계 — 최종 보안·개인정보 점검
- **16단계 완료:** AdSense 사이트 소유권 확인, `ads.txt` 적용, 광고·쿠키/UGC 정책 보완, Google AdSense 사이트 승인 확인
- **다음 단계:** 17단계 최종 보안·개인정보 점검 및 배포 환경 회귀 테스트
- **작업 원칙:** 실제 코드와 Supabase 동작을 확인한 뒤 한 단계씩 진행합니다. 기존 기능과 디자인을 불필요하게 깨뜨리지 않고, 구현 후 실제 사용자 테스트를 거쳐 완료 처리합니다.

## 전체 작업 순서 (1~17단계)

| 단계 | 작업 | 주요 내용 | 진행 상태 |
|---|---|---|---|
| 1 | 회원 시스템 | 이메일 회원가입·로그인·로그아웃, 이메일 인증, Google·Kakao 로그인, Supabase Auth, 프로필·닉네임·업종, 로그인 상태 유지 | 완료 |
| 2 | 기본 게시글 | 게시글 작성·목록·상세, 조회수, 카테고리·업종, 익명 작성, 본인 글 삭제, 삭제 상태 처리 | 완료 |
| 3 | 댓글 | 댓글 작성·목록 갱신, 익명 댓글·대댓글, 관리자 익명 댓글·대댓글, 본인 댓글 수정·삭제 | 완료 |
| 4 | 공감 반응 | ❤️ 😂 😭 😡 💪 반응, 등록·취소, 중복 방지, 반응 수와 내 반응 표시 | 완료 |
| 5 | 신고 | 회원용 신고 기능, 신고 사유 선택, 중복 신고 방지, 신고 데이터 저장 | 완료 |
| 6 | 검색 | 제목·본문·카테고리·업종 기준 검색 | 완료 |
| 7 | 게시판·카테고리 | 카테고리 및 업종별 하위 분류 | 완료 |
| 8 | 회원 마이페이지 | 프로필·닉네임·업종 수정, 내 게시글·댓글·공감한 글 | 완료 |
| 9 | PC·모바일 UI | 반응형 레이아웃 및 모바일 사용성 | 완료 |
| 10 | 관리자 시스템 | 신고·게시글·댓글·회원 관리, 통합검색, 숨김·삭제·복구 | 완료 |
| 11 | 관리자 보안 | RLS, 최소 권한, 관리자 RPC 검증, 일반회원 우회 차단 | 완료 |
| 12 | 공지·운영 페이지 | 공지사항, 이벤트, 이용규칙, 개인정보처리방침, 이용약관 | 완료 |
| 13 | 알림 | 댓글·대댓글·공감 알림, 읽음/안읽음, 배지, 모두 읽음, 원문 이동, RLS | 완료 |
| 14 | 이미지 업로드 + 편집기 | Storage, 이미지 보안, 리치 텍스트, 이모지, 서식, sticky 툴바, 댓글 이모지 | 완료 |
| 15 | SEO | 페이지 제목·설명, 공유 미리보기, robots, canonical, sitemap, 검색엔진 기본 설정 | **완료** |
| 16 | AdSense | 광고 정책 및 콘텐츠 요건 점검, `ads.txt`, 광고·쿠키/UGC 정책, 사이트 승인 | **완료** |
| 17 | 최종 보안·개인정보 점검 | RLS·API 키·관리자 권한·스토리지·XSS·스팸·개인정보처리방침 최종 확인 | **진행 중** |

## 운영 주소

- Vercel 운영 URL: `https://sajangnim-community.vercel.app/`
- Supabase Auth Site URL/Redirect URL에 Vercel 운영 주소 등록
- 이메일 로그인 정상
- Google OAuth 로그인 정상
- Kakao OAuth 로그인 정상
- 게시글/댓글/대댓글/이미지/수정 기능 실제 배포 환경에서 정상 확인
- Google AdSense 사이트 승인 확인: 2026-10-21

## 실행

```bat
cd D:\sajangnim-community
git pull origin main
py -m http.server 3000
```

브라우저: **http://localhost:3000**

수정 후에는 `git pull origin main` 후 브라우저에서 `Ctrl + F5`로 강력 새로고침합니다.

> Git 충돌이 발생하면 임의로 `git reset --hard`를 실행하지 말고 `git status`와 오류 메시지를 먼저 확인합니다.

## 현재 주요 기능

### 회원/마이페이지
- 이메일, Google, Kakao 로그인
- 프로필 닉네임·업종·소개 수정
- 내가 작성한 게시글/댓글 페이지네이션
- 내가 공감한 글 확인

### 게시글/댓글
- 게시글 작성·상세·수정·삭제
- 익명 게시글/댓글/대댓글
- 댓글 수정·삭제 및 대댓글
- 게시글/댓글 공감
- 신고
- 검색 및 카테고리/업종 필터

### 관리자
- 신고/게시글/댓글/회원 관리
- 관리자 통합검색
- 숨김·삭제·복구
- 원문 위치 이동
- 댓글·대댓글 수정/답글
- 관리자 익명 대댓글
- 공지/이벤트 관리

## 11단계 관리자 보안 — 완료

- `profiles/posts/comments/reports/reactions` 핵심 테이블 RLS 활성
- 브라우저에서 `profiles.role/status` 직접 변경 차단
- 본인 데이터만 수정 가능한 최소 권한 적용
- 관리자 함수 `SECURITY DEFINER + search_path=""` 검증
- 일반회원 관리자 RPC 우회 테스트 차단 확인
- `config.js`에는 브라우저용 publishable 키만 사용하고 `service_role` 키는 두지 않음

## 12단계 공지·운영 페이지 — 완료

- `notices`, `events` 테이블 및 RLS
- 운영센터/공지/이벤트 UI
- 관리자 공지·이벤트 작성·수정·삭제
- 이용규칙/개인정보처리방침/이용약관 운영 초안

> 개인정보처리방침과 이용약관은 실제 서비스 공개 전 운영자 정보, 문의 연락처, 보유기간, OAuth/Supabase 처리 구조를 17단계에서 다시 점검합니다.

## 13단계 알림 — 완료

### 데이터/보안
- `notifications` 테이블
- 자기 알림만 조회 가능
- 자기 알림의 `is_read`만 변경 가능
- 댓글/대댓글/게시글 공감 INSERT 시 DB 트리거 자동 알림
- 자기 활동 알림 제외
- 중복 알림 방지

### UI
- 상단 🔔 알림 버튼
- 읽지 않은 개수 배지
- 최근 알림 목록
- 댓글/대댓글/공감 알림
- 모두 읽음
- 원문 이동

### 검증
- 일반회원 댓글/공감 알림 정상
- 관리자 댓글/대댓글 알림 정상
- 관리자 신규 공감 알림 트리거 정상
- 관리자/일반회원 모두 읽음 정상
- 알림 RLS 및 롤백 테스트 완료

> 13단계 도입 전에 이미 존재하던 과거 공감은 새 알림으로 소급 생성하지 않습니다.

## 14단계 이미지 업로드 + 게시글 편집기 — 완료

### Supabase Storage
- `posts.content_html` 추가
- `post-images` Storage bucket
- 이미지 한 장당 최대 5MB
- JPG/JPEG/PNG/WEBP/GIF 허용, SVG 제외
- 로그인 사용자는 본인 UUID 폴더에만 업로드/삭제 가능

### 리치 텍스트 편집기
- Quill 2.0.3
- DOMPurify 3.4.16
- 굵게/기울임/밑줄/취소선/H2/H3/목록/인용/링크/이미지
- 부분 글자 크기/글자색/배경색/정렬
- 제목/본문/댓글/대댓글/관리자 수정 이모지
- 긴 글에서 sticky 툴바
- 수정 상태 및 이모지 버튼 중복 문제 수정

### 실제 사용자 확인 완료
- 리치 편집기 정상
- 제목/본문/댓글/대댓글/관리자 수정 이모지 정상
- sticky 편집 툴바 정상
- 수정 상태 잔존 및 이모지 버튼 중복 문제 수정 확인

## 15단계 SEO — 완료

`seo.js`

- 기본 title/description
- 게시글 상세 진입 시 브라우저 탭 제목 및 description 갱신
- Open Graph 기본 메타
- Twitter/X 카드 기본 메타
- canonical URL을 Vercel 운영주소 기준으로 설정

`robots.txt`

```text
User-agent: *
Allow: /

Sitemap: https://sajangnim-community.vercel.app/sitemap.xml
```

`sitemap.xml`

- 운영 홈 URL 등록
- 실제 Vercel 배포에서 XML 정상 표시 확인

### 실제 배포 검증
- 메인 화면 정상
- Supabase 게시글 목록 정상
- 게시글 상세/댓글/대댓글/이미지 정상
- 일반 로그인 정상
- Google 로그인 정상
- Kakao 로그인 정상
- `robots.txt` 정상
- `sitemap.xml` 정상

## 16단계 AdSense — 완료

- 운영 주소 `sajangnim-community.vercel.app` 등록
- Publisher ID `ca-pub-4440430005819024`
- 루트 `ads.txt` 적용
- AdSense 사이트 소유권 확인 성공
- 개인정보처리방침 광고·쿠키 안내 보완
- 이용규칙 UGC/광고 정책 위험 콘텐츠 안내 보완
- 이용약관 광고 관련 조항 보완
- Google AdSense 사이트 상태 승인 확인: 2026-10-21

## 17단계 최종 보안·개인정보 점검 — 진행 중

현재 확인/진행 항목:
- 핵심 public 테이블 RLS 활성 재확인
- browser config에 `service_role` 없음 재확인
- `SECURITY DEFINER` 함수 `search_path=""` 및 실행 권한 재확인
- Storage MIME/용량/본인 폴더 정책 재확인
- DOMPurify 기반 리치 콘텐츠 sanitizing 재확인
- Vercel 공통 보안 헤더 적용
- 익명 게시글/댓글의 API 수준 작성자 식별자 노출 구조 보강 예정
- 개인정보처리방침/이용약관 실제 운영정보 최종화 예정

세부 점검 기록은 `STAGE17_SECURITY_AUDIT.md`에서 관리합니다.

## 주요 파일

- `index.html` — 페이지 구조
- `style.css` — 전체 UI 스타일
- `app.js` — 회원·게시글·댓글·공감·신고·관리자 기본 기능
- `config.js` — Supabase 설정 및 보완 스크립트 로드
- `seo.js` — 15단계 SEO
- `robots.txt` — 검색엔진 크롤링 규칙
- `sitemap.xml` — 운영 URL sitemap
- `ads.txt` — Google AdSense 판매자 승인 정보
- `adsense-readiness.js` — 광고·쿠키/UGC 운영정책 보완
- `vercel.json` — Vercel 배포 보안 헤더
- `STAGE17_SECURITY_AUDIT.md` — 17단계 최종 보안·개인정보 점검 기록
- `rich-post-editor.js` — 14단계 리치 편집기/이미지
- `emoji-picker-enhancer.js` — 제목/본문/댓글 이모지
- `sticky-editor-toolbar.js` — 긴 게시글 편집 툴바 고정
- `post-edit-state-fix.js` — 게시글 수정 상태 및 이모지 중복 보완
- `notifications.js` — 13단계 알림 UI
- `comment-thread-reactions.js` — 댓글 대댓글/공감
- `admin-comment-thread-tools.js` — 관리자 댓글 스레드 관리
- `admin-reply-anonymous.js` — 관리자 대댓글 익명 작성
- `operating-pages.js` — 운영센터/운영문서
- `operating-db-sync.js` — 공지/이벤트 DB 연동
- `admin-operating-content.js` — 관리자 공지/이벤트 관리
- `supabase-step14-rich-posts.sql` — 14단계 게시글 HTML/Storage
- `supabase-step13-notifications.sql` — 13단계 알림 DB/RLS/트리거
- `supabase-step12-operating-content.sql` — 공지/이벤트 DB/RLS
- `supabase-step11-security-hardening.sql` — 관리자/프로필 보안

## GitHub 저장소

https://github.com/nalbaly-sys/sajangnim-community
