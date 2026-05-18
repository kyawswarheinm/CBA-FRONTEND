import { useEffect, useMemo, useRef, useState } from "react";
import manualAnnotationsCsvUrl from "../../manual_annotations/background_slide_only_24s_manual_annotations.csv?url";
import tiledBackground from "./assets/background_raw.png";
import "./BackgroundSlide.css";
import "./HomeBackgroundAnnotations.css";

const SOURCE_FRAME_WIDTH = 1920;
const SOURCE_FRAME_HEIGHT = 1080;
const BACKGROUND_LOOP_SECONDS = 24;
const ANNOTATION_UPDATE_FRAMES = 24;
const ANNOTATION_EXPAND_X_PX = 20;
const ANNOTATION_EXPAND_Y_PX = 20;
const ANNOTATION_LABEL_BASE_PX = 12;

const TILE_OFFSETS = [
  { id: "origin", x: 0, y: 0 },
  { id: "top", x: 0, y: -1 },
  { id: "right", x: 1, y: 0 },
  { id: "top-right", x: 1, y: -1 },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function wrapUnit(value) {
  const wrappedValue = value % 1;
  return wrappedValue < 0 ? wrappedValue + 1 : wrappedValue;
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

function anchorAnnotationToBackground(annotation, frameProgress) {
  const annotationWidth = annotation.x2 - annotation.x1;
  const annotationHeight = annotation.y2 - annotation.y1;
  const anchoredX1 = wrapUnit(annotation.x1 + frameProgress);
  const anchoredY1 = wrapUnit(annotation.y1 - frameProgress);

  return {
    ...annotation,
    x1: anchoredX1,
    y1: anchoredY1,
    x2: anchoredX1 + annotationWidth,
    y2: anchoredY1 + annotationHeight,
  };
}

function buildAnnotationLabelStyle(frameWidth, frameHeight) {
  const responsiveScale = clamp(Math.min(frameWidth, frameHeight) / 960, 0.9, 1.05);
  const fontSizePx = ANNOTATION_LABEL_BASE_PX * responsiveScale;

  return {
    fontSize: `${fontSizePx.toFixed(1)}px`,
  };
}

function parseManualAnnotations(csvText) {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) {
    return {
      annotationsByFrame: new Map(),
      frameCount: 0,
      frameWidth: SOURCE_FRAME_WIDTH,
      frameHeight: SOURCE_FRAME_HEIGHT,
    };
  }

  const frames = new Map();
  let maxFrameIndex = 0;
  let maxX2 = SOURCE_FRAME_WIDTH - 1;
  let maxY2 = SOURCE_FRAME_HEIGHT - 1;

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

function buildCoverFrame(viewportWidth, viewportHeight, frameWidth, frameHeight) {
  const safeViewportWidth = Math.max(viewportWidth, 1);
  const safeViewportHeight = Math.max(viewportHeight, 1);
  const safeFrameWidth = Math.max(frameWidth, 1);
  const safeFrameHeight = Math.max(frameHeight, 1);
  const scale = Math.max(safeViewportWidth / safeFrameWidth, safeViewportHeight / safeFrameHeight);
  const width = safeFrameWidth * scale;
  const height = safeFrameHeight * scale;

  return {
    left: (safeViewportWidth - width) / 2,
    top: (safeViewportHeight - height) / 2,
    width,
    height,
  };
}

function buildTileStyle(tile, coverFrame, progress) {
  return {
    left: coverFrame.left + (tile.x - progress) * coverFrame.width,
    top: coverFrame.top + (tile.y + progress) * coverFrame.height,
    width: coverFrame.width,
    height: coverFrame.height,
  };
}

export default function BackgroundSlide({ advanceSeconds = 0 }) {
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

  const sceneState = useMemo(() => {
    const frameWidth = Number(annotationData?.frameWidth ?? SOURCE_FRAME_WIDTH);
    const frameHeight = Number(annotationData?.frameHeight ?? SOURCE_FRAME_HEIGHT);
    const coverFrame = buildCoverFrame(
      viewportSize.width,
      viewportSize.height,
      frameWidth,
      frameHeight,
    );
    const shiftedPlayheadSeconds =
      (((playheadSeconds + Number(advanceSeconds || 0)) % BACKGROUND_LOOP_SECONDS) +
        BACKGROUND_LOOP_SECONDS) %
      BACKGROUND_LOOP_SECONDS;
    const progress = shiftedPlayheadSeconds / BACKGROUND_LOOP_SECONDS;
    const annotationsByFrame = annotationData?.annotationsByFrame;
    const annotationFrameCount = Number(annotationData?.frameCount ?? 0);

    if (!annotationFrameCount) {
      return {
        annotations: [],
        coverFrame,
        progress,
      };
    }

    const currentFrame = Math.min(
      annotationFrameCount - 1,
      Math.max(0, Math.floor(progress * annotationFrameCount)),
    );
    const displayFrame = Math.min(
      annotationFrameCount - 1,
      Math.floor(currentFrame / ANNOTATION_UPDATE_FRAMES) * ANNOTATION_UPDATE_FRAMES,
    );
    const displayFrameProgress = displayFrame / Math.max(annotationFrameCount, 1);

    return {
      annotations:
        (annotationsByFrame?.get(displayFrame) ?? []).map((annotation) =>
          expandAnnotation(
            anchorAnnotationToBackground(annotation, displayFrameProgress),
            frameWidth,
            frameHeight,
          ),
        ),
      coverFrame,
      progress,
    };
  }, [advanceSeconds, annotationData, playheadSeconds, viewportSize.height, viewportSize.width]);

  return (
    <div className="bg-slide" aria-hidden="true">
      {TILE_OFFSETS.map((tile) => (
        <div className="bg-slide__tile" key={tile.id} style={buildTileStyle(tile, sceneState.coverFrame, sceneState.progress)}>
          <img alt="" className="bg-slide__image" draggable="false" src={tiledBackground} />
          {sceneState.annotations.length ? (
            <div className="bg-slide__annotations">
              {sceneState.annotations.map((annotation) => (
                <div
                  className={`home-bg-annotation ${annotation.kind}`}
                  key={`${tile.id}-${annotation.id}`}
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
                      sceneState.coverFrame.width,
                      sceneState.coverFrame.height,
                    )}
                  >
                    {annotation.label}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
