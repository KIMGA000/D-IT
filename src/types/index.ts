/**
 * Certificate (자격증 종목 정보)
 * DB의 certificates 테이블과 매칭됩니다.
 */
export interface Certificate {
  id: string;
  standard_name: string;
  grades: string[] | null;
  aliases?: string[];
}

/**
 * UserSelectedCert (사용자가 등록한 자격증 객체)
 * ProfileScreen에서 선택했을 때 저장되는 형태입니다.
 */
export interface UserSelectedCert {
  standard_name: string;
  grade: string | null; // 선택한 등급 (없으면 null)
  displayName: string;
}

/**
 * UserSpecs (사용자 보유 스펙)
 * 객체 배열로 관리합니다.
 */
export interface UserSpecs {
  certificates: UserSelectedCert[]; // [{standard_name: '한국사...', grade: '1급', displayName: '...'}, ...]
  toeic?: number;
}

/**
 * Item (홈 화면 및 리스트용) - 기존 구조 유지
 */
export interface Item {
  id: number;
  type: "job" | "exam";
  title: string;
  institution: string;
  dDay: number;
  url?: string;
  raw?: any;
}

/**
 * Company (가산점 계산용 회사 정보)
 * DB의 companies와 bonus_rules 조인 결과를 담는 구조입니다.
 */
export interface CompanyBonusInfo {
  name: string;
  inst_type: string;
  max_bonus_rate: number;
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
