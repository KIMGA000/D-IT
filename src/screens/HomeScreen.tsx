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
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === "job") {
          const data = await fetchAlioJobs();
          const filtered = data.filter(
            (j) => getStatus(j.raw.pbancEndYmd) !== "마감",
          );
          setItems(
            filtered
              .sort((a, b) => a.dDay - b.dDay)
              .map((item) => ({ ...item, type: "job" })),
          );
        } else {
          const { data, error } = await supabase.from("exams").select(`
              *,
              agency:agency_id ( name, website_url ), 
              exam_certificates (
                certificates ( standard_name )
              )
            `);

          if (error) throw error;

          if (data) {
            const formattedExams = data.map((ex: any) => {
              const instName = ex.agency?.name || "주관처 정보 없음";
              const webUrl =
                ex.agency?.website_url || "https://www.q-net.or.kr";
              const certList = ex.exam_certificates || [];
              const certName =
                certList[0]?.certificates?.standard_name ||
                (Array.isArray(ex.target)
                  ? ex.target[0]
                  : ex.target || "자격증");
              const isAlways = ex.exam_type === "always";
              const end = ex.apply_end_date?.split("T")[0] || "";

              return {
                id: ex.id,
                type: "exam",
                title: isAlways
                  ? `${certName} (상시)`
                  : `${certName} (${ex.exam_round || ""})`,
                institution: instName,
                dDayValue: isAlways ? 999 : calculateDDay(ex.apply_end_date),
                raw: {
                  ...ex,
                  type: "exam",
                  certName,
                  instNm: instName,
                  srcUrl: webUrl,
                  pbancEndYmd: isAlways ? "상시" : end.replace(/-/g, ""),
                },
              };
            });
            setItems(
              formattedExams
                .filter((ex) => getStatus(ex.raw.pbancEndYmd) !== "마감")
                .sort((a, b) => a.dDayValue - b.dDayValue),
            );
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return dateStr.split("T")[0];
  };

  if (loading)
    return (
      <ActivityIndicator style={{ flex: 1 }} size="large" color="#4f46e5" />
    );

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

        {items.map((item) => {
          const dDayLabel = getStatus(item.raw.pbancEndYmd);
          const isSaved = savedJobs.find((j: any) => j.id === item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={theme.card}
              onPress={() => setSelectedItem(item.raw)}>
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
                    item.type === "job" ? "business-outline" : "ribbon-outline"
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
        })}
      </ScrollView>

      <Modal visible={!!selectedItem} transparent animationType="slide">
        <View style={theme.modalOverlay}>
          <View style={theme.modalContent}>
            <TouchableOpacity
              style={{ alignSelf: "flex-end", marginBottom: 10 }}
              onPress={() => setSelectedItem(null)}>
              <Ionicons name="close" size={28} color="#1e293b" />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={theme.modalInst}>{selectedItem?.instNm}</Text>
              <Text style={theme.modalTitle}>
                {selectedItem?.recrutPbancTtl || selectedItem?.certName}
              </Text>
              <View style={theme.modalDivider} />

              {selectedItem?.type === "exam" ? (
                <>
                  <Text style={theme.modalSectionTitle}>📅 시험 상세 일정</Text>
                  <View
                    style={{
                      backgroundColor: "#f8fafc",
                      padding: 15,
                      borderRadius: 12,
                      gap: 12,
                    }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}>
                      <Text style={{ color: "#64748b", fontWeight: "600" }}>
                        원서 접수
                      </Text>
                      <Text style={{ color: "#1e293b" }}>
                        {selectedItem?.apply_start_date
                          ? `${formatDate(selectedItem.apply_start_date)} ~ ${formatDate(selectedItem.apply_end_date)}`
                          : "상시 접수"}
                      </Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: "#e2e8f0" }} />
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}>
                      <Text style={{ color: "#64748b", fontWeight: "600" }}>
                        필기 시험
                      </Text>
                      <Text style={{ color: "#1e293b" }}>
                        {formatDate(selectedItem?.exam_start_date) ||
                          "일정 확인 필요"}
                      </Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: "#e2e8f0" }} />
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}>
                      <Text style={{ color: "#64748b", fontWeight: "600" }}>
                        실기 시험
                      </Text>
                      <Text style={{ color: "#1e293b" }}>
                        {formatDate(selectedItem?.exam_end_date) || "-"}
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <Text style={theme.modalSectionTitle}>
                    📍 채용 공고 상세 정보
                  </Text>
                  <Text style={theme.modalText}>
                    {selectedItem?.aplyQlfcCn ||
                      "상세 공고 내용을 확인해주세요."}
                  </Text>
                </>
              )}

              <Text style={[theme.modalSectionTitle, { marginTop: 20 }]}>
                ⏰ 마감 기한
              </Text>
              <Text style={{ color: "#ef4444", fontWeight: "700" }}>
                {selectedItem?.pbancEndYmd === "상시"
                  ? "상시 접수 가능"
                  : `${selectedItem?.pbancEndYmd || ""} 까지`}
              </Text>

              <TouchableOpacity
                style={theme.modalLinkBtn}
                onPress={() =>
                  Linking.openURL(
                    selectedItem?.srcUrl || "https://www.q-net.or.kr",
                  )
                }>
                <Text style={theme.modalLinkText}>
                  {selectedItem?.type === "exam"
                    ? "시험 원문 확인하기"
                    : "채용 공고 원문 확인하기"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
