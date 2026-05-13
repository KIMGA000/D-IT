import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useSaved } from "../context/SavedContext";
import { fetchAlioJobs } from "../services/api";
import { supabase } from "../services/supabase";
import { theme } from "../styles/theme";
import { getStatus } from "../utils/data";

export default function HomeScreen() {
  // 1. 상태 관리
  const { savedJobs, toggleSave } = useSaved();
  const [activeTab, setActiveTab] = useState<"job" | "exam">("job");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // 2. 데이터 로드 로직
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === "job") {
          // [채용 공고 로드]
          const data = await fetchAlioJobs();
          const filtered = data.filter(
            (j) => getStatus(j.raw.pbancEndYmd) !== "마감",
          );
          setItems(filtered.sort((a, b) => a.dDay - b.dDay));
        } else {
          // 시험 일정 로드 (시작일, 마감일, 시험일, 발표일 모두 가져옴)
          const { data, error } = await supabase.from("exams").select(`
              id, target, exam_round, exam_type, 
              apply_start_date, apply_end_date, 
              exam_start_date, exam_end_date, result_dates
            `);

          if (error) throw error;

          if (data) {
            const formattedExams = data.map((ex: any) => {
              const certName = Array.isArray(ex.target)
                ? ex.target[0]
                : ex.target || "자격증";
              const isAlways = ex.exam_type === "always";

              // 날짜 포맷 (리스트 출력용)
              const start = ex.apply_start_date?.split("T")[0] || "";
              const end = ex.apply_end_date?.split("T")[0] || "";

              return {
                id: ex.id,
                type: "exam",
                title: isAlways
                  ? `${certName} (상시)`
                  : `${certName} (${ex.exam_round})`,
                institution: "자격평가사업단",
                // 리스트에는 접수 기간을 보여줌
                period: isAlways ? "연중 상시 접수" : `${start} ~ ${end}`,
                dDayValue: isAlways ? 999 : calculateDDay(ex.apply_end_date),
                raw: {
                  ...ex,
                  certName,
                  pbancEndYmd: isAlways ? "상시" : end.replace(/-/g, ""),
                },
              };
            });

            const activeExams = formattedExams
              .filter((ex) => getStatus(ex.raw.pbancEndYmd) !== "마감")
              .sort((a, b) => a.dDayValue - b.dDayValue);

            setItems(activeExams);
          }
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab]);

  const calculateDDay = (date: string) => {
    if (!date) return 999;
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // 날짜 선택 핸들러 (상시/다중 날짜용)
  const handleDateSelect = (type: string, date: string) => {
    Alert.alert(
      "일정 등록",
      `${date}에 ${type}을(를) 보시겠습니까? 내 일정에 추가됩니다.`,
    );
    // TODO: 여기서 user_exams 테이블에 저장하는 로직 추가
  };

  if (loading)
    return (
      <ActivityIndicator style={{ flex: 1 }} size="large" color="#4f46e5" />
    );

  return (
    <View style={theme.safe}>
      {/* 헤더 영역 */}
      <View style={theme.header}>
        <View style={theme.logoRow}>
          <View style={theme.logoBox}>
            <Ionicons name="locate" size={20} color="#fff" />
          </View>
          <View>
            <Text style={theme.logoText}>D-IT</Text>
            <Text style={theme.logoSub}>01Pass</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={theme.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 탭 버튼 */}
        <View style={theme.subTabBar}>
          <TouchableOpacity
            style={[
              theme.subTabBtn,
              activeTab === "job" && theme.subTabBtnActive,
            ]}
            onPress={() => setActiveTab("job")}>
            <Text
              style={[
                theme.subTabText,
                activeTab === "job" && theme.subTabTextActive,
              ]}>
              채용 공고
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              theme.subTabBtn,
              activeTab === "exam" && theme.subTabBtnActive,
            ]}
            onPress={() => setActiveTab("exam")}>
            <Text
              style={[
                theme.subTabText,
                activeTab === "exam" && theme.subTabTextActive,
              ]}>
              자격증 시험
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={theme.sectionTitle}>
          {activeTab === "job" ? "전산직 채용 공고" : "자격증 시험 일정"}
        </Text>

        {/* 리스트 렌더링 */}
        {items.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
            <Text style={{ marginTop: 10, color: "#94a3b8" }}>
              {activeTab === "job"
                ? "진행 중인 공고가 없습니다."
                : "등록된 시험 일정이 없습니다."}
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const dDayLabel = getStatus(item.raw.pbancEndYmd);
            const isSaved = savedJobs.find((j: any) => j.id === item.id);

            return (
              <TouchableOpacity
                key={item.id}
                style={theme.card}
                activeOpacity={0.8}
                onPress={() => setSelectedJob(item.raw)}>
                <View
                  style={[
                    theme.cardIcon,
                    {
                      backgroundColor:
                        item.type === "job" ? "#eef2ff" : "#fffbeb",
                    },
                  ]}>
                  <Ionicons
                    name={
                      item.type === "job"
                        ? "business-outline"
                        : "ribbon-outline"
                    }
                    size={22}
                    color={item.type === "job" ? "#4f46e5" : "#d97706"}
                  />
                </View>

                <View style={theme.cardInfo}>
                  <Text style={theme.cardInst}>{item.institution}</Text>
                  <Text style={theme.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View
                    style={[
                      theme.dDayBadge,
                      dDayLabel === "D-Day" && { backgroundColor: "#fee2e2" },
                    ]}>
                    <Text
                      style={[
                        theme.dDayText,
                        dDayLabel === "D-Day" && { color: "#ef4444" },
                      ]}>
                      {dDayLabel}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => toggleSave(item)}
                  style={{ padding: 10 }}>
                  <Ionicons
                    name={isSaved ? "star" : "star-outline"}
                    size={24}
                    color={isSaved ? "#f59e0b" : "#e2e8f0"}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* 상세 모달 */}
      <Modal visible={!!selectedJob} transparent animationType="slide">
        <View style={theme.modalOverlay}>
          <View style={theme.modalContent}>
            <TouchableOpacity
              style={{ alignSelf: "flex-end", marginBottom: 10 }}
              onPress={() => setSelectedJob(null)}>
              <Ionicons name="close" size={28} color="#1e293b" />
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={theme.modalInst}>{selectedJob?.instNm}</Text>
              <Text style={theme.modalTitle}>
                {selectedJob?.recrutPbancTtl}
              </Text>
              <View style={theme.modalDivider} />
              <Text style={theme.modalSectionTitle}>📍 응시 자격</Text>
              <Text style={theme.modalText}>{selectedJob?.aplyQlfcCn}</Text>
              <Text style={theme.modalSectionTitle}>⏰ 마감 기한</Text>
              <Text
                style={[
                  theme.modalText,
                  { color: "#ef4444", fontWeight: "700" },
                ]}>
                {selectedJob?.pbancEndYmd === "상시"
                  ? "상시 접수 가능"
                  : `${selectedJob?.pbancEndYmd} 까지`}
              </Text>
              <TouchableOpacity
                style={theme.modalLinkBtn}
                onPress={() => Linking.openURL(selectedJob?.srcUrl)}>
                <Text style={theme.modalLinkText}>원문 확인하기</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
