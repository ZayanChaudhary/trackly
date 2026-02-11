import React, { useEffect, useState } from "react";
import { Text, Image } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./src/services/supabase";
import LoginScreen from "./src/screens/LoginScreen";
import HabitsScreen from "./src/screens/HabitsScreen";
import AddHabitScreen from "./src/screens/AddHabitScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#7ed957",
        tabBarInactiveTintColor: "#8e8e93",
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="HabitsTab"
        component={HabitsScreen}
        options={{
          tabBarLabel: "Habits",
          tabBarIcon: ({ color, focused }) => (
            <Image 
            source={require('./assets/icons/HabitScreenIcon.png')}
            style={{
              width: 24,
              height: 24,
        }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Image 
            source={require('./assets/icons/ProfileScreenIcon.png')}
            style={{
              width: 24,
              height: 24,
        }}
            />
          )
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="AddHabit"
              component={AddHabitScreen}
              options={{ presentation: "modal" }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
