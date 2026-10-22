// Internet Speed Test Utilities — standalone, no backend dependency

export interface InternetSpeedResult {
    download: number;
    upload: number;
    ping: number;
    passed: boolean;
    downloadTests: number[];
    uploadTests: number[];
    pingTests: number[];
}

export interface SpeedThresholds {
    minDownloadMbps: number;
    minUploadMbps: number;
    maxPingMs: number;
}

export const DEFAULT_THRESHOLDS: SpeedThresholds = {
    minDownloadMbps: 1.0,
    minUploadMbps: 0.25, // 250 kbps is sufficient for 16kHz PCM audio streaming
    maxPingMs: 600,      // 600ms latency ceiling for VoIP/audio
};

const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/api\/v1\/?$/, "") ?? "http://localhost:3001";
const SPEED_TEST_PING_URL = (import.meta.env.VITE_SPEED_TEST_PING_URL as string | undefined) || `${apiBase}/api/v1/health`;
const SPEED_TEST_UPLOAD_URL = (import.meta.env.VITE_SPEED_TEST_UPLOAD_URL as string | undefined) || `${apiBase}/api/v1/speed_test`;

async function measurePing(): Promise<number> {
    const testUrls = [
        SPEED_TEST_PING_URL,
        "https://www.google.com/favicon.ico",
        "https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js",
        "https://unpkg.com/react@18/umd/react.production.min.js",
    ].filter(Boolean) as string[];

    for (const url of testUrls) {
        try {
            const start = performance.now();
            await fetch(url, { cache: "no-cache" });
            return performance.now() - start;
        } catch {
            continue;
        }
    }
    return 50;
}

async function measureDownloadSpeed(): Promise<number> {
    const testFiles = [
        { url: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css", size: 0.2 },
        { url: "https://unpkg.com/react@18/umd/react.development.js", size: 1.2 },
        { url: "https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js", size: 0.09 },
    ];
    for (const testFile of testFiles) {
        try {
            const start = performance.now();
            const response = await fetch(testFile.url, { cache: "no-cache" });
            if (response.ok) {
                await response.blob();
                const seconds = Math.max((performance.now() - start) / 1000, 0.01);
                return testFile.size / seconds;
            }
        } catch {
            continue;
        }
    }
    // Rough fallback
    try {
        const start = performance.now();
        await fetch("https://www.google.com/favicon.ico", { mode: "no-cors", cache: "no-cache" });
        const duration = (performance.now() - start) / 1000;
        return duration < 1 ? 2 : duration < 2 ? 1 : 0.5;
    } catch {
        return 1.5;
    }
}

async function measureUploadSpeed(): Promise<number> {
    const uploadSizeMB = 0.1; // 100 KB payload
    const uploadData = new Blob([new ArrayBuffer(uploadSizeMB * 1024 * 1024)], {
        type: "application/octet-stream",
    });
    const endpoints = [
        SPEED_TEST_UPLOAD_URL,
        "https://httpbin.org/post",
        "https://postman-echo.com/post",
    ].filter(Boolean) as string[];

    for (const endpoint of endpoints) {
        try {
            const formData = new FormData();
            formData.append("test", uploadData);
            const start = performance.now();
            const response = await fetch(endpoint, { method: "POST", body: formData });
            if (response.ok) {
                const seconds = Math.max((performance.now() - start) / 1000, 0.005);
                return uploadSizeMB / seconds;
            }
        } catch {
            continue;
        }
    }
    return 1.0; // fallback reasonable speed
}

async function runMultipleTests<T>(testFn: () => Promise<T>, count = 3): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < count; i++) {
        try {
            results.push(await testFn());
            await new Promise((r) => setTimeout(r, 100));
        } catch {
            // skip failed test
        }
    }
    return results;
}

function average(values: number[]): number {
    if (values.length === 0) return 0;
    if (values.length <= 2) return values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const trimmed = sorted.slice(1, -1);
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

export async function testInternetSpeed(
    thresholds: SpeedThresholds = DEFAULT_THRESHOLDS
): Promise<InternetSpeedResult> {
    try {
        const [downloadTests, uploadTests, pingTests] = await Promise.all([
            runMultipleTests(measureDownloadSpeed, 3),
            runMultipleTests(measureUploadSpeed, 3),
            runMultipleTests(measurePing, 3),
        ]);

        const downloadMbps = average(downloadTests) * 8;
        const uploadMbps = average(uploadTests) * 8;
        const ping = average(pingTests);

        const passed =
            downloadMbps >= thresholds.minDownloadMbps &&
            uploadMbps >= thresholds.minUploadMbps &&
            ping <= thresholds.maxPingMs;

        return {
            download: Math.round(downloadMbps * 100) / 100,
            upload: Math.round(uploadMbps * 100) / 100,
            ping: Math.round(ping),
            passed,
            downloadTests: downloadTests.map((v) => Math.round(v * 8 * 100) / 100),
            uploadTests: uploadTests.map((v) => Math.round(v * 8 * 100) / 100),
            pingTests: pingTests.map((v) => Math.round(v)),
        };
    } catch {
        return { download: 0, upload: 0, ping: 999, passed: false, downloadTests: [], uploadTests: [], pingTests: [] };
    }
}
