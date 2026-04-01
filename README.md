📱 D-IT(딧) - Mobile App Project
IT 직군 특화 취업 관리 및 공기업 가산점 시뮬레이션 서비스입니다.

1. 개발 환경 구축
   (1) 필수 프로그램 설치(PC)
   Node.js (LTS 버전) 설치: https://nodejs.org/
   VS Code 설치: https://code.visualstudio.com/
   Git 설치: https://git-scm.com/

(2) 스마트폰 세팅
각자의 스마트폰(Android/iOS)에 'Expo Go' 앱을 설치합니다.

2. 프로젝트 가져오기

# 1. 프로젝트 복제

git clone https://github.com/KIMGA000/D-IT.git
cd d-it

# 2. 필수 라이브러리 설치

npm install

# 3. 앱 실행

npx expo start

3. 프로젝트 폴더 구조
   app/ : 실제 앱의 화면(Page)들이 위치하는 곳입니다.
   (tabs)/ : 하단 탭 메뉴 구성 (홈, 검색, 설정 등)
   index.tsx : 앱을 켰을 때 가장 처음 뜨는 메인 화면
   \_layout.tsx : 전체적인 앱의 뼈대(내비게이션) 설정
   components/ : 버튼, 카드 등 재사용 가능한 UI 조각들을 모아둡니다.
   constants/ : 색상(Colors.ts), 폰트 크기 등 공통 수치를 관리합니다.
   assets/ : 이미지, 아이콘, 폰트 파일 저장소
   hooks/ : 반복되는 로직을 커스텀 훅으로 관리합니다.
   package.json : 프로젝트 정보 및 라이브러리 목록

4. 브랜치 및 협업 규칙
   (1) 브랜치 명명 규칙
   feat/기능명 : 새로운 기능 추가 (예: feat/job-api)
   ui/화면명 : UI 구현 및 스타일링 (예: ui/timer-screen)
   fix/버그명 : 버그 수정 (예: fix/login-error)
   docs/변경내용 : README 등 문서 수정

(2) 작업 프로세스

1. **최신 코드 가져오기** : `git checkout main` -> `git pull origin main`
2. **새 브랜치 생성** : `git checkout -b feat/기능이름`
3. **작업 및 커밋** : `git add .` -> `git commit -m "[Feat] 메인 화면 UI 수정"`
4. **원격 업로드** : `git push origin feat/기능이름`
5. **합치기(PR)** : GitHub에서 `Pull Request` 생성 후 팀원 검토 후 Merge

(3) 커밋 메시지 규칙
[Feat] : 신규 기능 구현
[Design] : UI 디자인 및 스타일 수정
[Fix] : 버그 수정
[Docs] : 문서 수정
[Refactor] : 코드 리팩토링(기능 변경 없이 구조 개선)
