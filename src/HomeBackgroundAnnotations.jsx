import { useEffect, useMemo, useRef, useState } from "react";
import manualAnnotationsCsvUrl from "../../manual_annotations/background_slide_only_24s_manual_annotations.csv?url";
import "./HomeBackgroundAnnotations.css";

const BACKGROUND_LOOP_SECONDS = 24;
const ANNOTATION_UPDATE_FRAMES = 24;
const ANNOTATION_EXPAND_X_PX = 20;
const ANNOTATION_EXPAND_Y_PX = 20;
const ANNOTATION_LABEL_MIN_REM = 0.46;
const ANNOTATION_LABEL_MAX_REM = 0.72;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeInteraction(rawType) {
  if (rawType === "No Interaction") {
    return { kind: "no-interaction", label: "No Interaction" };
  }
  if (rawType === "Touching Shelf") {
    return { kind: "touching", label: "Touching" };
  }
  if (rawType === "Holding Object") {
    return { kind: "holding", label: "Holding" };
  }
  if (rawType === "Removing Item") {
    return { kind: "removed", label: "Removing Item" };
  }
  return null;
}

function expandAnnotation(annotation, frameWidth, frameHeight) {
  const expandX = ANNOTATION_EXPAND_X_PX / Math.max(frameWidth, 1);
  const expandY = ANNOTATION_EXPAND_Y_PX / Math.max(frameHeight, 1);

  return {
    ...annotation,
    x1: clamp(annotation.x1 - expandX, 0, 1),
    y1: clamp(annotation.y1 - expandY, 0, 1),
    x2: clamp(annotation.x2 + expandX, 0, 1),
    y2: clamp(annotation.y2 + expandY, 0, 1),
  };
}

function buildAnnotationLabelStyle(annotation, frameWidth, frameHeight) {
  const annotationWidthPx = (annotation.x2 - annotation.x1) * frameWidth;
  const annotationHeightPx = (annotation.y2 - annotation.y1) * frameHeight;
  const controllingSize = Math.min(annotationWidthPx, annotationHeightPx);
  const sizeProgress = clamp((controllingSize - 40) / 220, 0, 1);
  const fontSizeRem =
    ANNOTATION_LABEL_MAX_REM - (ANNOTATION_LABEL_MAX_REM - ANNOTATION_LABEL_MIN_REM) * sizeProgress;

  return {
    fontSize: `${fontSizeRem.toFixed(3)}rem`,
  };
}

function buildCoverFrame(viewportWidth, viewportHeight, frameWidth, frameHeight) {
  if (!viewportWidth || !viewportHeight || !frameWidth || !frameHeight) {
    return {
      left: 0,
      top: 0,
      width: viewportWidth,
      height: viewportHeight,
    };
  }

  const scale = Math.max(viewportWidth / frameWidth, viewportHeight / frameHeight);
  const width = frameWidth * scale;
  const height = frameHeight * scale;

  return {
    left: (viewportWidth - width) / 2,
    top: (viewportHeight - height) / 2,
    width,
    height,
  };
}

function parseManualAnnotations(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) {
    return {
      annotationsByFrame: new Map(),
      frameCount: 0,
      frameWidth: 1,
      frameHeight: 1,
    };
  }

  const frames = new Map();
  let maxFrameIndex = 0;
  let maxX2 = 1;
  let maxY2 = 1;

  for (const line of lines.slice(1)) {
    const [
      annotationId,
      frameIndex,
      timestampSeconds,
      timestampHms,
      interactionType,
      x1,
      y1,
      x2,
      y2,
    ] = line.split(",");

    const interaction = normalizeInteraction(interactionType);
    if (!interaction) {
      continue;
    }

    const normalizedFrameIndex = Number(frameIndex);
    const normalizedX2 = Number(x2);
    const normalizedY2 = Number(y2);
    const nextAnnotation = {
      id: `${annotationId}-${normalizedFrameIndex}`,
      frameIndex: normalizedFrameIndex,
      timeSeconds: Number(timestampSeconds),
      timeHms: timestampHms,
      kind: interaction.kind,
      label: interaction.label,
      x1: Number(x1),
      y1: Number(y1),
      x2: normalizedX2,
      y2: normalizedY2,
    };

    const currentAnnotations = frames.get(normalizedFrameIndex) ?? [];
    currentAnnotations.push(nextAnnotation);
    frames.set(normalizedFrameIndex, currentAnnotations);
    maxFrameIndex = Math.max(maxFrameIndex, normalizedFrameIndex);
    maxX2 = Math.max(maxX2, normalizedX2);
    maxY2 = Math.max(maxY2, normalizedY2);
  }

  for (const [frameIndex, annotations] of frames.entries()) {
    frames.set(
      frameIndex,
      annotations.map((annotation) => ({
        ...annotation,
        x1: annotation.x1 / (maxX2 + 1),
        y1: annotation.y1 / (maxY2 + 1),
        x2: annotation.x2 / (maxX2 + 1),
        y2: annotation.y2 / (maxY2 + 1),
      })),
    );
  }

  return {
    annotationsByFrame: frames,
    frameCount: maxFrameIndex + 1,
    frameWidth: maxX2 + 1,
    frameHeight: maxY2 + 1,
  };
}

export default function HomeBackgroundAnnotations({ advanceSeconds = 0 }) {
  const [annotationData, setAnnotationData] = useState(null);
  const [playheadSeconds, setPlayheadSeconds] = useState(0);
  const [viewportSize, setViewportSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const mountStartedAtRef = useRef(performance.now());

  useEffect(() => {
    let ignore = false;

    async function loadAnnotations() {
      try {
        const response = await fetch(manualAnnotationsCsvUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Could not load manual annotations.");
        }

        const csvText = await response.text();
        if (!ignore) {
          setAnnotationData(parseManualAnnotations(csvText));
        }
      } catch {
        if (!ignore) {
          setAnnotationData(null);
        }
      }
    }

    loadAnnotations();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let frameId = 0;

    function tick(now) {
      const elapsedSeconds = (now - mountStartedAtRef.current) / 1000;
      setPlayheadSeconds(elapsedSeconds % BACKGROUND_LOOP_SECONDS);
      frameId = window.requestAnimationFrame(tick);
    }

    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    function handleResize() {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const annotationFrameState = useMemo(() => {
    const annotationsByFrame = annotationData?.annotationsByFrame;
    const annotationFrameCount = Number(annotationData?.frameCount ?? 0);
    const frameWidth = Number(annotationData?.frameWidth ?? 1);
    const frameHeight = Number(annotationData?.frameHeight ?? 1);
    const coverFrame = buildCoverFrame(
      viewportSize.width,
      viewportSize.height,
      frameWidth,
      frameHeight,
    );
    if (!annotationFrameCount) {
      return {
        annotations: [],
        driftOffsetPercent: 0,
        frameWidth,
        frameHeight,
        coverFrame,
      };
    }

    const shiftedPlayheadSeconds =
      (((playheadSeconds + Number(advanceSeconds || 0)) % BACKGROUND_LOOP_SECONDS) +
        BACKGROUND_LOOP_SECONDS) %
      BACKGROUND_LOOP_SECONDS;
    const frameProgress = shiftedPlayheadSeconds / BACKGROUND_LOOP_SECONDS;
    const currentFrame = Math.min(
      annotationFrameCount - 1,
      Math.max(0, Math.floor(frameProgress * annotationFrameCount)),
    );
    const displayFrame = Math.min(
      annotationFrameCount - 1,
      Math.floor(currentFrame / ANNOTATION_UPDATE_FRAMES) * ANNOTATION_UPDATE_FRAMES,
    );
    const displayFrameStartSeconds =
      (displayFrame / annotationFrameCount) * BACKGROUND_LOOP_SECONDS;
    // Keep each batch attached to the moving background until the next annotation refresh snaps in.
    const displayFrameElapsedSeconds = Math.max(
      0,
      shiftedPlayheadSeconds - displayFrameStartSeconds,
    );

    return {
      annotations:
        (annotationsByFrame?.get(displayFrame) ?? []).map((annotation) =>
          expandAnnotation(annotation, frameWidth, frameHeight),
        ),
      driftOffsetPercent:
        (displayFrameElapsedSeconds / BACKGROUND_LOOP_SECONDS) * 100,
      frameWidth,
      frameHeight,
      coverFrame,
    };
  }, [advanceSeconds, annotationData, playheadSeconds, viewportSize.height, viewportSize.width]);

  if (!annotationFrameState.annotations.length) {
    return null;
  }

  return (
    <div className="home-bg-annotations" aria-hidden="true">
      <div
        className="home-bg-annotations__frame"
        style={{
          transform: `translate3d(-${annotationFrameState.driftOffsetPercent}%, ${annotationFrameState.driftOffsetPercent}%, 0)`,
        }}
      >
        <div
          className="home-bg-annotations__canvas"
          style={{
            left: `${annotationFrameState.coverFrame.left}px`,
            top: `${annotationFrameState.coverFrame.top}px`,
            width: `${annotationFrameState.coverFrame.width}px`,
            height: `${annotationFrameState.coverFrame.height}px`,
          }}
        >
          {annotationFrameState.annotations.map((annotation) => (
            <div
              className={`home-bg-annotation ${annotation.kind}`}
              key={annotation.id}
              style={{
                left: `${annotation.x1 * 100}%`,
                top: `${annotation.y1 * 100}%`,
                width: `${(annotation.x2 - annotation.x1) * 100}%`,
                height: `${(annotation.y2 - annotation.y1) * 100}%`,
              }}
              title={`${annotation.label} at ${annotation.timeHms}`}
            >
              <span
                className="home-bg-annotation__label"
                style={buildAnnotationLabelStyle(
                  annotation,
                  annotationFrameState.coverFrame.width,
                  annotationFrameState.coverFrame.height,
                )}
              >
                {annotation.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
