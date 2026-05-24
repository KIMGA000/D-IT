export interface UserCert {
  cert_id: string;
  standard_name: string;
}

export interface BonusRule {
  apply_step: "required" | "document" | "exam" | "interview";
  score_type: "required" | "score" | "percent";
  score_value: number;
  condition: string;
  is_cumulative: boolean;
  certificates: { id: string; standard_name: string };
}

export const calculateCompanyBonus = (
  rules: BonusRule[],
  userCerts: UserCert[],
) => {
  const userCertIds = userCerts.map((c) => c.cert_id);

  const report = {
    isEligible: true,
    required: {
      satisfied: [] as string[],
      missing: [] as string[],
      hasRules: false,
    },
    document: { score: 0, details: [] as string[], tips: [] as string[] },
    exam: { score: 0, details: [] as string[], tips: [] as string[] },
    interview: { score: 0, details: [] as string[], tips: [] as string[] },
  };

  const requiredRules = rules.filter((r) => r.apply_step === "required");
  if (requiredRules.length > 0) {
    report.required.hasRules = true;
    requiredRules.forEach((rule) => {
      const certName = rule.certificates?.standard_name;
      if (userCertIds.includes(rule.certificates?.id)) {
        report.required.satisfied.push(certName);
      } else {
        report.required.missing.push(certName);
      }
    });
    if (report.required.satisfied.length === 0) {
      report.isEligible = false;
    }
  }

  const scoreSteps: ("document" | "exam" | "interview")[] = [
    "document",
    "exam",
    "interview",
  ];

  scoreSteps.forEach((step) => {
    const stepRules = rules.filter((r) => r.apply_step === step);
    let totalScore = 0;
    let maxScore = 0;

    stepRules.forEach((rule) => {
      const certName = rule.certificates?.standard_name;
      const hasCert = userCertIds.includes(rule.certificates?.id);

      if (hasCert) {
        if (rule.is_cumulative) {
          totalScore += rule.score_value;
          report[step].details.push(`✅ ${certName} (+${rule.score_value}점)`);
        } else {
          if (rule.score_value > maxScore) maxScore = rule.score_value;
          report[step].details.push(
            `✅ ${certName} (보유 중 / 최고 점수 반영 예정)`,
          );
        }
      } else {
        report[step].tips.push(
          `💡 ${certName} 취득 시 +${rule.score_value}점 추가 가능`,
        );
      }
    });

    if (maxScore > 0) {
      totalScore += maxScore;
    }
    report[step].score = totalScore;
  });

  return report;
};
