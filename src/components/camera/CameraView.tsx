/**
 * CameraView Component
 * Real-time camera capture with pose detection overlay
 * Displays performance metrics and skeleton visualization
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraFormat } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { SkeletonRenderer } from './SkeletonRenderer';
import { PerformanceMetrics } from '../../utils/PerformanceMetrics';
import { usePoseFrameProcessor } from '../../services/frameProcessor';
import type { PoseDetectionResult, PerformanceMetrics as IPerformanceMetrics } from '../../types';

interface CameraViewProps {
  onPoseDetected?: (result: PoseDetectionResult) => void;
  showMetrics?: boolean;
  showSkeleton?: boolean;
  targetFps?: number;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onPoseDetected,
  showMetrics = true,
  showSkeleton = true,
  targetFps = 30,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [poseResult, setPoseResult] = useState<PoseDetectionResult | null>(null);
  const [metrics, setMetrics] = useState<IPerformanceMetrics>({
    fps: 0,
    inferenceLatency: 0,
    averageLatency: 0,
    frameCount: 0,
  });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const isFocused = useIsFocused();
  const device = useCameraDevice('back');
  const performanceMetrics = useRef(new PerformanceMetrics()).current;

  const format = useCameraFormat(device, [
    { fps: targetFps },
    { videoResolution: { width: 1920, height: 1080 } },
  ]);

  useEffect(() => {
    setIsActive(isFocused);
    if (!isFocused) {
      performanceMetrics.reset();
    }
  }, [isFocused, performanceMetrics]);

  const handlePoseDetection = useCallback(
    (result: PoseDetectionResult, latencyMs: number) => {
      performanceMetrics.recordFrame();
      performanceMetrics.recordLatency(latencyMs);

      setPoseResult(result);

      if (performanceMetrics.shouldUpdate()) {
        setMetrics(performanceMetrics.getMetrics());
      }

      onPoseDetected?.(result);
    },
    [onPoseDetected, performanceMetrics]
  );

  const handleLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  }, []);

  const frameProcessor = usePoseFrameProcessor(handlePoseDetection, targetFps);

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00FF00" />
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && isFocused}
        format={format}
        fps={targetFps}
        pixelFormat="yuv"
        frameProcessor={frameProcessor}
        outputOrientation="preview"
      />

      {showSkeleton && dimensions.width > 0 && (
        <SkeletonRenderer
          poseResult={poseResult}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}

      {showMetrics && (
        <View style={styles.metricsContainer}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>FPS</Text>
            <Text style={styles.metricValue}>{metrics.fps}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Latency</Text>
            <Text style={styles.metricValue}>{metrics.inferenceLatency}ms</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Avg</Text>
            <Text style={styles.metricValue}>{metrics.averageLatency}ms</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  metricsContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  metricLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricValue: {
    color: '#00FF00',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
