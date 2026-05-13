# 📱 D-IT (딧) - Team 01Pass

> IT 직군 특화 취업 관리 & 공기업 가산점 시뮬레이션 서비스
>
> D-IT(딧)은 전산직·IT 취업 준비생을 위한 올인원 취업 관리 플랫폼입니다.  
> 흩어져 있는 채용 공고와 자격증 정보를 한곳에서 관리하고,  
> 공기업별 가산점을 실시간으로 계산하여 전략적인 취업 준비를 돕습니다.

---

# 🚀 1. 개발 환경 구축

## 1) 필수 프로그램 설치

아래 프로그램을 먼저 설치해주세요.

- Node.js (LTS)
  - https://nodejs.org/
- VS Code
  - https://code.visualstudio.com/
- Git
  - https://git-scm.com/

---

## 2) 모바일 환경 세팅

Android 또는 iOS 기기에 아래 앱을 설치합니다.

- Expo Go
  - https://expo.dev/go

---

# 📦 2. 프로젝트 실행 방법

## 1) 프로젝트 클론

```bash
git clone https://github.com/KIMGA000/D-IT.git
cd D-IT
```

---

## 2) 의존성 설치

```bash
npm install
```

---

## 3) 환경 변수 설정

프로젝트 루트 폴더에 `.env` 파일을 생성한 뒤  
Supabase 접속 정보를 입력해주세요.

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ `.env` 파일은 보안을 위해 GitHub에 업로드하지 않습니다.

---

## 4) 프로젝트 실행

```bash
npx expo start
```

실행 후:

- 터미널의 QR 코드를 Expo Go 앱으로 스캔하거나
- Android Emulator / iOS Simulator를 사용하여 앱을 실행할 수 있습니다.

---

# 📂 3. 프로젝트 구조

D-IT은 Expo Router 기반의 파일 라우팅 구조를 사용합니다.

```text
D-IT/
├── app/                # 앱 화면 및 라우팅
│   ├── (tabs)/         # 하단 탭 네비게이션
│   ├── index.tsx       # 시작 화면
│   └── _layout.tsx     # 전체 레이아웃 및 네비게이션 설정
│
├── components/         # 재사용 가능한 UI 컴포넌트
├── services/           # API 및 Supabase 연동 로직
├── hooks/              # 커스텀 훅 관리
├── utils/              # 공통 유틸 함수
├── constants/          # 색상, 폰트 등 공통 상수
├── assets/             # 이미지, 아이콘, 폰트 파일
└── README.md
```

---

# 🌿 4. Git 브랜치 및 협업 규칙

## 1) 브랜치 네이밍 규칙

| 타입 | 설명 | 예시 |
|------|------|------|
| `feat/` | 새로운 기능 개발 | `feat/job-api` |
| `ui/` | UI 및 디자인 작업 | `ui/home-screen` |
| `fix/` | 버그 수정 | `fix/login-error` |
| `docs/` | 문서 수정 | `docs/readme-update` |
| `refactor/` | 코드 구조 개선 | `refactor/api-cleanup` |

---

## 2) Git 작업 프로세스

### ① main 브랜치 최신화

```bash
git checkout main
git pull origin main
```

### ② 기능 브랜치 생성

```bash
git checkout -b feat/기능명
```

예시:

```bash
git checkout -b feat/job-api
```

---

### ③ 작업 후 커밋

```bash
git add .
git commit -m "[Feat] 메인 화면 UI 구현"
```

---

### ④ 원격 저장소 업로드

```bash
git push origin feat/기능명
```

---

### ⑤ Pull Request 생성

- GitHub에서 Pull Request(PR) 생성
- 팀원 리뷰 진행
- 승인 후 Merge

---

# 📝 5. 커밋 메시지 규칙

| 태그 | 설명 |
|------|------|
| `[Feat]` | 신규 기능 구현 |
| `[Design]` | UI 및 스타일 수정 |
| `[Fix]` | 버그 수정 |
| `[Docs]` | 문서 수정 |
| `[Refactor]` | 코드 리팩토링 |
| `[Chore]` | 설정 및 패키지 관리 |

---

## ✅ 커밋 메시지 예시

```bash
git commit -m "[Feat] 공기업 가산점 계산 기능 추가"
```

```bash
git commit -m "[Fix] 로그인 상태 유지 오류 수정"
```

```bash
git commit -m "[Docs] README 프로젝트 구조 업데이트"
```

---

# 📌 주요 기능

- 🔍 IT 직군 채용 공고 통합 조회
- 📅 자격증 시험 일정 관리
- 🧮 공기업 가산점 자동 계산
- ⭐ 관심 채용 공고 저장
- ⏰ D-Day 기반 일정 관리
- 📊 사용자 맞춤 취업 준비 지원
