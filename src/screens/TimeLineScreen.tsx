import React, { useState, useEffect, use } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { supabase } from "../services/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { Accessory, UserProfile } from '../types/habit';

interface TimelineNode {
    level: number;
    hasReward: boolean;
    accessory?: Accessory;
    isUnlocked: boolean;
}

export default function TimelineScreen() {
    const [timeline, setTimeline] = useState<TimelineNode[]>([]);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [unlockedAccessoryIds, setUnlockedAccessoryIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            fetchTimelineData();
        }, [])
    );

    const fetchTimelineData = async () => {
        try{
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('level')
                .eq('user_id', user.id)
                .single()

            const userLevel = profile?.level || 1;
            setCurrentLevel(userLevel);

            const { data: accessories } = await supabase 
                .from('accessories')
                .select('*')
                .order('unlock_level', { ascending: true });

            const { data: userAccessories } = await supabase
                .from('user_accessories')
                .select('accessory_id')
                .eq('user_id', user.id)
        
            const unlockedIds = userAccessories?.map((ua) => ua.accessory_id) || [];
            setUnlockedAccessoryIds(unlockedIds);

            const timelineData: TimelineNode[] = [];
            const maxLevel = 30;

            for (let level = 1; level <= maxLevel; level++) {
                const accessory = accessories?.find((a) => a.unlock_level === level);

                timelineData.push({
                    level, 
                    hasReward: !!accessory,
                    accessory: accessory,
                    isUnlocked: level <= userLevel,
                });
            }

            setTimeline(timelineData);
        } catch (error) {
            console.error('Error fetching timeline:', error)
        } finally {
            setLoading(false);
        }
    };

  const renderTimelineNode = (node: TimelineNode, index: number) => {
    const isLast = index === timeline.length - 1;
    const isCurrent = node.level === currentLevel;

    return (
      <View key={node.level} style={styles.nodeContainer}>

        {index > 0 && (
          <View
            style={[
              styles.lineSegment,
              node.isUnlocked ? styles.lineUnlocked : styles.lineLocked,
            ]}
          />
        )}

        <View style={styles.nodeContent}>

          <View
            style={[
              styles.levelCircle,
              node.isUnlocked ? styles.circleUnlocked : styles.circleLocked,
              isCurrent && styles.circleCurrent,
            ]}
          >
            <Text
              style={[
                styles.levelText,
                node.isUnlocked ? styles.textUnlocked : styles.textLocked,
              ]}
            >
              {node.level}
            </Text>
          </View>


          <View
            style={[
              styles.rewardCard,
              node.hasReward
                ? node.isUnlocked
                  ? styles.cardUnlocked
                  : styles.cardLocked
                : styles.cardEmpty,
            ]}
          >
            {node.hasReward && node.accessory ? (
              <>
                <Text style={styles.rewardIcon}>{node.accessory.icon}</Text>
                <View style={styles.rewardInfo}>
                  <Text
                    style={[
                      styles.rewardName,
                      !node.isUnlocked && styles.rewardNameLocked,
                    ]}
                  >
                    {node.accessory.name}
                  </Text>
                  <Text
                    style={[
                      styles.rewardType,
                      !node.isUnlocked && styles.rewardTypeLocked,
                    ]}
                  >
                    {node.accessory.type}
                  </Text>
                </View>
                {node.isUnlocked && (
                  <View style={styles.unlockedBadge}>
                    <Text style={styles.unlockedText}>✓</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.noRewardText}>No reward</Text>
            )}
          </View>
        </View>

        {!isLast && (
          <View
            style={[
              styles.lineSegment,
              node.isUnlocked ? styles.lineUnlocked : styles.lineLocked,
            ]}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Rewards Timeline</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rewards Timeline</Text>
        <Text style={styles.headerSubtitle}>
          Current Level: {currentLevel}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.timelineContainer}
        showsVerticalScrollIndicator={false}
      >
        {timeline.map((node, index) => renderTimelineNode(node, index))}
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  timelineContainer: {
    padding: 20,
    paddingTop: 30,
  },
  nodeContainer: {
    alignItems: 'center',
  },
  lineSegment: {
    width: 4,
    height: 40,
  },
  lineUnlocked: {
    backgroundColor: '#007AFF',
  },
  lineLocked: {
    backgroundColor: '#E0E0E0',
  },
  nodeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  levelCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginRight: 15,
  },
  circleUnlocked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  circleLocked: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  circleCurrent: {
    borderColor: '#FFD700',
    borderWidth: 4,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  textUnlocked: {
    color: 'white',
  },
  textLocked: {
    color: '#999',
  },
  rewardCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    minHeight: 70,
  },
  cardUnlocked: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLocked: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  rewardIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  rewardNameLocked: {
    color: '#999',
  },
  rewardType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  rewardTypeLocked: {
    color: '#BBB',
  },
  noRewardText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  unlockedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

