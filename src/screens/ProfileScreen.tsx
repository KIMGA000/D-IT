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
    (j) => getStatus(j.raw.pbancEndYmd) !== "마감",
  );

  useEffect(() => {
    if (isCertModalVisible) {
      loadCertificates();
    }
  }, [isCertModalVisible]);

  /**
   * [수정] 정규화된 DB 구조에 맞게 '조인(Join)' 쿼리 사용
   * certificates 테이블에서 agencies 정보를 함께 가져옵니다.
   */
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
        // [핵심] 등급(grades) 배열을 풀어서 개별 자격증 객체로 변환
        const flattened: any[] = [];

        data.forEach((cert) => {
          if (cert.grades && cert.grades.length > 0) {
            // 등급이 있는 경우 (예: 한국사 1급, 2급...)
            cert.grades.forEach((grade: string) => {
              flattened.push({
                ...cert,
                // 화면에 표시될 전체 이름 생성
                displayName: `${cert.standard_name} ${grade}`,
                grade: grade, // 나중에 계산을 위해 등급 정보 따로 저장
              });
            });
          } else {
            // 등급이 없는 단일 자격증인 경우
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

    // 이제 displayName(한국사능력검정시험 1급)을 기준으로 검색
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
        {/* --- 섹션 1: 나의 보유 자격증 관리 --- */}
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
              <View key={index} style={[theme.card, { paddingVertical: 12 }]}>
                <Ionicons
                  name="ribbon"
                  size={20}
                  color="#4f46e5"
                  style={{ marginRight: 10 }}
                />
                <View style={theme.cardInfo}>
                  {/* [수정!] cert가 객체이므로 displayName을 출력해야 합니다. */}
                  <Text style={theme.cardTitle}>
                    {cert.displayName || cert}
                  </Text>
                </View>
                {/* [수정!] 삭제 시에도 객체를 넘겨야 context에서 정확히 찾아 지웁니다. */}
                <TouchableOpacity onPress={() => removeSpec(cert)}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* --- 섹션 2: 나의 관심 공고 (찜) --- */}
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
                <Ionicons name="business" size={22} color="#4f46e5" />
              </View>
              <View style={theme.cardInfo}>
                <Text style={theme.cardInst}>{item.institution}</Text>
                <Text style={theme.cardTitle} numberOfLines={1}>
                  {item.title}
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

      {/* --- 자격증 검색 및 추가 모달 --- */}
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
                      // [중요] string이 아닌 객체 {standard_name, grade} 형태로 저장 추천
                      // 만약 기존 context가 string 배열만 받는다면 item.displayName을 넘기세요.
                      addSpec({
                        standard_name: item.standard_name,
                        grade: item.grade,
                        displayName: item.displayName,
                      });
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

      {/* 상세 공고 모달 (생략된 기존 코드 유지) */}
      {selectedJob && (
        <Modal visible={!!selectedJob} transparent animationType="slide">
          {/* ... (이전과 동일한 상세 모달 코드) ... */}
        </Modal>
      )}
    </View>
  );
}
