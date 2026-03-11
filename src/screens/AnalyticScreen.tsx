import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
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
}

export default function AnalyticScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchAnalytics();
    }, []),
  );

  const fetchAnalytics = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: logs } = await supabase
        .from("habit_logs")
        .select("completed_at, points_earned, habit_id")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: true });

      const { data: habits } = await supabase
        .from("habits")
        .select("id, title, streak")
        .eq("user_id", user.id);

      if (!logs || !habits) {
        setLoading(false);
        return;
      }

      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        date.setHours(0, 0, 0, 0);
        return date;
      });

      const dailyData = last7Days.map((date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        return logs.filter((log) => {
          const logDate = new Date(log.completed_at);
          return logDate >= date && logDate < nextDay;
        }).length;
      });

      const weeklyCompletions = dailyData.reduce(
        (sum, count) => sum + count,
        0,
      );

      const totalPossibleCompletions = habits.length * 7;
      const completionRate =
        totalPossibleCompletions > 0
          ? (weeklyCompletions / totalPossibleCompletions) * 100
          : 0;

      const habitCompletions = habits.map((habit) => ({
        title: habit.title,
        count: logs.filter((log) => log.habit_id === habit.id).length,
      }));

      const topHabits = habitCompletions
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const longestStreak =
        habits.length > 0 ? Math.max(...habits.map((h) => h.streak)) : 0;

      const currentStreak = habits.reduce((sum, h) => sum + h.streak, 0);

      setData({
        totalCompletions: logs.length,
        weeklyCompletions,
        currentStreak,
        longestStreak,
        completionRate,
        dailyData,
        topHabits,
      });
    } catch (e) {
      console.error("Error fetching analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7ed957" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>No data available yet</Text>
        <Text style={styles.emptySubtext}>
          Complete some habits to see your analytics!
        </Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(126, 217, 87, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0,
  };

  const handleGenerateInsights = async () => {
    if (!data) return;

    setGeneratingInsight(true);
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
      alert(
        "Failed to generate insights. Please check your API key and try again",
      );
    }

    setGeneratingInsight(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Your progress insights</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={32} color="#34C759" />
          <Text style={styles.statNumber}>{data.totalCompletions}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={32} color="#FF9500" />
          <Text style={styles.statNumber}>{data.longestStreak}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={32} color="#7ed957" />
          <Text style={styles.statNumber}>
            {data.completionRate.toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>7-Day Rate</Text>
        </View>
      </View>

      {/* Weekly Activity Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Last 7 Days Activity</Text>
        <LineChart
          data={{
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                data: data.dailyData.length > 0 ? data.dailyData : [0],
              },
            ],
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Top Habits Chart */}
      {data.topHabits.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Top Habits</Text>
          <BarChart
            data={{
              labels: data.topHabits.map((h) => h.title.substring(0, 8)),
              datasets: [
                {
                  data: data.topHabits.map((h) => Math.max(h.count, 1)),
                },
              ],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>
      )}

      {/* Weekly Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Weekly Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Completions this week:</Text>
            <Text style={styles.summaryValue}>{data.weeklyCompletions}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current total streak:</Text>
            <Text style={styles.summaryValue}>{data.currentStreak} days</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Completion rate:</Text>
            <Text style={styles.summaryValue}>
              {data.completionRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* AI Insights Section */}
      <View style={styles.aiSection}>
        <View style={styles.aiHeader}>
          <Ionicons name="sparkles" size={24} color="#7ed957" />
          <Text style={styles.sectionTitle}>AI Insights</Text>
        </View>

        {!aiInsights && !generatingInsight && (
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateInsights}
          >
            <Ionicons name="bulb" size={20} color="white" />
            <Text style={styles.generateButtonText}>Generate AI Insights</Text>
          </TouchableOpacity>
        )}

        {generatingInsight && (
          <View style={styles.insightsLoading}>
            <ActivityIndicator size="small" color="#7ed957" />
            <Text style={styles.insightsLoadingText}>
              Analyzing your progress...
            </Text>
          </View>
        )}

        {aiInsights && (
          <View style={styles.insightsContainer}>
            {/* Summary */}
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>📊 Summary</Text>
              <Text style={styles.insightText}>{aiInsights.summary}</Text>
            </View>

            {/* Strengths */}
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>💪 Your Strengths</Text>
              {aiInsights.strengths.map((strength, index) => (
                <View key={index} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.insightText}>{strength}</Text>
                </View>
              ))}
            </View>

            {/* Suggestions */}
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>💡 Suggestions</Text>
              {aiInsights.suggestions.map((suggestion, index) => (
                <View key={index} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.insightText}>{suggestion}</Text>
                </View>
              ))}
            </View>

            {/* Motivational Message */}
            <View style={[styles.insightCard, styles.motivationalCard]}>
              <Text style={styles.motivationalText}>
                {aiInsights.motivationalMessage}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleGenerateInsights}
            >
              <Ionicons name="refresh" size={16} color="#7ed957" />
              <Text style={styles.refreshButtonText}>Refresh Insights</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  chartSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  aiSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  aiPlaceholder: {
    backgroundColor: "white",
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  aiPlaceholderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  aiPlaceholderSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  generateButton: {
    flexDirection: "row",
    backgroundColor: "#7ed957",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  generateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  insightsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 12,
  },
  insightsLoadingText: {
    marginLeft: 12,
    color: "#666",
    fontSize: 16,
  },
  insightsContainer: {
    gap: 16,
  },
  insightCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  insightText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
    flex: 1,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bullet: {
    fontSize: 15,
    color: "#7ed957",
    marginRight: 8,
    fontWeight: "bold",
  },
  motivationalCard: {
    backgroundColor: "#7ed957",
  },
  motivationalText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 24,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#7ed957",
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#7ed957",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});
