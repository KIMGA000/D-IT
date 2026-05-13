import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

  useEffect(() => {
    loadRankings();
  }, [activeTab, userSpecs.certificates]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const jobs = await fetchAlioJobs();

      // [수정] bonus_rules에서 is_cumulative 필드를 함께 가져옵니다.
      const { data: dbData, error } = await supabase.from("companies").select(`
          name, notice_name, inst_type, max_bonus_rate,
          bonus_rules ( 
            apply_step, 
            score_value, 
            steps_config, 
            is_cumulative, 
            certificates ( standard_name ) 
          )
        `);

      if (error) throw error;

      const currentTypeName = ORG_TYPES.find((t) => t.id === activeTab)?.name;

      const calculated = jobs.map((job) => {
        const dbInfo = dbData?.find(
          (d) =>
            d.name.replace(/\s/g, "") === job.institution.replace(/\s/g, ""),
        );

        const rules = dbInfo?.bonus_rules || [];
        const steps = Array.from(new Set(rules.map((r: any) => r.apply_step)));

        // 점수 계산을 위한 변수들
        let myTotalScore = 0;
        let maxPossibleScore = 0;

        // [중요] 규칙마다 is_cumulative가 다를 수 있으므로 내부 로직에서 처리
        // 보통 한 회사의 자격증 규칙들은 동일한 is_cumulative 값을 가집니다.
        const isCumulativeMode =
          rules.length > 0 ? rules[0].is_cumulative : false;

        if (isCumulativeMode) {
          // A. 합산 모드 (공영홈쇼핑 등) : 점수를 계속 더함
          rules.forEach((rule: any) => {
            const certName = rule.certificates?.standard_name;
            const myCert = userSpecs.certificates.find(
              (c: any) => c.standard_name === certName,
            );

            if (myCert) {
              let score = Number(rule.score_value);
              if (rule.steps_config && myCert.grade) {
                const config = rule.steps_config as Record<string, any>;
                score =
                  config[myCert.grade] !== undefined
                    ? Number(config[myCert.grade])
                    : score;
              }
              myTotalScore += score;
            }
          });
        } else {
          // B. 최고점 모드 (진흥원 등) : Math.max로 가장 높은 것 하나만 선택
          rules.forEach((rule: any) => {
            const certName = rule.certificates?.standard_name;
            const myCert = userSpecs.certificates.find(
              (c: any) => c.standard_name === certName,
            );

            if (myCert) {
              let score = Number(rule.score_value);
              if (rule.steps_config && myCert.grade) {
                const config = rule.steps_config as Record<string, any>;
                score =
                  config[myCert.grade] !== undefined
                    ? Number(config[myCert.grade])
                    : score;
              }
              if (score > myTotalScore) myTotalScore = score;
            }
          });
        }

        // [핵심] 만점 기준점 설정 (Limit)
        // DB에 등록된 max_bonus_rate를 최우선으로 사용합니다.
        const limit = Number(dbInfo?.max_bonus_rate) || 6.0;

        // 내 최종 점수는 한도(limit)를 넘을 수 없음
        const finalMyScore = Math.min(myTotalScore, limit);

        // 환산 점수 계산 (30점 만점에 10점이면 33점)
        const normalizedScore = limit > 0 ? (finalMyScore / limit) * 100 : 0;

        return {
          ...job,
          instType: dbInfo?.inst_type || "기타공공기관",
          noticeName: dbInfo?.notice_name || "자체 공고 참조",
          myScore: finalMyScore,
          maxLimit: limit,
          normalizedScore,
          steps,
          isReady: rules.length > 0,
        };
      });

      const filteredAndSorted = calculated
        .filter(
          (job) => activeTab === "all" || job.instType === currentTypeName,
        )
        .sort((a, b) => {
          if (a.isReady !== b.isReady) return a.isReady ? -1 : 1;
          if (a.isReady && b.isReady) {
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
          <View
            key={item.id}
            style={[theme.card, !item.isReady && { opacity: 0.6 }]}>
            <View style={theme.cardInfo}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                <Text style={theme.cardInst}>{item.institution}</Text>
                {item.isReady && (
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
                  <View
                    style={{ flexDirection: "row", gap: 5, marginBottom: 10 }}>
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
                      가산점 {(item.myScore || 0).toFixed(1)}% /{" "}
                      {(item.maxLimit || 0).toFixed(1)}%
                    </Text>
                  </View>

                  <Text style={styles.noticeLink}>
                    * 참고: {item.noticeName}
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                  데이터 준비 중
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
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
});