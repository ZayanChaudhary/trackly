import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image
} from "react-native";
import { supabase } from "../services/supabase";
import { Animated } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // RObust error handling
  const handleAuth = async () => {

    // typical error case: incomplete fields
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // typical error case: incomplete username
    if (isSignUp && !name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          Alert.alert("Sign Up Error", error.message);
        } else if (data.user) {

          await new Promise(resolve => setTimeout(resolve, 500));

          const { data: existingProfile } = await supabase
            .from("user_profiles")
            .select('*')
            .eq("user_id", data.user.id)
            .single();

          if (existingProfile) {
                // Update existing profile
                await supabase
                    .from('user_profiles')
                    .update({ display_name: name.trim() })
                    .eq('user_id', data.user.id);
            } else {
                // Create new profile with name
                await supabase
                    .from('user_profiles')
                    .insert({
                    user_id: data.user.id,
                    display_name: name.trim(),
                    username: email,
                    });
            }

          Alert.alert("Success", "Account created! Please log in.");
          setIsSignUp(false);
          setName("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          Alert.alert("Login Error", error.message);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.formContainer}>
               <Image
                  source={require("../../assets/icons/TracklyAuthPage.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />

        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Log In"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsSignUp(!isSignUp)}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {isSignUp
              ? "Already have an account? Log In"
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2a9546",
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
    textAlign: "center",
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#34C759",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  switchButton: {
    marginTop: 20,
    alignItems: "center",
  },
  switchText: {
    color: "#ccc",
    fontSize: 14,
  },
  logo: {
    width: 280, 
    height: 280,
    alignSelf: 'center',
    marginBottom: 20,
  }
});
