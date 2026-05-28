import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SimulatorDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedDetail: any;
}

export default function SimulatorDetailModal({
  isVisible,
  onClose,
  selectedDetail,
}: SimulatorDetailModalProps) {
  if (!selectedDetail) return null;

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              {selectedDetail.institution} 상세 명세서
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}>
            {/* 필수 응시 자격 가이드 세션 */}
            {selectedDetail.hasRequiredRule && (
              <View
                style={[
                  styles.sectionBox,
                  {
                    backgroundColor: selectedDetail.analysis.isEligible
                      ? "#f0fdf4"
                      : "#fef2f2",
                    marginBottom: 15,
                  },
                ]}>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      color: selectedDetail.analysis.isEligible
                        ? "#166534"
                        : "#991b1b",
                    },
                  ]}>
                  {selectedDetail.analysis.isEligible
                    ? `🟢 ${selectedDetail.requiredConditionText} 자격 충족`
                    : `🔴 ${selectedDetail.requiredConditionText} 자격 미달`}
                </Text>
                <Text style={styles.sectionDesc}>
                  지원직무 필수 충족 요건 자격증 보유 현황
                </Text>
                <View style={{ marginTop: 8, gap: 6 }}>
                  {selectedDetail.analysis.requiredDetails.map(
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

            {/* 📄/✍️/🗣️ 전형별 가산점 리스트 루프 렌더링 */}
            {[
              {
                title: "📄 서류 전형 가산점 명세",
                details: selectedDetail.analysis?.documentDetails,
              },
              {
                title: "✍️ 필기 전형 가산점 명세",
                details: selectedDetail.analysis?.writtenDetails,
              },
              {
                title: "🗣️ 면접 전형 가산점 명세",
                details: selectedDetail.analysis?.interviewDetails,
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
                <View key={sIdx} style={[styles.sectionBox, { marginTop: 15 }]}>
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
                          <Text style={{ color: "#b45309", fontWeight: "500" }}>
                            +{d.potentialScore}
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
  );
}

const styles = StyleSheet.create({
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
