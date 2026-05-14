import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSaved } from "../context/SavedContext";
import { supabase } from "../services/supabase";
import { theme } from "../styles/theme";
import { getStatus } from "../utils/data";

export default function ProfileScreen() {
  const { savedJobs, toggleSave, userSpecs, addSpec, removeSpec } = useSaved();

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isCertModalVisible, setIsCertModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allCerts, setAllCerts] = useState<any[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);

  const activeSavedJobs = savedJobs.filter(
    (j) => getStatus(j.raw?.pbancEndYmd || j.raw?.apply_end_date) !== "마감",
  );

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
        .select(
          `
          standard_name,
          grades,
          aliases,
          agencies ( name, aliases )
        `,
        )
        .order("standard_name");

      if (error) throw error;

      if (data) {
        const flattened: any[] = [];
        data.forEach((cert) => {
          if (cert.grades && cert.grades.length > 0) {
            cert.grades.forEach((grade: string) => {
              flattened.push({
                ...cert,
                displayName: `${cert.standard_name} ${grade}`,
                grade: grade,
              });
            });
          } else {
            flattened.push({
              ...cert,
              displayName: cert.standard_name,
              grade: null,
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

  const filteredCerts = allCerts.filter((cert) => {
    const query = searchQuery.toLowerCase().replace(/\s/g, "");
    const nameMatch = cert.displayName
      .toLowerCase()
      .replace(/\s/g, "")
      .includes(query);
    const certAliasMatch = cert.aliases?.some((a: string) =>
      a.toLowerCase().includes(query),
    );
    return nameMatch || certAliasMatch;
  });

  return (
    <View style={theme.safe}>
      <View style={theme.header}>
        <Text style={theme.logoText}>마이페이지</Text>
      </View>

      <ScrollView
        contentContainerStyle={theme.scrollContent}
        showsVerticalScrollIndicator={false}>
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
                    {cert.displayName || cert}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeSpec(cert)}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={theme.sectionTitle}>
          관심 공고 ({activeSavedJobs.length})
        </Text>
        {activeSavedJobs.length === 0 ? (
          <View style={theme.emptyStateBox}>
            <Text style={theme.emptyStateText}>찜한 공고가 없습니다.</Text>
          </View>
        ) : (
          activeSavedJobs.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={theme.card}
              onPress={() => setSelectedJob(item.raw)}>
              <View style={theme.cardIcon}>
                <Ionicons
                  name={item.type === "job" ? "business" : "ribbon"}
                  size={22}
                  color="#4f46e5"
                />
              </View>
              <View style={theme.cardInfo}>
                <Text style={theme.cardInst}>{item.institution || ""}</Text>
                <Text style={theme.cardTitle} numberOfLines={1}>
                  {item.title || ""}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleSave(item)}
                style={{ padding: 10 }}>
                <Ionicons name="star" size={24} color="#f59e0b" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

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

      <Modal visible={!!selectedJob} transparent animationType="slide">
        <View style={theme.modalOverlay}>
          <View style={theme.modalContent}>
            <TouchableOpacity
              style={{ alignSelf: "flex-end", marginBottom: 10 }}
              onPress={() => setSelectedJob(null)}>
              <Ionicons name="close" size={28} color="#1e293b" />
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={theme.modalInst}>
                {selectedJob?.instNm || selectedJob?.institution || ""}
              </Text>
              <Text style={theme.modalTitle}>
                {selectedJob?.recrutPbancTtl ||
                  selectedJob?.certName ||
                  selectedJob?.title ||
                  ""}
              </Text>
              <View style={theme.modalDivider} />
              <Text style={theme.modalSectionTitle}>📍 상세 정보</Text>
              <Text style={theme.modalText}>
                {selectedJob?.aplyQlfcCn || "상세 내용을 확인해주세요."}
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
