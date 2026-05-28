import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSaved } from "../context/SavedContext";
import { fetchAlioJobs } from "../services/api";
import { supabase } from "../services/supabase";
import { theme } from "../styles/theme";

// 🎯 분리된 시뮬레이터 전용 카드 및 명세서 모달 임포트
import SimulatorCard from "../components/SimulatorCard";
import SimulatorDetailModal from "../components/SimulatorDetailModal";

const ORG_TYPES = [
  { id: "all", name: "전체" },
  { id: "market", name: "시장형" },
  { id: "quasi-market", name: "준시장형" },
  { id: "quasi-gov-fund", name: "준정부기관(기금)" },
  { id: "quasi-gov-exec", name: "준정부기관(위탁)" },
  { id: "etc", name: "기타공공기관" },
];

export default function SimulatorScreen() {
  const router = useRouter();
  const { userSpecs } = useSaved();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [displayList, setDisplayList] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadRankings();
    }, [activeTab, userSpecs.certificates]),
  );

  const loadRankings = async () => {
    setLoading(true);
    try {
      const jobs = await fetchAlioJobs();

      const { data: dbData, error } = await supabase.from("companies").select(`
          id,
          name,
          notice_name,
          inst_type,
          max_bonus_rate,
          notice_id,
          bonus_rules (
            apply_step,
            score_value,
            score_type,
            steps_config,
            is_cumulative,
            condition,
            certificates (
              id,
              standard_name,
              grades
            )
          )
        `);

      if (error) throw error;

      const currentTypeName = ORG_TYPES.find((t) => t.id === activeTab)?.name;

      const calculated = jobs.map((job) => {
        const dbInfo = dbData?.find((d) => {
          const cleanDbName = d.name.replace(/[^가-힣a-zA-Z0-9]/g, "");
          const cleanJobName = job.institution.replace(
            /[^가-힣a-zA-Z0-9]/g,
            "",
          );
          return d.notice_id === job.id || cleanDbName === cleanJobName;
        });

        const rules = dbInfo?.bonus_rules || [];

        const rawSteps = rules.flatMap((r: any) => r.apply_step || []);
        const steps = Array.from(new Set(rawSteps)).filter(
          (s) => s !== "required" && s !== "essential",
        );

        const myCerts = userSpecs.certificates.map((c: any) => ({
          name: c.standard_name,
          grade: c.grade || "",
        }));

        // 응시 필수 자격 검증
        let isEligible = true;
        let hasRequiredRule = false;
        let requiredConditionText = "응시 필수";
        const requiredDetails: any[] = [];

        const requiredRules = rules.filter(
          (r: any) => r.apply_step && r.apply_step[0] === "required",
        );

        if (requiredRules.length > 0) {
          hasRequiredRule = true;
          let satisfiedCount = 0;

          if (requiredRules[0]?.condition) {
            requiredConditionText = requiredRules[0].condition;
          }

          requiredRules.forEach((rule: any) => {
            const certName = rule.certificates?.standard_name;
            const allowedGrades: string[] = rule.steps_config || [];
            const certMasterGrades: string[] = rule.certificates?.grades || [];

            const userHasCert = myCerts.find((c) => c.name === certName);

            if (userHasCert) {
              if (allowedGrades.length <= 1) {
                satisfiedCount++;
                const displayName =
                  certMasterGrades.length > 1 && userHasCert.grade
                    ? `${certName} (${userHasCert.grade})`
                    : certName;
                requiredDetails.push({ certName: displayName, hasIt: true });
              } else {
                const hasGrade = allowedGrades.includes(userHasCert.grade);
                if (hasGrade) satisfiedCount++;
                const displayName =
                  certMasterGrades.length > 1 && userHasCert.grade
                    ? `${certName} (${userHasCert.grade})`
                    : certName;
                requiredDetails.push({
                  certName: displayName,
                  hasIt: hasGrade,
                });
              }
            } else {
              requiredDetails.push({ certName, hasIt: false });
            }
          });

          if (satisfiedCount === 0) isEligible = false;
        }

        // 우대 가산점 스코어 통합 연산
        let myTotalScore = 0;
        const bonusRule = rules.find(
          (r: any) => r.apply_step && r.apply_step[0] !== "required",
        );
        const unit = bonusRule?.score_type === "percentage" ? "%" : "점";

        const documentDetails: any[] = [];
        const writtenDetails: any[] = [];
        const interviewDetails: any[] = [];

        rules.forEach((rule: any) => {
          const currentSteps: string[] = rule.apply_step || [];
          if (currentSteps[0] === "required") return;

          const certName = rule.certificates?.standard_name;
          const userHasCert = myCerts.find((c) => c.name === certName);
          const allowedGrades: string[] = rule.steps_config || [];
          const gradeScores: number[] = rule.score_value || [];
          const certMasterGrades: string[] = rule.certificates?.grades || [];

          let isSatisfied = false;
          let calculatedScore = 0;

          if (userHasCert) {
            if (gradeScores.length <= 1) {
              calculatedScore = Number(gradeScores[0] || 0);
              isSatisfied = true;
              myTotalScore += calculatedScore;
            } else {
              const gradeIdx = allowedGrades.indexOf(userHasCert.grade);
              if (gradeIdx !== -1) {
                calculatedScore = Number(gradeScores[gradeIdx] || 0);
                isSatisfied = true;
                myTotalScore += calculatedScore;
              }
            }
          }

          let displayCertName = certName;
          if (certMasterGrades.length > 1) {
            if (isSatisfied && userHasCert && userHasCert.grade) {
              displayCertName = `${certName} (${userHasCert.grade})`;
            } else if (allowedGrades.length > 0) {
              displayCertName = `${certName} (${allowedGrades[0]} 이상)`;
            }
          }

          const targetDetailObj = {
            certName: displayCertName,
            hasIt: isSatisfied,
            score: isSatisfied ? calculatedScore : 0,
            potentialScore: Number(gradeScores[0] || 0),
            unit,
          };

          if (currentSteps.includes("document"))
            documentDetails.push(targetDetailObj);
          if (currentSteps.includes("written"))
            writtenDetails.push(targetDetailObj);
          if (currentSteps.includes("interview"))
            interviewDetails.push(targetDetailObj);
        });

        const limit = Number(dbInfo?.max_bonus_rate) || 0;
        const hasBonusRules = rules.some(
          (r) => r.apply_step && r.apply_step[0] !== "required",
        );

        const finalMyScore = limit > 0 ? Math.min(myTotalScore, limit) : 0;
        const normalizedScore = limit > 0 ? (finalMyScore / limit) * 100 : 0;

        return {
          ...job,
          instType: dbInfo?.inst_type || "기타공공기관",
          noticeName: dbInfo?.notice_name || "자체 공고 참조",
          myScore: finalMyScore,
          maxLimit: limit,
          unit,
          normalizedScore,
          steps,
          isReady: rules.length > 0,
          hasRequiredRule,
          hasBonusRules,
          requiredConditionText,
          analysis: {
            isEligible,
            requiredDetails,
            documentDetails,
            writtenDetails,
            interviewDetails,
          },
        };
      });

      const filteredAndSorted = calculated
        .filter(
          (job) => activeTab === "all" || job.instType === currentTypeName,
        )
        .sort((a, b) => {
          if (a.isReady !== b.isReady) return a.isReady ? -1 : 1;
          if (a.isReady && b.isReady) {
            if (a.analysis.isEligible !== b.analysis.isEligible)
              return a.analysis.isEligible ? -1 : 1;
            if (b.normalizedScore !== a.normalizedScore) {
              return (b.normalizedScore || 0) - (a.normalizedScore || 0);
            }
          }
          return a.institution.localeCompare(b.institution);
        });

      setDisplayList(filteredAndSorted);
    } catch (err) {
      console.error("랭킹 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (item: any) => {
    setSelectedDetail(item);
    setModalVisible(true);
  };

  if (loading)
    return (
      <View style={theme.safe}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#4f46e5" />
      </View>
    );

  return (
    <View style={theme.safe}>
      <View style={theme.header}>
        <Text style={theme.logoText}>유형별 가산점 랭킹</Text>
      </View>

      <View style={{ backgroundColor: "#fff", paddingVertical: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}>
          {ORG_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              onPress={() => setActiveTab(type.id)}
              style={[
                theme.subTabBtn,
                { paddingHorizontal: 15, marginRight: 8, minWidth: 80 },
                activeTab === type.id && theme.subTabBtnActive,
              ]}>
              <Text
                style={[
                  theme.subTabText,
                  activeTab === type.id && theme.subTabTextActive,
                ]}>
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 리스트부 가독성 대격변 세션 */}
      <ScrollView
        contentContainerStyle={theme.scrollContent}
        showsVerticalScrollIndicator={false}>
        {displayList.map((item) => (
          <SimulatorCard
            key={item.id}
            item={item}
            onPress={() => item.isReady && openDetailModal(item)}
          />
        ))}
      </ScrollView>

      {/* 모달 렌더링부 외부 컴포넌트 캡슐화 연동 */}
      <SimulatorDetailModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedDetail={selectedDetail}
      />
    </View>
  );
}
