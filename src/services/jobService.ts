// src/services/jobService.ts
import { supabase } from "./supabase";

export const syncNewJobsOnly = async (jobs: any[]) => {
  const companyData = jobs.map((job) => ({
    name: job.institution || job.name,
    notice_name: job.title || job.notice_name,
  }));

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
