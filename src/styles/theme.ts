// src/styles/theme.ts
import { StyleSheet, Platform, StatusBar } from "react-native";

export const theme = StyleSheet.create({
  // --- 기존 스타일 유지 ---
  safe: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: {
    width: 38,
    height: 38,
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "3deg" }],
  },
  logoText: {
    fontSize: 22,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#1e293b",
  },
  logoSub: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6366f1",
    textTransform: "uppercase",
  },
  subTabBar: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    padding: 4,
    borderRadius: 16,
    marginBottom: 16,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  subTabBtnActive: {
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subTabText: { fontSize: 13, fontWeight: "800", color: "#64748b" },
  subTabTextActive: { color: "#4f46e5" },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#1e293b",
    marginVertical: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1, marginLeft: 14 },
  cardInst: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 2,
  },
  dDayBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  dDayText: { fontSize: 10, fontWeight: "900", color: "#4f46e5" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

  // --- 시뮬레이터 전용 추가 스타일 (가영님 공부용!) ---

  /**
   * 1. 전형 선택 토글 버튼 (필기/면접)
   * 카드 내부에서 탭처럼 쓰이는 버튼들입니다.
   */
  stepToggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  stepBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  stepBadgeActive: {
    backgroundColor: "#4f46e5",
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
  },
  stepBadgeTextActive: {
    color: "#fff",
  },

  /**
   * 2. 가산점 프로그레스 바 (충전율 그래프)
   * "다 채우면 100점" 로직을 시각적으로 보여주는 막대기입니다.
   */
  progressContainer: {
    height: 20,
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    overflow: "hidden",
    marginVertical: 10,
    position: "relative",
    justifyContent: "center",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 10,
  },
  progressText: {
    position: "absolute",
    alignSelf: "center",
    fontSize: 10,
    fontWeight: "900",
    color: "#1e293b",
    zIndex: 1,
  },

  /**
   * 3. 빈 데이터/준비 중 상태
   * 자격증이 없거나 규칙이 없을 때 띄우는 안내 스타일입니다.
   */
  emptyStateBox: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginTop: 10,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
    textAlign: "center",
  },

  // --- 기존 상세 모달 스타일 ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: "80%",
  },
  modalInst: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6366f1",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 20,
    lineHeight: 26,
  },
  modalDivider: { height: 1, backgroundColor: "#f1f5f9", marginBottom: 20 },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 20,
    marginBottom: 8,
  },
  modalText: { fontSize: 13, color: "#64748b", lineHeight: 20 },
  modalLinkBtn: {
    backgroundColor: "#4f46e5",
    padding: 18,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10,
  },
  modalLinkText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
