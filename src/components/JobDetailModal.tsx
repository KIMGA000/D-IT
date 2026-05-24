import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../styles/theme";

interface JobDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  item: any;
}

export default function JobDetailModal({
  isVisible,
  onClose,
  item,
}: JobDetailModalProps) {
  if (!item) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return dateStr.split("T")[0];
  };

  const isExam = item.type === "exam";

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={theme.modalOverlay}>
        <View style={theme.modalContent}>
          {/* 닫기 버튼 */}
          <TouchableOpacity
            style={{ alignSelf: "flex-end", marginBottom: 10 }}
            onPress={onClose}>
            <Ionicons name="close" size={28} color="#1e293b" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={theme.modalInst}>
              {item.instNm || item.institution}
            </Text>
            <Text style={theme.modalTitle}>
              {item.recrutPbancTtl || item.title}
            </Text>
            <View style={theme.modalDivider} />

            {isExam ? (
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableHeader}>전형 구분 항목</Text>
                  <Text style={styles.tableHeader}>상세 진행 일정</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>원서 접수 기한</Text>
                  <Text style={styles.tableValue}>
                    {item.apply_start_date
                      ? `${formatDate(item.apply_start_date)} ~ ${formatDate(item.apply_end_date)}`
                      : "상시 접수 진행 중"}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>필기 시험 일자</Text>
                  <Text style={styles.tableValue}>
                    {formatDate(item.exam_start_date) || "상세 일정 참조"}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>실기 시험 일자</Text>
                  <Text style={styles.tableValue}>
                    {formatDate(item.exam_end_date) || "-"}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>최종 합격 발표</Text>
                  <Text style={styles.tableValue}>
                    {formatDate(item.result_date) || "-"}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>
                    🎓 1. 필수 지원 및 응시 자격 요건
                  </Text>
                  <View style={styles.sectionBody}>
                    <Text style={styles.modalText}>
                      {item.aplyQlfcCn?.trim() ||
                        "상세 자격조건은 공고 원문을 참조해주세요."}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>
                    📋 2. 전형 단계 및 절차 운영 방식
                  </Text>
                  <View style={styles.sectionBody}>
                    <Text style={styles.modalText}>
                      {item.scrnprcdrMthdExpln?.trim() ||
                        "상세 전형절차는 공고 원문을 참조해주세요."}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>
                    🎯 3. 우대사항 및 자격증 가점 기준
                  </Text>
                  <View style={styles.sectionBody}>
                    <Text style={styles.modalText}>
                      {item.prefCn?.trim() ||
                        "상세 우대사항은 공고 원문을 참조해주세요."}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={[styles.modalSectionTitle, { marginTop: 20 }]}>
              ⏰ 마감 기한
            </Text>
            <Text
              style={{ color: "#ef4444", fontWeight: "700", marginBottom: 15 }}>
              {item.pbancEndYmd === "상시"
                ? "상시 접수 가능"
                : `${item.pbancEndYmd || ""} 까지`}
            </Text>

            <TouchableOpacity
              style={theme.modalLinkBtn}
              onPress={() =>
                Linking.openURL(
                  item.srcUrl || item.url || "https://job.alio.go.kr",
                )
              }>
              <Text style={theme.modalLinkText}>
                {isExam ? "시험 원문 확인하기" : "채용 공고 원문 확인하기"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
  },
  infoSection: { marginBottom: 4 },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: "#4f46e5",
    marginBottom: 6,
  },
  sectionBody: {
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalText: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 20,
    fontWeight: "500",
  },
  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
    marginTop: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  tableHeader: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f8fafc",
    fontWeight: "700",
    textAlign: "center",
    color: "#475569",
    fontSize: 13,
  },
  tableLabel: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f8fafc",
    fontWeight: "600",
    color: "#64748b",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 13,
  },
  tableValue: {
    flex: 2,
    padding: 12,
    color: "#1e293b",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
  },
});
