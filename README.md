# 📱 D-IT (딧) - 2팀 (01즈)
> **IT 직군 특화 취업 관리 및 공기업 가산점 시뮬레이션 서비스**

---

## 🛠️ 1. 개발 환경 구축

### (1) 필수 프로그램 설치 (PC)
* **Node.js (LTS)**: [https://nodejs.org/](https://nodejs.org/)
* **VS Code**: [https://code.visualstudio.com/](https://code.visualstudio.com/)
* **Git**: [https://git-scm.com/](https://git-scm.com/)

### (2) 스마트폰 세팅
* Android / iOS 기기에 **Expo Go** 앱 설치

---

## 🤝 2. 프로젝트 시작하기

# 1) 프로젝트 복제
git clone https://github.com/KIMGA000/D-IT.git

cd D-IT

# 2) 필수 라이브러리 설치
npm install

# 3) 앱 실행
npx expo start

---

## 📂 3. 프로젝트 폴더 구조
우리 프로젝트는 **Expo Router** 기반의 파일 라우팅을 사용합니다.

* **app/**: 실제 앱의 화면(Page)들이 위치하는 곳
  * **(tabs)/**: 하단 탭 메뉴 구성 (홈, 검색, 설정 등)
  * **index.tsx**: 앱 실행 시 최초 화면
  * **_layout.tsx**: 전체 앱의 뼈대 및 내비게이션 설정
* **components/**: 버튼, 카드 등 재사용 가능한 UI 컴포넌트
* **constants/**: 색상, 폰트 크기 등 공통 스타일 값
* **assets/**: 이미지, 아이콘, 폰트 파일 저장소
* **hooks/**: 반복되는 로직을 처리하는 커스텀 훅

---

## 🌿 4. 브랜치 및 협업 규칙

### (1) 브랜치 명명 규칙 (Type/기능명)
* `feat/` : 새로운 기능 개발 (ex: feat/job-api)
* `ui/` : UI 및 디자인 작업 (ex: ui/timer-screen)
* `fix/` : 버그 및 에러 수정 (ex: fix/login-error)
* `docs/` : 문서 및 README 수정

### (2) 작업 프로세스 (Git Workflow)
1. **최신화**: git checkout main → git pull origin main
2. **브랜치 생성**: git checkout -b feat/기능이름
3. **커밋**: git add . → git commit -m "[Feat] 메인 화면 UI 수정"
4. **업로드**: git push origin feat/기능이름
5. **PR**: GitHub에서 Pull Request 생성 → 검토 후 Merge

### (3) 커밋 메시지 규칙
* `[Feat]` : 신규 기능 구현
* `[Design]` : UI 디자인 및 스타일 수정
* `[Fix]` : 버그 수정
* `[Docs]` : 문서 수정
* `[Refactor]` : 코드 구조 개선 (기능 변화 없음)
git add README.md
git commit -m "[Docs] 팀 협업을 위한 상세 가이드 구축 📝"
git push origin main
