# AdSense 준비 체크리스트 — 사장님도 퇴근합니다

기준 사이트: `https://sajangnim-community.vercel.app/`

## 현재 완료

- [x] Vercel 실제 배포 완료
- [x] Supabase 일반 로그인 정상
- [x] Google 로그인 정상
- [x] Kakao 로그인 정상
- [x] 게시글/댓글/대댓글/이미지 정상
- [x] 신고 기능
- [x] 관리자 숨김/삭제/복구
- [x] 커뮤니티 이용규칙
- [x] 개인정보처리방침 초안
- [x] 이용약관 초안
- [x] SEO title/description/Open Graph/Twitter 메타
- [x] canonical 운영 URL 확정
- [x] robots.txt
- [x] sitemap.xml
- [x] 광고/쿠키/제3자 광고 사업자 안내 보완
- [x] UGC 광고 정책 위험 콘텐츠 금지 조항 보완

## AdSense 신청 전 확인 필요

- [ ] 운영자 또는 서비스 문의 연락처 확정
- [ ] 개인정보처리방침의 운영자 정보/문의 연락처/보유기간 최종 확정
- [ ] 실제 운영에 불필요한 테스트 게시물/빈 콘텐츠 정리
- [ ] 공개 페이지에 정책 위반 가능성이 있는 사용자 콘텐츠가 없는지 확인
- [ ] AdSense 계정 생성 및 사이트 등록
- [ ] AdSense에서 발급된 Publisher ID 확인
- [ ] 사이트 소유권 확인용 AdSense meta 또는 script 적용
- [ ] 실제 Publisher ID로 `/ads.txt` 생성
- [ ] AdSense 사이트 검토 요청

## 광고 적용 후

- [ ] Google CMP 또는 적절한 동의 관리 방식 검토
- [ ] 광고 위치를 콘텐츠와 혼동되지 않도록 설계
- [ ] 로그인/회원가입/관리자 모달 등 기능 UI를 광고가 가리지 않는지 확인
- [ ] 모바일 화면 광고 레이아웃 확인
- [ ] UGC 신고 및 운영자 검토 루틴 유지
- [ ] Google Publisher Policies 위반 여부 정기 점검

## 주의

`ads.txt`와 AdSense 코드에는 실제 계정에서 발급받은 Publisher ID만 사용합니다. 예시 `pub-0000000000000000` 값을 운영 사이트에 넣지 않습니다.

현재 Vercel 기본 주소인 `sajangnim-community.vercel.app`은 Vercel의 Public Suffix List 기반 사이트 주소이므로 AdSense 사이트 등록 후보로 사용할 수 있습니다. 실제 승인 여부는 Google의 사이트 검토 결과에 따릅니다.
