import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../services/supabase";

export default function AddHabitScreen({ navigation }: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [loading, setLoading] = useState(false);

  const handleAddHabit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a habit title");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "You must be logged in");
        return;
      }

      const { error } = await supabase.from("habits").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        frequency,
        streak: 0,
        points: 0,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Success", "Habit created!");
        navigation.goBack();
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Habit</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Habit Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Morning meditation"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Why is this habit important?"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Frequency</Text>
        <View style={styles.frequencyContainer}>
          <TouchableOpacity
            style={[
              styles.frequencyButton,
              frequency === "daily" && styles.frequencyButtonActive,
            ]}
            onPress={() => setFrequency("daily")}
          >
            <Text
              style={[
                styles.frequencyText,
                frequency === "daily" && styles.frequencyTextActive,
              ]}
            >
              Daily
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.frequencyButton,
              frequency === "weekly" && styles.frequencyButtonActive,
            ]}
            onPress={() => setFrequency("weekly")}
          >
            <Text
              style={[
                styles.frequencyText,
                frequency === "weekly" && styles.frequencyTextActive,
              ]}
            >
              Weekly
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.buttonDisabled]}
          onPress={handleAddHabit}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? "Creating..." : "Create Habit"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  cancelButton: {
    fontSize: 16,
    color: "#007AFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  frequencyContainer: {
    flexDirection: "row",
    gap: 10,
  },
  frequencyButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  frequencyButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  frequencyText: {
    fontSize: 16,
    color: "#333",
  },
  frequencyTextActive: {
    color: "white",
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
