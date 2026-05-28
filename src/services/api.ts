import { Item } from "../types";
import { supabase } from "./supabase";

const SERVICE_KEY = process.env.EXPO_PUBLIC_ALIO_KEY;
const ALIO_BASE_URL = `https://opendata.alio.go.kr/new/v1/recruit/list.do`;

const getMappedType = (instName: string): string => {
  const cleanName = instName.replace(
    /\s|㈜|\(주\)|주식회사|\(재\)|재단법인/g,
    "",
  );
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
    "대한무역투자진험공사",
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
    "한국장학재단",
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
    const { data: latestOne, error: timeError } = await supabase
      .from("companies")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    let needApiCall = false;

    if (!latestOne || latestOne.length === 0 || timeError) {
      needApiCall = true;
    } else {
      const lastSavedTime = new Date(latestOne[0].created_at).getTime();
      const currentTime = new Date().getTime();
      const diffMs = currentTime - lastSavedTime;
      const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

      console.log(`[Time Check] 마지막 저장: ${latestOne[0].created_at}`);
      console.log(
        `[Time Check] 시차(시간 환산): ${(diffMs / (1000 * 60 * 60)).toFixed(2)}시간`,
      );

      if (diffMs > THREE_HOURS_MS || diffMs < 0) {
        needApiCall = true;
      }
    }

    // 3시간 미만 경과: 안전하게 보존된 캐시 데이터 즉시 반환
    if (!needApiCall) {
      console.log("[Cache] 데이터가 유효합니다. 누적된 DB 캐시를 반환합니다.");
      const { data: cachedCompanies } = await supabase
        .from("companies")
        .select("*")
        .order("pblnt_date", { ascending: false });

      if (cachedCompanies && cachedCompanies.length > 0) {
        return cachedCompanies.map((c: any) => ({
          id: parseInt(c.notice_id) || 0,
          type: "job",
          title: c.notice_name,
          institution: c.name,
          dDay: 0,
          url: c.url || "https://job.alio.go.kr",
          raw: {
            ...c,
            notice_id: String(c.notice_id || "").trim(),
            instNm: c.name,
            recrutPbancTtl: c.notice_name,
            pbancEndYmd: c.pbanc_end_ymd || c.pblnt_date,
            srcUrl: c.url,
            aplyQlfcCn: c.aply_qlfc_cn,
            scrnprcdrMthdExpln: c.scrn_mthd_expln,
            prefCn: c.pref_cn,
          },
        }));
      }
    }

    // 3시간 만료 시 실시간 API 동기화 파트 개시
    console.log(
      "[Sync] 3시간이 만료되어 ALIO API로부터 새로운 데이터를 동기화합니다.",
    );
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

    const filteredByKeyword = data.result.filter((job: any) => {
      const ttl = job.recrutPbancTtl || "";
      const isExperienced =
        ttl.includes("경력") ||
        ttl.includes("박사") ||
        ttl.includes("전문 자격") ||
        ttl.includes("제한") ||
        ttl.includes("계약직원") ||
        ttl.includes("휴직대체") ||
        ttl.includes("경력경쟁");
      const isRestricted = ttl.includes("고졸") || ttl.includes("보훈");
      return !isExperienced && !isRestricted;
    });

    const parsedAndCleaned = filteredByKeyword.map((job: any) => {
      const dateStr = (
        job.pblntDate ||
        job.pblntDt ||
        job.pbancBgngYmd ||
        ""
      ).replace(/[^0-9]/g, "");
      const noticeId = job.recrutPblntSn
        ? String(job.recrutPblntSn).trim()
        : "0";
      const originalApiEndDate =
        job.pbancEndYmd || job.pbancEnd || job.pblntDate || "";
      const endYmd = String(originalApiEndDate)
        .replace(/[^0-9]/g, "")
        .substring(0, 8);
      const sanitizedCompanyName = job.instNm.replace(
        /\s|㈜|\(주\)|주식회사|\(재\)|재단법인/g,
        "",
      );

      return {
        ...job,
        parsedDate: parseInt(dateStr.substring(0, 8)) || 0,
        sanitizedCompanyName,
        noticeId,
        endYmd,
      };
    });

    const sorted = parsedAndCleaned.sort(
      (a: any, b: any) => b.parsedDate - a.parsedDate,
    );

    const uniqueJobs = sorted.filter(
      (item: any, index: number, self: any[]) =>
        index ===
        self.findIndex(
          (t) =>
            t.sanitizedCompanyName === item.sanitizedCompanyName &&
            t.recrutPbancTtl === item.recrutPbancTtl,
        ),
    );

    const finalFiltered = uniqueJobs.filter(
      (job: any) => job.parsedDate >= 20260101,
    );

    const { data: existingCompanies } = await supabase
      .from("companies")
      .select("notice_id, max_bonus_rate, name");

    const companyData = finalFiltered.map((job: any) => {
      const matchDb =
        existingCompanies?.find((e) => e.notice_id === job.noticeId) ||
        existingCompanies?.find((e) => e.name === job.sanitizedCompanyName);

      const currentRate = matchDb ? matchDb.max_bonus_rate : 0;

      return {
        name: job.sanitizedCompanyName,
        notice_name: job.recrutPbancTtl.trim(),
        inst_type: getMappedType(job.instNm),
        pblnt_date: String(job.parsedDate),
        notice_id: job.noticeId,
        url: job.srcUrl || "https://job.alio.go.kr",
        pbanc_end_ymd: job.endYmd,
        aply_qlfc_cn: job.aplyQlfcCn || "공고 원문을 참조해 주세요.",
        scrn_mthd_expln: job.scrnprcdrMthdExpln || "공고 원문을 참조해 주세요.",
        pref_cn: job.prefCn || "공고 원문을 참조해 주세요.",
        max_bonus_rate: currentRate,
        created_at: new Date().toISOString(),
      };
    });

    if (companyData.length > 0) {
      const { error: dbError } = await supabase
        .from("companies")
        .upsert(companyData, { onConflict: "notice_id" });

      if (dbError) console.error("DB 업데이트 실패:", dbError.message);
      else console.log(`[Sync Success] 신규 공고 동기화 완료!`);
    }

    const blacklistKeywords = [
      "경력",
      "박사",
      "전문 자격",
      "제한",
      "경력경쟁",
      "고졸",
      "보훈",
      "실무직",
      "기능직",
    ];

    const deleteCondition = blacklistKeywords
      .map((keyword) => `notice_name.ilike.%${keyword}%`)
      .join(",");

    const { data: deletedRows, error: deleteError } = await supabase
      .from("companies")
      .delete()
      .or(deleteCondition);

    if (deleteError) {
      console.error(
        "[Blacklist Delete Error] 블랙리스트 삭제 실패:",
        deleteError.message,
      );
    } else {
      console.log(
        `[Blacklist Cleaned] DB 내 블랙리스트 노이즈 공고 자동 청소 완료.`,
      );
    }

    const { data: allAccumulated } = await supabase
      .from("companies")
      .select("*")
      .order("pblnt_date", { ascending: false });
    return (allAccumulated || []).map((c: any) => ({
      id: parseInt(c.notice_id) || 0,
      type: "job",
      title: c.notice_name,
      institution: c.name,
      dDay: 0,
      url: c.url || "https://job.alio.go.kr",
      raw: {
        ...c,
        notice_id: String(c.notice_id || "").trim(),
        instNm: c.name,
        recrutPbancTtl: c.notice_name,
        pbancEndYmd: c.pbanc_end_ymd || c.pblnt_date,
        srcUrl: c.url,
        aplyQlfcCn: c.aply_qlfc_cn,
        scrnprcdrMthdExpln: c.scrn_mthd_expln,
        prefCn: c.pref_cn,
      },
    }));
  } catch (error) {
    console.error("오류 발생:", error);
    return [];
  }
};
