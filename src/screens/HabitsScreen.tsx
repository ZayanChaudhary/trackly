import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Animated,
  Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { Habit } from '../types/habit';
import { Ionicons } from '@expo/vector-icons';

export default function HabitsScreen({ navigation }: any) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'daily' | 'weekly'>('all');

  useFocusEffect(
    React.useCallback(() => {
      fetchHabits();
      fetchUserName();
    }, [])
  );

  const fetchHabits = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching habits:', error);
      } else {
        setHabits(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserName = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      if (profile?.display_name) {
        setUserName(profile.display_name);
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleCompleteHabit = async (habit: Habit) => {
    const { completeHabit } = require('../services/habitService');

    const result = await completeHabit(habit.id, habit.frequency, habit.streak);

    if (result.success) {
      Alert.alert(
        result.leveledUp ? '🎉 Level Up!' : 'Success!',
        result.leveledUp
          ? `${result.message}\nYou reached level ${result.newLevel}!`
          : result.message
      );
      fetchHabits();
    } else {
      Alert.alert('Info', result.message);
    }
  };

  const filteredHabits = habits.filter((habit) => {
    if (selectedFilter === 'all') return true;
    return habit.frequency === selectedFilter;
  });

  const dailyHabits = habits.filter((h) => h.frequency === 'daily');
  const weeklyHabits = habits.filter((h) => h.frequency === 'weekly');

  const renderHabit = ({ item }: { item: Habit }) => (
    <TouchableOpacity 
      style={styles.habitCard}
      activeOpacity={0.7}
    >

  <View style={styles.habitHeader}>
    <View style={styles.habitTitleRow}>
      {/* Conditionally render icon */}
      {item.frequency === 'daily' ? (
        <Image
          source={require("../../assets/icons/DailyIcon.png")}
          style={{
            width: 16,
            height: 16,
            marginRight: 10,
          }}
        />
      ) : (
        <Image
          source={require("../../assets/icons/WeeklyIcon.png")}
          style={{
            width: 16,
            height: 16,
            marginRight: 10,
          }}
        />
      )}
      
      <Text style={styles.habitTitle} numberOfLines={1}>
        {item.title}
      </Text>
    </View>
    
    {/* Streak badge */}
    <View style={styles.streakContainer}>
      <Text style={styles.streakEmoji}>🔥</Text>
      <Text style={styles.streakNumber}>{item.streak}</Text>
    </View>
  </View>

      {/* Description */}
      {item.description && (
        <Text style={styles.habitDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.statText}>
            {item.frequency === 'daily' ? 'Daily' : 'Weekly'}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="star-outline" size={16} color="#FFD700" />
          <Text style={styles.statText}>{item.points} XP</Text>
        </View>
      </View>

      {/* Complete Button */}
      <TouchableOpacity
        style={styles.completeButton}
        onPress={() => handleCompleteHabit(item)}
      >
        <Ionicons name="checkmark-circle" size={24} color="white" />
        <Text style={styles.completeButtonText}>Complete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="rocket-outline" size={80} color="#CCC" />
      <Text style={styles.emptyStateTitle}>Start Your Journey!</Text>
      <Text style={styles.emptyStateText}>
        Create your first habit and begin building better routines
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Stats Overview */}
      <View style={styles.statsOverview}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxNumber}>{dailyHabits.length}</Text>
          <Text style={styles.statBoxLabel}>Daily</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxNumber}>{weeklyHabits.length}</Text>
          <Text style={styles.statBoxLabel}>Weekly</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxNumber}>
            {habits.reduce((sum, h) => sum + h.streak, 0)}
          </Text>
          <Text style={styles.statBoxLabel}>Total Streaks</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'daily', 'weekly'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === filter && styles.filterTabTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userName}!</Text>
          <Text style={styles.subtitle}>Keep up the great work</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.menuButton}>
          <Ionicons name="log-out-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredHabits}
        renderItem={renderHabit}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          filteredHabits.length === 0 && styles.listContainerEmpty,
        ]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchHabits} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  menuButton: {
    width: 38,
    height: 40,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statBoxNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  filterTabTextActive: {
    color: 'white',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listContainerEmpty: {
    flex: 1,
  },
  habitCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  frequencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  dailyDot: {
    backgroundColor: '#007AFF',
  },
  weeklyDot: {
    backgroundColor: '#34C759',
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9500',
  },
  habitDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  completeButton: {
    flexDirection: 'row',
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});