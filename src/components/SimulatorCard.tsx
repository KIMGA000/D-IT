import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../styles/theme";

interface SimulatorCardProps {
  item: any;
  onPress: () => void;
}

export default function SimulatorCard({ item, onPress }: SimulatorCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
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
            {/* 응시 필수 자격 음영 블록 박스 조건부 노출 */}
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
                    color={item.analysis.isEligible ? "#166534" : "#991b1b"}
                  />
                  <Text
                    style={[
                      styles.requiredTitleText,
                      {
                        color: item.analysis.isEligible ? "#166534" : "#991b1b",
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

            {/* ① 전형 구분용 뱃지 목록 */}
            {item.hasBonusRules && item.steps.length > 0 && (
              <View style={{ flexDirection: "row", gap: 5 }}>
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

            {/* 가산점 단일 프로그레스 바 */}
            {item.hasBonusRules && (
              <View style={theme.progressContainer}>
                <View
                  style={[
                    theme.progressFill,
                    { width: `${Math.min(item.normalizedScore || 0, 100)}%` },
                  ]}
                />
                <Text style={theme.progressText}>
                  가산점 {item.myScore.toFixed(1)}
                  {item.unit} / {item.maxLimit.toFixed(1)}
                  {item.unit} 반영
                </Text>
              </View>
            )}

            {/* 참고 공고 출처 및 팁 */}
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
});
