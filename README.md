# MyTodo

카테고리별로 할 일을 관리할 수 있는 간단한 웹 기반 Todo List 애플리케이션입니다.
순수 HTML/CSS/JavaScript로 작성되었으며, [Supabase](https://supabase.com) Auth로 로그인/회원가입을 처리하고, 사용자별 할 일 데이터를 Supabase 데이터베이스에 저장합니다.

## 주요 기능

- 이메일 기반 로그인 / 회원가입 (로그인 전에는 할 일 목록이 보이지 않음)
- 사용자별로 분리된 할 일 목록 (다른 사용자의 할 일은 보이지 않음)
- 할 일 추가 / 삭제 / 수정
- 완료 여부 체크
- 카테고리 분류 (개인, 공부, 업무, 취미)
- 카테고리별 필터링
- 완료율 진행 표시줄(progress bar)
- Supabase 세션 기반 로그인 유지 (새로고침해도 로그인 상태와 목록 유지)
- 반응형 레이아웃 (모바일 화면 대응)

## Supabase 연동

- **인증**: `supabaseClient.auth.signUp()` / `signInWithPassword()` / `signOut()`으로 이메일 + 비밀번호 기반 회원가입/로그인/로그아웃을 처리합니다.
- **테이블 구조** (1:N 관계):
  - `user_tbl`: `id`(=`auth.users.id`), `email`, `created_at`. `auth.users`에 신규 가입이 생기면 트리거(`on_auth_user_created`)가 자동으로 이 테이블에 프로필 행을 만듭니다.
  - `todo_tbl`: `id`, `user_id`(→ `user_tbl.id`), `text`, `category`, `completed`, `created_at`. 한 사용자가 여러 할 일을 가지는 1:N 구조입니다.
- **RLS**: 두 테이블 모두 `authenticated` 역할에 한해 `auth.uid() = id`(`user_tbl`) / `auth.uid() = user_id`(`todo_tbl`) 조건으로 자신의 데이터만 조회·추가·수정·삭제할 수 있습니다. 로그인하지 않은 상태(`anon`)에서는 접근이 불가능합니다.
- `script.js` 상단의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 값으로 연결하며, `@supabase/supabase-js`를 CDN으로 불러와 사용합니다.
- 프로젝트의 이메일 인증(Confirm email) 설정이 켜져 있다면, 회원가입 후 받은 편지함의 인증 링크를 확인해야 로그인할 수 있습니다.

## 사용 방법

1. 이 저장소를 클론하거나 다운로드합니다.
2. `index.html` 파일을 브라우저로 엽니다.
3. 이메일/비밀번호로 회원가입 후 로그인하면 할 일 목록 화면으로 전환됩니다.
4. 입력창에 할 일을 작성하고 카테고리를 선택한 뒤 `추가` 버튼을 누르거나 Enter 키를 입력합니다.
5. 체크박스로 완료 처리, ✏️ 버튼으로 수정, 🗑 버튼으로 삭제할 수 있습니다.
6. 상단 필터 탭으로 카테고리별 할 일만 모아 볼 수 있습니다.
7. 우측 상단 `로그아웃` 버튼으로 로그아웃할 수 있습니다.

## 파일 구성

```
.
├── index.html   # 페이지 구조 (로그인/회원가입 + 할 일 목록)
├── style.css    # 스타일
├── script.js    # 동작 로직 (Supabase Auth + DB 연동)
└── README.md
```

## 기술 스택

- HTML5
- CSS3
- Vanilla JavaScript (프레임워크 없음)
