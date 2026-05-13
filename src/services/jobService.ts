// src/services/jobService.ts
import { supabase } from "./supabase";

/**
 * 인자로 받은 공고 리스트를 DB에 중복 없이 저장하는 전용 함수
 * @param jobs - API나 다른 소스에서 가져온 공고 배열
 */
export const syncNewJobsOnly = async (jobs: any[]) => {
  // 1. 저장할 형식(이름, 공고제목)에 맞춰 데이터 정제
  const companyData = jobs.map((job) => ({
    name: job.institution || job.name,
    notice_name: job.title || job.notice_name,
  }));

  // 2. Supabase upsert 실행
  // onConflict: notice_name 컬럼을 기준으로 중복 여부 판단
  // ignoreDuplicates: true -> 중복 시 덮어쓰지 않고 무시하여 DB 부하 감소
  const { error } = await supabase.from("companies").upsert(companyData, {
    onConflict: "notice_name",
    ignoreDuplicates: true,
  });

  if (error) {
    console.error("DB 저장 중 오류:", error.message);
  } else {
    console.log("새로운 공고 DB 저장 성공 (중복 제외)");
  }
};
