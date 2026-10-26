# Native Module Implementation Guide

This guide explains how to implement the native MediaPipe modules for iOS and Android to enable real pose detection.

## Overview

Currently, the app uses mock data for pose detection. To enable real-time pose detection, you need to:

1. Create native modules for iOS and Android
2. Integrate MediaPipe SDK
3. Connect the native modules to the Frame Processor
4. Handle frame buffer conversion and processing

## iOS Implementation

### Step 1: Install MediaPipe iOS SDK

```ruby
# ios/Podfile
pod 'MediaPipeTasksVision', '~> 0.10.14'
```

### Step 2: Create Native Module

Create `ios/PoseDetector.swift`:

```swift
import MediaPipeTasksVision

@objc(PoseDetector)
class PoseDetector: NSObject {
  private var poseDetector: PoseLandmarker?

  @objc
  func initialize(_ options: NSDictionary,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {

    let modelPath = Bundle.main.path(forResource: "pose_landmarker", ofType: "task")!
    let detectorOptions = PoseLandmarkerOptions()
    detectorOptions.baseOptions.modelAssetPath = modelPath
    detectorOptions.runningMode = .liveStream
    detectorOptions.minPoseDetectionConfidence = options["minDetectionConfidence"] as? Float ?? 0.5
    detectorOptions.minPosePresenceConfidence = options["minTrackingConfidence"] as? Float ?? 0.5

    do {
      poseDetector = try PoseLandmarker(options: detectorOptions)
      resolve(true)
    } catch {
      reject("INIT_ERROR", "Failed to initialize pose detector", error)
    }
  }

  @objc
  func detectPose(_ frameBuffer: Data,
                  width: Int,
                  height: Int,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard let detector = poseDetector else {
      reject("NOT_INITIALIZED", "Pose detector not initialized", nil)
      return
    }

    // Convert frame buffer to MPImage
    // Process with MediaPipe
    // Return landmarks as dictionary

    resolve(landmarks)
  }
}
```

### Step 3: Bridge to React Native

Create `ios/PoseDetector.m`:

```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(PoseDetector, NSObject)

RCT_EXTERN_METHOD(initialize:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(detectPose:(NSData *)frameBuffer
                  width:(NSInteger)width
                  height:(NSInteger)height
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

### Step 4: Download Model

Download the MediaPipe Pose Landmarker model:
```bash
curl -o ios/pose_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task
```

Add to Xcode project resources.

## Android Implementation

### Step 1: Add MediaPipe Dependencies

```gradle
// android/app/build.gradle
dependencies {
    implementation 'com.google.mediapipe:tasks-vision:0.10.14'
}
```

### Step 2: Create Native Module

Create `android/app/src/main/java/com/opb/PoseDetectorModule.kt`:

```kotlin
package com.opb

import com.facebook.react.bridge.*
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerOptions

class PoseDetectorModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var poseLandmarker: PoseLandmarker? = null

    override fun getName() = "PoseDetector"

    @ReactMethod
    fun initialize(options: ReadableMap, promise: Promise) {
        try {
            val modelPath = "pose_landmarker.task"
            val baseOptions = BaseOptions.builder()
                .setModelAssetPath(modelPath)
                .build()

            val landmarkerOptions = PoseLandmarkerOptions.builder()
                .setBaseOptions(baseOptions)
                .setRunningMode(RunningMode.LIVE_STREAM)
                .setMinPoseDetectionConfidence(options.getDouble("minDetectionConfidence").toFloat())
                .setMinPosePresenceConfidence(options.getDouble("minTrackingConfidence").toFloat())
                .build()

            poseLandmarker = PoseLandmarker.createFromOptions(reactApplicationContext, landmarkerOptions)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", "Failed to initialize pose detector", e)
        }
    }

    @ReactMethod
    fun detectPose(frameBuffer: ReadableArray, width: Int, height: Int, promise: Promise) {
        val detector = poseLandmarker
        if (detector == null) {
            promise.reject("NOT_INITIALIZED", "Pose detector not initialized")
            return
        }

        // Convert frame buffer to MPImage
        // Process with MediaPipe
        // Return landmarks as map

        promise.resolve(result)
    }
}
```

### Step 3: Register Module

Create `android/app/src/main/java/com/opb/PoseDetectorPackage.kt`:

```kotlin
package com.opb

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class PoseDetectorPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(PoseDetectorModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
```

Register in `MainApplication.kt`:
```kotlin
packages.add(PoseDetectorPackage())
```

### Step 4: Add Model Asset

Download and place in `android/app/src/main/assets/`:
```bash
curl -o android/app/src/main/assets/pose_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task
```

## Connecting to JavaScript

### Step 1: Create NativeModule Bridge

Create `src/services/NativePoseDetector.ts`:

```typescript
import { NativeModules } from 'react-native';

const { PoseDetector } = NativeModules;

export interface NativePoseDetector {
  initialize(options: {
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }): Promise<boolean>;

  detectPose(
    frameBuffer: Uint8Array,
    width: number,
    height: number
  ): Promise<any>;
}

export default PoseDetector as NativePoseDetector;
```

### Step 2: Update PoseDetectionManager

Replace the mock detection in `PoseDetectionManager.ts`:

```typescript
import NativePoseDetector from './NativePoseDetector';

async detectPose(
  frameData: any,
  width: number,
  height: number
): Promise<PoseDetectionResult | null> {
  if (!this.isInitialized) {
    throw new Error('PoseDetectionManager not initialized');
  }

  try {
    const result = await NativePoseDetector.detectPose(
      frameData,
      width,
      height
    );

    return {
      landmarks: result.landmarks,
      worldLandmarks: result.worldLandmarks,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[PoseDetectionManager] Detection failed:', error);
    return null;
  }
}
```

## Frame Processor Integration

### Using VisionCamera Frame Processor Plugin

For optimal performance, create a Vision Camera frame processor plugin:

#### iOS Plugin

```swift
@objc(PoseFrameProcessorPlugin)
public class PoseFrameProcessorPlugin: FrameProcessorPlugin {
  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
    let buffer = CMSampleBufferGetImageBuffer(frame.buffer)
    // Convert to MPImage
    // Process with detector
    // Return landmarks
    return landmarks
  }
}
```

#### Android Plugin

```kotlin
class PoseFrameProcessorPlugin : FrameProcessorPlugin() {
  override fun callback(frame: Frame, arguments: Map<String, Any>?): Any {
    val buffer = frame.image
    // Convert to MPImage
    // Process with detector
    // Return landmarks
    return landmarks
  }
}
```

## Testing

### Unit Tests
```typescript
describe('PoseDetectionManager', () => {
  it('initializes correctly', async () => {
    await poseDetectionManager.initialize();
    expect(poseDetectionManager.isReady()).toBe(true);
  });

  it('detects pose from frame', async () => {
    const result = await poseDetectionManager.detectPose(mockFrame, 1920, 1080);
    expect(result).toBeTruthy();
    expect(result.landmarks).toHaveLength(33);
  });
});
```

### Device Testing
1. Build and run on physical device
2. Grant camera permissions
3. Point camera at person
4. Verify skeleton overlay appears
5. Check performance metrics (FPS > 25, latency < 100ms)

## Performance Optimization

### iOS
- Use GPU delegate for faster inference
- Enable CoreML delegate if available
- Adjust model complexity based on device

### Android
- Use NNAPI delegate for hardware acceleration
- Enable GPU delegate on supported devices
- Profile with Android Studio Profiler

## Troubleshooting

### Model Loading Errors
- Verify model file exists in assets/resources
- Check file permissions
- Ensure correct model version for SDK

### Low Performance
- Reduce model complexity
- Lower camera resolution
- Decrease target FPS
- Use GPU acceleration

### Frame Conversion Issues
- Verify buffer format (YUV vs RGB)
- Check stride/alignment
- Test with different frame formats

## Resources

- [MediaPipe Pose Landmarker](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- [VisionCamera Frame Processor Plugins](https://react-native-vision-camera.com/docs/guides/frame-processors-plugins-overview)
- [React Native Turbo Modules](https://reactnative.dev/docs/next/the-new-architecture/pillars-turbomodules)
