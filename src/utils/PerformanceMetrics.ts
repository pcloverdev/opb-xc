/**
 * PerformanceMetrics
 * Tracks FPS and inference latency for real-time monitoring
 */

export class PerformanceMetrics {
  private frameTimestamps: number[] = [];
  private latencyMeasurements: number[] = [];
  private readonly maxSamples = 30;
  private lastUpdateTime = 0;
  private readonly updateInterval = 500;

  /**
   * Record a new frame timestamp
   */
  recordFrame(): void {
    const now = performance.now();
    this.frameTimestamps.push(now);

    if (this.frameTimestamps.length > this.maxSamples) {
      this.frameTimestamps.shift();
    }
  }

  /**
   * Record inference latency for a frame
   */
  recordLatency(latency: number): void {
    this.latencyMeasurements.push(latency);

    if (this.latencyMeasurements.length > this.maxSamples) {
      this.latencyMeasurements.shift();
    }
  }

  /**
   * Calculate current FPS
   */
  getFPS(): number {
    if (this.frameTimestamps.length < 2) {
      return 0;
    }

    const timeSpan =
      this.frameTimestamps[this.frameTimestamps.length - 1] -
      this.frameTimestamps[0];

    if (timeSpan === 0) {
      return 0;
    }

    return Math.round(((this.frameTimestamps.length - 1) / timeSpan) * 1000);
  }

  /**
   * Get latest inference latency
   */
  getLatestLatency(): number {
    return this.latencyMeasurements.length > 0
      ? Math.round(this.latencyMeasurements[this.latencyMeasurements.length - 1])
      : 0;
  }

  /**
   * Get average inference latency
   */
  getAverageLatency(): number {
    if (this.latencyMeasurements.length === 0) {
      return 0;
    }

    const sum = this.latencyMeasurements.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / this.latencyMeasurements.length);
  }

  /**
   * Get total frame count
   */
  getFrameCount(): number {
    return this.frameTimestamps.length;
  }

  /**
   * Check if metrics should be updated (throttled)
   */
  shouldUpdate(): boolean {
    const now = performance.now();
    if (now - this.lastUpdateTime >= this.updateInterval) {
      this.lastUpdateTime = now;
      return true;
    }
    return false;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.frameTimestamps = [];
    this.latencyMeasurements = [];
    this.lastUpdateTime = 0;
  }

  /**
   * Get all metrics as an object
   */
  getMetrics() {
    return {
      fps: this.getFPS(),
      inferenceLatency: this.getLatestLatency(),
      averageLatency: this.getAverageLatency(),
      frameCount: this.getFrameCount(),
    };
  }
}
