/**
 * LiveCameraScreen
 * Main screen for real-time pose detection and shooting analysis
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { CameraView } from '../components/camera/CameraView';
import { requestPermissionsWithHandling, isCameraReady } from '../utils/permissions';
import type { PoseDetectionResult } from '../types';

export const LiveCameraScreen: React.FC = () => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAndRequestPermissions();
  }, []);

  const checkAndRequestPermissions = async () => {
    try {
      const cameraReady = await isCameraReady();

      if (!cameraReady) {
        const granted = await requestPermissionsWithHandling();
        setHasPermissions(granted);
      } else {
        setHasPermissions(true);
      }
    } catch (error) {
      console.error('[LiveCameraScreen] Permission error:', error);
      Alert.alert('Error', 'Failed to request camera permissions');
      setHasPermissions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePoseDetected = (result: PoseDetectionResult) => {
    // TODO: Add shot tracking logic here
    // Analyze shooting form, track release angle, etc.
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00FF00" />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  if (!hasPermissions) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Camera permission required</Text>
        <Text style={styles.errorSubtext}>
          Please enable camera access in your device settings to use this feature.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onPoseDetected={handlePoseDetected}
        showMetrics={true}
        showSkeleton={true}
        targetFps={30}
      />
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
