package __PACKAGE__

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import android.media.Image
import android.os.SystemClock
import android.util.Log
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.ImageProcessingOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import java.io.ByteArrayOutputStream

/**
 * VisionCamera Frame Processor Plugin that runs MediaPipe Pose Landmarker on
 * each camera frame and returns 33 normalized body landmarks.
 *
 * Registered from JS as `detectPose` (see registration in MainApplication).
 */
class PoseLandmarkerFrameProcessorPlugin(
  private val context: Context,
  options: Map<String, Any>?,
) : FrameProcessorPlugin() {

  private var landmarker: PoseLandmarker? = null

  init {
    val detectionConfidence = (options?.get("minDetectionConfidence") as? Number)?.toFloat() ?: 0.5f
    val trackingConfidence = (options?.get("minTrackingConfidence") as? Number)?.toFloat() ?: 0.5f
    setupLandmarker(detectionConfidence, trackingConfidence)
  }

  private fun setupLandmarker(detectionConfidence: Float, trackingConfidence: Float) {
    try {
      val baseOptions = BaseOptions.builder()
        .setModelAssetPath(MODEL_ASSET)
        .build()

      val landmarkerOptions = PoseLandmarker.PoseLandmarkerOptions.builder()
        .setBaseOptions(baseOptions)
        .setRunningMode(RunningMode.VIDEO)
        .setNumPoses(1)
        .setMinPoseDetectionConfidence(detectionConfidence)
        .setMinPosePresenceConfidence(trackingConfidence)
        .setMinTrackingConfidence(trackingConfidence)
        .build()

      landmarker = PoseLandmarker.createFromOptions(context, landmarkerOptions)
      Log.i(TAG, "Initialized successfully.")
    } catch (e: Throwable) {
      Log.e(TAG, "Failed to initialize: ${e.message}", e)
    }
  }

  override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
    val detector = landmarker ?: return null

    return try {
      val image: Image = frame.image
      val bitmap = yuv420ToBitmap(image)

      val rotationDegrees = frame.imageProxy.imageInfo.rotationDegrees
      val processingOptions = ImageProcessingOptions.builder()
        .setRotationDegrees(rotationDegrees)
        .build()

      val mpImage = BitmapImageBuilder(bitmap).build()
      val result = detector.detectForVideo(mpImage, processingOptions, SystemClock.uptimeMillis())

      val poses = result.landmarks()
      if (poses.isEmpty()) {
        return ArrayList<Any>() // No person detected in this frame.
      }

      poses[0].map { landmark ->
        hashMapOf(
          "x" to landmark.x(),
          "y" to landmark.y(),
          "z" to landmark.z(),
          "visibility" to landmark.visibility().orElse(1.0f),
        )
      }
    } catch (e: Throwable) {
      Log.e(TAG, "Detection error: ${e.message}", e)
      null
    }
  }

  /** Converts a YUV_420_888 [Image] into an RGB [Bitmap] via NV21 + JPEG. */
  private fun yuv420ToBitmap(image: Image): Bitmap {
    val nv21 = yuv420ToNv21(image)
    val yuvImage = YuvImage(nv21, ImageFormat.NV21, image.width, image.height, null)
    val out = ByteArrayOutputStream()
    yuvImage.compressToJpeg(Rect(0, 0, image.width, image.height), 85, out)
    val jpegBytes = out.toByteArray()
    return BitmapFactory.decodeByteArray(jpegBytes, 0, jpegBytes.size)
  }

  private fun yuv420ToNv21(image: Image): ByteArray {
    val width = image.width
    val height = image.height
    val ySize = width * height
    val chromaWidth = width / 2
    val chromaHeight = height / 2
    val nv21 = ByteArray(ySize + 2 * chromaWidth * chromaHeight)

    val yPlane = image.planes[0]
    val uPlane = image.planes[1]
    val vPlane = image.planes[2]

    val yBuffer = yPlane.buffer
    val yRowStride = yPlane.rowStride
    val yPixelStride = yPlane.pixelStride

    var pos = 0
    for (row in 0 until height) {
      val rowStart = row * yRowStride
      for (col in 0 until width) {
        nv21[pos++] = yBuffer.get(rowStart + col * yPixelStride)
      }
    }

    val uBuffer = uPlane.buffer
    val vBuffer = vPlane.buffer
    val uRowStride = uPlane.rowStride
    val vRowStride = vPlane.rowStride
    val uPixelStride = uPlane.pixelStride
    val vPixelStride = vPlane.pixelStride

    // NV21 chroma is interleaved as V, U.
    for (row in 0 until chromaHeight) {
      for (col in 0 until chromaWidth) {
        nv21[pos++] = vBuffer.get(row * vRowStride + col * vPixelStride)
        nv21[pos++] = uBuffer.get(row * uRowStride + col * uPixelStride)
      }
    }

    return nv21
  }

  companion object {
    private const val TAG = "PoseLandmarker"
    private const val MODEL_ASSET = "pose_landmarker_lite.task"
  }
}
