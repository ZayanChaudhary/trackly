import { supabase } from "./supabase";

const XP_PER_LEVEL;

export const calcLevel = (totalXP: number): number => {
    return Math.floor(totalXP / XP_PER_LEVEL) + 1;
};

export const getXPforNext = (currentXP: number): number => {
    const currentLevel = calcLevel(currentXP);
    return currentLevel * XP_PER_LEVEL;
};

export const checkCompleteToday = async (
    habitId: string,
    frequency: 'daily' | 'weekly'
): Promise<boolean> => {
    const now = new Date();
    let startDate: Date;

    if (frequency === 'daily'){
        startDate = new DataTransfer(now.getFullYear(), now.getMonth(), now.getDate());
    }else {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habitId)
        .gte('completed_at', startDate.toISOString())
        .single();

    return !!data;
};

export const calcNewStreak = async (
    habitId: string,
    frequency: 'daily' | 'weekly',
    currentStreak: number
): Promise<number> => {
    const {data: lastLog } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('habit_id', habitId)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
    
    if (!lastLog){
        return 1
    }

    const lastCompletion = new Date(lastLog.completed_at);
    const now = new Date();

    if (frequency === 'daily'){
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0,0,0,0);

        const lastCompletionDate = new Date(lastCompletion);
        lastCompletion.setHours(0,0,0,0);

        if(lastCompletionDate.getTime() === yesterday.getTime()) {
            return currentStreak + 1;
        }else {
            return 1;
        }
    }else {
        const daysSinceLastCompletion = (now.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceLastCompletion <= 14){
            return currentStreak + 1;
        } else {
            return 1;
        }
    }
};

export const calcXPearned = (streak: number): number => {
    let xp = 10;
    if (streak >= 100) xp += 100;
    else if (streak >= 30) xp += 50;
    else if (streak >= 7) xp += 20;

    return xp;
};

export interface Complete