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
} from "react-native";
import { useSaved } from "../context/SavedContext";
import { fetchAlioJobs } from "../services/api";
import { supabase } from "../services/supabase";
import { theme } from "../styles/theme";
import { getStatus } from "../utils/data";

export default function HomeScreen() {
  const { savedJobs, toggleSave } = useSaved();
  const [activeTab, setActiveTab] = useState<"job" | "exam">("job");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === "job") {
          const data = await fetchAlioJobs();
          const filtered = data.filter(
            (j) => getStatus(j.raw.pbancEndYmd) !== "마감",
          );
          setItems(filtered.sort((a, b) => a.dDay - b.dDay));
        } else {
          const { data, error } = await supabase.from("exams").select(`
              *,
              agency:agency_id ( name ), 
              exam_certificates (
                certificates ( standard_name )
              )
            `);

          if (error) throw error;

          if (data) {
            const formattedExams = data.map((ex: any) => {
              const instName = ex.agency?.name || "주관처 정보 없음";
              const certList = ex.exam_certificates || [];
              const certName =
                certList[0]?.certificates?.standard_name ||
                (Array.isArray(ex.target)
                  ? ex.target[0]
                  : ex.target || "자격증");

              const isAlways = ex.exam_type === "always";
              const start = ex.apply_start_date?.split("T")[0] || "";
              const end = ex.apply_end_date?.split("T")[0] || "";

              const targetLabel = Array.isArray(ex.target)
                ? ex.target.join(", ")
                : ex.target || "";

              const title =
                certList.length > 1
                  ? `${targetLabel} (${certName} 외 ${certList.length - 1}건)`
                  : isAlways
                    ? `${certName} (상시)`
                    : `${certName} (${ex.exam_round || ""})`;

              return {
                id: ex.id,
                type: "exam",
                title: title,
                institution: instName,
                period: isAlways ? "연중 상시 접수" : `${start} ~ ${end}`,
                dDayValue: isAlways ? 999 : calculateDDay(ex.apply_end_date),
                raw: {
                  ...ex,
                  certName,
                  instNm: instName,
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

  if (loading) {
    return (
      <ActivityIndicator style={{ flex: 1 }} size="large" color="#4f46e5" />
    );
  }

  return (
    <View style={theme.safe}>
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

        {items.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
            <Text style={{ marginTop: 10, color: "#94a3b8" }}>
              정보가 없습니다.
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
                  <Text style={theme.cardInst}>{item.institution || ""}</Text>
                  <Text style={theme.cardTitle} numberOfLines={1}>
                    {item.title || ""}
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
                      {dDayLabel || ""}
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

      <Modal visible={!!selectedJob} transparent animationType="slide">
        <View style={theme.modalOverlay}>
          <View style={theme.modalContent}>
            <TouchableOpacity
              style={{ alignSelf: "flex-end", marginBottom: 10 }}
              onPress={() => setSelectedJob(null)}>
              <Ionicons name="close" size={28} color="#1e293b" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={theme.modalInst}>{selectedJob?.instNm || ""}</Text>
              <Text style={theme.modalTitle}>
                {selectedJob?.recrutPbancTtl || selectedJob?.certName || ""}
              </Text>
              <View style={theme.modalDivider} />

              <Text style={theme.modalSectionTitle}>📍 상세 정보</Text>
              <Text style={theme.modalText}>
                {selectedJob?.aplyQlfcCn || "상세 공고 내용을 확인해주세요."}
              </Text>

              <Text style={theme.modalSectionTitle}>⏰ 마감 기한</Text>
              <Text style={{ color: "#ef4444", fontWeight: "700" }}>
                {selectedJob?.pbancEndYmd === "상시"
                  ? "상시 접수 가능"
                  : `${selectedJob?.pbancEndYmd || ""} 까지`}
              </Text>

              <TouchableOpacity
                style={theme.modalLinkBtn}
                onPress={() =>
                  Linking.openURL(
                    selectedJob?.srcUrl || "https://www.q-net.or.kr",
                  )
                }>
                <Text style={theme.modalLinkText}>공고/시험 원문 확인하기</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
