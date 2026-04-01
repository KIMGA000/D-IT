# 📱 D-IT(딧) - Mobile App Project
# IT 직군 특화 취업 관리 및 공기업 가산점 시뮬레이션 서비스입니다.

# =========================
# 1. 개발 환경 구축
# =========================

# (1) 필수 프로그램 설치 (PC)
# Node.js (LTS): https://nodejs.org/
# VS Code: https://code.visualstudio.com/
# Git: https://git-scm.com/

# (2) 스마트폰 세팅
# Android / iOS에 Expo Go 앱 설치

# =========================
# 2. 프로젝트 가져오기
# =========================

# 1) 프로젝트 복제
git clone https://github.com/KIMGA000/D-IT.git
cd D-IT

# 2) 필수 라이브러리 설치
npm install

# 3) 앱 실행
npx expo start

# =========================
# 3. 프로젝트 폴더 구조
# =========================

# app/ : 실제 앱 화면(Page)
# (tabs)/ : 하단 탭 메뉴 (홈, 검색, 설정 등)
# index.tsx : 앱 실행 시 최초 화면
# _layout.tsx : 전체 앱 구조 (내비게이션)

# components/ : 재사용 UI 컴포넌트
# constants/ : 색상, 폰트 등 공통 값
# assets/ : 이미지, 아이콘, 폰트
# hooks/ : 커스텀 훅

# package.json : 프로젝트 정보 및 의존성

# =========================
# 4. 브랜치 및 협업 규칙
# =========================

# (1) 브랜치 명명 규칙
# feat/기능명 : 새로운 기능 (ex: feat/job-api)
# ui/화면명 : UI 작업 (ex: ui/timer-screen)
# fix/버그명 : 버그 수정 (ex: fix/login-error)
# docs/변경내용 : 문서 수정

# (2) 작업 프로세스

# 1. 최신 코드 가져오기
git checkout main
git pull origin main

# 2. 브랜치 생성
git checkout -b feat/기능이름

# 3. 작업 후 커밋
git add .
git commit -m "[Feat] 메인 화면 UI 수정"

# 4. 원격 업로드
git push origin feat/기능이름

# 이후 GitHub에서 Pull Request 생성 → 리뷰 → Merge

# (3) 커밋 메시지 규칙
# [Feat] : 신규 기능
# [Design] : UI 수정
# [Fix] : 버그 수정
# [Docs] : 문서 수정
# [Refactor] : 리팩토링
