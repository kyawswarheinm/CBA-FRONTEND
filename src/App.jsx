import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import exampleShelfImage from "./assets/example1-shelf.png";
import BackgroundSlide from "./BackgroundSlide";
import example1Layout from "./productLayouts/example1Layout";
import example2Layout from "./productLayouts/example2Layout";
import sampleStreamDefinitions from "./sampleStreamDefinitions.json";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const FALLBACK_STREAMS = sampleStreamDefinitions.map((stream) => ({ ...stream }));

const VIEW_OPTIONS = [
  { value: "live", label: "live view" },
  { value: "heatmap", label: "heatmap" },
];

const HEATMAP_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "touching", label: "Touching Shelf" },
  { value: "holding", label: "Holding Object" },
  { value: "removed", label: "Removing Item" },
];

const PRODUCT_LAYOUT_OPTIONS = [
  { value: "example2", label: "Example Layout" },
  { value: "example1", label: "Example with Real Shelf" },
  { value: "custom", label: "Configure Yourself" },
];
const UPLOAD_STREAM_OPTION_VALUE = "__upload_video__";
const STREAM_SETUP_ORIENTATIONS = [
  { value: "none", label: "Upright" },
  { value: "rotate_90_ccw", label: "Rotate Left" },
  { value: "rotate_90_cw", label: "Rotate Right" },
  { value: "rotate_180", label: "Flip 180" },
];
const DEFAULT_SHELF_ZONE_DRAFT = [
  { x: 0.12, y: 0.14 },
  { x: 0.88, y: 0.14 },
  { x: 0.82, y: 0.88 },
  { x: 0.18, y: 0.9 },
];
const SHELF_ZONE_COORDINATE_MIN = -2;
const SHELF_ZONE_COORDINATE_MAX = 2;
const SHELF_ZONE_HANDLE_LABELS = [2, 1, 4, 3];
const SHELF_ZONE_REFERENCE_ITEMS = [
  { label: 1, title: "Top right", description: "Place on the top-right corner of the shelf." },
  { label: 2, title: "Top left", description: "Place on the top-left corner of the shelf." },
  { label: 3, title: "Bottom left", description: "Place on the bottom-left corner of the shelf." },
  { label: 4, title: "Bottom right", description: "Place on the bottom-right corner of the shelf." },
];
const HOME_ANNOTATION_ADVANCE_DEFAULT = -0.2;
const PERSISTENT_ANALYTICS_STORAGE_KEY = "cba-persistent-product-events-v1";
const MAX_PERSISTENT_ANALYTICS_EVENTS = 6000;
const UPLOAD_CHUNK_SIZE_FALLBACK = 4 * 1024 * 1024;
const ABOUT_INTRO_PARAGRAPHS = [
  {
    tone: "default",
    text:
      "Customer Behaviour Analysis(CBA) combines shelf-level computer vision, a custom trained yolo model, retail data workflows, predictive analytics, and data visualization into one integrated decision system built for modern retail operations.",
  },
  {
    tone: "insight",
    text:
      "Unlike traditional POS systems, its purpose is to reveal pre-purchase customer intent and connect those behavior signals with actualsales outcomes. This helps retail teams act on revenue risks before they appear in transactional reports.",
  },
  {
    tone: "accent",
    text:
      "Instead of asking only what were sold, the platform is designed to explain what customers noticed, touched, held, removed, or ignored, then transform those behaviors into measurable signals for faster and smarter business decisions.",
  },
];
const ABOUT_TRAINING_IMAGES = [
  {
    src: "/images/labels.jpg",
    alt: "Dataset label distribution for customer interaction training data",
    caption: "Label density, class balance, and annotation spread across the retail interaction dataset.",
  },
  {
    src: "/images/results.png",
    alt: "Training results chart for the retail interaction model",
    caption: "Training and validation metrics across the full 50-epoch schedule.",
  },
  {
    src: "/images/confusion_matrix_normalized.png",
    alt: "Normalized confusion matrix for the interaction model",
    caption: "Normalized confusion matrix showing relative overlap across the four interaction classes.",
  },
  {
    src: "/images/confusion_matrix.png",
    alt: "Raw confusion matrix for the interaction model",
    caption: "Raw confusion matrix counts from the evaluation split for the current model checkpoint.",
  },
];
const ABOUT_LIMITATION_IMAGES = [
  {
    src: "/images/BoxP_curve.png",
    alt: "Precision curve for the interaction model",
    caption: "Precision behavior across confidence thresholds, useful for understanding false-positive tradeoffs.",
  },
  {
    src: "/images/BoxR_curve.png",
    alt: "Recall curve for the interaction model",
    caption: "Recall behavior across thresholds, showing how easily first-contact events can still be missed.",
  },
  {
    src: "/images/BoxF1_curve.png",
    alt: "F1 score curve for the interaction model",
    caption: "F1 balance across thresholds, highlighting the practical operating zone of the current model.",
  },
  {
    src: "/images/BoxPR_curve.png",
    alt: "Precision recall curve for the interaction model",
    caption: "Precision-recall behavior under real scene constraints, useful for understanding current boundary conditions.",
  },
];
const ABOUT_SECTIONS = [
  {
    title: "01. The Retail Problem We Set Out to Solve",
    visual: "comparison",
    paragraphs: [
      {
        tone: "default",
        text:
          "Most retail systems are highly effective at explaining completed transactions, but they reveal very little about customer intent before checkout. Stores usually know what sold, when it sold, and how much revenue was generated, yet they often cannot measure what happened in front of the shelf before the purchase decision was made.",
      },
      {
        tone: "warning",
        text:
          "Valuable signals such as products customers examined, shelves they paused at, items they touched, products they held, or items they removed and then did not buy are normally lost. This creates a major intelligence gap because attention without conversion can indicate pricing friction, weak product messaging, poor placement, assortment mismatch, or stock uncertainty.",
      },
      {
        tone: "accent",
        text:
          "By the time these problems appear clearly in sales reports, revenue opportunities may already be missed or never realized at all. Our system was built to make these hidden pre-purchase behaviors visible, measurable, and actionable for retail management.",
      },
      {
        tone: "warning",
        text:
          "W. Edwards Deming — “Without data, you're just another person with an opinion.”",
      },
    ],
  },
  {
    title: "02. How the Intelligence Engine Works",
    visual: "pipeline",
      paragraphs: [
        {
          tone: "default",
          text:
            "The platform now operates through two coordinated data paths (RECORDED SAMPLE REPLAY FLOW and LIVE UPLOAD + ANALYSIS FLOW).",
        },
        {
          tone: "insight",
          text:
            "For sample demonstrations (DEMO INPUTS) , videos are played in the frontend and overlaid with interactions boxes, generated from an already recorded dataset generated from the current YOLO model. Because the bottleneck between the backend and frontend is very small, live playback and live analysis from the backend modelsare nearly seamless. This frontend hosting method allows smooth browser playback while preserving the acurate presentation of model behaviours.",
        },
        {
          tone: "insight",
          text:
            "For users uploaded videos (CUSTOM INPUTS), the pipeline uses FastAPI upload sessions (as 'chunks') -> configured shelf-zone setup -> YOLO detection at backend, interaction-chain tracking(Marker chains), and backend event processing to generate analytics streams.",
        },
        {
          tone: "accent",
          text:
            "For Data Visualization, camera playback, shelf-zone overlays, interaction points, heatmaps, and the Product Overlay Board are all fed from the same event pipeline. Exact interaction coordinates are retained as operational points, linked back to shelf-product placement, and accumulated into rolling analytics state so the system can show both live visual evidence and persistent business insight in one dashboard experience.",
        },
      ],
    },
  {
    title: "03. How We Built and Trained the Model",
    visual: "training",
    images: ABOUT_TRAINING_IMAGES,
      paragraphs: [
        {
          tone: "default",
          text:
            "The vision component was trained on custom shelf-interaction videos recorded using phone cameras because large public datasets for this exact retail behavior problem are very limited. All 11 footage samples were recorded with cameras facing the shelf sideways in real retail environments, with volunteers interacting naturally to capture realistic browsing, touching, holding, and removal behavior.",
        },
        {
          tone: "insight",
          text:
            "The recorded footage was manually labeled frame by frame in CVAT for both the training and validation sets. The label classes were 'No Interaction,' 'Touching Shelf,' 'Holding Product,' and 'Item Removed.' Ten videos were used for development, while one full video was held out for final testing. To reduce leakage from highly correlated adjacent frames, the split was performed at the video level rather than through random image sampling.",
        },
        {
          tone: "default",
          text:
            "This produced a dataset with 7 training videos containing 9,554 labeled images, 3 validation videos containing 3,024 images, and 1 fully unseen test video. The total documented frame count is 12,578. That is enough to demonstrate the feasibility of the system and compare class behavior visually, but it is still a relatively small dataset for building a highly reliable production-grade retail model across many shelves, stores, lighting conditions, and customer behaviors.",
        },
        {
          tone: "accent",
          text:
            "Training was performed through the Ultralytics YOLO pipeline for 50 epochs, with the strongest validation checkpoint appearing around epoch 25. The documented metrics at that stage were precision 0.7269, recall 0.5895, mAP@50 of 0.6091, and mAP@50-95 of 0.2525. In practical terms, these numbers indicate a workable prototype that can surface meaningful retail interaction patterns, while still showing clear room for stronger generalization, more stable recall, and better robustness under harder real-world conditions.",
        },
        {
          tone: "insight",
          text:
            "The training visuals shown in this section are not decorative extras. The labels chart helps verify dataset balance and annotation density, the training-results plot shows how learning evolved across epochs, and the confusion matrices reveal where classes still overlap or get confused. Together they explain why the system is already useful for directional analysis, but should still be treated as an integrated prototype rather than a fully mature production model.",
        },
      ],
    },
  {
    title: "04. Data Analysis and Predictive Intelligence",
    visual: "predictive",
    paragraphs: [
      {
        tone: "default",
        text:
          "Beyond detection, the platform converts behavior events into advanced analysis and predictive signals that support forward-looking decisions. Users can compare customer behavior against completed sales, measure conversion efficiency by product or category, and identify products gaining interest before transactions rise.",
      },
      {
        tone: "accent",
        text:
          "By combining behavior, sales, and inventory records, the system enables predictive KPIs that traditional reporting tools cannot easily provide. The funnel shows how attention narrows from shelf contact to actual purchase, giving retailers a concrete view of where intent is being lost.",
      },
    ],
  },
  {
    title: "05. Business Impact and Operational Value",
    visual: "impact",
    paragraphs: [
      {
        tone: "default",
        text:
          "The main business value of the system is that it helps retail teams see where customer interest is strong but sales results are weak. When a product gets a lot of attention but does not convert, it can signal pricing issues, poor placement, weak packaging appeal, or stock-related friction.",
      },
      {
        tone: "warning",
        text:
          "Managers can also spot shelf areas where customers engage repeatedly but still do not complete a purchase. This makes it easier to identify layout problems, merchandising gaps, or availability issues before they become obvious in sales reports.",
      },
      {
        tone: "accent",
        text:
          "By showing demand signals earlier than traditional transaction reporting, the platform supports faster replenishment, better assortment planning, and quicker action on underperforming shelf areas. In business terms, it helps retailers move from reacting to lost sales after the fact to improving performance while opportunities still exist.",
      },
    ],
  },
  {
    title: "06. Limitations",
    visual: "limitations",
    images: ABOUT_LIMITATION_IMAGES,
    paragraphs: [
      {
        tone: "default",
        title: "Model accuracy:",
        text:
          "the current behavior model is useful for directional retail analysis, but it is not yet a perfect frame-level representation of human interaction. Performance still depends on factors such as camera angle, lighting, shelf visibility, occlusion, motion speed, and similarity to the training footage. Some early contact frames may still be missed, overlapping states can occur, and confidence tradeoffs remain necessary.",
      },
      {
        tone: "default",
        title: "Points overlaying system:",
        text:
          "interaction points are estimated from detected regions, shelf geometry, and temporal matching rather than exact hand keypoints. The points should therefore be interpreted as stable operational estimates, not exact physical contact pixels. Fast motion, partial visibility, overlapping people, and repeated detections can still create chain-merging or chain-splitting edge cases.",
      },
      {
        tone: "default",
        title: "Bottleneck:",
        text:
          "current bottlenecks mainly involve video processing throughput, replay generation time, upload-to-analysis latency, and maintaining stable interaction rendering while preserving accurate event chains. Larger deployments would require stronger batching, queueing, caching, and infrastructure optimization.",
      },
      {
        tone: "default",
        title: "Potential usage:",
        text:
          "the system was designed for operational retail decision support, with several areas still open for further exploration, such as identifying attention hotspots, low-conversion areas, product interaction trends, placement issues, replenishment needs, and demand patterns.",
      },
      {
        tone: "default",
        title: "Additional limitation areas:",
        text:
          "broader deployment would still require more engineering around camera calibration, asynchronous processing, data persistence, scalability, long-term reliability, and operational governance. The current implementation is a strong integrated prototype demonstrating the full workflow from shelf behavior to analytics.",
      },
    ],
  },
  {
    title: "07. Contributors",
    visual: "contributors",
    textVariant: "credit",
    paragraphs: [
      {
        tone: "default",
        text:
          "*Web UI by Kyaw Swar Hein",
      },
    ],
  },
];
const ABOUT_COMPARISON_ROWS = [
  { traditional: "Knows what sold", system: "Knows what customers considered" },
  { traditional: "Revenue after purchase", system: "Intent before purchase" },
  { traditional: "Detects loss late", system: "Detects risks early & Identifies the cause" },
  { traditional: "Sales only", system: "Behavior + Sales" },
];
const ABOUT_TRAINING_METRICS = [
  { metric: "Framework", value: "Ultralytics YOLO" },
  { metric: "Annotation Tool", value: "CVAT" },
  { metric: "Source Videos", value: "11" },
  { metric: "Training Videos", value: "7" },
  { metric: "Validation Videos", value: "3" },
  { metric: "Test Videos", value: "1" },
  { metric: "Training Images", value: "9,554" },
  { metric: "Validation Images", value: "3,024" },
  { metric: "Total Images", value: "12,578" },
  { metric: "Classes", value: "4" },
  { metric: "Epochs", value: "50" },
  { metric: "Best Checkpoint", value: "Around epoch 25" },
  { metric: "Precision", value: "0.7269" },
  { metric: "Recall", value: "0.5895" },
  { metric: "mAP@50", value: "0.6091" },
  { metric: "mAP@50-95", value: "0.2525" },
];
const ABOUT_FUNNEL_STEPS = [
  { label: "Touches", value: "1,000", width: 100 },
  { label: "Holds", value: "490", width: 72 },
  { label: "Items Removed", value: "170", width: 42 },
  { label: "Purchases", value: "45", width: 20 },
];
const ABOUT_OPERATIONAL_INPUTS = [
  { label: "Behavior Signals(CBA)", detail: "touch, hold, remove" },
  { label: "Sales Outcomes(POS)", detail: "conversion and revenue" },
  { label: "Inventory State", detail: "stock and shelf ratio" },
];
const ABOUT_OPERATIONAL_ACTIONS = [
  {
    labelLines: ["Pricing /", "Placement Review"],
    detail: "fix conversion gaps",
  },
  {
    labelLines: ["Replenishment", "Action"],
    detail: "respond to demand risk",
  },
  {
    labelLines: ["Merchandising", "Decisions"],
    detail: "assortment and promotion",
  },
];
const ABOUT_CONTRIBUTORS = [];
const ABOUT_PROJECT_GITHUB_URL = "https://github.com/Paradox-9007/CBA-FRONTEND";
const ABOUT_INSPIRATION_URL =
  "https://www.researchgate.net/profile/Hira-Kamal-3/publication/394022210_Customer_Object_Interaction_Analytics_in_Retail_Using_YOLOv5_Object_Detection/links/6884865e00a2407910a46e32/Customer-Object-Interaction-Analytics-in-Retail-Using-YOLOv5-Object-Detection.pdf";
const ABOUT_INSPIRATION_LABEL =
  "Customer Object Interaction Analytics in Retail Using YOLOv5 Object Detection";

function pageFromPath(pathname) {
  return pathname === "/action" ? "action" : "home";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number.isFinite(value) ? value : 0);
}

function formatTimestamp(value) {
  if (!value) {
    return "No frame yet";
  }

  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  return timestamp.toLocaleString();
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "Unknown size";
  }

  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatInsightName(name, count) {
  if (!count) {
    return "No data yet";
  }
  return name;
}

function applyOrientationToSize(size, orientation) {
  const width = Number(size?.width ?? 0);
  const height = Number(size?.height ?? 0);
  if (!width || !height) {
    return { width: 0, height: 0 };
  }
  if (orientation === "rotate_90_cw" || orientation === "rotate_90_ccw") {
    return { width: height, height: width };
  }
  return { width, height };
}

function orientationTransform(orientation) {
  if (orientation === "rotate_90_cw") {
    return "rotate(90deg)";
  }
  if (orientation === "rotate_90_ccw") {
    return "rotate(-90deg)";
  }
  if (orientation === "rotate_180") {
    return "rotate(180deg)";
  }
  return "none";
}

function normalizePersistentAnalyticsEvent(event) {
  if (!event || !["touching", "holding", "product_remove"].includes(event.event_type)) {
    return null;
  }

  return {
    camera_id: Number(event.camera_id ?? 0),
    stream_id: String(event.stream_id ?? ""),
    captured_at: String(event.captured_at ?? ""),
    event_type: String(event.event_type ?? ""),
    heatmap_x: Number(event.heatmap_x ?? 0),
    heatmap_y: Number(event.heatmap_y ?? 0),
    shelf_slot: String(event.shelf_slot ?? ""),
    frame_index: Number(event.frame_index ?? 0),
  };
}

function persistentAnalyticsEventKey(event) {
  return [
    event.stream_id,
    event.captured_at,
    event.event_type,
    event.heatmap_x,
    event.heatmap_y,
    event.shelf_slot,
    event.frame_index,
  ].join("|");
}

function loadPersistentAnalyticsEvents() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(PERSISTENT_ANALYTICS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(normalizePersistentAnalyticsEvent)
      .filter(Boolean)
      .slice(-MAX_PERSISTENT_ANALYTICS_EVENTS);
  } catch {
    return [];
  }
}

function persistAnalyticsEvents(events) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PERSISTENT_ANALYTICS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Ignore storage write failures and keep in-memory state alive.
  }
}

function accumulatePersistentAnalyticsEvents(currentEvents, incomingEvents) {
  const normalizedIncoming = Array.isArray(incomingEvents)
    ? incomingEvents.map(normalizePersistentAnalyticsEvent).filter(Boolean)
    : [];

  if (!normalizedIncoming.length) {
    return currentEvents;
  }

  const combined = Array.isArray(currentEvents) ? [...currentEvents] : [];
  const seenKeys = new Set(combined.map(persistentAnalyticsEventKey));
  let addedCount = 0;

  for (const event of normalizedIncoming) {
    const key = persistentAnalyticsEventKey(event);
    if (seenKeys.has(key)) {
      continue;
    }
    combined.push(event);
    seenKeys.add(key);
    addedCount += 1;
  }

  if (addedCount === 0 && combined.length <= MAX_PERSISTENT_ANALYTICS_EVENTS) {
    return currentEvents;
  }

  return combined.slice(-MAX_PERSISTENT_ANALYTICS_EVENTS);
}

function historyRowsToEventPoints(historyEvents = [], rows = 18, cols = 32) {
  return historyEvents
    .filter((event) => ["touching", "holding", "product_remove"].includes(event?.event_type))
    .map((event, index) => ({
      id: `${persistentAnalyticsEventKey(event)}-${index}`,
      kind: event.event_type,
      x: clamp(Number(event.heatmap_x ?? 0) / Math.max(cols - 1, 1), 0, 1),
      y: clamp(Number(event.heatmap_y ?? 0) / Math.max(rows - 1, 1), 0, 1),
      capturedAt: event.captured_at ?? "",
    }));
}

function insideRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function normalizeDraftRect(draft) {
  const minX = clamp(Math.min(draft.startX, draft.endX), 0, 1);
  const maxX = clamp(Math.max(draft.startX, draft.endX), 0, 1);
  const minY = clamp(Math.min(draft.startY, draft.endY), 0, 1);
  const maxY = clamp(Math.max(draft.startY, draft.endY), 0, 1);

  return {
    x: minX,
    y: minY,
    width: clamp(maxX - minX, 0, 1),
    height: clamp(maxY - minY, 0, 1),
  };
}

function getPointerPosition(event, node) {
  const bounds = node.getBoundingClientRect();
  const x = clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1), 0, 1);
  const y = clamp((event.clientY - bounds.top) / Math.max(bounds.height, 1), 0, 1);

  return { x, y };
}

function normalizeShelfZoneDraft(points) {
  if (!Array.isArray(points) || points.length !== 4) {
    return DEFAULT_SHELF_ZONE_DRAFT.map((point) => ({ ...point }));
  }

  return points.map((point) => ({
    x: clamp(Number(point?.x ?? 0), SHELF_ZONE_COORDINATE_MIN, SHELF_ZONE_COORDINATE_MAX),
    y: clamp(Number(point?.y ?? 0), SHELF_ZONE_COORDINATE_MIN, SHELF_ZONE_COORDINATE_MAX),
  }));
}

function shelfZonePointsAreEqual(leftPoints, rightPoints) {
  if (!Array.isArray(leftPoints) || !Array.isArray(rightPoints) || leftPoints.length !== rightPoints.length) {
    return false;
  }

  return leftPoints.every((point, index) => {
    const rightPoint = rightPoints[index];
    return (
      Math.abs(Number(point?.x ?? 0) - Number(rightPoint?.x ?? 0)) < 0.0005 &&
      Math.abs(Number(point?.y ?? 0) - Number(rightPoint?.y ?? 0)) < 0.0005
    );
  });
}

function streamHasShelfZone(stream) {
  return Array.isArray(stream?.shelf_zone) && stream.shelf_zone.length === 4;
}

function mergeStreamsWithLocalDefinitions(streams, localDefinitions) {
  const nextStreams = Array.isArray(streams) ? streams : [];
  const definitions = Array.isArray(localDefinitions) ? localDefinitions : [];
  const definitionMap = new Map(definitions.map((stream) => [stream.stream_id, stream]));
  const merged = nextStreams.map((stream) => {
    const definition = definitionMap.get(stream.stream_id);
    return definition ? { ...stream, ...definition, is_custom: Boolean(stream?.is_custom) } : stream;
  });

  for (const definition of definitions) {
    if (!merged.some((stream) => stream.stream_id === definition.stream_id)) {
      merged.push({ ...definition });
    }
  }

  return merged;
}

function pointInNormalizedPolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) {
    return true;
  }

  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previousIndex];
    const currentX = Number(currentPoint?.x ?? 0);
    const currentY = Number(currentPoint?.y ?? 0);
    const previousX = Number(previousPoint?.x ?? 0);
    const previousY = Number(previousPoint?.y ?? 0);
    const intersects =
      currentY > point.y !== previousY > point.y &&
      point.x <
        ((previousX - currentX) * (point.y - currentY)) / ((previousY - currentY) || 1e-9) + currentX;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function interactionKindPriority(kind) {
  if (kind === "product_remove") {
    return 3;
  }
  if (kind === "holding") {
    return 2;
  }
  if (kind === "touching") {
    return 1;
  }
  return 0;
}

function stabilizeInteractionPoints(points) {
  if (!Array.isArray(points) || !points.length) {
    return [];
  }

  const mergedPoints = [];
  for (const point of points) {
    const nextPoint = {
      ...point,
      x: Number(point?.x ?? 0),
      y: Number(point?.y ?? 0),
      heatmap_x: Number(point?.heatmap_x ?? -1),
      heatmap_y: Number(point?.heatmap_y ?? -1),
      shelf_slot: point?.shelf_slot ? String(point.shelf_slot) : "",
    };

    let bestMatch = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const candidate of mergedPoints) {
      if (
        nextPoint.marker_id != null &&
        candidate.marker_id != null &&
        Number(nextPoint.marker_id) === Number(candidate.marker_id)
      ) {
        bestMatch = candidate;
        bestScore = -1;
        break;
      }

      const sameSlot =
        nextPoint.shelf_slot &&
        candidate.shelf_slot &&
        nextPoint.shelf_slot === candidate.shelf_slot;
      const heatmapDistance =
        nextPoint.heatmap_x >= 0 &&
        nextPoint.heatmap_y >= 0 &&
        candidate.heatmap_x >= 0 &&
        candidate.heatmap_y >= 0
          ? Math.hypot(nextPoint.heatmap_x - candidate.heatmap_x, nextPoint.heatmap_y - candidate.heatmap_y)
          : Number.POSITIVE_INFINITY;
      const normalizedDistance = Math.hypot(nextPoint.x - candidate.x, nextPoint.y - candidate.y);
      const isMatch =
        (sameSlot && heatmapDistance <= 2.5) ||
        normalizedDistance <= 0.035;

      if (!isMatch) {
        continue;
      }

      const score = Math.min(heatmapDistance, normalizedDistance * 100);
      if (score < bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    if (!bestMatch) {
      mergedPoints.push(nextPoint);
      continue;
    }

    bestMatch.x = Number(((bestMatch.x + nextPoint.x) / 2).toFixed(4));
    bestMatch.y = Number(((bestMatch.y + nextPoint.y) / 2).toFixed(4));
    if (!bestMatch.shelf_slot && nextPoint.shelf_slot) {
      bestMatch.shelf_slot = nextPoint.shelf_slot;
    }
    if (bestMatch.heatmap_x < 0 && nextPoint.heatmap_x >= 0) {
      bestMatch.heatmap_x = nextPoint.heatmap_x;
      bestMatch.heatmap_y = nextPoint.heatmap_y;
    }
    if (interactionKindPriority(nextPoint.kind) >= interactionKindPriority(bestMatch.kind)) {
      bestMatch.kind = nextPoint.kind;
      bestMatch.label = nextPoint.label;
      bestMatch.updated_at = nextPoint.updated_at ?? bestMatch.updated_at;
    }
  }

  return mergedPoints;
}

function filterPointsToShelfZone(points, shelfZone) {
  if (!Array.isArray(points) || !points.length) {
    return [];
  }
  if (!Array.isArray(shelfZone) || shelfZone.length !== 4) {
    return points;
  }

  return points.filter((point) =>
    pointInNormalizedPolygon(
      {
        x: Number(point?.x ?? 0),
        y: Number(point?.y ?? 0),
      },
      shelfZone,
    ),
  );
}

function buildHistoricalEventPoints(heatmapData, shelfAnalysis) {
  const rows = heatmapData?.shape?.rows ?? 18;
  const cols = heatmapData?.shape?.cols ?? 32;

  return (shelfAnalysis?.history_events ?? [])
    .filter((event) => ["touching", "holding", "product_remove"].includes(event?.event_type))
    .map((event, index) => ({
      id: `${event.captured_at ?? "event"}-${index}`,
      kind: event.event_type,
      x: clamp(Number(event.heatmap_x ?? 0) / Math.max(cols - 1, 1), 0, 1),
      y: clamp(Number(event.heatmap_y ?? 0) / Math.max(rows - 1, 1), 0, 1),
      capturedAt: event.captured_at ?? "",
    }));
}

function mergeShelfAnalysis(payloads) {
  const validPayloads = payloads.filter(Boolean);
  const mergedProducts = new Map();
  const recentEvents = [];
  const historyEvents = [];
  let historyLimit = 0;

  for (const payload of validPayloads) {
    historyLimit = Math.max(historyLimit, Number(payload?.history_limit ?? 0));

    for (const product of payload?.products ?? []) {
      const slot = product?.slot;
      if (!slot) {
        continue;
      }

      const current = mergedProducts.get(slot) ?? {
        slot,
        touching_count: 0,
        holding_count: 0,
        removed_count: 0,
        total_interactions: 0,
      };

      current.touching_count += Number(product.touching_count ?? 0);
      current.holding_count += Number(product.holding_count ?? 0);
      current.removed_count += Number(product.removed_count ?? 0);
      current.total_interactions += Number(product.total_interactions ?? 0);
      mergedProducts.set(slot, current);
    }

    recentEvents.push(...(payload?.recent_events ?? []));
    historyEvents.push(...(payload?.history_events ?? []));
  }

  recentEvents.sort((left, right) =>
    String(right?.captured_at ?? "").localeCompare(String(left?.captured_at ?? "")),
  );
  historyEvents.sort((left, right) =>
    String(left?.captured_at ?? "").localeCompare(String(right?.captured_at ?? "")),
  );

  return {
    camera_id: null,
    stream_id: "combined",
    products: Array.from(mergedProducts.values()),
    recent_events: recentEvents.slice(0, 25),
    history_events: historyEvents,
    history_event_count: historyEvents.length,
    history_limit: historyLimit,
  };
}

function buildProductStates(products, historicalEventPoints) {
  return products.map((product) => {
    const rawCounts = {
      touching: 0,
      holding: 0,
      removed: 0,
    };
    const counts = {
      touchingCount: 0,
      holdingCount: 0,
      removedCount: 0,
      totalInteractions: 0,
    };

    for (const point of historicalEventPoints) {
      if (!insideRect(point, product)) {
        continue;
      }

      counts.totalInteractions += 1;
      if (point.kind === "touching") {
        rawCounts.touching += 1;
      } else if (point.kind === "holding") {
        rawCounts.holding += 1;
      } else if (point.kind === "product_remove") {
        rawCounts.removed += 1;
      }
    }

    // Display counts as a funnel so the board always respects Touch >= Hold >= Remove.
    counts.removedCount = rawCounts.removed;
    counts.holdingCount = rawCounts.holding + rawCounts.removed;
    counts.touchingCount = rawCounts.touching + counts.holdingCount;

    let stage = null;
    if (counts.removedCount > 0) {
      stage = "product_remove";
    } else if (counts.holdingCount > 0) {
      stage = "holding";
    } else if (counts.touchingCount > 0) {
      stage = "touching";
    }

    return {
      ...product,
      stage,
      ...counts,
    };
  });
}

function findTopProduct(productStates, countKey) {
  let bestProduct = null;

  for (const product of productStates) {
    if (!bestProduct || product[countKey] > bestProduct[countKey]) {
      bestProduct = product;
      continue;
    }

    if (
      bestProduct &&
      product[countKey] === bestProduct[countKey] &&
      product.totalInteractions > bestProduct.totalInteractions
    ) {
      bestProduct = product;
    }
  }

  if (!bestProduct || bestProduct[countKey] === 0) {
    return { name: "No data yet", count: 0 };
  }

  return { name: bestProduct.name, count: bestProduct[countKey] };
}

function buildProductInsights(productStates) {
  return {
    touching: findTopProduct(productStates, "touchingCount"),
    holding: findTopProduct(productStates, "holdingCount"),
    removed: findTopProduct(productStates, "removedCount"),
    total: findTopProduct(productStates, "totalInteractions"),
  };
}

function metricForCamera(metrics, cameraId) {
  return metrics.find((item) => item.camera_id === cameraId) ?? null;
}

function createHeatmapGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
}

function addReplayHeatmapImpulse(grid, xIndex, yIndex) {
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      const nextX = clamp(xIndex + dx, 0, grid[0].length - 1);
      const nextY = clamp(yIndex + dy, 0, grid.length - 1);
      const weight = dx === 0 && dy === 0 ? 1 : 0.35;
      grid[nextY][nextX] += weight;
    }
  }
}

function normalizeHeatmapGrid(grid) {
  let peak = 0;
  for (const row of grid) {
    for (const value of row) {
      if (value > peak) {
        peak = value;
      }
    }
  }

  if (peak <= 0) {
    return grid.map((row) => row.map(() => 0));
  }

  return grid.map((row) => row.map((value) => Number((value / peak).toFixed(4))));
}

function buildReplayHeatmapData(historyEvents = []) {
  const rows = 18;
  const cols = 32;
  const touchingGrid = createHeatmapGrid(rows, cols);
  const holdingGrid = createHeatmapGrid(rows, cols);
  const removedGrid = createHeatmapGrid(rows, cols);

  for (const event of historyEvents) {
    const xIndex = clamp(Number(event?.heatmap_x ?? 0), 0, cols - 1);
    const yIndex = clamp(Number(event?.heatmap_y ?? 0), 0, rows - 1);
    addReplayHeatmapImpulse(touchingGrid, xIndex, yIndex);
    if (event?.event_type === "holding" || event?.event_type === "product_remove") {
      addReplayHeatmapImpulse(holdingGrid, xIndex, yIndex);
    }
    if (event?.event_type === "product_remove") {
      addReplayHeatmapImpulse(removedGrid, xIndex, yIndex);
    }
  }

  return {
    shape: { rows, cols },
    touching_values: normalizeHeatmapGrid(touchingGrid),
    holding_values: normalizeHeatmapGrid(holdingGrid),
    removed_values: normalizeHeatmapGrid(removedGrid),
  };
}

function summarizeInteractionPoints(points = []) {
  const rawCounts = {
    touching: 0,
    holding: 0,
    removed: 0,
  };

  for (const point of points) {
    if (point?.kind === "touching") {
      rawCounts.touching += 1;
    } else if (point?.kind === "holding") {
      rawCounts.holding += 1;
    } else if (point?.kind === "product_remove") {
      rawCounts.removed += 1;
    }
  }

  return {
    touching: rawCounts.touching + rawCounts.holding + rawCounts.removed,
    holding: rawCounts.holding + rawCounts.removed,
    removed: rawCounts.removed,
  };
}

function buildReplayMetric(stream, replayFrame, replayStream, persistentPoints = []) {
  if (!stream || !replayFrame) {
    return null;
  }

  const metrics = replayFrame.metrics ?? {};
  const interactionSummary = summarizeInteractionPoints(persistentPoints);
  return {
    camera_id: stream.camera_id,
    stream_id: stream.stream_id,
    status: "connected",
    last_error: "",
    live_fps: Number(replayStream?.frame_rate ?? replayFrame.analysis_fps ?? 0),
    current_people: Number(metrics.current_people ?? 0),
    touching_events: interactionSummary.touching,
    holding_events: interactionSummary.holding,
    product_remove_events: interactionSummary.removed,
    no_interaction_events: Number(metrics.no_interaction_events ?? 0),
    behavior_events: interactionSummary.touching,
    person_boxes: replayFrame.person_boxes ?? [],
    behavior_boxes: replayFrame.behavior_boxes ?? [],
    camera_metadata: {
      last_frame_at: `Sample ${Number(replayFrame.time_s ?? 0).toFixed(1)}s`,
    },
  };
}

function sortProductsForDisplay(productStates) {
  return [...productStates].sort((left, right) => {
    if (right.totalInteractions !== left.totalInteractions) {
      return right.totalInteractions - left.totalInteractions;
    }
    return left.name.localeCompare(right.name);
  });
}

function buildFunnelSegmentPoints(topWidth, bottomWidth, centerX, y, height) {
  const topLeft = centerX - topWidth / 2;
  const topRight = centerX + topWidth / 2;
  const bottomLeft = centerX - bottomWidth / 2;
  const bottomRight = centerX + bottomWidth / 2;

  return `${topLeft},${y} ${topRight},${y} ${bottomRight},${y + height} ${bottomLeft},${y + height}`;
}

function SvgMultilineText({ x, y, lines, lineHeight = 18, ...props }) {
  return (
    <text x={x} y={y} {...props}>
      {lines.map((line, index) => (
        <tspan dy={index === 0 ? 0 : lineHeight} key={`${line}-${index}`} x={x}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function wrapSvgText(text, maxCharsPerLine) {
  if (!text) {
    return [];
  }

  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length > maxCharsPerLine && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function AboutPipelineSection({ x, width, title, subtitle }) {
  return (
    <g>
      <rect
        fill="url(#aboutPipelineSectionFill)"
        fillOpacity="0.94"
        height="710"
        rx="40"
        stroke="#ffffff"
        strokeOpacity="0.06"
        width={width}
        x={x}
        y="62"
      />
      <text fill="#fff3e7" fontSize="20" fontWeight="800" x={x + 26} y="110">
        {title}
      </text>
      <text fill="rgba(244, 239, 232, 0.5)" fontSize="11.5" x={x + 26} y="130">
        {subtitle}
      </text>
      <line
        stroke="#ffffff"
        strokeOpacity="0.07"
        strokeWidth="1.4"
        x1={x + 26}
        x2={x + width - 26}
        y1="144"
        y2="144"
      />
    </g>
  );
}

function AboutPipelineCard({
  x,
  y,
  width,
  height,
  kicker,
  titleLines,
  bulletLines,
  accent = "#ffd7b9",
  emphasis = "normal",
}) {
  const isStrong = emphasis === "strong";
  const isMuted = emphasis === "muted";
  const fillColor = isStrong
    ? "url(#aboutPipelineCardFillStrong)"
    : isMuted
      ? "url(#aboutPipelineCardFillMuted)"
      : "url(#aboutPipelineCardFill)";
  const strokeOpacity = isStrong ? "0.18" : isMuted ? "0.06" : "0.1";
  const limitedBullets = bulletLines.slice(0, 3);
  const titleFontSize = isStrong ? 18 : isMuted ? 15.5 : 17;
  const titleLineHeight = isStrong ? 19 : 18;
  const bulletFontSize = isMuted ? 10.8 : 11.2;
  const bulletOpacity = isMuted ? "0.72" : "1";
  const kickerOpacity = isMuted ? "0.82" : "1";
  const topBarOpacity = isStrong ? "0.22" : isMuted ? "0.08" : "0.14";
  const maxBulletChars = Math.max(18, Math.floor((width - 54) / (bulletFontSize * 0.58)));
  const wrappedBullets = limitedBullets.map((line) => wrapSvgText(line, maxBulletChars));
  let bulletCursorY = y + 110;

  return (
    <g filter="url(#aboutPipelineCardShadow)">
      <rect
        fill={fillColor}
        fillOpacity="0.96"
        height={height}
        rx="30"
        stroke="#ffffff"
        strokeOpacity={strokeOpacity}
        width={width}
        x={x}
        y={y}
      />
      <rect
        fill={accent}
        fillOpacity={topBarOpacity}
        height="4"
        rx="2"
        width={width - 34}
        x={x + 17}
        y={y + 14}
      />
      <text fill={accent} fillOpacity={kickerOpacity} fontSize="9.4" fontWeight="800" x={x + 18} y={y + 36}>
        {kicker}
      </text>
      <SvgMultilineText
        fill="#fff5e9"
        fontSize={titleFontSize}
        fontWeight="700"
        lineHeight={titleLineHeight}
        lines={titleLines}
        x={x + 18}
        y={y + 66}
      />
      {wrappedBullets.map((lines, index) => {
        const bulletY = bulletCursorY;
        bulletCursorY += lines.length * 14 + 8;
        return (
          <g key={`${limitedBullets[index]}-${index}`}>
            <circle cx={x + 21} cy={bulletY - 4} fill={accent} fillOpacity={isMuted ? "0.7" : "0.94"} r="3" />
            <SvgMultilineText
              fill="#d7dee9"
              fillOpacity={bulletOpacity}
              fontSize={bulletFontSize}
              lineHeight={13.5}
              lines={lines}
              x={x + 31}
              y={bulletY}
            />
          </g>
        );
      })}
    </g>
  );
}

function AboutPipelineArrow({ path, kind = "primary" }) {
  const isSecondary = kind === "secondary";
  const isSupport = kind === "support";
  const stroke = isSecondary ? "#86aed5" : isSupport ? "#aeb8c7" : "#f7b68f";
  const marker = isSecondary ? "url(#aboutPipelineArrowHeadSecondary)" : "url(#aboutPipelineArrowHeadPrimary)";
  const strokeWidth = isSecondary ? "1.3" : isSupport ? "1.35" : "2.85";
  const strokeOpacity = isSecondary ? "0.28" : isSupport ? "0.24" : "0.94";

  return (
    <g>
      <path
        d={path}
        fill="none"
        markerEnd={marker}
        stroke={stroke}
        strokeDasharray={isSecondary ? "8 8" : undefined}
        strokeOpacity={strokeOpacity}
        strokeWidth={strokeWidth}
      />
    </g>
  );
}

function AboutComparisonVisual() {
  return (
    <div className="landing-about__visual">
      <span className="about-visual__kicker">Before vs after CBA's intelligence comparison</span>
      <div className="about-table-shell">
        <table className="about-table about-table--comparison">
          <thead>
            <tr>
              <th>Traditional POS Only</th>
              <th>Our CBA System</th>
            </tr>
          </thead>
          <tbody>
            {ABOUT_COMPARISON_ROWS.map((row) => (
              <tr key={row.traditional}>
                <td>{row.traditional}</td>
                <td>{row.system}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AboutPipelineVisual() {
  return (
    <div className="landing-about__visual">
      <span className="about-visual__kicker">End-to-end data pipeline</span>
      <div className="about-svg-shell">
        <svg
          aria-label="End-to-end data pipeline showing sample replay generation, backend inference, storage, APIs, and frontend dashboard updates"
          className="about-svg about-svg--pipeline"
          role="img"
          viewBox="0 0 1120 820"
        >
          <defs>
            <linearGradient id="aboutPipelineSectionFill" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#202732" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#1a212b" stopOpacity="0.98" />
            </linearGradient>
            <linearGradient id="aboutPipelineCardFill" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#293345" />
              <stop offset="100%" stopColor="#243041" />
            </linearGradient>
            <linearGradient id="aboutPipelineCardFillStrong" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#2b3749" />
              <stop offset="100%" stopColor="#263244" />
            </linearGradient>
            <linearGradient id="aboutPipelineCardFillMuted" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#273141" />
              <stop offset="100%" stopColor="#232d3c" />
            </linearGradient>
            <filter id="aboutPipelineCardShadow" x="-20%" y="-20%" width="140%" height="160%">
              <feDropShadow dx="0" dy="16" floodColor="#02060c" floodOpacity="0.24" stdDeviation="16" />
            </filter>
            <marker
              id="aboutPipelineArrowHeadPrimary"
              markerHeight="7"
              markerUnits="strokeWidth"
              markerWidth="7"
              orient="auto"
              refX="6"
              refY="3.5"
            >
              <path d="M0,0 L7,3.5 L0,7 z" fill="#f7b68f" />
            </marker>
            <marker
              id="aboutPipelineArrowHeadSecondary"
              markerHeight="6"
              markerUnits="strokeWidth"
              markerWidth="6"
              orient="auto"
              refX="5"
              refY="3"
            >
              <path d="M0,0 L6,3 L0,6 z" fill="#8fb7de" />
            </marker>
          </defs>
          <rect
            fill="#121720"
            fillOpacity="0.00"
            height="796"
            rx="40"
            width="1096"
            x="12"
            y="0"
          />
          <AboutPipelineSection
            subtitle="Video sources and setup"
            title="Inputs"
            width={260}
            x={34}
          />
          <AboutPipelineSection
            subtitle="Replay generation and live inference"
            title="Processing & AI"
            width={260}
            x={302}
          />
          <AboutPipelineSection
            subtitle="Event storage and delivery"
            title="Storage & APIs"
            width={260}
            x={570}
          />
          <AboutPipelineSection
            subtitle="Playback, dashboards, and board updates"
            title="Frontend Experience"
            width={260}
            x={838}
          />

          <AboutPipelineCard
            accent="#ffbe93"
            bulletLines={["Frontend-hosted MP4s", "Smooth browser playback"]}
            height={156}
            kicker="DEMO INPUTS"
            titleLines={["Recorded", "samples"]}
            width={208}
            x={50}
            y={200}
          />
          <AboutPipelineCard
            accent="#ffbe93"
            bulletLines={["Rotate video + place zone", "Chunked upload to backend"]}
            height={176}
            kicker="CUSTOM INPUTS"
            titleLines={["Upload +", "shelf setup"]}
            width={208}
            x={50}
            y={372}
          />
            <AboutPipelineCard
              accent="#ffbe93"
              bulletLines={["Zones, slots, product layout", "Shared by replay + live analysis"]}
              height={172}
              emphasis="muted"
              kicker="CONFIG"
              titleLines={["Shelf zones +", "mapping"]}
              width={220}
              x={50}
              y={562}
            />

            <AboutPipelineCard
              accent="#8ff0b6"
              bulletLines={["Local YOLO replay pass", "Boxes + points + history"]}
              emphasis="strong"
              height={148}
              kicker="OFFLINE REPLAY"
              titleLines={["Replay", "generation"]}
              width={220}
              x={318}
              y={200}
            />
            <AboutPipelineCard
              accent="#8ff0b6"
              bulletLines={["FastAPI upload sessions", "Preview stream + saved setup"]}
              height={164}
              kicker="INGEST"
              titleLines={["Upload preview", "+ ingest"]}
              width={220}
              x={318}
              y={388}
            />
            <AboutPipelineCard
              accent="#8ff0b6"
              bulletLines={["Person, behavior, hand models", "Marker chains + heatmaps + KPIs"]}
              emphasis="strong"
              height={174}
              kicker="LIVE AI ENGINE"
              titleLines={["YOLO detection +", "interaction analysis"]}
              width={220}
              x={318}
              y={568}
            />

          <AboutPipelineCard
            accent="#8fc2ff"
            bulletLines={["sample_replay_data.json", "Recorded overlays + events"]}
            height={156}
            emphasis="strong"
            kicker="STATIC REPLAY DATA"
            titleLines={["Recorded replay", "dataset"]}
            width={208}
            x={586}
            y={200}
          />
            <AboutPipelineCard
              accent="#8fc2ff"
              bulletLines={["Heatmap events + camera logs", "Metrics + heatmaps + products"]}
              emphasis="strong"
              height={172}
              kicker="LIVE DATA LAYER"
              titleLines={["Analytics store", "+ delivery APIs"]}
              width={208}
              x={586}
              y={452}
            />

            <AboutPipelineCard
              accent="#d4b7ff"
              bulletLines={[
                "Video, shelf zone, boxes, points",
                "Heatmap + Product Overlay Board",
                "Sample replay or uploaded view",
              ]}
              emphasis="strong"
              height={206}
              kicker="USER-FACING EXPERIENCE"
              titleLines={["Camera view +", "analytics UI"]}
              width={224}
              x={848}
              y={246}
            />
            <AboutPipelineCard
              accent="#d4b7ff"
              bulletLines={["localStorage accumulation", "6000-event FIFO cap"]}
              height={160}
              emphasis="muted"
              kicker="FRONTEND STATE"
              titleLines={["Rolling analytics", "cache"]}
              width={224}
              x={848}
              y={544}
            />

            <AboutPipelineArrow kind="primary" path="M258 268 L318 268" />
            <AboutPipelineArrow kind="primary" path="M538 268 L586 268" />
            <AboutPipelineArrow kind="primary" path="M794 268 L848 268" />

            <AboutPipelineArrow kind="primary" path="M258 420 L318 420" />
            <AboutPipelineArrow kind="primary" path="M428 537 L428 577" />
            <AboutPipelineArrow kind="primary" path="M270 612 L318 612" />
            <AboutPipelineArrow kind="primary" path="M530 616 L586 540" />
            <AboutPipelineArrow kind="primary" path="M794 524 L848 386" />
            <AboutPipelineArrow kind="primary" path="M960 422 L960 544" />

          <rect
            fill="rgba(247, 182, 143, 0.08)"
            height="24"
            rx="12"
            stroke="rgba(247, 182, 143, 0.16)"
            width="170"
            x="337"
            y="172"
          />
          <text fill="#ffd7b9" fontSize="10" fontWeight="800" textAnchor="middle" x="422" y="187">
            RECORDED SAMPLE REPLAY FLOW
          </text>

          <rect
            fill="rgba(143, 240, 182, 0.07)"
            height="24"
            rx="12"
            stroke="rgba(143, 240, 182, 0.16)"
            width="174"
            x="335"
            y="362"
          />
          <text fill="#c6f7da" fontSize="10" fontWeight="800" textAnchor="middle" x="422" y="378">
            LIVE UPLOAD + ANALYSIS FLOW
          </text>

          <rect
            fill="#111722"
            fillOpacity="0.8"
            height="40"
            rx="20"
            stroke="#ffffff"
            strokeOpacity="0.08"
            width="200"
            x="438"
            y="776"
          />
          <line stroke="#f7b68f" strokeOpacity="0.88" strokeWidth="2.2" x1="478" x2="512" y1="798" y2="798" />
          <path d="M512,794 L518,798 L512,802 z" fill="#f7b68f" />
          <text fill="#f3f6fb" fontSize="10.5" x="538" y="800">
            Data flow
          </text>
        </svg>
      </div>
    </div>
  );
}

function AboutTrainingVisual() {
  return (
    <div className="landing-about__visual">
      <span className="about-visual__kicker">Training dataset and model setup</span>
      <div className="about-table-shell">
        <table className="about-table about-table--metrics">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {ABOUT_TRAINING_METRICS.map((row) => (
              <tr key={row.metric}>
                <td>{row.metric}</td>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="landing-about__paragraph landing-about__paragraph--footnote">
        Note: The current amount of frames (12,578) is nowhere near enough to train a production-grade model that is highly reliable, robust, and consistently accurate.
      </p>
    </div>
  );
}

function AboutPredictiveVisual() {
  return (
    <div className="landing-about__visual">
      <span className="about-visual__kicker">Interaction funnel</span>
      <div className="about-svg-shell">
        <svg
          aria-label="Funnel chart showing the progression from touches to purchases"
          className="about-svg about-svg--funnel"
          role="img"
          viewBox="0 0 920 380"
        >
          <rect
            fill="#121720"
            fillOpacity="0.46"
            height="358"
            rx="30"
            width="900"
            x="10"
            y="11"
          />
          {ABOUT_FUNNEL_STEPS.map((step, index) => {
            const nextWidth = ABOUT_FUNNEL_STEPS[index + 1]?.width ?? 12;
            const topWidth = 640 * (step.width / 100);
            const bottomWidth = 640 * (nextWidth / 100);
            const y = 32 + index * 78;
            const centerX = 360;
            return (
              <g key={step.label}>
                <polygon
                  fill={["#30d158", "#0a84ff", "#ff9f0a", "#7b6aa6"][index]}
                  fillOpacity="0.88"
                  points={buildFunnelSegmentPoints(topWidth, bottomWidth, centerX, y, 64)}
                  stroke="#ffffff"
                  strokeOpacity="0.08"
                />
                <text
                  fill="#fff4e7"
                  fontSize="16"
                  fontWeight="600"
                  textAnchor="middle"
                  x={centerX}
                  y={y + 24}
                >
                  {step.label}
                </text>
                <text
                  fill="#fff4e7"
                  fontSize="20"
                  fontWeight="700"
                  textAnchor="middle"
                  x={centerX}
                  y={y + 47}
                >
                  {step.value}
                </text>
              </g>
            );
          })}
          <g>
            <rect
              fill="#2a3342"
              fillOpacity="0.94"
              height="250"
              rx="24"
              stroke="#ffffff"
              strokeOpacity="0.08"
              width="250"
              x="628"
              y="64"
            />
            <text fill="#ffd7b9" fontSize="10" fontWeight="700" x="654" y="98">
              CONVERSION READOUT
            </text>
            <text fill="#fff5e9" fontSize="32" fontWeight="700" x="654" y="136">
              4.5%
            </text>
            <text fill="#f0e7dd" fontSize="12" x="654" y="150">
              purchases from touch events
            </text>
            <text fill="#8fc2ff" fontSize="11" fontWeight="700" x="654" y="175">
              strongest loss zone
            </text>
            <text fill="#f3f6fb" fontSize="15" fontWeight="600" x="654" y="195">
              hold to purchase
            </text>
            <text fill="#d6deea" fontSize="11" x="654" y="216">
              where intent narrows sharply
            </text>
            <text fill="#8ff0b6" fontSize="11" fontWeight="700" x="654" y="250">
              business interpretation
            </text>
            <text fill="#f3f6fb" fontSize="12" fontWeight="600" x="654" y="275">
              review price, placement,
            </text>
            <text fill="#f3f6fb" fontSize="12" fontWeight="600" x="654" y="295">
              and stock confidence
            </text>
          </g>
        </svg>
      </div>
      <div className="about-funnel-caption">
        <span>Attention</span>
        <span>Consideration</span>
        <span>Basket intent</span>
        <span>Purchase</span>
      </div>
    </div>
  );
}

function AboutImpactVisual() {
  return (
    <div className="landing-about__visual">
      <span className="about-visual__kicker">Operational decision flow</span>
      <div className="about-svg-shell">
        <svg
          aria-label="Diagram showing how behavior, sales, and inventory are turned into operational retail actions"
          className="about-svg about-svg--impact"
          role="img"
          viewBox="0 0 920 420"
        >
          <rect
            fill="#121720"
            fillOpacity="0.46"
            height="398"
            rx="30"
            width="900"
            x="10"
            y="11"
          />
          {ABOUT_OPERATIONAL_INPUTS.map((item, index) => {
            const y = 56 + index * 96;
            return (
              <g key={item.label}>
                <rect
                  fill="#2a3342"
                  fillOpacity="0.94"
                  height="74"
                  rx="22"
                  stroke="#ffffff"
                  strokeOpacity="0.08"
                  width="210"
                  x="52"
                  y={y}
                />
                <text fill="#ffd7b9" fontSize="11" fontWeight="700" x="78" y={y + 28}>
                  {`0${index + 1}`}
                </text>
                <text fill="#fff5e9" fontSize="16" fontWeight="700" x="78" y={y + 50}>
                  {item.label}
                </text>
                <text fill="#d7dee9" fontSize="11" x="78" y={y + 68}>
                  {item.detail}
                </text>
                <line
                  stroke="#ffffff"
                  strokeOpacity="0.16"
                  strokeWidth="3"
                  x1="262"
                  x2="344"
                  y1={y + 37}
                  y2="190"
                />
              </g>
            );
          })}
          <rect
            fill="#f1884f"
            fillOpacity="0.16"
            height="168"
            rx="32"
            stroke="#ffd7b9"
            strokeOpacity="0.22"
            width="248"
            x="336"
            y="106"
          />
          <text fill="#ffd7b9" fontSize="11" fontWeight="700" textAnchor="middle" x="460" y="144">
            OPERATIONAL DECISION LAYER
          </text>
          <SvgMultilineText
            fill="#fff5e9"
            fontSize="16"
            fontWeight="700"
            lineHeight={16}
            lines={["Behavior +", "Sales + Inventory"]}
            textAnchor="middle"
            x="460"
            y="172"
          />
          <text fill="#f2e7db" fontSize="11" textAnchor="middle" x="460" y="220">
            conversion gap detection
          </text>
          <text fill="#f2e7db" fontSize="11" textAnchor="middle" x="460" y="238">
            demand and replenishment scoring
          </text>
          <text fill="#f2e7db" fontSize="11" textAnchor="middle" x="460" y="256">
            pricing and placement priority
          </text>
          {ABOUT_OPERATIONAL_ACTIONS.map((item, index) => {
            const y = 56 + index * 96;
            return (
              <g key={item.labelLines.join("-")}>
                <rect
                  fill="#2a3342"
                  fillOpacity="0.94"
                  height="88"
                  rx="24"
                  stroke="#ffffff"
                  strokeOpacity="0.08"
                  width="230"
                  x="638"
                  y={y}
                />
                <line
                  stroke="#ffffff"
                  strokeOpacity="0.16"
                  strokeWidth="3"
                  x1="584"
                  x2="638"
                  y1="190"
                  y2={y + 44}
                />
                <text fill="#8ff0b6" fontSize="11" fontWeight="700" x="664" y={y + 28}>
                  ACTION
                </text>
                <SvgMultilineText
                  fill="#fff5e9"
                  fontSize="16"
                  fontWeight="700"
                  lineHeight={16}
                  lines={item.labelLines}
                  x="664"
                  y={y + 46}
                />
                <text fill="#d7dee9" fontSize="11" x="664" y={y + 80}>
                  {item.detail}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function AboutLimitationsVisual() {
  const limitationAreas = [
    "Model confidence and class overlap",
    "Interaction point stability under fast motion",
    "Scene-specific calibration and shelf geometry",
    "Deployment, scaling, and persistence boundaries",
  ];

  return (
    <div className="landing-about__visual">
      <span className="about-visual__kicker">Current system boundaries</span>
      <div className="about-limitations__list">
        {limitationAreas.map((item, index) => (
          <div className="about-limitations__item" key={item}>
            <span className="about-limitations__index">{`0${index + 1}`}</span>
            <strong>{item}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutContributorsVisual() {
  const hasContributors = ABOUT_CONTRIBUTORS.length > 0;
  const hasGithubLink = Boolean(ABOUT_PROJECT_GITHUB_URL);
  const hasInspirationLink = Boolean(ABOUT_INSPIRATION_URL);

  return (
    <div className="landing-about__visual">
      <span className="about-visual__kicker">Credits and contacts</span>
      <div className="about-table-shell">
        <table className="about-table about-table--contributors">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Email</th>
            </tr>
          </thead>
          <tbody>
            {hasContributors ? (
              ABOUT_CONTRIBUTORS.map((contributor) => (
                <tr key={`${contributor.name}-${contributor.email}`}>
                  <td>{contributor.name}</td>
                  <td>{contributor.role}</td>
                  <td>{contributor.email}</td>
                </tr>
              ))
            ) : (
              <>
                <tr>
                  <td>Kyaw Swar Hein</td>
                  <td>Developer</td>
                  <td>heinm.dev@gmail.com</td>
                </tr>
                <tr>
                  <td>Banyar Htet Naung</td>
                  <td>Developer</td>
                  <td>banyarhtetnaung28@gmail.com</td>
                </tr>
                <tr>
                  <td>Tin Aung Yin</td>
                  <td>Developer</td>
                  <td>tinaungyin1996@gmail.com</td>
                </tr>
                <tr>
                  <td>Pyae Sone Htut</td>
                  <td>Business Advisor</td>
                  <td>pyaesonehtut002@gmail.com</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
      <div className="about-contributors__repo">
        <span className="about-contributors__repo-label">Project GitHub</span>
        {hasGithubLink ? (
          <>
          <span className="about-contributors__empty">
            Frontend Only: 
          </span>
          <a
            className="about-contributors__repo-link"
            href={ABOUT_PROJECT_GITHUB_URL}
            rel="noreferrer"
            target="_blank"
          >
            {ABOUT_PROJECT_GITHUB_URL}
          </a>
           </>
        ): (
          <span className="about-contributors__empty">
            Frontend Only: https://github.com/Paradox-9007/CBA-FRONTEND
          </span>
        )}
      </div>
      <div className="about-contributors__acknowledgment">
        <span className="about-contributors__repo-label">RESEARCH INSPIRATION</span>
        {hasInspirationLink ? (
          <p className="about-contributors__acknowledgment-text">
            Inspired by the study:{" "}
            <a
              className="about-contributors__repo-link"
              href={ABOUT_INSPIRATION_URL}
              rel="noreferrer"
              target="_blank"
            >
              {ABOUT_INSPIRATION_LABEL}
            </a>
          </p>
        ) : (
          <span className="about-contributors__empty">
            Inspiration paper link can be added here.
          </span>
        )}
      </div>
    </div>
  );
}

function AboutImageGallery({ images = [], kicker = "Supporting figures" }) {
  if (!Array.isArray(images) || !images.length) {
    return null;
  }

  return (
    <div className="landing-about__visual landing-about__visual--gallery">
      <span className="about-visual__kicker">{kicker}</span>
      <div className="about-image-gallery">
        {images.map((image) => (
          <figure className="about-image-card" key={image.src}>
            <img alt={image.alt} className="about-image-card__image" src={image.src} />
            <figcaption className="about-image-card__caption">{image.caption}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function AboutParagraphGroup({ paragraphs, variant = "body" }) {
  function renderHighlightedInteractionLabels(text) {
    if (!text) {
      return text;
    }

    const labelMatches = [
      { label: "'No Interaction,'", className: "landing-about__label landing-about__label--red" },
      { label: "'Touching Shelf,'", className: "landing-about__label landing-about__label--blue" },
      { label: "'Holding Product,'", className: "landing-about__label landing-about__label--orange" },
      { label: "'Item Removed.'", className: "landing-about__label landing-about__label--purple" },
    ];

    const escapedPattern = labelMatches.map((match) => match.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const parts = text.split(new RegExp(`(${escapedPattern})`));

    return parts.map((part, index) => {
      const matchedLabel = labelMatches.find((match) => match.label === part);
      if (!matchedLabel) {
        return <span key={`${part}-${index}`}>{part}</span>;
      }
      return (
        <span className={matchedLabel.className} key={`${part}-${index}`}>
          {part}
        </span>
      );
    });
  }

  return (
    <div className={`landing-about__text-flow landing-about__text-flow--${variant}`}>
      {paragraphs.map((paragraph, index) => {
        const isDemingQuote = paragraph.text.includes("Without data, you're just another person with an opinion.");

        return (
          <p
            className={`landing-about__paragraph${isDemingQuote ? " landing-about__paragraph--quote" : ""}`}
            key={`${paragraph.text.slice(0, 24)}-${index}`}
          >
            {paragraph.title ? <strong className="landing-about__paragraph-title">{paragraph.title}</strong> : null}
            {paragraph.title ? " " : null}
            {isDemingQuote ? (
              <>
                {"\"Without data, you're just another person with an opinion.\" "}
                <span className="landing-about__quote-attribution">— W. Edwards Deming</span>
              </>
              ) : (
                renderHighlightedInteractionLabels(paragraph.text)
              )}
            {paragraph.href ? (
              <>
                {" "}
                <a
                  className="landing-about__link"
                  href={paragraph.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {paragraph.linkLabel ?? paragraph.href}
                </a>
              </>
            ) : null}
          </p>
        );
      })}
    </div>
  );
}

function renderAboutVisual(visual) {
  if (visual === "comparison") {
    return <AboutComparisonVisual />;
  }
  if (visual === "pipeline") {
    return <AboutPipelineVisual />;
  }
  if (visual === "training") {
    return <AboutTrainingVisual />;
  }
  if (visual === "predictive") {
    return <AboutPredictiveVisual />;
  }
  if (visual === "impact") {
    return <AboutImpactVisual />;
  }
  if (visual === "limitations") {
    return <AboutLimitationsVisual />;
  }
  if (visual === "contributors") {
    return <AboutContributorsVisual />;
  }
  return null;
}

function HomePage({ onStart }) {
  const aboutSectionRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function syncScrollTopVisibility() {
      setShowScrollTop(window.scrollY > 280);
    }

    syncScrollTopVisibility();
    window.addEventListener("scroll", syncScrollTopVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncScrollTopVisibility);
    };
  }, []);

  function scrollToAbout() {
    aboutSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="landing-shell">
      <BackgroundSlide advanceSeconds={HOME_ANNOTATION_ADVANCE_DEFAULT} />
      <section className="landing-hero">
        <div className="minimalist-home">
          <button className="start-button" type="button" onClick={onStart}>
            See the Action
          </button>
        </div>
      </section>

      <section className="landing-about-section" ref={aboutSectionRef}>
        <div className="landing-about-panel">
          <button className="landing-about__peek" type="button" onClick={scrollToAbout}>
            <span className="landing-about__peek-title">About This Project</span>
          </button>

          <div className="landing-about__intro">
            <p className="landing-about__eyebrow">Project overview</p>
            <h2 className="landing-about__title">Customer Behaviour Analysis</h2>
            <AboutParagraphGroup paragraphs={ABOUT_INTRO_PARAGRAPHS} variant="lead" />
          </div>

          <div className="landing-about__grid">
            {ABOUT_SECTIONS.map((section) => (
              <article
                className={`landing-about__section landing-about__section--${section.visual}`}
                key={section.title}
              >
                <h3>{section.title}</h3>
                {renderAboutVisual(section.visual)}
                {section.images?.length ? (
                  <AboutImageGallery
                    images={section.images}
                    kicker={
                      section.visual === "training"
                        ? "Training outputs and evaluation figures"
                        : "Limitation-related evaluation figures"
                    }
                  />
                ) : null}
                <AboutParagraphGroup
                  paragraphs={section.paragraphs}
                  variant={section.textVariant ?? "body"}
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <button
        aria-label="Scroll to top"
        className={`landing-scroll-top${showScrollTop ? " is-visible" : ""}`}
        type="button"
        onClick={scrollToTop}
      >
        <span aria-hidden="true">˄</span>
      </button>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
    </article>
  );
}

function ProductInsightCard({ label, name, count, tone }) {
  return (
    <article className={`product-insight-card ${tone}`}>
      <span>{label}</span>
      <strong>{formatInsightName(name, count)}</strong>
      <small>{count ? `${formatNumber(count)} logged events` : "Waiting for history"}</small>
    </article>
  );
}

function LegendItem({ colorClass, label }) {
  return (
    <div className="legend-item">
      <span className={`legend-swatch ${colorClass}`} />
      <span>{label}</span>
    </div>
  );
}

function pointColorForKind(kind) {
  if (kind === "touching") {
    return "#30d158";
  }
  if (kind === "holding") {
    return "#52a7ff";
  }
  return "#c77dff";
}

function ProductPointsCanvas({ points }) {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const board = canvas?.parentElement;
    if (!canvas || !board) {
      return undefined;
    }

    function syncSize(width, height) {
      const nextWidth = Math.max(0, Math.round(width));
      const nextHeight = Math.max(0, Math.round(height));
      setCanvasSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight },
      );
    }

    const boardBounds = board.getBoundingClientRect();
    syncSize(boardBounds.width, boardBounds.height);

    if (typeof ResizeObserver === "undefined") {
      function handleResize() {
        const nextBounds = board.getBoundingClientRect();
        syncSize(nextBounds.width, nextBounds.height);
      }

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      syncSize(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(board);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasSize.width || !canvasSize.height) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(canvasSize.width * dpr));
    canvas.height = Math.max(1, Math.round(canvasSize.height * dpr));
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const pointRadius = canvasSize.width < 480 ? 4.5 : 5.5;
    const haloRadius = pointRadius + (canvasSize.width < 480 ? 2 : 3);
    const strokeWidth = canvasSize.width < 480 ? 1.5 : 2;

    for (const point of points) {
      const x = point.x * canvasSize.width;
      const y = point.y * canvasSize.height;

      context.beginPath();
      context.fillStyle = "rgba(255, 255, 255, 0.10)";
      context.arc(x, y, haloRadius, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.fillStyle = pointColorForKind(point.kind);
      context.arc(x, y, pointRadius, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.strokeStyle = "rgba(255, 255, 255, 0.86)";
      context.lineWidth = strokeWidth;
      context.arc(x, y, pointRadius, 0, Math.PI * 2);
      context.stroke();
    }
  }, [canvasSize.height, canvasSize.width, points]);

  return <canvas aria-hidden="true" className="product-points-canvas" ref={canvasRef} />;
}

function ShelfZoneEditor({ points, disabled, onChange, showHandles = true }) {
  const editorRef = useRef(null);
  const activeHandleIndexRef = useRef(-1);

  function updatePoint(index, event) {
    const node = editorRef.current;
    if (!node) {
      return;
    }

    const point = getPointerPosition(event, node);
    onChange((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? point : item)),
    );
  }

  function handlePointerDown(index, event) {
    if (disabled) {
      return;
    }

    activeHandleIndexRef.current = index;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updatePoint(index, event);
  }

  function handlePointerMove(index, event) {
    if (disabled || activeHandleIndexRef.current !== index) {
      return;
    }
    updatePoint(index, event);
  }

  function handlePointerUp(index, event) {
    if (activeHandleIndexRef.current !== index) {
      return;
    }
    activeHandleIndexRef.current = -1;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  const normalizedPoints = normalizeShelfZoneDraft(points);
  const polygonPath = normalizedPoints
    .map((point) => `${(point.x * 100).toFixed(2)},${(point.y * 100).toFixed(2)}`)
    .join(" ");

  return (
    <div className={`shelf-zone-editor${disabled ? " is-disabled" : ""}`} ref={editorRef}>
      <svg
        aria-hidden="true"
        className="shelf-zone-editor__svg"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <polygon className="shelf-zone-editor__fill" points={polygonPath} />
        <polygon className="shelf-zone-editor__outline" points={polygonPath} />
      </svg>

      {showHandles
        ? normalizedPoints.map((point, index) => (
            <button
              aria-label={`Shelf zone point ${SHELF_ZONE_HANDLE_LABELS[index] ?? index + 1}`}
              className="shelf-zone-editor__handle"
              key={`zone-point-${SHELF_ZONE_HANDLE_LABELS[index] ?? index + 1}`}
              style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
              type="button"
              onPointerDown={(event) => handlePointerDown(index, event)}
              onPointerMove={(event) => handlePointerMove(index, event)}
              onPointerUp={(event) => handlePointerUp(index, event)}
              onPointerCancel={(event) => handlePointerUp(index, event)}
            >
              <span>{SHELF_ZONE_HANDLE_LABELS[index] ?? index + 1}</span>
            </button>
          ))
        : null}
    </div>
  );
}

function ShelfZonePointReference() {
  return (
    <div className="upload-setup-modal__point-reference">
      <svg
        aria-hidden="true"
        className="upload-setup-modal__point-reference-art"
        viewBox="0 0 240 180"
      >
        <rect
          fill="rgba(255, 255, 255, 0.04)"
          height="156"
          rx="22"
          stroke="rgba(255, 255, 255, 0.08)"
          width="216"
          x="12"
          y=" 2"
        />
        <path
          d="M48 50h144M42 86h156M35 122h170"
          fill="none"
          opacity="0.72"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeLinecap="round"
          strokeWidth="5"
        />
        <polygon
          fill="rgba(247, 162, 108, 0.14)"
          points="54,46 186,46 196,138 44,138"
          stroke="rgba(247, 162, 108, 0.85)"
          strokeLinejoin="round"
          strokeWidth="3"
        />
        <g>
          <circle cx="186" cy="46" fill="#f7a26c" r="15" />
          <circle cx="54" cy="46" fill="#f7a26c" r="15" />
          <circle cx="44" cy="138" fill="#f7a26c" r="15" />
          <circle cx="196" cy="138" fill="#f7a26c" r="15" />
          <g
            fill="#11151c"
            fontFamily="inherit"
            fontSize="14"
            fontWeight="800"
            textAnchor="middle"
          >
            <text x="186" y="51">1</text>
            <text x="54" y="51">2</text>
            <text x="44" y="143">3</text>
            <text x="196" y="143">4</text>
          </g>
        </g>
      </svg>

      <div className="upload-setup-modal__point-reference-list">
        {SHELF_ZONE_REFERENCE_ITEMS.map((item) => (
          <div className="upload-setup-modal__point-reference-item" key={item.label}>
            <span>{item.label}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CameraLog({ metric, selectedStream }) {
  const rows = [
    { label: "stream", value: selectedStream?.name ?? "Unavailable" },
    { label: "status", value: metric?.status ?? "waiting" },
    { label: "live fps", value: metric?.live_fps ? `${metric.live_fps.toFixed(2)} fps` : "0.00 fps" },
    { label: "last frame", value: formatTimestamp(metric?.camera_metadata?.last_frame_at) },
  ];

  return (
    <section className="panel-card">
      <h3>Camera Log</h3>
      <div className="list-panel compact-list">
        {rows.map((row) => (
          <div className="list-row" key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function HeatmapGrid({ heatmapData, filterMode }) {
  const rows = heatmapData?.shape?.rows ?? 0;
  const cols = heatmapData?.shape?.cols ?? 0;

  if (!rows || !cols) {
    return <div className="viewer-empty">Heatmap will appear here once the stream is active.</div>;
  }

  const touchingValues = heatmapData?.touching_values ?? [];
  const holdingValues = heatmapData?.holding_values ?? [];
  const removedValues = heatmapData?.removed_values ?? [];
  const cells = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    for (let colIndex = 0; colIndex < cols; colIndex += 1) {
      const touchingValue = touchingValues[rowIndex]?.[colIndex] ?? 0;
      const holdingValue = holdingValues[rowIndex]?.[colIndex] ?? 0;
      const removedValue = removedValues[rowIndex]?.[colIndex] ?? 0;

      let cellClass = "neutral";
      let intensity = 0;

      if (filterMode === "touching") {
        intensity = touchingValue;
        if (touchingValue > 0) {
          cellClass = "touching";
        }
      } else if (filterMode === "holding") {
        intensity = Math.max(holdingValue, removedValue);
        if (intensity > 0) {
          cellClass = "holding";
        }
      } else if (filterMode === "removed") {
        intensity = removedValue;
        if (removedValue > 0) {
          cellClass = "removed";
        }
      } else if (removedValue > 0) {
        intensity = removedValue;
        cellClass = "removed";
      } else if (holdingValue > 0) {
        intensity = holdingValue;
        cellClass = "holding";
      } else if (touchingValue > 0) {
        intensity = touchingValue;
        cellClass = "touching";
      }

      cells.push(
        <div
          className={`heatmap-cell ${cellClass}`}
          key={`${rowIndex}-${colIndex}`}
          style={{ opacity: intensity > 0 ? Math.max(0.2, intensity) : 0.24 }}
        />,
      );
    }
  }

  return (
    <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {cells}
    </div>
  );
}

function DetectionOverlay({ personBoxes = [], behaviorBoxes = [], persistentPoints = [], frameSize }) {
  const frameWidth = Math.max(Number(frameSize?.width ?? 0), 1);
  const frameHeight = Math.max(Number(frameSize?.height ?? 0), 1);
  const allBoxes = [
    ...personBoxes.map((box, index) => ({ ...box, overlayId: `person-${index}` })),
    ...behaviorBoxes.map((box, index) => ({ ...box, overlayId: `behavior-${index}` })),
  ];

  if (!allBoxes.length && !persistentPoints.length) {
    return null;
  }

  return (
    <div className="detection-overlay" aria-hidden="true">
      {allBoxes.map((box) => {
        const [x1, y1, x2, y2] = box.bbox ?? [0, 0, 0, 0];
        const kind = box.kind ?? "person";
        const width = Math.max(x2 - x1, 0);
        const height = Math.max(y2 - y1, 0);

        return (
          <div
            className={`detection-box detection-box--${kind}`}
            key={box.overlayId}
            style={{
              left: `${(x1 / frameWidth) * 100}%`,
              top: `${(y1 / frameHeight) * 100}%`,
              width: `${(width / frameWidth) * 100}%`,
              height: `${(height / frameHeight) * 100}%`,
            }}
          >
            <span className="detection-box__label">{box.label ?? kind}</span>
          </div>
        );
      })}
      {persistentPoints.map((point) => (
        <span
          className={`interaction-point interaction-point--${point.kind ?? "touching"}`}
          key={point.id}
          style={{
            left: `${(Number(point.x ?? 0) * 100).toFixed(3)}%`,
            top: `${(Number(point.y ?? 0) * 100).toFixed(3)}%`,
          }}
        />
      ))}
    </div>
  );
}

function ProductBoard({
  backgroundImage,
  boardClassName,
  products,
  eventPoints,
  showEventPoints,
  onBoardPointerDown,
  onBoardPointerMove,
  onBoardPointerUp,
  onProductClick,
  selectedProductId,
  draftRect,
  editable,
}) {
  return (
    <div
      className={`product-board ${boardClassName}`}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
      onPointerDown={onBoardPointerDown}
      onPointerMove={onBoardPointerMove}
      onPointerUp={onBoardPointerUp}
      onPointerLeave={onBoardPointerUp}
      role={editable ? "presentation" : undefined}
    >
      {showEventPoints ? <ProductPointsCanvas points={eventPoints} /> : null}

      {products.map((product) => (
        <button
          className={`product-slot ${product.stage ?? "idle"} ${
            selectedProductId === product.id ? "selected" : ""
          }`}
          key={product.id}
          style={{
            left: `${product.x * 100}%`,
            top: `${product.y * 100}%`,
            width: `${product.width * 100}%`,
            height: `${product.height * 100}%`,
          }}
          type="button"
          onClick={() => onProductClick?.(product.id)}
        >
          <span className="product-slot__name">{product.name}</span>
          <span className="product-slot__meta">
            T {product.touchingCount} / H {product.holdingCount} / R {product.removedCount}
          </span>
          {product.totalInteractions > 0 ? (
            <span className="product-slot__count">{formatNumber(product.totalInteractions)}</span>
          ) : null}
        </button>
      ))}

      {draftRect ? (
        <div
          className="product-slot draft"
          style={{
            left: `${draftRect.x * 100}%`,
            top: `${draftRect.y * 100}%`,
            width: `${draftRect.width * 100}%`,
            height: `${draftRect.height * 100}%`,
          }}
        />
      ) : null}
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => pageFromPath(window.location.pathname));
  const [streams, setStreams] = useState([]);
  const [selectedStreamId, setSelectedStreamId] = useState("");
  const [selectedViewMode, setSelectedViewMode] = useState("live");
  const [sampleReplayData, setSampleReplayData] = useState(null);
  const [sampleReplayError, setSampleReplayError] = useState("");
  const [sampleReplayStepIndex, setSampleReplayStepIndex] = useState(0);
  const [sampleVideoStatus, setSampleVideoStatus] = useState("idle");
  const [persistentAnalyticsEvents, setPersistentAnalyticsEvents] = useState(() =>
    loadPersistentAnalyticsEvents(),
  );
  const [heatmapFilter, setHeatmapFilter] = useState("all");
  const [metrics, setMetrics] = useState([]);
  const [heatmapData, setHeatmapData] = useState(null);
  const [shelfAnalysis, setShelfAnalysis] = useState(null);
  const [requestError, setRequestError] = useState("");
  const [productLayoutMode, setProductLayoutMode] = useState("example2");
  const [showEventPoints, setShowEventPoints] = useState(false);
  const [customProducts, setCustomProducts] = useState([]);
  const [selectedCustomProductId, setSelectedCustomProductId] = useState("");
  const [draftProduct, setDraftProduct] = useState(null);
  const [streamUploadFile, setStreamUploadFile] = useState(null);
  const [streamUploadPreviewUrl, setStreamUploadPreviewUrl] = useState("");
  const [streamUploadProgress, setStreamUploadProgress] = useState(0);
  const [streamUploadStatus, setStreamUploadStatus] = useState("");
  const [streamUploadError, setStreamUploadError] = useState("");
  const [isUploadingStream, setIsUploadingStream] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [setupStream, setSetupStream] = useState(null);
  const [setupOrientation, setSetupOrientation] = useState("none");
  const [isUpdatingSetupPreview, setIsUpdatingSetupPreview] = useState(false);
  const [setupPreviewVersion, setSetupPreviewVersion] = useState(0);
  const [setupVideoSize, setSetupVideoSize] = useState({ width: 0, height: 0 });
  const [shelfZoneDraft, setShelfZoneDraft] = useState(() => normalizeShelfZoneDraft([]));
  const [shelfZoneStatus, setShelfZoneStatus] = useState("");
  const [shelfZoneError, setShelfZoneError] = useState("");
  const [isSavingShelfZone, setIsSavingShelfZone] = useState(false);
  const [, startPointToggleTransition] = useTransition();
  const boardRef = useRef(null);
  const sampleVideoRef = useRef(null);
  const onActionPage = currentPage === "action";

  useEffect(() => {
    function handlePopState() {
      setCurrentPage(pageFromPath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  function navigateTo(pathname) {
    if (window.location.pathname !== pathname) {
      window.history.pushState({}, "", pathname);
    }
    setCurrentPage(pageFromPath(pathname));
  }

  useEffect(() => {
    document.body.dataset.page = onActionPage ? "analysis" : "landing";
    return () => {
      delete document.body.dataset.page;
    };
  }, [onActionPage]);

  useEffect(() => {
    persistAnalyticsEvents(persistentAnalyticsEvents);
  }, [persistentAnalyticsEvents]);

  useEffect(() => {
    if (!streamUploadFile) {
      setStreamUploadPreviewUrl("");
      setSetupStream(null);
      setSetupVideoSize({ width: 0, height: 0 });
      return undefined;
    }
    return undefined;
  }, [streamUploadFile]);

  useEffect(() => {
    let ignore = false;

    async function loadReplay() {
      try {
        const response = await fetch("/sample-analysis/sample_replay_data.json");
        if (!response.ok) {
          throw new Error("Could not load recorded sample replay data.");
        }
        const payload = await response.json();
        if (!ignore) {
          setSampleReplayData(payload ?? null);
          setSampleReplayError("");
        }
      } catch (error) {
        if (!ignore) {
          setSampleReplayData(null);
          setSampleReplayError(error.message || "Could not load recorded sample replay data.");
        }
      }
    }

    loadReplay();
    return () => {
      ignore = true;
    };
  }, []);

  async function loadStreams(preferredStreamId = "") {
    try {
      const response = await fetch(`${API_BASE_URL}/camera-streams`);
      if (!response.ok) {
        throw new Error("Could not load camera streams.");
      }

      const payload = await response.json();
      const nextStreams = payload?.streams?.length
        ? mergeStreamsWithLocalDefinitions(payload.streams, FALLBACK_STREAMS)
        : FALLBACK_STREAMS;
      setStreams(nextStreams);
      setSelectedStreamId((current) => {
        const nextSelectedId = preferredStreamId || current;
        if (nextSelectedId && nextStreams.some((stream) => stream.stream_id === nextSelectedId)) {
          return nextSelectedId;
        }
        return nextStreams[0]?.stream_id || "";
      });
      setRequestError("");
      return nextStreams;
    } catch (error) {
      setStreams(FALLBACK_STREAMS);
      setSelectedStreamId((current) => current || FALLBACK_STREAMS[0].stream_id);
      setRequestError(error.message || "Could not connect to the backend.");
      return FALLBACK_STREAMS;
    }
  }

  useEffect(() => {
    let ignore = false;

    async function syncStreams() {
      const nextStreams = await loadStreams();
      if (ignore) {
        return;
      }
      setStreams(nextStreams);
    }

    syncStreams();
    return () => {
      ignore = true;
    };
  }, []);

  const selectedStream =
    streams.find((stream) => stream.stream_id === selectedStreamId) ??
    FALLBACK_STREAMS.find((stream) => stream.stream_id === selectedStreamId) ??
    streams[0] ??
    FALLBACK_STREAMS[0];
  const isUploadStreamOptionSelected = selectedStreamId === UPLOAD_STREAM_OPTION_VALUE;
  const selectedStreamZoneSignature = JSON.stringify(selectedStream?.shelf_zone ?? []);
  const selectedStreamHasShelfZone = streamHasShelfZone(selectedStream);
  const selectedReplayStream = sampleReplayData?.streams?.[selectedStream?.stream_id] ?? null;
  const usesRecordedSampleReplay =
    !isUploadStreamOptionSelected &&
    selectedStream?.playback_mode === "replay" &&
    Boolean(selectedStream?.frontend_video_path) &&
    Boolean(selectedReplayStream);
  const liveViewerAspectStyle =
    selectedStream?.fixed_size?.width && selectedStream?.fixed_size?.height
      ? {
          aspectRatio: `${selectedStream.fixed_size.width} / ${selectedStream.fixed_size.height}`,
        }
      : undefined;
  const setupViewerAspectStyle =
    setupStream?.fixed_size?.width && setupStream?.fixed_size?.height
      ? {
          aspectRatio: `${setupStream.fixed_size.width} / ${setupStream.fixed_size.height}`,
        }
      : undefined;

  useEffect(() => {
    setShelfZoneDraft(normalizeShelfZoneDraft(selectedStream?.shelf_zone));
    setShelfZoneStatus("");
    setShelfZoneError("");
  }, [selectedStream?.stream_id, selectedStreamZoneSignature]);

  useEffect(() => {
    if (!usesRecordedSampleReplay) {
      setSampleReplayStepIndex(0);
      setSampleVideoStatus("idle");
      return;
    }

    setSampleReplayStepIndex(0);
    setSampleVideoStatus("loading");
  }, [selectedStream?.stream_id, usesRecordedSampleReplay]);

  useEffect(() => {
    if (!usesRecordedSampleReplay || selectedViewMode !== "live") {
      return undefined;
    }

    const videoNode = sampleVideoRef.current;
    if (!videoNode) {
      return undefined;
    }

    const handleLoadedData = () => setSampleVideoStatus("ready");
    const handlePlaying = () => setSampleVideoStatus("playing");
    const handleWaiting = () => setSampleVideoStatus("buffering");
    const handleError = () => setSampleVideoStatus("error");

    videoNode.load();
    videoNode.play().catch(() => {});
    videoNode.addEventListener("loadeddata", handleLoadedData);
    videoNode.addEventListener("playing", handlePlaying);
    videoNode.addEventListener("waiting", handleWaiting);
    videoNode.addEventListener("stalled", handleWaiting);
    videoNode.addEventListener("error", handleError);

    return () => {
      videoNode.removeEventListener("loadeddata", handleLoadedData);
      videoNode.removeEventListener("playing", handlePlaying);
      videoNode.removeEventListener("waiting", handleWaiting);
      videoNode.removeEventListener("stalled", handleWaiting);
      videoNode.removeEventListener("error", handleError);
    };
  }, [selectedStream?.frontend_video_path, selectedStream?.stream_id, usesRecordedSampleReplay]);

  useEffect(() => {
    if (!onActionPage || selectedViewMode !== "live" || !usesRecordedSampleReplay || !selectedReplayStream) {
      return undefined;
    }

    const videoNode = sampleVideoRef.current;
    if (!videoNode) {
      return undefined;
    }

    let cancelled = false;
    let frameCallbackId = 0;
    let fallbackIntervalId = 0;
    const frameRate = Math.max(Number(selectedReplayStream.frame_rate ?? 30), 1);
    const replayFrameCount = selectedReplayStream.frames?.length ?? 0;

    const updateReplayCursor = () => {
      if (cancelled || replayFrameCount <= 0) {
        return;
      }
      const playbackFrame = Math.max(0, Math.floor(videoNode.currentTime * frameRate));
      const nextIndex = clamp(playbackFrame, 0, replayFrameCount - 1);
      setSampleReplayStepIndex((current) => (current === nextIndex ? current : nextIndex));
    };

    const handleFrame = () => {
      updateReplayCursor();
      if (!cancelled && typeof videoNode.requestVideoFrameCallback === "function") {
        frameCallbackId = videoNode.requestVideoFrameCallback(handleFrame);
      }
    };

    updateReplayCursor();
    if (typeof videoNode.requestVideoFrameCallback === "function") {
      frameCallbackId = videoNode.requestVideoFrameCallback(handleFrame);
    } else {
      fallbackIntervalId = window.setInterval(updateReplayCursor, 100);
    }

    return () => {
      cancelled = true;
      window.clearInterval(fallbackIntervalId);
      if (typeof videoNode.cancelVideoFrameCallback === "function" && frameCallbackId) {
        videoNode.cancelVideoFrameCallback(frameCallbackId);
      }
    };
  }, [onActionPage, selectedReplayStream, selectedViewMode, usesRecordedSampleReplay]);

  useEffect(() => {
    if (!isUploadStreamOptionSelected) {
      return;
    }

    setMetrics([]);
    setHeatmapData(null);
    setShelfAnalysis(null);
    setRequestError("");
  }, [isUploadStreamOptionSelected]);

  useEffect(() => {
    if (!isUploadModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsUploadModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isUploadModalOpen]);

  useEffect(() => {
    if (!onActionPage || !selectedStream?.camera_id || isUploadStreamOptionSelected || usesRecordedSampleReplay) {
      return undefined;
    }

    let ignore = false;

    async function refreshAnalysis() {
      try {
        const allCameraIds = Array.from(
          new Set((streams.length ? streams : FALLBACK_STREAMS).map((stream) => stream.camera_id)),
        );
        const cameraIds = selectedStream?.is_custom
          ? [selectedStream.camera_id]
          : allCameraIds;

        const [metricsResponse, heatmapResponse, ...productsResponses] = await Promise.all([
          fetch(`${API_BASE_URL}/camera-daily-metrics?camera_id=${selectedStream.camera_id}`),
          fetch(`${API_BASE_URL}/camera-heatmaps/${selectedStream.camera_id}`),
          ...cameraIds.map((cameraId) =>
            fetch(`${API_BASE_URL}/camera-analytics/${cameraId}/shelf-products`),
          ),
        ]);

        if (!metricsResponse.ok || !heatmapResponse.ok || productsResponses.some((response) => !response.ok)) {
          throw new Error("Could not refresh the live analysis.");
        }

        const [metricsPayload, heatmapPayload, ...productsPayloads] = await Promise.all([
          metricsResponse.json(),
          heatmapResponse.json(),
          ...productsResponses.map((response) => response.json()),
        ]);

        if (ignore) {
          return;
        }

        setMetrics(metricsPayload?.metrics ?? []);
        setHeatmapData(heatmapPayload ?? null);
        setShelfAnalysis(
          selectedStream?.is_custom ? (productsPayloads[0] ?? null) : mergeShelfAnalysis(productsPayloads),
        );
        setRequestError("");
      } catch (error) {
        if (!ignore) {
          setRequestError(error.message || "Could not refresh the live analysis.");
        }
      }
    }

    refreshAnalysis();
    const intervalId = window.setInterval(refreshAnalysis, 2500);

    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, [onActionPage, selectedStream?.camera_id, streams, isUploadStreamOptionSelected, usesRecordedSampleReplay]);

  const currentReplayFrame =
    usesRecordedSampleReplay && selectedReplayStream?.frames?.length
      ? selectedReplayStream.frames[clamp(sampleReplayStepIndex, 0, selectedReplayStream.frames.length - 1)]
      : null;
  const replayVisibleHistoryEvents = useMemo(() => {
    if (!usesRecordedSampleReplay || !currentReplayFrame || !selectedReplayStream) {
      return [];
    }

    const currentFrameIndex = Number(currentReplayFrame.frame_index ?? 0);
    return (selectedReplayStream.history_events ?? []).filter(
      (event) => Number(event?.frame_index ?? 0) <= currentFrameIndex,
    );
  }, [currentReplayFrame, selectedReplayStream, usesRecordedSampleReplay]);
  const currentPersistentPoints = useMemo(
    () =>
      usesRecordedSampleReplay
        ? stabilizeInteractionPoints(
            filterPointsToShelfZone(
              currentReplayFrame?.replay_points ?? currentReplayFrame?.persistent_points ?? [],
              selectedStream?.shelf_zone,
            ),
          )
        : [],
    [currentReplayFrame, selectedStream?.shelf_zone, usesRecordedSampleReplay],
  );
  const replayMetric = useMemo(
    () => buildReplayMetric(selectedStream, currentReplayFrame, selectedReplayStream, currentPersistentPoints),
    [currentPersistentPoints, currentReplayFrame, selectedReplayStream, selectedStream],
  );
  const effectiveHeatmapData = usesRecordedSampleReplay
    ? buildReplayHeatmapData(replayVisibleHistoryEvents)
    : heatmapData;
  const effectiveShelfAnalysis = usesRecordedSampleReplay
    ? {
        history_event_count: replayVisibleHistoryEvents.length,
        history_limit: selectedReplayStream?.history_limit ?? 0,
      }
    : shelfAnalysis;
  const currentMetric = isUploadStreamOptionSelected
    ? null
    : usesRecordedSampleReplay
      ? replayMetric
      : metricForCamera(metrics, selectedStream?.camera_id);
  const currentPersonBoxes = currentMetric?.person_boxes ?? [];
  const currentBehaviorBoxes = currentMetric?.behavior_boxes ?? [];
  const accumulatedEventPoints = useMemo(
    () => historyRowsToEventPoints(persistentAnalyticsEvents),
    [persistentAnalyticsEvents],
  );
  const boardEventPoints = accumulatedEventPoints;
  const deferredBoardEventPoints = useDeferredValue(boardEventPoints);
  const activeProductLayout =
    productLayoutMode === "example2"
      ? example2Layout
      : productLayoutMode === "custom"
        ? customProducts
        : example1Layout;
  const productStates = useMemo(
    () => buildProductStates(activeProductLayout, boardEventPoints),
    [activeProductLayout, boardEventPoints],
  );
  const productInsights = useMemo(() => buildProductInsights(productStates), [productStates]);
  const sortedProducts = useMemo(() => sortProductsForDisplay(productStates), [productStates]);
  const selectedCustomProduct =
    productLayoutMode === "custom"
      ? customProducts.find((product) => product.id === selectedCustomProductId) ?? null
      : null;
  const setupOrientationLabel =
    STREAM_SETUP_ORIENTATIONS.find((option) => option.value === setupOrientation)?.label ?? "Upright";
  const selectedViewModeLabel =
    VIEW_OPTIONS.find((option) => option.value === selectedViewMode)?.label ?? "live view";
  const selectedStreamLabel = isUploadStreamOptionSelected
    ? "Upload Video"
    : selectedStream?.name ?? "No stream selected";
  const selectedHeatmapFilterLabel =
    HEATMAP_FILTER_OPTIONS.find((option) => option.value === heatmapFilter)?.label ?? "All";
  const selectedProductLayoutLabel =
    PRODUCT_LAYOUT_OPTIONS.find((option) => option.value === productLayoutMode)?.label ?? "Example Layout";
  const productAnalysisNote = isUploadStreamOptionSelected
    ? "Upload a video first, then configure the shelf trapezium to begin custom analysis."
    : selectedStream?.is_custom
    ? selectedStreamHasShelfZone
      ? `Using ${formatNumber(persistentAnalyticsEvents.length)} accumulated interaction events across all processed videos.`
      : "Save the shelf trapezium on your uploaded video first to start generating interaction history."
    : usesRecordedSampleReplay
      ? `The Product Overlay Board is accumulating ${formatNumber(persistentAnalyticsEvents.length)} events across all processed videos with a rolling cap of ${formatNumber(MAX_PERSISTENT_ANALYTICS_EVENTS)}.` // Showing ${formatNumber(currentPersistentPoints.length)} live interaction points. 
      : `Using ${formatNumber(persistentAnalyticsEvents.length)} accumulated interaction events across all processed videos with a rolling cap of ${formatNumber(MAX_PERSISTENT_ANALYTICS_EVENTS)}.`;
  const sampleReplayStatusMessage = sampleReplayError
    ? sampleReplayError
    : sampleVideoStatus === "playing"
      ? "Playing recorded sample replay."
      : sampleVideoStatus === "buffering"
        ? "Buffering recorded sample video..."
        : sampleVideoStatus === "ready"
          ? "Recorded sample video loaded."
          : sampleVideoStatus === "loading"
            ? "Loading recorded sample video..."
            : "Recorded sample replay is idle.";

  useEffect(() => {
    const incomingEvents = usesRecordedSampleReplay
      ? replayVisibleHistoryEvents
      : effectiveShelfAnalysis?.history_events ?? [];

    if (!incomingEvents.length) {
      return;
    }

    setPersistentAnalyticsEvents((current) => accumulatePersistentAnalyticsEvents(current, incomingEvents));
  }, [effectiveShelfAnalysis?.history_events, replayVisibleHistoryEvents, usesRecordedSampleReplay]);

  function updateCustomProductName(nextName) {
    setCustomProducts((current) =>
      current.map((product) =>
        product.id === selectedCustomProductId ? { ...product, name: nextName } : product,
      ),
    );
  }

  function deleteSelectedCustomProduct() {
    if (!selectedCustomProductId) {
      return;
    }

    setCustomProducts((current) =>
      current.filter((product) => product.id !== selectedCustomProductId),
    );
    setSelectedCustomProductId("");
  }

  function clearCustomProducts() {
    setCustomProducts([]);
    setSelectedCustomProductId("");
    setDraftProduct(null);
  }

  function openUploadModal() {
    setIsUploadModalOpen(true);
    setStreamUploadFile(null);
    setStreamUploadPreviewUrl("");
    setStreamUploadProgress(0);
    setStreamUploadError("");
    setStreamUploadStatus("Choose a shelf video to begin.");
    setSetupStream(null);
    setSetupOrientation("none");
    setSetupPreviewVersion(0);
    setSetupVideoSize({ width: 0, height: 0 });
    setShelfZoneDraft(normalizeShelfZoneDraft([]));
    setShelfZoneError("");
    setShelfZoneStatus("");
  }

  function closeUploadModal() {
    setIsUploadModalOpen(false);
  }

  async function handleStreamUpload() {
    if (!streamUploadFile) {
      setStreamUploadError("Choose a video file first.");
      setStreamUploadStatus("");
      return;
    }

    setIsUploadingStream(true);
    setStreamUploadError("");
    setShelfZoneError("");
    setStreamUploadProgress(0);
    setStreamUploadStatus("Preparing upload session...");

    try {
      const sessionResponse = await fetch(`${API_BASE_URL}/camera-streams/upload-sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orientation: setupOrientation,
          filename: streamUploadFile.name,
          file_size: streamUploadFile.size,
          content_type: streamUploadFile.type,
          display_name: streamUploadFile.name.replace(/\.[^.]+$/, ""),
        }),
      });
      const sessionPayload = await sessionResponse.json().catch(() => ({}));
      if (!sessionResponse.ok) {
        throw new Error(sessionPayload?.detail || "Could not start the upload session.");
      }

      const sessionId = sessionPayload?.session_id;
      const chunkSize = Number(sessionPayload?.chunk_size ?? UPLOAD_CHUNK_SIZE_FALLBACK);
      if (!sessionId) {
        throw new Error("Upload session could not be created.");
      }

      const chunkCount = Math.max(1, Math.ceil(streamUploadFile.size / chunkSize));
      for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
        const startOffset = chunkIndex * chunkSize;
        const endOffset = Math.min(streamUploadFile.size, startOffset + chunkSize);
        const chunk = streamUploadFile.slice(startOffset, endOffset);
        setStreamUploadStatus(`Uploading ${chunkIndex + 1} of ${chunkCount} chunks...`);

        const chunkResponse = await fetch(
          `${API_BASE_URL}/camera-streams/upload-sessions/${sessionId}?index=${chunkIndex}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/octet-stream",
            },
            body: chunk,
          },
        );
        const chunkPayload = await chunkResponse.json().catch(() => ({}));
        if (!chunkResponse.ok) {
          throw new Error(chunkPayload?.detail || "Could not upload the video chunk.");
        }
        setStreamUploadProgress(endOffset / Math.max(streamUploadFile.size, 1));
      }

      setStreamUploadStatus("Preparing backend preview...");
      const completeResponse = await fetch(
        `${API_BASE_URL}/camera-streams/upload-sessions/${sessionId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orientation: setupOrientation,
            display_name: streamUploadFile.name.replace(/\.[^.]+$/, ""),
          }),
        },
      );
      const completePayload = await completeResponse.json().catch(() => ({}));
      if (!completeResponse.ok) {
        throw new Error(completePayload?.detail || "Could not prepare the uploaded video.");
      }

      const uploadedStream = completePayload?.stream;
      setSetupStream(uploadedStream ?? null);
      setSetupOrientation(uploadedStream?.orientation ?? setupOrientation);
      setSetupPreviewVersion((current) => current + 1);
      setShelfZoneDraft(normalizeShelfZoneDraft(uploadedStream?.shelf_zone ?? []));
      setStreamUploadStatus("Video uploaded. Rotate it if needed, adjust the shelf zone, then confirm.");
    } catch (error) {
      setStreamUploadError(error.message || "Could not upload the video.");
      setStreamUploadStatus("");
    } finally {
      setIsUploadingStream(false);
    }
  }

  function resetShelfZoneDraft() {
    setShelfZoneDraft(normalizeShelfZoneDraft([]));
    setShelfZoneStatus("");
    setShelfZoneError("");
  }

  async function updateSetupPreviewOrientation(nextOrientation) {
    if (!setupStream?.stream_id || nextOrientation === setupOrientation) {
      return;
    }

    setIsUpdatingSetupPreview(true);
    setStreamUploadError("");
    setStreamUploadStatus("Updating preview orientation...");

    try {
      const response = await fetch(`${API_BASE_URL}/camera-streams/${setupStream.stream_id}/preview`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orientation: nextOrientation }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.detail || "Could not update the video rotation.");
      }

      setSetupStream(payload?.stream ?? setupStream);
      setSetupOrientation(payload?.stream?.orientation ?? nextOrientation);
      setSetupPreviewVersion((current) => current + 1);
      setStreamUploadStatus("Preview updated. Adjust the trapezium when the video looks correct.");
    } catch (error) {
      setStreamUploadError(error.message || "Could not update the video rotation.");
      setStreamUploadStatus("");
    } finally {
      setIsUpdatingSetupPreview(false);
    }
  }

  async function finalizeUploadedStreamSetup() {
    if (!setupStream?.stream_id) {
      setStreamUploadError("Upload the video first.");
      return;
    }

    setIsSavingShelfZone(true);
    setShelfZoneError("");
    setShelfZoneStatus("");
    setStreamUploadStatus("Saving setup and starting analysis...");

    try {
      const response = await fetch(`${API_BASE_URL}/camera-streams/${setupStream.stream_id}/shelf-zone`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          points: shelfZoneDraft,
          orientation: setupOrientation,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.detail || "Could not start analysis for the uploaded video.");
      }

      const updatedStream = payload?.stream;
      await loadStreams(updatedStream?.stream_id ?? setupStream.stream_id);
      setSelectedStreamId(updatedStream?.stream_id ?? setupStream.stream_id);
      setSelectedViewMode("live");
      setShelfZoneDraft(normalizeShelfZoneDraft(updatedStream?.shelf_zone ?? []));
      setShelfZoneStatus("Analysis started.");
      setStreamUploadStatus("Setup complete.");
      setIsUploadModalOpen(false);
    } catch (error) {
      setShelfZoneError(error.message || "Could not start analysis for the uploaded video.");
      setShelfZoneStatus("");
    } finally {
      setIsSavingShelfZone(false);
    }
  }

  async function saveShelfZone() {
    if (!selectedStream?.stream_id || !selectedStream?.is_custom) {
      return;
    }

    setIsSavingShelfZone(true);
    setShelfZoneError("");
    setShelfZoneStatus("Saving shelf zone and resetting analysis for the uploaded stream...");

    try {
      const response = await fetch(`${API_BASE_URL}/camera-streams/${selectedStream.stream_id}/shelf-zone`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          points: shelfZoneDraft,
          orientation: selectedStream?.orientation ?? "none",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.detail || "Could not save the shelf zone.");
      }

      const updatedStream = payload?.stream;
      await loadStreams(updatedStream?.stream_id ?? selectedStream.stream_id);
      setShelfZoneDraft(normalizeShelfZoneDraft(updatedStream?.shelf_zone));
      setShelfZoneStatus(
        "Shelf trapezium saved. Metrics, heatmap, and product analysis will now refresh from your uploaded video.",
      );
    } catch (error) {
      setShelfZoneError(error.message || "Could not save the shelf zone.");
      setShelfZoneStatus("");
    } finally {
      setIsSavingShelfZone(false);
    }
  }

  function handleCustomBoardPointerDown(event) {
    if (productLayoutMode !== "custom" || !boardRef.current || event.target !== event.currentTarget) {
      return;
    }

    const point = getPointerPosition(event, boardRef.current);
    setSelectedCustomProductId("");
    setDraftProduct({
      startX: point.x,
      startY: point.y,
      endX: point.x,
      endY: point.y,
    });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleCustomBoardPointerMove(event) {
    if (productLayoutMode !== "custom" || !draftProduct || !boardRef.current) {
      return;
    }

    const point = getPointerPosition(event, boardRef.current);
    setDraftProduct((current) =>
      current
        ? {
            ...current,
            endX: point.x,
            endY: point.y,
          }
        : current,
    );
  }

  function handleCustomBoardPointerUp() {
    if (productLayoutMode !== "custom" || !draftProduct) {
      return;
    }

    const rect = normalizeDraftRect(draftProduct);
    setDraftProduct(null);
    if (rect.width < 0.035 || rect.height < 0.035) {
      return;
    }

    const nextProductId = `custom-${Date.now()}`;
    const nextProduct = {
      id: nextProductId,
      slot: nextProductId,
      name: `Product ${customProducts.length + 1}`,
      ...rect,
    };

    setCustomProducts((current) => [...current, nextProduct]);
    setSelectedCustomProductId(nextProductId);
  }

  if (!onActionPage) {
    return <HomePage onStart={() => navigateTo("/action")} />;
  }

  return (
    <div className="analysis-shell">
      <header className="analysis-header">
        <div>
          <p className="eyebrow">Customer Behaviour Analysis</p>
          <p className="muted-text">Frontend-rendered streaming with pre-recorded model outputs are used to reduce performance bottlenecks.</p>
        </div>
        <button className="ghost-button" type="button" onClick={() => navigateTo("/")}>
          Back Home
        </button>
      </header>

      <div className="dashboard-grid">
        <section className="left-section">
          <div className="viewer-controls">
            <div className="control-card top-control-card top-control-card--view">
              <label className="field-label" htmlFor="view-mode-select">
                View mode
              </label>
              <select
                className="control-select"
                id="view-mode-select"
                title={selectedViewModeLabel}
                value={selectedViewMode}
                onChange={(event) => setSelectedViewMode(event.target.value)}
              >
                {VIEW_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-card top-control-card top-control-card--stream">
              <label className="field-label" htmlFor="stream-select">
                Video source
              </label>
              <select
                className="control-select control-select--stream"
                id="stream-select"
                title={selectedStreamLabel}
                value={selectedStream?.stream_id ?? ""}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (nextValue === UPLOAD_STREAM_OPTION_VALUE) {
                    openUploadModal();
                    return;
                  }
                  setSelectedStreamId(nextValue);
                }}
              >
                {streams.map((stream) => (
                  <option key={stream.stream_id} value={stream.stream_id}>
                    {stream.name}
                  </option>
                ))}
                <option value={UPLOAD_STREAM_OPTION_VALUE}>Upload Video</option>
              </select>
            </div>
          </div>

          <section className="viewer-card">
            <>
            {/* HEATMAP VIEW */}
            <div
              style={{
                display: selectedViewMode === "heatmap" ? "block" : "none",
              }}
            >
              <div className="viewer-card-toolbar">
                <div>
                  <span className="viewer-mode-label">Heatmap View</span>
                  <p className="muted-text">
                    Filter interaction stages directly inside the heatmap viewer.
                  </p>
                </div>

                <div className="viewer-filter-control">
                  <label className="field-label" htmlFor="heatmap-filter">
                    Heatmap filter
                  </label>

                  <select
                    className="control-select"
                    id="heatmap-filter"
                    value={heatmapFilter}
                    onChange={(event) => setHeatmapFilter(event.target.value)}
                  >
                    {HEATMAP_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="viewer-frame viewer-frame--heatmap">
                <div className="heatmap-display">
                  <HeatmapGrid
                    heatmapData={effectiveHeatmapData}
                    filterMode={heatmapFilter}
                  />
                </div>
              </div>
            </div>

            {/* LIVE VIEW */}
            <div
              style={{
                display: selectedViewMode === "live" ? "block" : "none",
              }}
            >
              <div
                className="viewer-frame viewer-frame--interactive"
                style={liveViewerAspectStyle}
              >
                {!isUploadStreamOptionSelected && selectedStream ? (
                  usesRecordedSampleReplay ? (
                    <div className="viewer-scene">
                      <video
                        aria-label={`${selectedStream.name} recorded replay`}
                        className="viewer-video"
                        loop
                        muted
                        autoPlay
                        playsInline
                        preload="auto"
                        ref={sampleVideoRef}
                        src={selectedStream.frontend_video_path}
                      />
                      {streamHasShelfZone(selectedStream) ? (
                        <ShelfZoneEditor
                          disabled
                          points={selectedStream.shelf_zone}
                          showHandles={false}
                        />
                      ) : null}
                      <DetectionOverlay
                        behaviorBoxes={currentBehaviorBoxes}
                        frameSize={selectedStream.fixed_size}
                        personBoxes={currentPersonBoxes}
                        persistentPoints={currentPersistentPoints}
                      />
                    </div>
                  ) : (
                    <img
                      alt={`${selectedStream.name} live stream`}
                      className="viewer-image"
                      src={`${API_BASE_URL}/camera-streams/${selectedStream.stream_id}`}
                    />
                  )
                ) : (
                  <div className="viewer-empty">
                    Upload mode selected.
                  </div>
                )}
              </div>
            </div>
          </>




          </section>
        </section>

        <aside className="right-section">
          <div className="kpi-grid">
            <MetricCard label="total person" value={currentMetric?.current_people ?? 0} />
            <MetricCard label="touching shelf" value={currentMetric?.touching_events ?? 0} />
            <MetricCard label="holding object" value={currentMetric?.holding_events ?? 0} />
            <MetricCard label="item removed" value={currentMetric?.product_remove_events ?? 0} />
          </div>

          <section className="panel-card">
            <h3>Legend</h3>
            <div className="legend-grid">
              <LegendItem colorClass="person" label="Human" />
              <LegendItem colorClass="no-interaction" label="No Interaction" />
              <LegendItem colorClass="touching" label="Touching Shelf" />
              <LegendItem colorClass="holding" label="Holding Item" />
              <LegendItem colorClass="removed" label="Item Removed" />
            </div>
          </section>

          <CameraLog metric={currentMetric} selectedStream={selectedStream} />
        </aside>
      </div>

      <section className="panel-card product-analysis-section">
        <div className="product-analysis-header">
          <div>
            <p className="eyebrow">Product Analysis</p>
            <h2>Product overlay board</h2>
            <p className="muted-text">
              Points overlaying system draws interaction points on the trapezium zone of camera view, then maps them onto the real shelf layout to understand product-level interactions.
            </p>
          </div>

          <div className="product-analysis-control">
            <label className="field-label" htmlFor="product-layout-mode">
              Product layout
            </label>
            <select
              className="control-select control-select--layout"
              id="product-layout-mode"
              title={selectedProductLayoutLabel}
              value={productLayoutMode}
              onChange={(event) => setProductLayoutMode(event.target.value)}
            >
              {PRODUCT_LAYOUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
                ))}
              </select>
              <label className="toggle-control" htmlFor="show-event-points">
                <input
                  id="show-event-points"
                  checked={showEventPoints}
                  type="checkbox"
                  onChange={(event) => {
                    const nextChecked = event.target.checked;
                    startPointToggleTransition(() => {
                      setShowEventPoints(nextChecked);
                    });
                  }}
                />
                <span>Show individual points</span>
              </label>
          </div>
        </div>

        <div className="product-analysis-body">
          <div className="product-board-shell">
            <div className="product-board-header">
              <div>
                <span className="viewer-mode-label">
                  {PRODUCT_LAYOUT_OPTIONS.find((option) => option.value === productLayoutMode)?.label}
                </span>
                <p className="muted-text">{productAnalysisNote}</p>
              </div>
            </div>

            <div ref={boardRef}>
              <ProductBoard
                backgroundImage={productLayoutMode === "example1" ? exampleShelfImage : ""}
                boardClassName={
                  productLayoutMode === "example1"
                    ? "product-board--image"
                    : productLayoutMode === "example2"
                      ? "product-board--example2"
                      : "product-board--custom"
                }
                draftRect={draftProduct ? normalizeDraftRect(draftProduct) : null}
                editable={productLayoutMode === "custom"}
                eventPoints={deferredBoardEventPoints}
                onBoardPointerDown={handleCustomBoardPointerDown}
                onBoardPointerMove={handleCustomBoardPointerMove}
                onBoardPointerUp={handleCustomBoardPointerUp}
                onProductClick={(productId) => {
                  if (productLayoutMode === "custom") {
                    setSelectedCustomProductId(productId);
                  }
                }}
                products={productStates}
                selectedProductId={productLayoutMode === "custom" ? selectedCustomProductId : ""}
                showEventPoints={showEventPoints}
              />
            </div>

            {productLayoutMode === "custom" ? (
              <div className="custom-board-editor">
                <p className="muted-text">
                  Drag on the board to define each product rectangle, then rename the selected
                  product below.
                </p>
                <div className="custom-board-actions">
                  <input
                    aria-label="Selected product name"
                    disabled={!selectedCustomProduct}
                    placeholder="Selected product name"
                    type="text"
                    value={selectedCustomProduct?.name ?? ""}
                    onChange={(event) => updateCustomProductName(event.target.value)}
                  />
                  <button
                    className="ghost-button"
                    disabled={!selectedCustomProduct}
                    type="button"
                    onClick={deleteSelectedCustomProduct}
                  >
                    Delete Selected
                  </button>
                  <button
                    className="ghost-button"
                    disabled={!customProducts.length}
                    type="button"
                    onClick={clearCustomProducts}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="product-kpi-grid">
            <ProductInsightCard
              count={productInsights.touching.count}
              label="highest touched item"
              name={productInsights.touching.name}
              tone="touching"
            />
            <ProductInsightCard
              count={productInsights.holding.count}
              label="highest holding item"
              name={productInsights.holding.name}
              tone="holding"
            />
            <ProductInsightCard
              count={productInsights.removed.count}
              label="highest removed item"
              name={productInsights.removed.name}
              tone="removed"
            />
            <ProductInsightCard
              count={productInsights.total.count}
              label="most active item"
              name={productInsights.total.name}
              tone="neutral"
            />
          </div>

          <section className="product-summary-panel">
            <div className="product-summary-head">
              <span>product</span>
              <span>touch</span>
              <span>hold</span>
              <span>remove</span>
              <span>total</span>
            </div>
            <div className="product-summary-table">
              {sortedProducts.length ? (
                sortedProducts.map((product) => (
                  <div className="product-summary-row" key={product.id}>
                    <strong>{product.name}</strong>
                    <span>{formatNumber(product.touchingCount)}</span>
                    <span>{formatNumber(product.holdingCount)}</span>
                    <span>{formatNumber(product.removedCount)}</span>
                    <span>{formatNumber(product.totalInteractions)}</span>
                  </div>
                ))
              ) : (
                <div className="product-summary-empty">No product rectangles configured yet.</div>
              )}
            </div>
          </section>
        </div>
      </section>

      {isUploadModalOpen ? (
        <div
          className="upload-setup-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-setup-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeUploadModal();
            }
          }}
        >
          <div className="upload-setup-modal__panel">
            <input
              accept="video/*,.mp4,.mov,.avi,.mkv,.webm"
              className="upload-setup-modal__file-input"
              id="stream-upload"
              type="file"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setStreamUploadFile(nextFile);
                setSetupStream(null);
                setSetupOrientation("none");
                setSetupPreviewVersion(0);
                setShelfZoneDraft(normalizeShelfZoneDraft([]));
                setStreamUploadProgress(0);
                setStreamUploadError("");
                setShelfZoneError("");
                setShelfZoneStatus("");
                if (nextFile) {
                  setStreamUploadStatus(`Ready to configure ${nextFile.name}.`);
                }
              }}
            />
            <div className="upload-setup-modal__header">
              <div>
                <p className="eyebrow">Upload Video</p>
                <h2 id="upload-setup-title" className="upload-setup-modal__title">
                  Upload and Configure
                </h2>
                <p className="muted-text">
                  Upload your own shelf video, rotate it if needed, then place the trapezium
                  before starting analysis.
                </p>
              </div>
              <button className="ghost-button" type="button" onClick={closeUploadModal}>
                Close
              </button>
            </div>

            {!setupStream ? (
              <div className="upload-setup-modal__intro">
                <div className="upload-setup-modal__dropzone upload-setup-modal__dropzone--minimal">
                  <div className="upload-setup-modal__section-heading">
                    <span className="viewer-mode-label">Step 1</span>
                    <h3>Choose a shelf video</h3>
                    <p className="muted-text">
                      Upload a video, rotate it if needed, drag the shelf zone, then confirm.
                    </p>
                  </div>

                  <div className="upload-setup-modal__file-picker">
                    <label className="ghost-button upload-setup-modal__file-button" htmlFor="stream-upload">
                      Choose Video
                    </label>
                    <div className="upload-setup-modal__file-summary">
                      {streamUploadFile ? (
                        <>
                          <strong>{streamUploadFile.name}</strong>
                          <span>{formatFileSize(streamUploadFile.size)}</span>
                        </>
                      ) : (
                        <>
                          <strong>No video selected yet</strong>
                          <span>Supported formats: MP4, MOV, AVI, MKV, WEBM</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="upload-setup-modal__actions">
                    <button
                      className="upload-setup-modal__primary-button"
                      disabled={!streamUploadFile || isUploadingStream}
                      type="button"
                      onClick={handleStreamUpload}
                    >
                      {isUploadingStream ? "Uploading..." : "Upload and Continue"}
                    </button>
                  </div>

                  {streamUploadError ? <p className="error-text">{streamUploadError}</p> : null}
                  {!streamUploadError && streamUploadStatus ? (
                    <p className="muted-text">{streamUploadStatus}</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="upload-setup-modal__workspace">
                <div className="upload-setup-modal__preview">
                  <div className="upload-setup-modal__preview-toolbar">
                    <div className="upload-setup-modal__section-heading">
                      <span className="viewer-mode-label">Step 2</span>
                      <h3>Rotate and adjust the shelf zone</h3>
                      <p className="muted-text">
                        Drag the four points until the blue trapezium matches the shelf area.
                      </p>
                    </div>
                    <div className="upload-setup-modal__rotation-row">
                      {STREAM_SETUP_ORIENTATIONS.map((option) => (
                        <button
                          className={`upload-setup-modal__rotation-button ${
                            setupOrientation === option.value ? "is-active" : ""
                          }`}
                          key={option.value}
                          type="button"
                          onClick={() => updateSetupPreviewOrientation(option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    className="viewer-frame viewer-frame--interactive upload-setup-modal__viewer-frame"
                    style={setupViewerAspectStyle}
                  >
                    {setupStream?.stream_id ? (
                      <div className="viewer-scene viewer-scene--setup">
                        <img
                          alt={`${setupStream?.name ?? "Uploaded video"} preview`}
                          className="viewer-image viewer-image--setup"
                          src={`${API_BASE_URL}/camera-streams/${setupStream.stream_id}?preview=${setupPreviewVersion}`}
                        />
                        <ShelfZoneEditor
                          disabled={isSavingShelfZone || isUploadingStream || isUpdatingSetupPreview}
                          points={shelfZoneDraft}
                          onChange={setShelfZoneDraft}
                        />
                        <div className="upload-setup-modal__canvas-guide">
                          <span>2</span>
                          <span>1</span>
                          <span>3</span>
                          <span>4</span>
                        </div>
                      </div>
                    ) : (
                      <div className="viewer-empty">Video preview will appear here.</div>
                    )}
                  </div>

                  <div className="upload-setup-modal__hint-bar">
                    <span>Rotate if needed, then drag each point to the shelf corners.</span>
                    <strong>Analysis starts after you confirm.</strong>
                  </div>
                </div>

                <aside className="upload-setup-modal__sidebar">
                  <div className="upload-setup-modal__summary">
                    <span className="viewer-mode-label">Step 3</span>
                    <div className="list-panel compact-list">
                      <div className="list-row">
                        <span>video</span>
                        <strong>{setupStream?.name ?? "Local preview"}</strong>
                      </div>
                      <div className="list-row">
                        <span>rotation</span>
                        <strong>{setupOrientationLabel}</strong>
                      </div>
                      <div className="list-row">
                        <span>shelf zone</span>
                        <strong>4 draggable points</strong>
                      </div>
                      <div className="list-row">
                        <span>upload progress</span>
                        <strong>{`${Math.round(streamUploadProgress * 100)}%`}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="upload-setup-modal__actions">
                    <button className="ghost-button" type="button" onClick={resetShelfZoneDraft}>
                      Reset Trapezium
                    </button>
                    <label className="ghost-button upload-setup-modal__file-button" htmlFor="stream-upload">
                      Choose Another Video
                    </label>
                    <button
                      className="upload-setup-modal__primary-button"
                      disabled={isSavingShelfZone || isUploadingStream || isUpdatingSetupPreview || !setupStream?.stream_id}
                      type="button"
                      onClick={finalizeUploadedStreamSetup}
                    >
                      {isSavingShelfZone ? "Starting..." : "Confirm and Start Analysis"}
                    </button>
                  </div>

                  {streamUploadError || shelfZoneError || streamUploadStatus || shelfZoneStatus ? (
                    <div className="upload-setup-modal__status-card">
                      {streamUploadError ? <p className="error-text">{streamUploadError}</p> : null}
                      {shelfZoneError ? <p className="error-text">{shelfZoneError}</p> : null}
                      {!streamUploadError && !shelfZoneError && streamUploadStatus ? (
                        <p className="muted-text">{streamUploadStatus}</p>
                      ) : null}
                      {!streamUploadError && !shelfZoneError && shelfZoneStatus ? (
                        <p className="muted-text">{shelfZoneStatus}</p>
                      ) : null}
                    </div>
                  ) : null}
                </aside>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
