import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSaved } from "../context/SavedContext";
import { fetchAlioJobs } from "../services/api";
import { supabase } from "../services/supabase";
import { theme } from "../styles/theme";

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

        // 유저 자격증 구조화
        const myCerts = userSpecs.certificates.map((c: any) => ({
          name: c.standard_name,
          grade: c.grade || "",
        }));

        // 응시 필수 자격 검증 (apply_step = ["required"])
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

          if (satisfiedCount === 0) {
            isEligible = false;
          }
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

      <ScrollView
        contentContainerStyle={theme.scrollContent}
        showsVerticalScrollIndicator={false}>
        {displayList.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => item.isReady && openDetailModal(item)}
            style={[theme.card, !item.isReady && { opacity: 0.6 }]}>
            <View style={theme.cardInfo}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                <Text style={theme.cardInst}>{item.institution}</Text>

                {item.isReady && item.hasBonusRules && (
                  <Text style={styles.scoreText}>
                    {(item.normalizedScore || 0).toFixed(0)}점
                  </Text>
                )}
              </View>

              <Text style={theme.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>

              {item.isReady ? (
                <View style={{ marginTop: 10 }}>
                  {item.hasRequiredRule && (
                    <View
                      style={[
                        styles.requiredBlock,
                        {
                          backgroundColor: item.analysis.isEligible
                            ? "#f0fdf4"
                            : "#fef2f2",
                          borderColor: item.analysis.isEligible
                            ? "#bbf7d0"
                            : "#fecaca",
                        },
                      ]}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}>
                        <Ionicons
                          name={
                            item.analysis.isEligible
                              ? "checkmark-circle"
                              : "alert-circle"
                          }
                          size={16}
                          color={
                            item.analysis.isEligible ? "#166534" : "#991b1b"
                          }
                        />
                        <Text
                          style={[
                            styles.requiredTitleText,
                            {
                              color: item.analysis.isEligible
                                ? "#166534"
                                : "#991b1b",
                            },
                          ]}>
                          {item.requiredConditionText} 자격:{" "}
                          {item.analysis.isEligible
                            ? "충족 (지원 가능)"
                            : "미달 (지원 불가)"}
                        </Text>
                      </View>
                    </View>
                  )}

                  {item.hasBonusRules && item.steps.length > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 5,
                        marginBottom: 10,
                      }}>
                      {item.steps.map((step: string) => (
                        <View key={step} style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {step === "document"
                              ? "서류"
                              : step === "written"
                                ? "필기"
                                : "면접"}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {item.hasBonusRules && (
                    <View style={theme.progressContainer}>
                      <View
                        style={[
                          theme.progressFill,
                          {
                            width: `${Math.min(item.normalizedScore || 0, 100)}%`,
                          },
                        ]}
                      />
                      <Text style={theme.progressText}>
                        가산점 {(item.myScore || 0).toFixed(1)}
                        {item.unit} / {(item.maxLimit || 0).toFixed(1)}
                        {item.unit} 반영
                      </Text>
                    </View>
                  )}

                  <Text style={styles.noticeLink}>
                    * 참고 공고: {item.noticeName}
                  </Text>

                  <Text style={styles.clickableTipText}>
                    💡 블럭을 클릭하면 상세 점수 명세서를 볼 수 있습니다
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                  데이터 준비 중
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedDetail?.institution} 상세 명세서
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color="#1e293b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}>
              {selectedDetail?.hasRequiredRule && (
                <View
                  style={[
                    styles.sectionBox,
                    {
                      backgroundColor: selectedDetail?.analysis.isEligible
                        ? "#f0fdf4"
                        : "#fef2f2",
                      marginBottom: 15,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: selectedDetail?.analysis.isEligible
                          ? "#166534"
                          : "#991b1b",
                      },
                    ]}>
                    {selectedDetail?.analysis.isEligible
                      ? `🟢 ${selectedDetail?.requiredConditionText} 자격 충족`
                      : `🔴 ${selectedDetail?.requiredConditionText} 자격 미달`}
                  </Text>
                  <Text style={styles.sectionDesc}>
                    지원직무 필수 충족 요건 자격증 보유 현황
                  </Text>
                  <View style={{ marginTop: 8, gap: 6 }}>
                    {selectedDetail?.analysis.requiredDetails.map(
                      (req: any, idx: number) => (
                        <View key={idx} style={styles.detailRow}>
                          <Text
                            style={{
                              color: req.hasIt ? "#166534" : "#64748b",
                              fontWeight: req.hasIt ? "600" : "400",
                            }}>
                            {req.hasIt ? "✅" : "❌"} {req.certName}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: req.hasIt ? "#166534" : "#94a3b8",
                            }}>
                            {req.hasIt ? "보유 중" : "미보유"}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                </View>
              )}

              {[
                {
                  title: "📄 서류 전형 가산점 명세",
                  details: selectedDetail?.analysis?.documentDetails,
                },
                {
                  title: "✍️ 필기 전형 가산점 명세",
                  details: selectedDetail?.analysis?.writtenDetails,
                },
                {
                  title: "🗣️ 면접 전형 가산점 명세",
                  details: selectedDetail?.analysis?.interviewDetails,
                },
              ].map((stepGroup, sIdx) => {
                if (!stepGroup.details || stepGroup.details.length === 0)
                  return null;

                const satisfiedList = stepGroup.details.filter(
                  (d: any) => d.hasIt,
                );
                const missingList = stepGroup.details.filter(
                  (d: any) => !d.hasIt,
                );

                return (
                  <View
                    key={sIdx}
                    style={[styles.sectionBox, { marginTop: 15 }]}>
                    <Text style={styles.sectionTitle}>{stepGroup.title}</Text>

                    <Text style={styles.subLabel}>
                      💡 적용된 자격증 내역 (만족)
                    </Text>
                    {satisfiedList.length > 0 ? (
                      satisfiedList.map((d: any, idx: number) => (
                        <View key={idx} style={styles.detailRow}>
                          <Text style={{ color: "#1e293b" }}>
                            ⭐ {d.certName}
                          </Text>
                          <Text style={{ color: "#4f46e5", fontWeight: "600" }}>
                            +{d.score}
                            {d.unit} 반영
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>
                        보유 중인 가산점 대상 자격증이 없습니다.
                      </Text>
                    )}

                    {missingList.length > 0 && (
                      <>
                        <Text
                          style={[
                            styles.subLabel,
                            { marginTop: 12, color: "#b45309" },
                          ]}>
                          🚀 추천 자격증 취득 시 추가 확보 가능 항목
                        </Text>
                        {missingList.map((d: any, idx: number) => (
                          <View key={idx} style={styles.detailRow}>
                            <Text style={{ color: "#64748b" }}>
                              • {d.certName}
                            </Text>
                            <Text
                              style={{ color: "#b45309", fontWeight: "500" }}>
                              +{d.score}
                              {d.unit} 확보 가능
                            </Text>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scoreText: { fontSize: 18, fontWeight: "900", color: "#4f46e5" },
  badge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#4f46e5",
  },
  badgeText: { fontSize: 10, color: "#4f46e5", fontWeight: "700" },
  noticeLink: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 10,
    fontStyle: "italic",
  },
  requiredBlock: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  requiredTitleText: { fontSize: 12, fontWeight: "800" },
  clickableTipText: {
    fontSize: 10,
    color: "#a0aec0",
    marginTop: 8,
    textAlign: "right",
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    paddingBottom: 10,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    flex: 1,
  },
  sectionBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  sectionDesc: { fontSize: 11, color: "#64748b", marginTop: 2 },
  subLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4f46e5",
    marginTop: 8,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
    paddingLeft: 4,
  },
});
