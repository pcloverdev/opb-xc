package __PACKAGE__

import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker

/**
 * React Native module that extracts a frame from a video file at a given
 * timestamp and runs MediaPipe Pose Landmarker (IMAGE mode) on it.
 *
 * Exposed to JS as `NativeModules.VideoPoseDetector`.
 */
class VideoPoseDetectorModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var landmarker: PoseLandmarker? = null

  override fun getName() = "VideoPoseDetector"

  private fun getLandmarker(): PoseLandmarker? {
    landmarker?.let { return it }
    return try {
      val baseOptions = BaseOptions.builder()
        .setModelAssetPath(MODEL_ASSET)
        .build()
      val options = PoseLandmarker.PoseLandmarkerOptions.builder()
        .setBaseOptions(baseOptions)
        .setRunningMode(RunningMode.IMAGE)
        .setNumPoses(1)
        .build()
      landmarker = PoseLandmarker.createFromOptions(reactApplicationContext, options)
      landmarker
    } catch (e: Throwable) {
      Log.e(TAG, "Failed to initialize: ${e.message}", e)
      null
    }
  }

  @ReactMethod
  fun detectPoseInFrame(uri: String, timestampMs: Double, promise: Promise) {
    val detector = getLandmarker()
    if (detector == null) {
      promise.reject("NO_MODEL", "Failed to load $MODEL_ASSET")
      return
    }

    val retriever = MediaMetadataRetriever()
    try {
      retriever.setDataSource(reactApplicationContext, Uri.parse(uri))

      val frame = retriever.getFrameAtTime(
        (timestampMs * 1000).toLong(), // microseconds
        MediaMetadataRetriever.OPTION_CLOSEST
      )
      if (frame == null) {
        promise.reject("NO_FRAME", "Could not extract frame at ${timestampMs}ms")
        return
      }

      // MediaPipe requires an ARGB_8888 bitmap.
      val bitmap: Bitmap =
        if (frame.config == Bitmap.Config.ARGB_8888) frame
        else frame.copy(Bitmap.Config.ARGB_8888, false)

      val mpImage = BitmapImageBuilder(bitmap).build()
      val result = detector.detect(mpImage)

      val array = Arguments.createArray()
      val poses = result.landmarks()
      if (poses.isNotEmpty()) {
        for (landmark in poses[0]) {
          val map = Arguments.createMap()
          map.putDouble("x", landmark.x().toDouble())
          map.putDouble("y", landmark.y().toDouble())
          map.putDouble("z", landmark.z().toDouble())
          map.putDouble("visibility", landmark.visibility().orElse(1.0f).toDouble())
          array.pushMap(map)
        }
      }
      promise.resolve(array)
    } catch (e: Throwable) {
      Log.e(TAG, "Detection error: ${e.message}", e)
      promise.reject("DETECT_ERROR", e.message, e)
    } finally {
      retriever.release()
    }
  }

  companion object {
    private const val TAG = "VideoPoseDetector"
    private const val MODEL_ASSET = "pose_landmarker_lite.task"
  }
}
