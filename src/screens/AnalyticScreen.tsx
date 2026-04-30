import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { supabase } from "../services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { generateAIInsights, AIInsight } from "../services/aiService";

const screenWidth = Dimensions.get("window").width;

interface AnalyticsData {
  totalCompletions: number;
  weeklyCompletions: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  dailyData: number[];
  topHabits: { title: string; count: number }[];
  labels: string[];
}

export default function AnalyticScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  useFocusEffect(
    React.useCallback(() => {
      fetchAnalytics();
      fadeAnim.setValue(0);
      slideUp.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideUp, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, []),
  );

  const handleGenerateInsights = async () => {
    if (!data) return;

    setGeneratingInsight(true);
    try {
      const insights = await generateAIInsights(
        data.totalCompletions,
        data.weeklyCompletions,
        data.completionRate,
        data.longestStreak,
        data.topHabits,
      );

      if (insights) {
        setAiInsights(insights);
      } else {
        alert("Failed to generate insights. Please try again.");
      }
    } catch (error) {
      console.error("AI Insight Error:", error);
    } finally {
      setGeneratingInsight(false);
    }
  };

  const getStaticInsights = () => {
    if (!data) return null;

    const bestDayIndex = data.dailyData.indexOf(Math.max(...data.dailyData));
    const worstDayIndex = data.dailyData.indexOf(Math.min(...data.dailyData));
    const mostConsistent = data.topHabits[0]?.title || null;

    return {
      bestDay: data.labels[bestDayIndex] || "N/A",
      worstDay: data.labels[worstDayIndex] || "N/A",
      mostConsistent,
    };
  };

  const fetchAnalytics = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch data from Supabase
      const [{ data: logs }, { data: habits }] = await Promise.all([
        supabase
          .from("habit_logs")
          .select("completed_at, habit_id")
          .eq("user_id", user.id),
        supabase
          .from("habits")
          .select("id, title, streak")
          .eq("user_id", user.id),
      ]);

      if (!logs || !habits) {
        setLoading(false);
        return;
      }

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dailyData: number[] = [];
      const labels: string[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        const count = logs.filter((log) => {
          const logDate = new Date(log.completed_at);
          return logDate >= d && logDate < nextD;
        }).length;

        dailyData.push(count);
        labels.push(dayNames[d.getDay()]);
      }

      const totalCompletions = logs.length;
      const weeklyCompletions = dailyData.reduce((a, b) => a + b, 0);

      const longestStreak =
        habits.length > 0 ? Math.max(...habits.map((h) => h.streak || 0)) : 0;

      const currentStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0);

      const totalPossibleWeekly = habits.length * 7;
      const completionRate =
        totalPossibleWeekly > 0
          ? (weeklyCompletions / totalPossibleWeekly) * 100
          : 0;

      const topHabits = habits
        .map((habit) => ({
          title: habit.title,
          count: logs.filter((l) => l.habit_id === habit.id).length,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setData({
        totalCompletions,
        weeklyCompletions,
        currentStreak,
        longestStreak,
        completionRate,
        dailyData,
        labels,
        topHabits,
      });
    } catch (e) {
      console.error("Error fetching analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(126, 217, 87, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7ed957" />
      </View>
    );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideUp }] }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Personalised AI Insights</Text>
        </View>

        <View style={styles.aiSection}>
          {!aiInsights && !generatingInsight && (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateInsights}
            >
              <Ionicons name="sparkles-sharp" size={20} color="white" />
              <Text style={styles.generateButtonText}>Get AI Analysis</Text>
            </TouchableOpacity>
          )}

          {generatingInsight && (
            <View style={styles.insightsLoading}>
              <ActivityIndicator size="small" color="#7ed957" />
              <Text style={styles.insightsLoadingText}>Thinking...</Text>
            </View>
          )}

          {aiInsights && (
            <View>
              <View style={styles.summaryHighlightCard}>
                <Ionicons name="bulb" size={24} color="#7ed957" />
                <Text style={styles.summaryHighlightText} numberOfLines={10}>
                  {aiInsights.summary}
                </Text>
              </View>

              <View style={styles.insightGrid}>
                <View style={[styles.gridCard, { borderLeftColor: "#7ed957" }]}>
                  <Text style={styles.gridTitle}>Strengths</Text>
                  <Text style={styles.gridBody}>{aiInsights.strengths[0]}</Text>
                </View>
                <View style={[styles.gridCard, { borderLeftColor: "#FF9500" }]}>
                  <Text style={styles.gridTitle}>Tips</Text>
                  <Text style={styles.gridBody}>
                    {aiInsights.suggestions[0]}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statNumber}>{data?.totalCompletions}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Best Streak</Text>
            <Text style={styles.statNumber}>{data?.longestStreak}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Rate</Text>
            <Text style={styles.statNumber}>
              {data?.completionRate.toFixed(0)}%
            </Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Weekly Activity</Text>
          <LineChart
            data={{
              labels: data?.labels || ["", "", "", "", "", "", ""],
              datasets: [{ data: data?.dailyData || [0, 0, 0, 0, 0, 0, 0] }],
            }}
            width={screenWidth - 40}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            fromZero={true}
            segments={Math.max(...(data?.dailyData || [1]))}
          />
        </View>
        {data &&
          (() => {
            const insights = getStaticInsights();
            if (!insights) return null;
            return (
              <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>Quick Insights</Text>
                <View style={styles.insightRow}>
                  <View
                    style={[styles.insightChip, { borderLeftColor: "#7ed957" }]}
                  >
                    <Text style={styles.insightChipLabel}>📈 Best Day</Text>
                    <Text style={styles.insightChipValue}>
                      {insights.bestDay}
                    </Text>
                  </View>
                  <View
                    style={[styles.insightChip, { borderLeftColor: "#FF3B30" }]}
                  >
                    <Text style={styles.insightChipLabel}>📉 Worst Day</Text>
                    <Text style={styles.insightChipValue}>
                      {insights.worstDay}
                    </Text>
                  </View>
                </View>
                {insights.mostConsistent && (
                  <View
                    style={[
                      styles.insightChipFull,
                      { borderLeftColor: "#FF9500" },
                    ]}
                  >
                    <Text style={styles.insightChipLabel}>
                      🏆 Most Consistent Habit
                    </Text>
                    <Text style={styles.insightChipValue}>
                      {insights.mostConsistent}
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#1A1A1A" },
  headerSubtitle: { fontSize: 15, color: "#8e8e93" },

  aiSection: { paddingHorizontal: 20, marginBottom: 20 },
  generateButton: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  generateButtonText: { color: "white", fontWeight: "600", marginLeft: 8 },
  summaryHighlightCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 2,
  },
  summaryHighlightText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  insightGrid: { flexDirection: "row", justifyContent: "space-between" },
  gridCard: {
    width: "48%",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 2,
  },
  gridTitle: {
    fontWeight: "bold",
    fontSize: 13,
    color: "#8e8e93",
    marginBottom: 4,
  },
  gridBody: { fontSize: 12, color: "#333", fontWeight: "500" },

  // Stats
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    alignItems: "center",
  },
  statNumber: { fontSize: 20, fontWeight: "bold", color: "#1A1A1A" },
  statLabel: { fontSize: 11, color: "#8e8e93", textTransform: "uppercase" },

  // Charts
  chartSection: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  chart: { borderRadius: 16, marginLeft: -10 },
  insightsLoading: { padding: 20, alignItems: "center" },
  insightsLoadingText: { marginTop: 8, color: "#8e8e93" },

  insightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  insightChip: {
    width: "48%",
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 2,
  },
  insightChipFull: {
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 2,
  },
  insightChipLabel: {
    fontSize: 11,
    color: "#8e8e93",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  insightChipValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
});
