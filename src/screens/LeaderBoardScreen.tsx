import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../services/supabase";
import { Ionicons } from "@expo/vector-icons";

interface LeaderboardEntry {
  display_name: string;
  level: number;
  xp: number;
  avatar_accessory: string | null;
  isCurrentUser: boolean;
}

export default function LeaderBoardScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchLeaderboard();
    }, []),
  );

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, level, xp")
        .order("xp", { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped: LeaderboardEntry[] = (data || []).map((p) => ({
        display_name: p.display_name || "Anonymous",
        level: p.level,
        xp: p.xp,
        avatar_accessory: null,
        isCurrentUser: p.user_id === user?.id,
      }));

      setEntries(mapped);
    } catch (e) {
      console.error("Leaderboard error", e);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColour = (index: number) => {
    if (index === 0) return "#FFD700";
    if (index === 1) return "#C0C0C0";
    if (index == 2) return "#CD7F32";
    return "#8e8e93";
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7ed957" />
      </View>
    );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Top habit builders globally</Text>
      </View>

      {entries.length >= 3 && (
        <View style={styles.podium}>
          {[1, 0, 2].map((pos) => (
            <View
              key={pos}
              style={[styles.podiumItem, pos === 0 && styles.podiumFirst]}
            >
              <Text style={styles.podiumMedal}>
                {pos === 0 ? "🥇" : pos === 1 ? "🥈" : "🥉"}
              </Text>
              <View
                style={[
                  styles.podiumAvatar,
                  { borderColor: getMedalColour(pos) },
                ]}
              >
                <Text style={styles.podiumAvatarText}>
                  {entries[pos].display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>
                {entries[pos].display_name}
              </Text>
              <Text style={styles.podiumXP}>{entries[pos].xp} XP</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.listContainer}>
        {entries.map((entry, index) => (
          <View
            key={index}
            style={[styles.row, entry.isCurrentUser && styles.currentUserRow]}
          >
            <Text style={[styles.rank, { color: getMedalColour(index) }]}>
              #{index + 1}
            </Text>
            <View
              style={[styles.avatar, { borderColor: getMedalColour(index) }]}
            >
              <Text style={styles.avatarText}>
                {entry.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>
                {entry.display_name}
                {entry.isCurrentUser && (
                  <Text style={styles.youBadge}> (you)</Text>
                )}
              </Text>
              <Text style={styles.level}>Level {entry.level}</Text>
            </View>
            <Text style={styles.xp}>{entry.xp} XP</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#1A1A1A" },
  headerSubtitle: { fontSize: 15, color: "#8e8e93" },

  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  podiumItem: { alignItems: "center", flex: 1 },
  podiumFirst: { marginBottom: 16 },
  podiumMedal: { fontSize: 24, marginBottom: 4 },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1A1A1A",
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  podiumAvatarText: { color: "white", fontSize: 22, fontWeight: "bold" },
  podiumName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 4,
  },
  podiumXP: { fontSize: 11, color: "#8e8e93" },

  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    elevation: 1,
  },
  currentUserRow: { borderWidth: 2, borderColor: "#7ed957" },
  rank: { width: 32, fontWeight: "bold", fontSize: 14 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "white", fontWeight: "bold" },
  info: { flex: 1 },
  name: { fontWeight: "600", fontSize: 14, color: "#1A1A1A" },
  youBadge: { color: "#7ed957", fontSize: 12 },
  level: { fontSize: 12, color: "#8e8e93" },
  xp: { fontWeight: "bold", color: "#7ed957", fontSize: 14 },
});
