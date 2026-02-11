import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Image
} from "react-native";
import { supabase } from "../services/supabase";
import { Habit } from "../types/habit";
import { useFocusEffect } from "@react-navigation/native";

export default function HabitsScreen({ navigation }: any) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUsername] = useState("User");

  useFocusEffect(
    React.useCallback(() => {
      fetchHabits();
      fetchUserName();
    }, []),
  );

  const fetchUserName = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

        
      console.log('=== DEBUG: Fetching user name ===');
      console.log('User ID:', user?.id);

      if (!user) {
      console.log('No user found');
      return;
      }

      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      
      console.log('Profile data:', profile);
      console.log('Profile error:', error);
      console.log('Display name value:', profile?.display_name);

      if (profile?.display_name) {
        console.log('Settign username to:', profile.display_name)
        setUsername(profile.display_name);
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };
  const fetchHabits = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching habits:", error);
      } else {
        setHabits(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const renderHabit = ({ item }: { item: Habit }) => (
    <View style={styles.habitCard}>
      <View style={styles.habitHeader}>
        <Text style={styles.habitTitle}>{item.title}</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>{item.streak}</Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.habitDescription}>{item.description}</Text>
      )}
      <View style={styles.habitFooter}>
      <View style={styles.frequencyContainer}>
        <Image
          source={
            item.frequency === "daily"
              ? require("../../assets/icons/DailyIcon.png")
              : require("../../assets/icons/WeeklyIcon.png")
          }
          style={styles.frequencyIcon}
          resizeMode="contain"
        />
        <Text style={styles.frequencyText}>
          {item.frequency === "daily" ? "Daily" : "Weekly"}
        </Text>
      </View>
        <Text style={styles.pointsText}>{item.points} pts</Text>
      </View>

      <TouchableOpacity
        style={styles.completeButton}
        onPress={() => handleCompleteHabit(item)}
      >
        <Text style={styles.completeButtonText}>Complete</Text>
      </TouchableOpacity>
    </View>
  );

  const handleCompleteHabit = async (habit: Habit) => {
    const { completeHabit } = require("../services/habitService");

    const result = await completeHabit(habit.id, habit.frequency, habit.streak);

    if (result.success) {
      Alert.alert(
        result.leveledUp ? "Level Up!" : "Success",
        result.leveledUp
          ? `${result.message}\nYou reached level ${result.newLevel}!`
          : result.message,
      );
      fetchHabits();
    } else {
      Alert.alert("Info", result.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{userName}'s Habits</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOutButton}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {habits.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No habits yet!</Text>
          <Text style={styles.emptyStateSubtext}>
            Start building better habits today
          </Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          renderItem={renderHabit}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchHabits} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddHabit")}
      >
        <Text style={styles.addButtonText}>+ Add Habit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  signOutButton: {
    color: "#FF3B30",
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
  },
  habitCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  habitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  streakBadge: {
    backgroundColor: "#c7f1a1ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "600",
  },
  habitDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  habitFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  frequencyText: {
    fontSize: 14,
    color: "#666",
  },
  pointsText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#666",
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  completeButton: {
    backgroundColor: "#34C759",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  completeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  frequencyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  frequencyIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
});
