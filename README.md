# 사장님도 퇴근합니다

자영업 사장님들이 가게 운영 경험과 고민을 나누는 커뮤니티 프로젝트입니다.

## 1. 준비물
- Windows PC
- Git 설치
- Python 설치(Windows에서 `py` 명령어 사용 가능해야 함)
- GitHub 저장소 접근 권한

## 2. 처음 실행하기
명령 프롬프트(CMD)를 열고 아래 명령어를 한 줄씩 실행합니다.

```bat
cd /d D:\\sajangnim-community
git pull origin main
py -m http.server 3000
```

- `cd /d D:\\sajangnim-community`: 프로젝트 폴더로 이동합니다.
- `git pull origin main`: GitHub의 최신 코드를 내려받습니다.
- `py -m http.server 3000`: 현재 폴더의 파일을 로컬 웹서버로 실행합니다.

서버 실행 후 브라우저에서 아래 주소를 엽니다.

**http://localhost:3000**

테스트하는 동안 서버가 실행 중인 CMD 창을 닫지 마세요. 서버를 종료하려면 CMD 창에서 `Ctrl + C`를 누릅니다.

## 3. 코드를 수정한 뒤 테스트하기
1. GitHub 또는 로컬에서 코드를 수정합니다.
2. 로컬에서 작업하는 경우 수정 내용을 저장하고 GitHub의 `main` 브랜치에 커밋/푸시합니다.
3. 테스트 PC의 CMD에서 서버를 종료하려면 `Ctrl + C`를 누릅니다.
4. 프로젝트 폴더에서 최신 코드를 받습니다.

```bat
cd /d D:\\sajangnim-community
git pull origin main
py -m http.server 3000
```

5. 브라우저에서 **http://localhost:3000**을 열거나, 이미 열려 있다면 **Ctrl + F5**로 강력 새로고침합니다.

> `git pull`에서 충돌이나 오류가 발생하면 `git reset --hard` 같은 초기화 명령어를 임의로 실행하지 말고, 오류 메시지와 `git status` 결과를 먼저 확인하세요.

## 4. 테스트 체크리스트
- [ ] 홈페이지가 정상적으로 열리는지
- [ ] 회원가입 및 이메일 로그인/로그아웃
- [ ] Google 로그인
- [ ] Kakao 로그인 (현재 `app.js`에는 Google OAuth만 확인되므로, 카카오 로그인 구현 후 테스트)
- [ ] 게시글 및 댓글 기능
- [ ] 마이페이지 진입/닫기, 프로필 수정
- [ ] 새로고침 후 로그인 상태와 화면이 올바른지
- [ ] PC와 모바일 화면이 모두 읽기 편한지

현재 구현 여부에 따라 일부 체크 항목은 아직 테스트할 수 없을 수 있습니다.

## 5. 로그인 리다이렉트 주소
Supabase 및 Google/Kakao 로그인 설정을 사용하는 경우, 로컬 테스트 주소가 허용된 리다이렉트 URL 목록에 등록되어 있어야 합니다. 필요한 경우 다음 주소를 설정에 추가합니다.

- `http://localhost:3000`
- 프로젝트에서 실제 사용하는 OAuth 콜백 주소

Supabase 대시보드의 Authentication URL 설정과 각 OAuth 제공자의 설정은 서로 다를 수 있으므로, 로그인 오류가 나면 두 곳의 URL 설정을 확인하세요.

## 6. 보안 주의사항
- 브라우저에서 사용하는 Supabase anon/publishable 키는 공개 클라이언트용 키여야 하며, 데이터 접근은 Supabase RLS 정책으로 보호해야 합니다.
- **Supabase service_role 키, 비밀번호, OAuth client secret 등 비밀 정보는 `config.js`나 GitHub에 올리지 마세요.**
- `py -m http.server`는 정적 파일 테스트용 서버입니다. 실제 서비스용 서버나 보안 경계가 아니며, 프로젝트 파일을 인터넷에 공개하는 용도로 사용하지 마세요.

## 7. 프로젝트 파일
- `index.html`: 페이지 구조
- `style.css`: 화면 디자인
- `app.js`: 화면 동작 및 기능
- `config.js`: 클라이언트 설정

## 8. GitHub 저장소
https://github.com/nalbaly-sys/sajangnim-community
