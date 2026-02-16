import React, { useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { supabase } from "../services/supabase";
import { UserProfile } from "../types/habit";
import { calcLevel, getXPforNext } from "../services/habitService";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalHabits, setTotalHabits] = useState(0);
  const [totalCompletions, setTotalCompletions] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
      fetchStats();
    }, []),
  );

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { count: habitsCount } = await supabase
        .from("habits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: completionsCount } = await supabase
        .from("habit_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setTotalHabits(habitsCount || 0);
      setTotalCompletions(completionsCount || 0);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  if (loading || !profile) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const xpProgress = (profile.xp / 100) * 100;
  const nextLevelXP = getXPforNext(profile.total_xp);

  return (
    <ScrollView>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOutButton}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>
            {profile.display_name?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.userName}>{profile.display_name || "User"}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Level {profile.level}</Text>
        </View>
      </View>

      <View style={styles.xpSection}>
        <View style={styles.xpHeader}>
          <Text style={styles.xpLabel}>XP Progress</Text>
          <Text style={styles.xpNumbers}> {profile.xp} / 100 XP</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${xpProgress}%` }]} />
        </View>
        <Text style={styles.xpSubtext}>
          {100 - profile.xp} XP until level {profile.level + 1}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{profile.total_xp}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalHabits}</Text>
          <Text style={styles.statLabel}>Habits</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalCompletions}</Text>
          <Text style={styles.statLabel}>Completions</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsPlaceholder}>
          <Text style={styles.placeholderText}>
            Complete more habits to unlock achievements! 
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unlocked Accessories</Text>
        <UnlockedAccessoriesList userId={profile.user_id} />
      </View>
    </ScrollView>
  );
}

function UnlockedAccessoriesList({ userId }: { userId: string }) {
  const [accessories, setAccessories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnlockedAccessories();
  }, []);

  const fetchUnlockedAccessories = async () => {
    try {
      const { data } = await supabase
        .from('user_accessories')
        .select(`
          accessory_id,
          accessories (
            id,
            name,
            type,
            icon,
            unlock_level
          )
        `)
        .eq('user_id', userId);

      const accessoryList = data?.map((item: any) => item.accessories) || [];
      setAccessories(accessoryList);
    } catch (error) {
      console.error('Error fetching accessories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.achievementsPlaceholder}>
        <Text style={styles.placeholderText}>Loading...</Text>
      </View>
    );
  }

  if (accessories.length === 0) {
    return (
      <View style={styles.achievementsPlaceholder}>
        <Text style={styles.placeholderText}>
          Reach higher levels to unlock accessories!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.accessoriesGrid}>
      {accessories.map((accessory) => (
        <View key={accessory.id} style={styles.accessoryCard}>
          <Text style={styles.accessoryIcon}>{accessory.icon}</Text>
          <Text style={styles.accessoryName}>{accessory.name}</Text>
          <Text style={styles.accessoryLevel}>Level {accessory.unlock_level}</Text>
        </View>
      ))}
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
  avatarSection: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "white",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  levelBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  xpSection: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 20,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  xpLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  xpNumbers: {
    fontSize: 16,
    color: "#666",
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 5,
  },
  xpSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "white",
    flex: 1,
    padding: 20,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  achievementsPlaceholder: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
accessoriesGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
},
accessoryCard: {
  backgroundColor: 'white',
  padding: 15,
  borderRadius: 12,
  alignItems: 'center',
  width: '48%',
  borderWidth: 2,
  borderColor: '#007AFF',
},
accessoryIcon: {
  fontSize: 40,
  marginBottom: 8,
},
accessoryName: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
  textAlign: 'center',
  marginBottom: 4,
},
accessoryLevel: {
  fontSize: 12,
  color: '#666',
},
});
