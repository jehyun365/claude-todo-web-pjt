# MyTodo

카테고리별로 할 일을 관리할 수 있는 간단한 웹 기반 Todo List 애플리케이션입니다.
순수 HTML/CSS/JavaScript로 작성되었으며, [Supabase](https://supabase.com) 데이터베이스(`todo_tbl` 테이블)에 데이터를 저장합니다.

## 주요 기능

- 할 일 추가 / 삭제 / 수정
- 완료 여부 체크
- 카테고리 분류 (개인, 공부, 업무, 취미)
- 카테고리별 필터링
- 완료율 진행 표시줄(progress bar)
- Supabase(PostgreSQL) 연동을 통한 데이터 유지 (기기/브라우저와 무관하게 목록 공유)
- 반응형 레이아웃 (모바일 화면 대응)

## Supabase 연동

- 테이블: `todo_tbl` (`id uuid`, `text`, `category`, `completed`, `created_at`)
- `script.js` 상단의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 값으로 연결하며, `@supabase/supabase-js`를 CDN으로 불러와 사용합니다.
- 로그인 기능이 없는 데모 앱으로, RLS 정책이 `anon` 역할에 대해 모든 행에 대한 조회/추가/수정/삭제를 허용합니다. 즉 이 페이지에 접속하는 모든 사용자가 같은 할 일 목록을 공유합니다. 사용자별 데이터 분리가 필요하다면 Supabase Auth를 도입하고 정책을 `auth.uid()` 기준으로 제한해야 합니다.

## 사용 방법

1. 이 저장소를 클론하거나 다운로드합니다.
2. `index.html` 파일을 브라우저로 엽니다.
3. 입력창에 할 일을 작성하고 카테고리를 선택한 뒤 `추가` 버튼을 누르거나 Enter 키를 입력합니다.
4. 체크박스로 완료 처리, ✏️ 버튼으로 수정, 🗑 버튼으로 삭제할 수 있습니다.
5. 상단 필터 탭으로 카테고리별 할 일만 모아 볼 수 있습니다.

## 파일 구성

```
.
├── index.html   # 페이지 구조
├── style.css    # 스타일
├── script.js    # 동작 로직 (localStorage 연동 포함)
└── README.md
```

## 기술 스택

- HTML5
- CSS3
- Vanilla JavaScript (프레임워크 없음)
