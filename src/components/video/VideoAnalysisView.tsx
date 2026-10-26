/**
 * VideoAnalysisView Component
 * Video playback with pose detection overlay and playback controls
 * Allows frame-by-frame analysis and variable playback speed
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import { SkeletonRenderer } from '../camera/SkeletonRenderer';
import { detectPoseInVideoFrame } from '../../services/VideoPoseDetector';
import type { PoseDetectionResult } from '../../types';

interface VideoAnalysisViewProps {
  onClose?: () => void;
}

export const VideoAnalysisView: React.FC<VideoAnalysisViewProps> = ({ onClose }) => {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [poseResult, setPoseResult] = useState<PoseDetectionResult | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const videoRef = useRef<Video>(null);

  const pickVideo = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        setPosition(0);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('[VideoAnalysisView] Error picking video:', error);
      Alert.alert('Error', 'Failed to load video from library');
    }
  }, []);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
    }
  }, []);

  const processFrameAtPosition = useCallback(async (positionMs: number) => {
    if (!videoUri) return;
    try {
      const result = await detectPoseInVideoFrame(videoUri, positionMs);
      setPoseResult(result);
    } catch (error) {
      console.error('[VideoAnalysisView] Frame processing error:', error);
    }
  }, [videoUri]);

  const seekToPosition = useCallback(async (positionMillis: number) => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(positionMillis);
    processFrameAtPosition(positionMillis);
  }, [processFrameAtPosition]);

  const stepFrame = useCallback(async (direction: 'forward' | 'backward') => {
    if (!videoRef.current) return;

    const frameTime = 1000 / 30;
    const newPosition = direction === 'forward'
      ? Math.min(position + frameTime, duration)
      : Math.max(position - frameTime, 0);

    await seekToPosition(newPosition);
  }, [position, duration, seekToPosition]);

  const togglePlayback = useCallback(async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
      // Analyze the frame we paused on.
      processFrameAtPosition(position);
    } else {
      setPoseResult(null); // Clear stale overlay while playing.
      await videoRef.current.playAsync();
    }
  }, [isPlaying, position, processFrameAtPosition]);

  const handleSpeedChange = useCallback(async (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      await videoRef.current.setRateAsync(speed, true);
    }
  }, []);

  const handleLayout = useCallback((event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  }, []);

  const formatTime = (millis: number) => {
    const seconds = Math.floor(millis / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!videoUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Video Analysis</Text>
        <TouchableOpacity style={styles.pickButton} onPress={pickVideo}>
          <Text style={styles.pickButtonText}>Select Video from Gallery</Text>
        </TouchableOpacity>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer} onLayout={handleLayout}>
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {dimensions.width > 0 && (
          <SkeletonRenderer
            poseResult={poseResult}
            width={dimensions.width}
            height={dimensions.height}
          />
        )}
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.timelineContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={seekToPosition}
            minimumTrackTintColor="#00FF00"
            maximumTrackTintColor="#666"
            thumbTintColor="#00FF00"
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.playbackControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => stepFrame('backward')}
          >
            <Text style={styles.controlButtonText}>◀◀</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
            <Text style={styles.playButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => stepFrame('forward')}
          >
            <Text style={styles.controlButtonText}>▶▶</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.speedControls}>
          <Text style={styles.speedLabel}>Speed: {playbackSpeed.toFixed(1)}x</Text>
          <View style={styles.speedButtons}>
            {[0.25, 0.5, 1.0, 1.5, 2.0].map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedButton,
                  playbackSpeed === speed && styles.speedButtonActive,
                ]}
                onPress={() => handleSpeedChange(speed)}
              >
                <Text
                  style={[
                    styles.speedButtonText,
                    playbackSpeed === speed && styles.speedButtonTextActive,
                  ]}
                >
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.changeVideoButton} onPress={pickVideo}>
          <Text style={styles.changeVideoButtonText}>Change Video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  controlsContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    paddingBottom: 32,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    minWidth: 40,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  controlButton: {
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#000',
    fontSize: 24,
  },
  speedControls: {
    marginBottom: 16,
  },
  speedLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  speedButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  speedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#333',
    borderRadius: 6,
  },
  speedButtonActive: {
    backgroundColor: '#00FF00',
  },
  speedButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  speedButtonTextActive: {
    color: '#000',
  },
  pickButton: {
    backgroundColor: '#00FF00',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 40,
  },
  pickButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeVideoButton: {
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  changeVideoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#888',
    fontSize: 16,
  },
});
