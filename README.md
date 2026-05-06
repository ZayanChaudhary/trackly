# Trackly

**Author:** Yusuf Chaudhary
**Module:** UG Final Year Project
**Supervisor:** Dr Anne Hsu

# Important Note
This submission contains the source code only. 'node_modules', '.git' and environment variables are not included as per supervisor guidance. The application requires a configured '.env' file and active Supabase and Gemini API credentials to run. 
This is not included in submission. 

## Project Structure
 
```
Trackly/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx        # Authentication (sign up, log in, forgot password)
│   │   ├── HabitsScreen.tsx       # Main habits list, completion, XP animation
│   │   ├── AddHabitScreen.tsx     # Habit creation form
│   │   ├── AnalyticScreen.tsx     # Analytics, charts, AI insights
│   │   ├── ProfileScreen.tsx      # Profile, XP progress, leaderboard, ranks
│   │   ├── TimeLineScreen.tsx     # Rewards timeline
│   │   └── LeaderBoardScreen.tsx  # Global leaderboard
│   ├── services/
│   │   ├── supabase.ts            # Supabase client initialisation
│   │   ├── habitService.ts        # Core business logic (XP, streaks, levels)
│   │   └── aiService.ts           # Gemini API integration and caching
│   ├── types/
│   │   └── habit.ts               # TypeScript interfaces
│   ├── utils/
│   │   └── rankImages.ts          # Rank image resolver
│   └── __test__/
│       └── habitService.test.ts   # Jest unit tests
├── __mocks__/                     # Jest mock files
├── assets/                        # Icons and images
├── App.tsx                        # Navigation and tab bar setup
├── index.ts                       # App entry point
├── app.json                       # Expo configuration
├── package.json                   # Dependencies
└── tsconfig.json                  # TypeScript configuration
```

---
 
## Key Technical Files
 
| File | Description |
|---|---|
| `src/services/habitService.ts` | Contains all gamification logic including XP calculation, streak tracking, level progression and accessory unlocking |
| `src/services/aiService.ts` | Gemini 2.5 Flash API integration with exponential backoff retry logic and session-level caching |
| `src/screens/HabitsScreen.tsx` | Main screen with skeleton loading components and XP popup animation on habit completion |
| `src/screens/AnalyticScreen.tsx` | Weekly activity charts, computed static insights and AI insight generation |
| `src/screens/ProfileScreen.tsx` | XP progress bar, global leaderboard and unlocked rank display |
| `src/__test__/habitService.test.ts` | 12 Jest unit tests covering XP calculation, level progression and streak multipliers |
 
---

## Running unit tests

Dependencies must be installed first:

```bash
npm install
npx jest
```

To run the app:

```bash
npx expo start
```


