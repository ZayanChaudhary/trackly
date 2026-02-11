import { supabase } from "./supabase";


export const getXPRequiredForLevel = (level: number): number => {

    return 100 * level;
}

export const calcLevel = (totalXP: number): number => {
  let level = 1;
  let xpNeeded = 0;
  
  while (xpNeeded <= totalXP) {
    xpNeeded += getXPRequiredForLevel(level);
    if (xpNeeded <= totalXP) {
      level++;
    }
  }
  
  return level;
};

export const getXPforNext = (currentXP: number): number => {
    const currentLevel = calcLevel(currentXP);
    return getXPRequiredForLevel(currentLevel);
};

export const getCurrentLevelProgress = (totalXP: number): { currentXP: number; neededXP: number} => {
    const currentLevel = calcLevel(totalXP);

    let xpForCurrent = 0;
    for (let i = 1; i < currentLevel; i++){
        xpForCurrent += getXPRequiredForLevel(i);
    }

    const currentXP = totalXP - xpForCurrent;
    const neededXP = getXPRequiredForLevel(currentLevel);

    return { currentXP, neededXP}
}

export const checkCompleteToday = async (
    habitId: string,
    frequency: 'daily' | 'weekly'
): Promise<boolean> => {
    const now = new Date();
    let startDate: Date;

    if (frequency === 'daily'){
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
    const {data: logs } = await supabase
        .from('habit_logs')
        .select('completed_at')
        .eq('habit_id', habitId)
        .order('completed_at', { ascending: false })
        .limit(2)
    
    console.log('Logs found:', logs);

    if (!logs || logs.length === 0) {
        console.log('First completion');
        return 1;
    }

    const lastLog = logs[0]
    const lastCompletion = new Date(lastLog.completed_at);
    const now = new Date();

    if (frequency === 'daily'){
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0,0,0,0);

        const lastCompletionDate = new Date(lastCompletion);
        lastCompletionDate.setHours(0,0,0,0);

        if(lastCompletionDate.getTime() === yesterday.getTime()) {
            console.log('Continuing Streak')
            return currentStreak + 1;
        }else {
            console.log('Resetting Streak')
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
    
    let minXP = 8;
    let maxXP = 15;
    
    if (streak >= 100)
    {
        minXP = 50;
        maxXP = 120;
    }
    else if (streak >= 30)
    {
        minXP = 30;
        maxXP = 70;
    }
    else if (streak >= 7)
    {
        minXP = 15;
        maxXP = 35;
    }

    const randomXP = Math.floor(Math.random() * (maxXP - minXP + 1)) + minXP;

    return randomXP;
};

export interface CompleteHabitResult {
    success: boolean;
    message: string;
    xpEarned?: number;
    newLevel?: number;
    leveledUp?: boolean;
    newStreak?: number;
}

export const completeHabit = async (
    habitId: string,
    frequency: 'daily' | 'weekly',
    currentStreak: number
): Promise<CompleteHabitResult> => {
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if(!user) {
            return { success: false, message: 'Not Authorised'};
        }

        const alreadyCompleted = await checkCompleteToday(habitId, frequency);
        if (alreadyCompleted){
            return {
                success: false, 
                message:
                    frequency === 'daily'
                    ? 'Already completed today!'
                    : 'Already completed this week!'
            };
        }


        const newStreak = await calcNewStreak(
        habitId,
        frequency,
        currentStreak
        );


        const xpEarned = calcXPearned(newStreak);


        const { error: logError } = await supabase.from('habit_logs').insert({
        habit_id: habitId,
        user_id: user.id,
        completed_at: new Date().toISOString(),
        points_earned: xpEarned,
        });

        if (logError) throw logError;


        const { error: habitError } = await supabase
        .from('habits')
        .update({
            streak: newStreak,
            points: currentStreak + xpEarned,
        })
        .eq('id', habitId);

        if (habitError) throw habitError;


        let { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

        if (!profile) {

        const { data: newProfile } = await supabase
            .from('user_profiles')
            .insert({
            user_id: user.id,
            username: user.email,
            level: 1,
            xp: 0,
            total_xp: 0,
            })
            .select()
            .single();

        profile = newProfile;
        }

        if (!profile) {
        return { success: false, message: 'Failed to get profile' };
        }


        const oldLevel = profile.level;
        const newTotalXP = profile.total_xp + xpEarned;
        const newLevel = calcLevel(newTotalXP);

        const {currentXP, neededXP} = getCurrentLevelProgress(newTotalXP);


        const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
            xp: currentXP,
            total_xp: newTotalXP,
            level: newLevel,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

        if (profileError) throw profileError;

        // Check if leveled up and unlock accessories
        const leveledUp = newLevel > oldLevel;
        if (leveledUp) {
        await unlockAccessoriesForLevel(user.id, newLevel);
        }

        return {
        success: true,
        message: `+${xpEarned} XP! 🎉`,
        xpEarned,
        newLevel,
        leveledUp,
        newStreak,
        };
    } catch (error) {
        console.error('Error completing habit:', error);
        return { success: false, message: 'Failed to complete habit' };
        }
    };

    const unlockAccessoriesForLevel = async (
        userId: string,
        level: number
    ): Promise<void> => {
        try {
            const { data: accessories } = await supabase
            .from('accessories')
            .select('*')
            .eq('unlock_level', level);

        
            if (!accessories || accessories.length === 0) return;

            for (const accessory of accessories) {
                await supabase
                .from('user_accessories')
                .insert({
                    user_id: userId,
                    accessory_id: accessory.id,
                })
                .select()
            }
        } catch (error) {
            console.error('Error unlocking accessories:', error);
        }
};