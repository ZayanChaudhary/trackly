export interface Habit {
    id: string,
    user_id: string;
    title: string;
    description?: string;
    frequency: 'daily' | 'weekly';
    created_at: string;
    streak: number;
    points: number;
}

export interface HabitLog {
    id: string;
    habit_id: string;
    user_id: string;
    completed_at: string;
    icon: string;
}

export interface Achievement {
    id: string;
    user_id: string;
    title: string;
    description: string;
    unlocked_at: string;
    icon: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  level: number;
  xp: number;
  total_xp: number;
  avatar_accessories: {
    hat: string | null;
    glasses: string | null;
    background: string | null;
  };
  created_at: string;
  updated_at: string;
}

export interface Accessory {
  id: string;
  name: string;
  type: 'hat' | 'glasses' | 'background';
  icon: string;
  unlock_level: number;
  description: string;
  created_at: string;
}

export interface UserAccessory {
  id: string;
  user_id: string;
  accessory_id: string;
  unlocked_at: string;
}