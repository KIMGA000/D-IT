import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import JobCard from "../components/JobCard";
import JobDetailModal from "../components/JobDetailModal";
import { useSaved } from "../context/SavedContext";
import { supabase } from "../services/supabase";
import { theme } from "../styles/theme";

export default function ProfileScreen() {
  const { savedJobs, toggleSave, userSpecs, addSpec, removeSpec } = useSaved();

  const [activeTab, setActiveTab] = useState<"job" | "exam">("job");
  const [isCertModalVisible, setIsCertModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allCerts, setAllCerts] = useState<any[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [selectedItem, setSelectedDetail] = useState<any>(null);

  useEffect(() => {
    if (isCertModalVisible) {
      loadCertificates();
    }
  }, [isCertModalVisible]);

  const loadCertificates = async () => {
    setLoadingCerts(true);
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select(`standard_name, grades, aliases, agencies ( name, aliases )`)
        .order("standard_name");

      if (error) throw error;

      if (data) {
        const flattened: any[] = [];
        data.forEach((cert) => {
          if (cert.grades && cert.grades.length > 1) {
            cert.grades.forEach((grade: string) => {
              flattened.push({
                ...cert,
                displayName: `${cert.standard_name} ${grade}`, // 멀티 급수만 이름 뒤에 등급 명시
                grade: grade,
              });
            });
          } else {
            flattened.push({
              ...cert,
              displayName: cert.standard_name,
              grade:
                cert.grades && cert.grades.length === 1 ? cert.grades[0] : null,
            });
          }
        });
        setAllCerts(flattened);
      }
    } catch (err: any) {
      console.error("자격증 로드 실패:", err.message);
    } finally {
      setLoadingCerts(false);
    }
  };

  const getProcessedSavedItems = () => {
    const filteredByTab = savedJobs.filter((j) => j && j.type === activeTab);

    const mapped = filteredByTab.map((item: any) => {
      let targetDateSrc = "";

      if (item?.type === "job") {
        targetDateSrc = item.raw?.pbancEndYmd || "";
      } else {
        targetDateSrc = item["apply_end_date"] || item?.apply_end_date || "";
      }

      let rawDateStr = String(targetDateSrc || "")
        .split("T")[0]
        .replace(/[^0-9]/g, "");
      let displayDate = rawDateStr;

      if (rawDateStr.length === 8) {
        displayDate = `${rawDateStr.substring(0, 4)}-${rawDateStr.substring(4, 6)}-${rawDateStr.substring(6, 8)}`;
      }

      let dDayLabel = "접수중";
      let isUrgent = false;
      let isDDay = false;
      let isFinished = false;
      let sortWeight = 999;

      if (displayDate && displayDate !== "상시" && displayDate.length === 10) {
        const target = new Date(displayDate);
        const today = new Date();
        target.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (!isNaN(target.getTime())) {
          const diffDays = Math.ceil(
            (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          sortWeight = diffDays;

          if (diffDays < 0) {
            dDayLabel = "마감";
            isFinished = true;
          } else if (diffDays === 0) {
            dDayLabel = "오늘마감";
            isUrgent = true;
          } else if (diffDays <= 3) {
            dDayLabel = `D-${diffDays}`;
            isUrgent = true;
          } else {
            dDayLabel = `D-${diffDays}`;
            isDDay = true;
          }
        }
      }

      if (targetDateSrc === "상시") {
        dDayLabel = "상시";
        sortWeight = 9999;
      }

      return {
        ...item,
        dDayLabel,
        isUrgent,
        isDDay,
        isFinished,
        sortWeight,
      };
    });

    return mapped
      .filter((item) => !item.isFinished)
      .sort((a, b) => a.sortWeight - b.sortWeight);
  };

  const displaySavedItems = getProcessedSavedItems();

  const filteredCerts = allCerts.filter((cert) => {
    const query = searchQuery.toLowerCase().replace(/\s/g, "");
    const nameMatch = cert.displayName
      .toLowerCase()
      .replace(/\s/g, "")
      .includes(query);
    return (
      nameMatch ||
      cert.aliases?.some((a: string) => a.toLowerCase().includes(query))
    );
  });

  const handleItemPress = (item: any) => {
    if (item && item.type === "exam") {
      setSelectedDetail({ ...item });
    } else if (item) {
      setSelectedDetail({ ...item.raw });
    }
  };

  return (
    <View style={theme.safe}>
      <View style={theme.header}>
        <Text style={theme.logoText}>마이페이지</Text>
      </View>

      <ScrollView
        contentContainerStyle={theme.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 보유 자격증 등록 세션 */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
          }}>
          <Text style={theme.sectionTitle}>나의 보유 자격증</Text>
          <TouchableOpacity
            onPress={() => setIsCertModalVisible(true)}
            style={{
              backgroundColor: "#4f46e5",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
            }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>
              + 자격증 추가
            </Text>
          </TouchableOpacity>
        </View>

        {userSpecs.certificates.length === 0 ? (
          <View style={[theme.emptyStateBox, { marginBottom: 30 }]}>
            <Ionicons name="ribbon-outline" size={40} color="#cbd5e1" />
            <Text style={theme.emptyStateText}>등록된 자격증이 없습니다.</Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginBottom: 30 }}>
            {userSpecs.certificates.map((cert: any, index: number) => (
              <View
                key={index}
                style={[
                  theme.card,
                  {
                    paddingVertical: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  },
                ]}>
                <Ionicons
                  name="ribbon"
                  size={20}
                  color="#4f46e5"
                  style={{ marginRight: 10 }}
                />
                <View style={theme.cardInfo}>
                  <Text style={theme.cardTitle}>
                    {cert.displayName || cert.standard_name || cert}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeSpec(cert)}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* 관심 공고 및 자격증 이원화 탭바 구역 */}
        <View style={[theme.subTabBar, { marginBottom: 15 }]}>
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
              관심 채용공고
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
              관심 자격증일정
            </Text>
          </TouchableOpacity>
        </View>

        {displaySavedItems.length === 0 ? (
          <View style={theme.emptyStateBox}>
            <Text style={theme.emptyStateText}>
              {activeTab === "job"
                ? "찜한 채용 공고가 없습니다."
                : "찜한 자격증 일정이 없습니다."}
            </Text>
          </View>
        ) : (
          displaySavedItems.map((item) => (
            <JobCard
              key={item.id}
              item={item}
              isSaved={true}
              onPress={() => handleItemPress(item)}
              onToggleSave={() => toggleSave(item)}
            />
          ))
        )}
      </ScrollView>

      {/* 공통 상세 모달 컴포넌트 결합 */}
      <JobDetailModal
        isVisible={!!selectedItem}
        onClose={() => setSelectedDetail(null)}
        item={selectedItem}
      />

      {/* 자격증 검색 추가 팝업 */}
      <Modal visible={isCertModalVisible} animationType="slide" transparent>
        <View style={theme.modalOverlay}>
          <View style={[theme.modalContent, { height: "80%" }]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}>
              <Text style={theme.modalSectionTitle}>자격증 검색</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsCertModalVisible(false);
                  setSearchQuery("");
                }}>
                <Ionicons name="close" size={28} color="#1e293b" />
              </TouchableOpacity>
            </View>
            <View
              style={{
                backgroundColor: "#f1f5f9",
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                marginBottom: 15,
              }}>
              <Ionicons name="search" size={20} color="#94a3b8" />
              <TextInput
                style={{ flex: 1, padding: 12, fontSize: 14 }}
                placeholder="자격증 명칭 혹은 별칭 (예: 한능검, 컴활)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            {loadingCerts ? (
              <ActivityIndicator
                size="large"
                color="#4f46e5"
                style={{ marginTop: 20 }}
              />
            ) : (
              <FlatList
                data={filteredCerts}
                keyExtractor={(item, index) =>
                  `${item.standard_name}-${item.grade}-${index}`
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      paddingVertical: 15,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f1f5f9",
                    }}
                    onPress={() => {
                      addSpec(item);
                      setIsCertModalVisible(false);
                      setSearchQuery("");
                    }}>
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#1e293b",
                          fontWeight: "600",
                        }}>
                        {item.displayName}
                      </Text>
                      {item.agencies && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#94a3b8",
                            marginTop: 4,
                          }}>
                          {item.agencies.name}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
