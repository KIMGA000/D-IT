import { Item } from "../types";
import { supabase } from "./supabase";

const SERVICE_KEY = process.env.EXPO_PUBLIC_ALIO_KEY;
const ALIO_BASE_URL = `https://opendata.alio.go.kr/new/v1/recruit/list.do`;

/**
 * 2026년 공공기관 지정 현황 기반 분류 함수
 */
const getMappedType = (instName: string): string => {
  const cleanName = instName.replace(/\s|㈜|\(주\)/g, "");

  const marketType = [
    "인천국제공항공사",
    "한국공항공사",
    "한국도로공사",
    "한국남동발전",
    "한국남부발전",
    "한국동서발전",
    "한국서부발전",
    "한국수력원자력",
    "한국전력공사",
    "한국중부발전",
    "한국지역난방공사",
    "강원랜드",
    "한국가스공사",
    "한국석유공사",
  ];
  const quasiMarketType = [
    "한국조폐공사",
    "그랜드코리아레저",
    "한국마사회",
    "한국가스기술공사",
    "한국광해광업공단",
    "한국수자원공사",
    "한국전력기술",
    "한전KDN",
    "한전KPS",
    "에스알",
    "제주국제자유도시개발센터",
    "주택도시보증공사",
    "한국부동산원",
    "한국철도공사",
    "한국토지주택공사",
    "해양환경공단",
  ];
  const fundType = [
    "국민체육진흥공단",
    "한국무역보험공사",
    "국민연금공단",
    "근로복지공단",
    "기술보증기금",
    "소상공인시장진흥공단",
    "중소벤처기업진흥공단",
    "신용보증기금",
    "예금보험공사",
    "한국자산관리공사",
    "한국주택금융공사",
    "공무원연금공단",
  ];
  const executionType = [
    "우체국금융개발원",
    "우체국물류지원단",
    "한국방송통신전파진흥원",
    "한국연구재단",
    "한국인터넷진흥원",
    "한국지능정보사회진흥원",
    "한국장학재단",
    "한국국제협력단",
    "한국승강기안전공단",
    "한국보훈복지의료공단",
    "한국관광공사",
    "한국법무보호복지공단",
    "축산물품질평가원",
    "한국농수산식품유통공사",
    "한국농어촌공사",
    "대한무역투자진흥공사",
    "한국가스안전공사",
    "한국산업기술진흥원",
    "한국산업기술기획평가원",
    "한국산업단지공단",
    "한국석유관리원",
    "건강보험심사평가원",
    "국민건강보험공단",
    "한국사회보장정보원",
    "국립공원공단",
    "국립생태원",
    "한국환경공단",
    "한국환경산업기술원",
    "한국에너지공단",
    "한국원자력환경공단",
    "한국전기안전공사",
    "한국전력거래소",
    "한국고용정보원",
    "한국산업안전보건공단",
    "한국산업인력공단",
    "한국장애인고용공단",
    "국가철도공단",
    "국토안전관리원",
    "한국국토정보공사",
    "한국교통안전공단",
    "한국해양교통안전공단",
    "한국재정정보원",
    "한국소비자원",
    "한국도로교통공단",
    "한국산림복지진흥원",
    "한국수목원정원관리원",
  ];

  if (marketType.some((name) => cleanName.includes(name))) return "시장형";
  if (quasiMarketType.some((name) => cleanName.includes(name)))
    return "준시장형";
  if (fundType.some((name) => cleanName.includes(name)))
    return "준정부기관(기금)";
  if (executionType.some((name) => cleanName.includes(name)))
    return "준정부기관(위탁)";

  return "기타공공기관";
};

export const fetchAlioJobs = async (): Promise<Item[]> => {
  try {
    const queryParams = new URLSearchParams({
      serviceKey: SERVICE_KEY || "",
      pageNo: "1",
      numOfRows: "1000",
      ncsCdLst: "R600020",
      recrutSe: "R2010",
      acbgCondLst: "R7010,R7020,R7030,R7040,R7050",
      hireTypeLst: "R1010,R1050,R1060,R1070",
    }).toString();

    const response = await fetch(`${ALIO_BASE_URL}?${queryParams}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    if (!data.result) return [];

    // 1. 데이터 파싱 및 날짜 숫자화
    const parsedData = data.result.map((job: any) => {
      const dateStr = (
        job.pblntDate ||
        job.pblntDt ||
        job.pbancBgngYmd ||
        ""
      ).replace(/[^0-9]/g, "");
      return {
        ...job,
        parsedDate: parseInt(dateStr.substring(0, 8)) || 0,
      };
    });

    // 2. 기관별 최신 공고 1개만 남기기 (날짜 내림차순 정렬 후 필터링)
    const sorted = parsedData.sort(
      (a: any, b: any) => b.parsedDate - a.parsedDate,
    );
    const uniqueByInst = sorted.filter(
      (item: any, index: number, self: any[]) =>
        index === self.findIndex((t) => t.instNm === item.instNm),
    );

    // 3. 2026년 이후 공고만 필터링
    const finalFiltered = uniqueByInst.filter(
      (job: any) => job.parsedDate >= 20260101,
    );

    // 4. DB 저장용 데이터 생성
    const companyData = finalFiltered.map((job: any) => ({
      name: job.instNm,
      notice_name: job.recrutPbancTtl.trim(),
      inst_type: getMappedType(job.instNm),
      pblnt_date: String(job.parsedDate),
    }));

    // 5. DB Upsert (onConflict: "name" 기반으로 기관당 1개 유지)
    if (companyData.length > 0) {
      const { error: dbError } = await supabase
        .from("companies")
        .upsert(companyData, { onConflict: "name" });

      if (dbError) console.error("DB 업데이트 실패:", dbError.message);
      else console.log(`${companyData.length}개 기관 최신 데이터 동기화 완료!`);
    }

    // 6. DB 청소 (2026년 이전 데이터 삭제)
    await supabase
      .from("companies")
      .delete()
      .or("pblnt_date.lt.20260101,pblnt_date.is.null");

    // 7. UI용 데이터 반환
    return finalFiltered.map((job: any) => ({
      id: job.recrutPblntSn,
      type: "job",
      title: job.recrutPbancTtl.trim(),
      institution: job.instNm,
      dDay: job.decimalDay,
      url: job.srcUrl,
      raw: job,
    }));
  } catch (error) {
    console.error("오류 발생:", error);
    return [];
  }
};
