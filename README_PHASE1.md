# One Percent Better - Phase 1 (Proof of Concept)

Cross-platform basketball training app with real-time pose detection using computer vision.

## Overview

Phase 1 validates the core technology for analyzing basketball shooting form using 2D pose detection across both iOS and Android platforms with a unified codebase.

## Technology Stack

- **Framework**: React Native 0.81.5 with New Architecture (Fabric)
- **Navigation**: Expo Router 6.0
- **Camera**: react-native-vision-camera 4.6.3
- **Rendering**: @shopify/react-native-skia 1.5.7
- **CV Engine**: MediaPipe (via @mediapipe/tasks-vision)
- **Video**: expo-av (Expo SDK 54)
- **Language**: TypeScript 5.9

## Project Structure

```
opb/
├── src/
│   ├── components/
│   │   ├── camera/
│   │   │   ├── CameraView.tsx          # Real-time camera with pose overlay
│   │   │   └── SkeletonRenderer.tsx    # Skia-based skeleton visualization
│   │   └── video/
│   │       └── VideoAnalysisView.tsx   # Video playback with pose analysis
│   ├── screens/
│   │   ├── LiveCameraScreen.tsx        # Live camera screen
│   │   └── VideoAnalysisScreen.tsx     # Video analysis screen
│   ├── services/
│   │   ├── PoseDetectionManager.ts     # Platform-abstracted pose detection
│   │   └── frameProcessor.ts           # Frame processing with worklets
│   ├── types/
│   │   ├── pose.types.ts               # Pose detection types
│   │   └── permissions.types.ts        # Permission types
│   └── utils/
│       ├── PerformanceMetrics.ts       # FPS and latency tracking
│       └── permissions.ts              # Permission handling
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx                   # Live Camera tab
│   │   ├── explore.tsx                 # Video Analysis tab
│   │   └── _layout.tsx                 # Tab navigation
│   └── _layout.tsx                     # Root layout
└── app.json                            # Expo configuration
```

## Features

### 1. Real-Time Pose Detection
- Live camera feed with 30-60 FPS capture
- Real-time pose skeleton overlay using Skia
- Performance metrics (FPS, inference latency)
- 33-point body landmark detection (MediaPipe Pose)

### 2. Video Analysis
- Gallery video picker
- Frame-by-frame navigation
- Variable playback speed (0.25x - 2.0x)
- Pose overlay on recorded videos

### 3. Performance Monitoring
- Real-time FPS tracking
- Inference latency measurement
- Average latency calculation
- Throttled UI updates for efficiency

## Key Components

### CameraView
Real-time camera component with pose detection overlay.

**Props:**
- `onPoseDetected?: (result: PoseDetectionResult) => void`
- `showMetrics?: boolean` (default: true)
- `showSkeleton?: boolean` (default: true)
- `targetFps?: number` (default: 30)

**Features:**
- Automatic permission handling
- Performance metrics display
- Landscape orientation
- Background/foreground state management

### SkeletonRenderer
High-performance Skia-based skeleton visualization.

**Props:**
- `poseResult: PoseDetectionResult | null`
- `width: number`
- `height: number`
- `showAllLandmarks?: boolean` (default: true)
- `jointColor?: string` (default: '#00FF00')
- `connectionColor?: string` (default: '#00FF00')
- `highlightColor?: string` (default: '#FF00FF')

**Features:**
- 33 pose landmarks with visibility filtering
- Key basketball landmarks highlighting
- Customizable colors
- Optimized rendering with useMemo

### VideoAnalysisView
Video playback with pose detection and analysis controls.

**Features:**
- Gallery video picker
- Playback controls (play/pause)
- Frame-by-frame stepping (forward/backward)
- Playback speed control (0.25x, 0.5x, 1.0x, 1.5x, 2.0x)
- Timeline scrubbing
- Pose overlay on video frames

### PoseDetectionManager
Platform-abstracted pose detection service.

**Methods:**
- `initialize(config?: PoseDetectorConfig): Promise<void>`
- `detectPose(frameData, width, height): Promise<PoseDetectionResult | null>`
- `cleanup(): Promise<void>`
- `isReady(): boolean`

**Configuration:**
- Model complexity: 0 (lite), 1 (full), 2 (heavy)
- Smooth landmarks: boolean
- Min detection confidence: 0-1
- Min tracking confidence: 0-1

## Setup Instructions

### Prerequisites
- Node.js 18+
- iOS: Xcode 15+ (macOS only)
- Android: Android Studio with SDK 30+
- Physical device (camera required)

### Installation

```bash
cd opb
npm install
```

### iOS Setup

```bash
# Install CocoaPods dependencies
cd ios
pod install
cd ..

# Run on iOS
npm run ios
```

### Android Setup

```bash
# Run on Android
npm run android
```

## Permissions

### iOS (Info.plist)
- `NSCameraUsageDescription`: Camera access for shooting form analysis
- `NSMicrophoneUsageDescription`: Microphone for video recording
- `NSPhotoLibraryUsageDescription`: Access to analyze recorded videos
- `NSPhotoLibraryAddUsageDescription`: Save analyzed videos

### Android (AndroidManifest.xml)
- `CAMERA`: Camera access
- `RECORD_AUDIO`: Audio recording
- `READ_EXTERNAL_STORAGE`: Read media files
- `READ_MEDIA_VIDEO`: Read video files (API 33+)
- `READ_MEDIA_IMAGES`: Read image files (API 33+)

## Architecture Notes

### Frame Processing
The frame processor uses React Native's new architecture with JSI (JavaScript Interface) for near-native performance:

1. Camera captures frames at target FPS (30-60)
2. Frame processor runs on worklet thread (not JS thread)
3. MediaPipe processes frame (native module)
4. Results dispatched back to JS thread
5. Skia renders skeleton overlay (GPU-accelerated)

### Platform Abstraction
The `PoseDetectionManager` provides a unified interface for pose detection:

- **iOS**: Can use Vision Framework or MediaPipe iOS SDK
- **Android**: Uses MediaPipe Android SDK
- Allows platform-specific optimizations while maintaining API compatibility

### Performance Optimization
- Frame processing throttled to target FPS
- Skia rendering on separate thread
- Metrics update throttled (500ms intervals)
- useMemo for expensive calculations
- Visibility filtering for landmarks

## Next Steps (Phase 2)

1. **Native MediaPipe Integration**
   - Implement native iOS module (Vision Framework/MediaPipe)
   - Implement native Android module (MediaPipe SDK)
   - Frame buffer conversion utilities

2. **Ball Tracking**
   - Custom TFLite model for basketball detection
   - Ball trajectory tracking
   - Release point detection

3. **Shooting Metrics**
   - Release angle calculation
   - Elbow alignment analysis
   - Shot arc tracking
   - Follow-through detection

4. **Shot Counter**
   - Make/miss detection
   - Shot attempt tracking
   - Performance statistics

## Known Limitations (Phase 1)

- MediaPipe integration is currently mocked (returns sample data)
- Frame processor needs native module implementation
- Video analysis processes frames but doesn't call actual CV
- No persistent storage for shot data
- Limited to 2D pose detection (no depth)

## Performance Targets

### iOS (iPhone 12+)
- Target: 60 FPS camera capture
- Inference: <50ms latency
- Battery: <20% drain per 30-minute session

### Android (Samsung S21+, Pixel 6+)
- Target: 30-60 FPS camera capture
- Inference: <75ms latency
- Battery: <25% drain per 30-minute session

## Development Notes

### Testing on Device
Physical devices are required for camera functionality. Simulators/emulators cannot access camera hardware.

### Debugging
- Use Flipper for React Native debugging
- Enable "Show Performance Monitor" in dev menu
- Check native logs for MediaPipe errors:
  - iOS: Xcode console
  - Android: `adb logcat`

### Common Issues

**Camera not showing:**
- Check permissions are granted
- Verify device is not in use by another app
- Restart the app

**Low FPS:**
- Reduce target FPS in configuration
- Lower model complexity (use 0 or 1)
- Disable segmentation if enabled

**Build errors:**
- Clear Metro bundler cache: `npm start -- --reset-cache`
- Clean iOS build: `cd ios && xcodebuild clean && cd ..`
- Clean Android build: `cd android && ./gradlew clean && cd ..`

## Contributing

This is Phase 1 (Proof of Concept). Focus on:
1. Validating MediaPipe performance on target devices
2. Testing camera stability and FPS
3. Evaluating battery consumption
4. Identifying UX improvements

## License

Proprietary - One Percent Better Basketball Training App
