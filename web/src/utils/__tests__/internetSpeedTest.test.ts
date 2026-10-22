import { describe, it, expect } from "vitest";
import { DEFAULT_THRESHOLDS } from "../internetSpeedTest";

describe("Internet Speed Test for AI Voice Interview", () => {
  it("defines realistic thresholds suitable for 16kHz PCM audio streaming", () => {
    // 16kHz mono 16-bit PCM = 256 kbps = 0.256 Mbps
    expect(DEFAULT_THRESHOLDS.minUploadMbps).toBeLessThanOrEqual(0.3);
    expect(DEFAULT_THRESHOLDS.minUploadMbps).toBeGreaterThan(0);

    // Download for 24kHz audio playback
    expect(DEFAULT_THRESHOLDS.minDownloadMbps).toBeLessThanOrEqual(2.0);
    expect(DEFAULT_THRESHOLDS.minDownloadMbps).toBeGreaterThan(0);

    // VoIP latency ceiling
    expect(DEFAULT_THRESHOLDS.maxPingMs).toBeGreaterThanOrEqual(400);
  });

  it("passes candidate connection parameters (13.37 Mbps down, 0.29 Mbps up, 40 ms ping)", () => {
    const candidateDownload = 13.37;
    const candidateUpload = 0.29;
    const candidatePing = 40;

    const passed =
      candidateDownload >= DEFAULT_THRESHOLDS.minDownloadMbps &&
      candidateUpload >= DEFAULT_THRESHOLDS.minUploadMbps &&
      candidatePing <= DEFAULT_THRESHOLDS.maxPingMs;

    expect(passed).toBe(true);
  });
});
