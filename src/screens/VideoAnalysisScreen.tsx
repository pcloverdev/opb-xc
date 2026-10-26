/**
 * VideoAnalysisScreen
 * Screen for analyzing recorded shooting videos
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { VideoAnalysisView } from '../components/video/VideoAnalysisView';
import { requestPermissionsWithHandling } from '../utils/permissions';
import * as ImagePicker from 'expo-image-picker';

export const VideoAnalysisScreen: React.FC = () => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAndRequestPermissions();
  }, []);

  const checkAndRequestPermissions = async () => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        const granted = await requestPermissionsWithHandling();
        setHasPermissions(granted);
      } else {
        setHasPermissions(true);
      }
    } catch (error) {
      console.error('[VideoAnalysisScreen] Permission error:', error);
      Alert.alert('Error', 'Failed to request media library permissions');
      setHasPermissions(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FF00" />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  if (!hasPermissions) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Media library access required</Text>
        <Text style={styles.errorSubtext}>
          Please enable media library access in your device settings to analyze videos.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoAnalysisView />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 32,
  },
  errorText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorSubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
});
