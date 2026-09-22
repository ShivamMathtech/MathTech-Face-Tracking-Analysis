import {
  FaceLandmarker,
  FaceDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { bounds, iou, poseFromMatrix } from "../core/math";
import type { Detection, Settings } from "../types";
let landmarker: FaceLandmarker | undefined, detector: FaceDetector | undefined;
const ctx = self as unknown as {
  postMessage: (value: unknown) => void;
  onmessage: ((event: MessageEvent) => void) | null;
};
ctx.onmessage = async (event: MessageEvent) => {
  const m = event.data;
  try {
    if (m.type === "init") {
      const files = await FilesetResolver.forVisionTasks(`${m.base}wasm`);
      const s = m.settings as Settings;
      landmarker = await FaceLandmarker.createFromOptions(files, {
        baseOptions: {
          modelAssetPath: `${m.base}models/face_landmarker.task`,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numFaces: s.maxFaces,
        minFaceDetectionConfidence: s.threshold,
        minFacePresenceConfidence: s.threshold,
        minTrackingConfidence: s.threshold,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
      detector = await FaceDetector.createFromOptions(files, {
        baseOptions: {
          modelAssetPath: `${m.base}models/blaze_face_short_range.tflite`,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        minDetectionConfidence: s.threshold,
      });
      ctx.postMessage({ type: "ready" });
    } else if (m.type === "settings") {
      await landmarker?.setOptions({
        numFaces: m.settings.maxFaces,
        minFaceDetectionConfidence: m.settings.threshold,
        minFacePresenceConfidence: m.settings.threshold,
        minTrackingConfidence: m.settings.threshold,
      });
      await detector?.setOptions({
        minDetectionConfidence: m.settings.threshold,
      });
    } else if (m.type === "frame") {
      if (!landmarker || !detector) {
        m.bitmap.close();
        throw Error("Vision engine is not initialized");
      }
      const start = performance.now();
      const bitmap = m.bitmap as ImageBitmap;
      try {
        const result = landmarker.detectForVideo(bitmap, m.timestamp);
        const boxes = detector.detectForVideo(bitmap, m.timestamp).detections;
        const faces: Detection[] = result.faceLandmarks.map((points, index) => {
          const box = bounds(points, bitmap.width, bitmap.height);
          const scores = boxes
            .map((d) => ({
              score: d.categories[0]?.score ?? null,
              overlap: d.boundingBox
                ? iou(box, {
                    x: d.boundingBox.originX,
                    y: d.boundingBox.originY,
                    width: d.boundingBox.width,
                    height: d.boundingBox.height,
                  })
                : 0,
            }))
            .sort((a, b) => b.overlap - a.overlap);
          return {
            bbox: box,
            landmarks: points.map((p) => ({
              x: p.x * bitmap.width,
              y: p.y * bitmap.height,
              z: p.z * bitmap.width,
            })),
            confidence: scores[0]?.overlap > 0.1 ? scores[0].score : null,
            pose: poseFromMatrix(
              result.facialTransformationMatrixes[index]?.data ?? [],
            ),
            signals: Object.fromEntries(
              (result.faceBlendshapes[index]?.categories ?? []).map((c) => [
                c.categoryName,
                c.score,
              ]),
            ),
          };
        });
        ctx.postMessage({
          type: "result",
          faces,
          latency: performance.now() - start,
          timestamp: m.timestamp,
          epoch: m.epoch,
        });
      } finally {
        bitmap.close();
      }
    }
  } catch (e) {
    ctx.postMessage({
      type: "error",
      error: e instanceof Error ? e.message : String(e),
    });
  }
};
