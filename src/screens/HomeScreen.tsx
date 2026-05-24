import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import JobCard from "../components/JobCard";
import JobDetailModal from "../components/JobDetailModal";
import { useSaved } from "../context/SavedContext";
import { fetchAlioJobs } from "../services/api";
import { supabase } from "../services/supabase";
import { theme } from "../styles/theme";

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

          const { data: blacklistData } = await supabase
            .from("blacklists")
            .select("notice_id, company_name");

          let bannedIds: string[] = [];
          let bannedCompanyNames: string[] = [];

          if (blacklistData && blacklistData.length > 0) {
            bannedIds = blacklistData.map((b) =>
              String(b.notice_id || "").trim(),
            );
            bannedCompanyNames = blacklistData.map((b) =>
              String(b.company_name || "").replace(/[^가-힣a-zA-Z0-9]/g, ""),
            );
          }

          const processedJobs = data.map((item) => {
            let rawDateStr = String(item.raw?.pbancEndYmd || "").replace(
              /[^0-9]/g,
              "",
            );
            let displayDate = rawDateStr;

            if (rawDateStr.length === 8) {
              displayDate = `${rawDateStr.substring(0, 4)}-${rawDateStr.substring(4, 6)}-${rawDateStr.substring(6, 8)}`;
            }

            let dDayLabel = "접수중";
            let isUrgent = false;
            let isDDay = false;
            let isFinished = false;
            let sortWeight = 999;

            if (
              displayDate &&
              displayDate !== "상시" &&
              displayDate.length === 10
            ) {
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

            return {
              ...item,
              id: String(item.id || item.raw?.notice_id || "").trim(),
              type: "job",
              dDayLabel,
              isUrgent,
              isDDay,
              isFinished,
              sortWeight,
              raw: {
                ...item.raw,
                type: "job",
                pbancEndYmd: displayDate,
                instNm: item.institution,
                recrutPbancTtl: item.title,
                srcUrl: item.url,
                aplyQlfcCn: item.raw?.aplyQlfcCn || "공고 원문을 참조해주세요.",
                scrnprcdrMthdExpln:
                  item.raw?.scrnprcdrMthdExpln || "공고 원문을 참조해주세요.",
                prefCn: item.raw?.prefCn || "우대사항 정보 없음",
              },
            };
          });

          const aliveJobs = processedJobs.filter((job) => {
            const currentIdStr = String(job.id).trim();
            const cleanInstName = String(job.institution || "").replace(
              /[^가-힣a-zA-Z0-9]/g,
              "",
            );

            const isIdBanned = bannedIds.includes(currentIdStr);
            const isNameBanned = bannedCompanyNames.some(
              (bannedName) =>
                bannedName.length > 0 &&
                (cleanInstName.includes(bannedName) ||
                  bannedName.includes(cleanInstName)),
            );

            if (isIdBanned || isNameBanned) return false;
            return !job.isFinished;
          });

          setItems(aliveJobs.sort((a, b) => a.sortWeight - b.sortWeight));
        } else {
          const { data: examData, error } = await supabase.from("exams")
            .select(`
              *,
              agency:agency_id ( name, website_url ), 
              exam_certificates ( certificates ( standard_name ) )
            `);

          if (error) throw error;

          if (examData) {
            const formattedExams = examData.map((ex: any) => {
              const instName = ex.agency?.name || "주관처 정보 없음";
              const webUrl =
                ex.agency?.website_url || "https://www.q-net.or.kr";
              const certName =
                ex.exam_certificates?.[0]?.certificates?.standard_name ||
                ex.target ||
                "자격증";
              const isAlways = ex.exam_type === "always";
              const end = ex.apply_end_date?.split("T")[0] || "";

              let examDDay = "접수중";
              let exUrgent = false;
              let exDDay = false;
              let exFinished = false;
              let sortWeight = 999;

              if (!isAlways && ex.apply_end_date) {
                const diff = Math.ceil(
                  (new Date(ex.apply_end_date).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                sortWeight = diff;

                if (diff < 0) {
                  examDDay = "마감";
                  exFinished = true;
                } else if (diff === 0) {
                  examDDay = "오늘마감";
                  exUrgent = true;
                } else if (diff <= 3) {
                  examDDay = `D-${diff}`;
                  exUrgent = true;
                } else {
                  examDDay = `D-${diff}`;
                  exDDay = true;
                }
              }

              return {
                id: String(ex.id),
                type: "exam",
                title: isAlways
                  ? `${certName} (상시)`
                  : `${certName} (${ex.exam_round || ""})`,
                institution: instName,
                dDayLabel: examDDay,
                isUrgent: exUrgent,
                isDDay: exDDay,
                isFinished: exFinished,
                sortWeight,
                pbancEndYmd: isAlways ? "상시" : end,
                apply_start_date: ex.apply_start_date,
                apply_end_date: ex.apply_end_date,
                exam_start_date: ex.exam_start_date,
                exam_end_date: ex.exam_end_date,
                result_date: ex.result_date,
                srcUrl: webUrl,
              };
            });

            const aliveExams = formattedExams.filter((ex) => !ex.isFinished);
            setItems(aliveExams.sort((a, b) => a.sortWeight - b.sortWeight));
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

  const handleItemPress = (clickedItem: any) => {
    if (clickedItem.type === "exam") {
      setSelectedItem({ ...clickedItem });
    } else {
      setSelectedItem({ ...clickedItem.raw });
    }
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

        {items.map((item) => (
          <JobCard
            key={item.id}
            item={item}
            isSaved={!!savedJobs.find((j: any) => j.id === item.id)}
            onPress={() => handleItemPress(item)}
            onToggleSave={() => toggleSave(item)}
          />
        ))}
      </ScrollView>

      <JobDetailModal
        isVisible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />
    </View>
  );
}
