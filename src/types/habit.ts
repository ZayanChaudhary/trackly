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
