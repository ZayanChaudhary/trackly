import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from './lib/supabase';

export default function TestSupabase() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Test 1: Check if supabase client is initialized
      if (!supabase) {
        setConnectionStatus('❌ Supabase client not initialized');
        setLoading(false);
        return;
      }

      // Test 2: Try to get the session (this tests API connectivity)
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setConnectionStatus(`❌ Connection failed: ${error.message}`);
      } else {
        setConnectionStatus('✅ Connected successfully to Supabase!');
      }
    } catch (error) {
      setConnectionStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Text style={styles.status}>{connectionStatus}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
});