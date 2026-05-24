import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../styles/theme";

interface JobCardProps {
  item: any;
  isSaved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}

export default function JobCard({
  item,
  isSaved,
  onPress,
  onToggleSave,
}: JobCardProps) {
  const isJob = item.type === "job";

  return (
    <TouchableOpacity style={theme.card} onPress={onPress}>
      <View
        style={[
          theme.cardIcon,
          { backgroundColor: isJob ? "#eef2ff" : "#fffbeb" },
        ]}>
        <Ionicons
          name={isJob ? "business-outline" : "ribbon-outline"}
          size={22}
          color={isJob ? "#4f46e5" : "#d97706"}
        />
      </View>

      <View style={theme.cardInfo}>
        <Text style={theme.cardInst}>{item.institution}</Text>
        <Text style={theme.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>

        {/* D-Day 배지 레이아웃 */}
        <View
          style={[
            theme.dDayBadge,
            item.isUrgent && { backgroundColor: "#fee2e2" },
            item.isDDay && { backgroundColor: "#eef2ff" },
            item.dDayLabel === "접수중" && { backgroundColor: "#e6f4ea" },
          ]}>
          <Text
            style={[
              theme.dDayText,
              item.isUrgent && { color: "#ef4444" },
              item.isDDay && { color: "#4f46e5" },
              item.dDayLabel === "접수중" && { color: "#137333" },
            ]}>
            {item.dDayLabel}
          </Text>
        </View>
      </View>

      {/* 별표 찜하기 버튼 */}
      <TouchableOpacity onPress={onToggleSave} style={{ padding: 10 }}>
        <Ionicons
          name={isSaved ? "star" : "star-outline"}
          size={24}
          color={isSaved ? "#f59e0b" : "#e2e8f0"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
