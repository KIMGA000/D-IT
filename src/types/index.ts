/**
 * 1. Certificate (자격증 종목 정보)
 * DB의 certificates 테이블과 매칭됩니다.
 */
export interface Certificate {
  id: string;
  standard_name: string; // 종목명 (예: 한국사능력검정시험)
  grades: string[] | null; // 가능한 등급 리스트 (예: ["1급", "2급", "3급"])
  aliases?: string[];
}

/**
 * 2. UserSelectedCert (사용자가 등록한 자격증 객체)
 * ProfileScreen에서 "한국사 1급"을 선택했을 때 저장되는 형태입니다.
 */
export interface UserSelectedCert {
  standard_name: string;
  grade: string | null; // 선택한 등급 (없으면 null)
  displayName: string; // 화면 표시용 (예: 한국사능력검정시험 1급)
}

/**
 * 3. UserSpecs (사용자 보유 스펙)
 * 이제 단순 문자열 배열이 아니라 객체 배열로 관리합니다.
 */
export interface UserSpecs {
  certificates: UserSelectedCert[]; // [{standard_name: '한국사...', grade: '1급', displayName: '...'}, ...]
  toeic?: number;
}

/**
 * 4. Item (홈 화면 및 리스트용) - 기존 구조 유지
 */
export interface Item {
  id: number;
  type: "job" | "exam";
  title: string;
  institution: string;
  dDay: number;
  url?: string;
  raw?: any; // API 원본 데이터
}

/**
 * 5. Company (가산점 계산용 회사 정보)
 * DB의 companies와 bonus_rules 조인 결과를 담는 구조입니다.
 */
export interface CompanyBonusInfo {
  name: string; // 기관명
  inst_type: string; // 시장형, 준정부기관 등
  max_bonus_rate: number; // 최대 가산점 한도 (예: 6%)
  bonus_rules: BonusRule[];
}

export interface BonusRule {
  score_value: number;
  apply_step: string; // written (필기), interview (면접)
  steps_config: Record<string, number>; // {"1급": 3, "2급": 2} 형태의 JSON
  certificates: {
    standard_name: string;
  };
}
