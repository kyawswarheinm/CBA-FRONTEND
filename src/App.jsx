import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import exampleShelfImage from "./assets/example1-shelf.png";
import BackgroundSlide from "./BackgroundSlide";
import example1Layout from "./productLayouts/example1Layout";
import example2Layout from "./productLayouts/example2Layout";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const FALLBACK_STREAMS = [
  {
    stream_id: "entrance",
    camera_id: 1,
    name: "Training Video Sample",
    source_type: "file",
    fixed_size: { width: 720, height: 1280 },
    shelf_zone: [],
    is_custom: false,
  },
  {
    stream_id: "aisle-a",
    camera_id: 2,
    name: "Validation Video Sample",
    source_type: "file",
    fixed_size: { width: 720, height: 1280 },
    shelf_zone: [],
    is_custom: false,
  },
  {
    stream_id: "shelf-hand",
    camera_id: 3,
    name: "Test Video Sample",
    source_type: "file",
    fixed_size: { width: 720, height: 1280 },
    shelf_zone: [],
    is_custom: false,
  },
];

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
const SHELF_ZONE_HANDLE_LABELS = [2, 1, 4, 3];
const SHELF_ZONE_REFERENCE_ITEMS = [
  { label: 1, title: "Top right", description: "Place on the top-right corner of the shelf." },
  { label: 2, title: "Top left", description: "Place on the top-left corner of the shelf." },
  { label: 3, title: "Bottom left", description: "Place on the bottom-left corner of the shelf." },
  { label: 4, title: "Bottom right", description: "Place on the bottom-right corner of the shelf." },
];
const HOME_ANNOTATION_ADVANCE_DEFAULT = -0.2;
const ABOUT_INTRO_PARAGRAPHS = [
  {
    tone: "default",
    text:
      "This project combines shelf-level computer vision, a custom trained yolo model, retail data workflows, predictive analytics, and data visualization into one integrated decision system built for modern retail operations.",
  },
  {
    tone: "insight",
    text:
      "Its purpose is to reveal pre-purchase customer intent, connect behavior signals with sales outcomes, and help retail teams act on revenue risks before they appear in transactional reports.",
  },
  {
    tone: "accent",
    text:
      "Instead of asking only what sold, the platform is designed to explain what customers noticed, touched, held, removed, or ignored, then transform those behaviors into measurable demand signals and operational priorities for faster and smarter business decisions.",
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
          "By the time these problems appear clearly in sales reports, revenue opportunities may already be missed. Our system was built to make these hidden pre-purchase behaviors visible, measurable, and actionable so retailers can respond earlier with smarter decisions.",
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
    visual: "stack",
    paragraphs: [
      {
        tone: "default",
        text:
          "The platform operates as an end-to-end retail intelligence pipeline that transforms raw shelf activity into business insight. Shelf-facing camera feeds capture real customer interactions in-store,and then the computer vision layer continuously detects behavior states such as no interaction, touching shelf, holding product, and item removed.",
      },
      {
        tone: "insight",
        text:
          "These raw detections are then passed into backend services where raw data are cleaned, timestamped, structured, and enriched with business context. The system connects behavior signals with transactional sales data and product placement on shelf to create one unified operational dataset (heatmap and KPIs).",
      },
      {
        tone: "accent",
        text:
          "The computer vision not only captures the type of customer interaction, but also records the exact coordinates where the interaction occurs. This enables the system to plot interaction points on the live monitoring screen and the heatmap dashboard. The heatmap can then be overlaid with shelf-product placement information, allowing further analysis of which products were interacted with and how many times each product received customer attention.",
      },
    ],
  },
  {
    title: "03. How We Built and Trained the Model",
    visual: "training",
    paragraphs: [
      {
        tone: "default",
        text:
          "The vision model was trained on a custom behavior-focused dataset collected under realistic retail conditions because large public datasets for shelf interaction behavior are limited. Source footage was manually gathered from 11 videos using shelf-facing viewpoints in store environments.",
      },
      {
        tone: "insight",
        text:
          "The labels included \"No Interaction\", \"Touching Shelf\", \"Holding Product\", and \"Item Removed\". Annotation was completed in CVAT, with 10 videos labeled for model development and 1 video reserved exclusively for final testing. To reduce data leakage caused by highly correlated adjacent frames, the dataset split was performed at the video level rather than at the random image level. During training, the model achieved a validation accuracy of approximately 60%, indicating moderate classification performance on unseen validation data.",
      },
      {
        tone: "accent",
        text:
          "The final dataset consisted of 7 training videos with 9,554 images, 3 validation videos with 3,024 images, and 1 unseen test video. Training was performed using the Ultralytics YOLO pipeline for 50 epochs, and best validation performance was reached around epoch 25 with precision 0.7269, recall 0.5895, mAP@50 0.6091, and mAP@50-95 0.2525.",
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
          "By combining behavior, sales, and inventory records, the system enables predictive KPIs that traditional reporting tools cannot easily provide. The funnel below shows how attention narrows from shelf contact to actual purchase, giving retailers a concrete view of where intent is being lost.",
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
          "The main commercial value of the system is its ability to connect customer behavior directly with operational action. Retail teams can identify products receiving strong attention but weak sales conversion, revealing possible pricing issues, packaging friction, or poor product positioning.",
      },
      {
        tone: "warning",
        text:
          "Managers can detect shelf zones with repeated engagement but low purchase completion, highlighting layout inefficiencies, merchandising opportunities, or stock-related friction before those issues become obvious in transactional reporting.",
      },
      {
        tone: "accent",
        text:
          "The platform can surface demand signals earlier than transaction reports, allowing faster replenishment, better assortment planning, and quicker intervention before revenue loss occurs. Overall, the system shifts store management from reactive reporting toward proactive growth optimization.",
      },
    ],
  },
  {
    title: "06. Contributors",
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
  { traditional: "Detects loss late", system: "Detects risk early" },
  { traditional: "Sales only", system: "Behavior + Sales" },
];
const ABOUT_ARCHITECTURE_LAYERS = [
  "Input Layer",
  "AI Detection Layer",
  "Data Layer",
  "Prediction Layer",
  "Dashboard Layer",
];
const ABOUT_TRAINING_METRICS = [
  { metric: "Source Videos", value: "11" },
  { metric: "Training Videos", value: "7" },
  { metric: "Validation Videos", value: "3" },
  { metric: "Test Videos", value: "1" },
  { metric: "Training Images", value: "9,554" },
  { metric: "Validation Images", value: "3,024" },
  { metric: "Total Images", value: "12,578" },
  { metric: "Classes", value: "4" },
  { metric: "Epochs", value: "50" },
];
const ABOUT_FUNNEL_STEPS = [
  { label: "Touches", value: "1,000", width: 100 },
  { label: "Holds", value: "490", width: 72 },
  { label: "Items Removed", value: "170", width: 42 },
  { label: "Purchases", value: "45", width: 20 },
];
const ABOUT_OPERATIONAL_INPUTS = [
  { label: "Behavior Signals", detail: "touch, hold, remove" },
  { label: "Sales Outcomes", detail: "conversion and revenue" },
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
const ABOUT_PROJECT_GITHUB_URL = "";
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
    x: clamp(Number(point?.x ?? 0), 0, 1),
    y: clamp(Number(point?.y ?? 0), 0, 1),
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

function AboutComparisonVisual() {
  return (
    <div className="landing-about__visual">
      <span className="about-visual__kicker">Before vs after CBA's intelligence comparison</span>
      <div className="about-table-shell">
        <table className="about-table about-table--comparison">
          <thead>
            <tr>
              <th>Traditional POS Only</th>
              <th>Our System</th>
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

function AboutStackVisual() {
  const layerColors = ["#404a5e", "#394558", "#334153", "#2d3c4e", "#28384a"];

  return (
    <div className="landing-about__visual">
      <span className="about-visual__kicker">Stacked layer diagram</span>
      <div className="about-svg-shell">
        <svg
          aria-label="Stacked layer diagram showing the retail intelligence engine"
          className="about-svg about-svg--stack"
          role="img"
          viewBox="0 0 920 430"
        >
          <rect
            fill="#121720"
            fillOpacity="0.46"
            height="408"
            rx="34"
            width="900"
            x="10"
            y="11"
          />
          {ABOUT_ARCHITECTURE_LAYERS.map((layer, index) => {
            const y = 36 + index * 74;
            return (
              <g key={layer}>
                {index < ABOUT_ARCHITECTURE_LAYERS.length - 1 ? (
                  <line
                    stroke="#ffffff"
                    strokeOpacity="0.18"
                    strokeWidth="2"
                    x1="155"
                    x2="155"
                    y1={y + 52}
                    y2={y + 74}
                  />
                ) : null}
                <rect
                  fill={layerColors[index]}
                  fillOpacity="0.94"
                  height="52"
                  rx="26"
                  stroke="#ffffff"
                  strokeOpacity="0.09"
                  width="680"
                  x="120"
                  y={y}
                />
                <circle
                  cx="155"
                  cy={y + 26}
                  fill="#f1884f"
                  fillOpacity="0.22"
                  r="18"
                  stroke="#ffd7b9"
                  strokeOpacity="0.38"
                />
                <text
                  fill="#ffd7b9"
                  fontSize="14"
                  fontWeight="700"
                  textAnchor="middle"
                  x="155"
                  y={y + 31}
                >
                  {`0${index + 1}`}
                </text>
                <text
                  fill="#f7f0e7"
                  fontSize="19"
                  fontWeight="600"
                  x="190"
                  y={y + 33}
                >
                  {layer}
                </text>
              </g>
            );
          })}
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
                <text fill="#ffd7b9" fontSize="13" fontWeight="700" x="78" y={y + 28}>
                  {`0${index + 1}`}
                </text>
                <text fill="#fff5e9" fontSize="18" fontWeight="700" x="78" y={y + 50}>
                  {item.label}
                </text>
                <text fill="#d7dee9" fontSize="13" x="78" y={y + 68}>
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
          <text fill="#ffd7b9" fontSize="13" fontWeight="700" textAnchor="middle" x="460" y="144">
            OPERATIONAL DECISION LAYER
          </text>
          <SvgMultilineText
            fill="#fff5e9"
            fontSize="21"
            fontWeight="700"
            lineHeight={22}
            lines={["Behavior +", "Sales + Inventory"]}
            textAnchor="middle"
            x="460"
            y="172"
          />
          <text fill="#f2e7db" fontSize="12" textAnchor="middle" x="460" y="220">
            conversion gap detection
          </text>
          <text fill="#f2e7db" fontSize="12" textAnchor="middle" x="460" y="238">
            demand and replenishment scoring
          </text>
          <text fill="#f2e7db" fontSize="12" textAnchor="middle" x="460" y="256">
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
                <text fill="#8ff0b6" fontSize="13" fontWeight="700" x="664" y={y + 28}>
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
                <text fill="#d7dee9" fontSize="13" x="664" y={y + 80}>
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
                  <td>kyawswarhein3092004@gmail.com</td>
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
                  <td>Business Analyst</td>
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
          <a
            className="about-contributors__repo-link"
            href={ABOUT_PROJECT_GITHUB_URL}
            rel="noreferrer"
            target="_blank"
          >
            {ABOUT_PROJECT_GITHUB_URL}
          </a>
        ) : (
          <span className="about-contributors__empty">
            Project GitHub link can be added here.
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

function AboutParagraphGroup({ paragraphs, variant = "body" }) {
  return (
    <div className={`landing-about__text-flow landing-about__text-flow--${variant}`}>
      {paragraphs.map((paragraph, index) => (
        <p className="landing-about__paragraph" key={`${paragraph.text.slice(0, 24)}-${index}`}>
          {paragraph.text}
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
      ))}
    </div>
  );
}

function renderAboutVisual(visual) {
  if (visual === "comparison") {
    return <AboutComparisonVisual />;
  }
  if (visual === "stack") {
    return <AboutStackVisual />;
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

function ShelfZoneEditor({ points, disabled, onChange }) {
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
        <polyline className="shelf-zone-editor__outline" points={polygonPath} />
      </svg>

      {normalizedPoints.map((point, index) => (
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
      ))}
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
          y="12"
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
  const [streamUploadStatus, setStreamUploadStatus] = useState("");
  const [streamUploadError, setStreamUploadError] = useState("");
  const [isUploadingStream, setIsUploadingStream] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [setupStream, setSetupStream] = useState(null);
  const [setupOrientation, setSetupOrientation] = useState("none");
  const [isUpdatingSetupPreview, setIsUpdatingSetupPreview] = useState(false);
  const [setupPreviewVersion, setSetupPreviewVersion] = useState(0);
  const [shelfZoneDraft, setShelfZoneDraft] = useState(() => normalizeShelfZoneDraft([]));
  const [shelfZoneStatus, setShelfZoneStatus] = useState("");
  const [shelfZoneError, setShelfZoneError] = useState("");
  const [isSavingShelfZone, setIsSavingShelfZone] = useState(false);
  const [, startPointToggleTransition] = useTransition();
  const boardRef = useRef(null);
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

  async function loadStreams(preferredStreamId = "") {
    try {
      const response = await fetch(`${API_BASE_URL}/camera-streams`);
      if (!response.ok) {
        throw new Error("Could not load camera streams.");
      }

      const payload = await response.json();
      const nextStreams = payload?.streams?.length ? payload.streams : FALLBACK_STREAMS;
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
    if (!onActionPage || !selectedStream?.camera_id || isUploadStreamOptionSelected) {
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
  }, [onActionPage, selectedStream?.camera_id, streams, isUploadStreamOptionSelected]);

  const currentMetric = isUploadStreamOptionSelected
    ? null
    : metricForCamera(metrics, selectedStream?.camera_id);
  const historicalEventPoints = useMemo(
    () => buildHistoricalEventPoints(heatmapData, shelfAnalysis),
    [heatmapData, shelfAnalysis],
  );
  const deferredHistoricalEventPoints = useDeferredValue(historicalEventPoints);
  const activeProductLayout =
    productLayoutMode === "example2"
      ? example2Layout
      : productLayoutMode === "custom"
        ? customProducts
        : example1Layout;
  const productStates = useMemo(
    () => buildProductStates(activeProductLayout, historicalEventPoints),
    [activeProductLayout, historicalEventPoints],
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
      ? `Using ${formatNumber(shelfAnalysis?.history_event_count ?? 0)} stored interaction events from your uploaded video.`
      : "Save the shelf trapezium on your uploaded video first to start generating interaction history."
    : `Using ${formatNumber(shelfAnalysis?.history_event_count ?? 0)} stored interaction events combined from all example videos, with a rolling cap of ${formatNumber(shelfAnalysis?.history_limit ?? 0)} per stream.`;

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
    setStreamUploadError("");
    setStreamUploadStatus("Choose a shelf video to start the setup flow.");
    setSetupStream(null);
    setSetupOrientation("none");
    setSetupPreviewVersion(0);
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

    const formData = new FormData();
    formData.append("file", streamUploadFile);

    setIsUploadingStream(true);
    setStreamUploadError("");
    setStreamUploadStatus("Uploading video to the analysis backend...");

    try {
      const response = await fetch(`${API_BASE_URL}/camera-streams/upload`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.detail || "Could not upload the video.");
      }

      const uploadedStream = payload?.stream;
      setSetupStream(uploadedStream ?? null);
      setSetupOrientation(uploadedStream?.orientation ?? "none");
      setSetupPreviewVersion((current) => current + 1);
      setShelfZoneDraft(normalizeShelfZoneDraft(uploadedStream?.shelf_zone));
      setStreamUploadStatus(
        "Video uploaded. Rotate it if needed, place the shelf trapezium, then start analysis.",
      );
      setStreamUploadFile(null);
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
      return;
    }

    setIsSavingShelfZone(true);
    setShelfZoneError("");
    setShelfZoneStatus("Saving setup and starting analysis...");

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
        throw new Error(payload?.detail || "Could not start analysis for the uploaded stream.");
      }

      const updatedStream = payload?.stream;
      await loadStreams(updatedStream?.stream_id ?? setupStream.stream_id);
      setSelectedStreamId(updatedStream?.stream_id ?? setupStream.stream_id);
      setSelectedViewMode("live");
      setSetupStream(updatedStream ?? null);
      setShelfZoneDraft(normalizeShelfZoneDraft(updatedStream?.shelf_zone));
      setShelfZoneStatus("Setup saved.");
      setStreamUploadStatus("");
      setIsUploadModalOpen(false);
    } catch (error) {
      setShelfZoneError(error.message || "Could not start analysis for the uploaded stream.");
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
          <h1 className="analysis-title">Live monitoring dashboard</h1>
          <p className="muted-text">Backend-rendered stream, live KPIs, and shelf product overlays.</p>
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
            {selectedViewMode === "heatmap" ? (
              <>
                <div className="viewer-card-toolbar">
                  <div>
                    <span className="viewer-mode-label">Heatmap View</span>
                    <p className="muted-text">Filter interaction stages directly inside the heatmap viewer.</p>
                  </div>

                  <div className="viewer-filter-control">
                    <label className="field-label" htmlFor="heatmap-filter">
                      Heatmap filter
                    </label>
                    <select
                      className="control-select"
                      id="heatmap-filter"
                      title={selectedHeatmapFilterLabel}
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
                    {isUploadStreamOptionSelected ? (
                      <div className="viewer-empty">
                        Upload a video and save the shelf trapezium before opening the heatmap.
                      </div>
                    ) : selectedStream?.is_custom && !selectedStreamHasShelfZone ? (
                      <div className="viewer-empty">
                        Save the shelf trapezium in live view before opening the heatmap.
                      </div>
                    ) : (
                      <HeatmapGrid heatmapData={heatmapData} filterMode={heatmapFilter} />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="viewer-frame viewer-frame--interactive" style={liveViewerAspectStyle}>
                  {!isUploadStreamOptionSelected && selectedStream ? (
                    <img
                      alt={`${selectedStream.name} live stream`}
                      className="viewer-image"
                      key={selectedStream.stream_id}
                      src={`${API_BASE_URL}/camera-streams/${selectedStream.stream_id}`}
                    />
                  ) : (
                    <div className="viewer-empty">
                      Upload mode selected. Choose a video above to create your custom stream.
                    </div>
                  )}
                  {selectedStream?.is_custom && !isUploadStreamOptionSelected ? (
                    <ShelfZoneEditor
                      disabled={isSavingShelfZone}
                      points={shelfZoneDraft}
                      onChange={setShelfZoneDraft}
                    />
                  ) : null}
                </div>
                <div className="viewer-footer">
                  <span className="viewer-label">
                    {isUploadStreamOptionSelected
                      ? "Upload Video"
                      : selectedStream?.name ?? "No stream selected"}
                  </span>
                  <p className="muted-text">
                    {isUploadStreamOptionSelected
                      ? "Upload a video to start the custom configuration flow."
                      : requestError || "Video View"}
                  </p>
                </div>
                {selectedStream?.is_custom && !isUploadStreamOptionSelected ? (
                  <div className="custom-stream-panel">
                    <p className="muted-text">
                      Drag the four handles to match your shelf trapezium, then save it to start
                      custom metrics, heatmaps, and product interaction history.
                    </p>
                    <div className="custom-stream-panel__actions">
                      <button className="ghost-button" type="button" onClick={resetShelfZoneDraft}>
                        Reset Trapezium
                      </button>
                      <button
                        className="ghost-button"
                        disabled={isSavingShelfZone}
                        type="button"
                        onClick={saveShelfZone}
                      >
                        {isSavingShelfZone ? "Saving..." : "Save Shelf Zone"}
                      </button>
                    </div>
                    {!selectedStreamHasShelfZone ? (
                      <p className="muted-text">
                        This uploaded stream will stay unscored until the trapezium is saved.
                      </p>
                    ) : null}
                    {shelfZoneError ? <p className="error-text">{shelfZoneError}</p> : null}
                    {!shelfZoneError && shelfZoneStatus ? (
                      <p className="muted-text">{shelfZoneStatus}</p>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
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
              Historical heatmap-event CSV data now drives the product rectangles, colors, and
              rankings below.
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
                eventPoints={deferredHistoricalEventPoints}
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
                <div className="upload-setup-modal__intro-grid">
                  <div className="upload-setup-modal__dropzone">
                    <div className="upload-setup-modal__section-heading">
                      <span className="viewer-mode-label">Step 1</span>
                      <h3>Upload your shelf video</h3>
                      <p className="muted-text">
                        Choose a shelf-facing video first. Nothing will be analyzed until you
                        rotate the preview, place the four shelf points, and confirm the setup.
                      </p>
                    </div>

                    <div className="upload-setup-modal__file-picker">
                      <input
                        accept="video/*,.mp4,.mov,.avi,.mkv,.webm"
                        className="upload-setup-modal__file-input"
                        id="stream-upload"
                        type="file"
                        onChange={(event) => {
                          const nextFile = event.target.files?.[0] ?? null;
                          setStreamUploadFile(nextFile);
                          setStreamUploadError("");
                          if (nextFile) {
                            setStreamUploadStatus(`Ready to upload ${nextFile.name}.`);
                          }
                        }}
                      />
                      <label className="ghost-button upload-setup-modal__file-button" htmlFor="stream-upload">
                        {streamUploadFile ? "Choose Another Video" : "Choose Video"}
                      </label>
                      <div className="upload-setup-modal__file-summary">
                        <strong>{streamUploadFile?.name ?? "No video selected yet"}</strong>
                        <span>
                          {streamUploadFile
                            ? `${formatFileSize(streamUploadFile.size)}${
                                streamUploadFile.type ? ` | ${streamUploadFile.type}` : ""
                              }`
                            : "Supported formats: MP4, MOV, AVI, MKV, WEBM"}
                        </span>
                      </div>
                    </div>

                    <div className="upload-setup-modal__actions upload-setup-modal__actions--intro">
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

                  <aside className="upload-setup-modal__guide-card">
                    <span className="viewer-mode-label">Setup flow</span>
                    <div className="upload-setup-modal__step-flow">
                      <div className="upload-setup-modal__step-item">
                        <span>01</span>
                        <div>
                          <strong>Upload the video</strong>
                          <p>Pick a shelf-facing clip and create a private custom stream.</p>
                        </div>
                      </div>
                      <div className="upload-setup-modal__step-item">
                        <span>02</span>
                        <div>
                          <strong>Rotate the preview</strong>
                          <p>Make sure the shelf looks upright before setting the shelf zone.</p>
                        </div>
                      </div>
                      <div className="upload-setup-modal__step-item">
                        <span>03</span>
                        <div>
                          <strong>Place the four points</strong>
                          <p>Match the point order guide so the shelf trapezium is mapped correctly.</p>
                        </div>
                      </div>
                      <div className="upload-setup-modal__step-item">
                        <span>04</span>
                        <div>
                          <strong>Start analysis</strong>
                          <p>Once saved, the uploaded stream appears in the action view with your setup.</p>
                        </div>
                      </div>
                    </div>

                    <div className="upload-setup-modal__reference-block">
                      <h4>Point order reference</h4>
                      <ShelfZonePointReference />
                    </div>
                  </aside>
                </div>
              </div>
            ) : (
              <div className="upload-setup-modal__workspace">
                <div className="upload-setup-modal__preview">
                  <div className="upload-setup-modal__step-strip">
                    <span className="upload-setup-modal__step-pill is-complete">1. Uploaded</span>
                    <span className="upload-setup-modal__step-pill is-active">2. Rotate</span>
                    <span className="upload-setup-modal__step-pill is-active">3. Mark Shelf</span>
                    <span className="upload-setup-modal__step-pill">4. Start Analysis</span>
                  </div>

                  <div className="upload-setup-modal__preview-toolbar">
                    <div className="upload-setup-modal__section-heading">
                      <span className="viewer-mode-label">Steps 2 and 3</span>
                      <h3>Rotate the video, then fit the shelf trapezium</h3>
                      <p className="muted-text">
                        Use the point order on the right: 1 top right, 2 top left, 3 bottom left,
                        4 bottom right.
                      </p>
                    </div>
                    <div className="upload-setup-modal__rotation-row">
                      {STREAM_SETUP_ORIENTATIONS.map((option) => (
                        <button
                          className={`upload-setup-modal__rotation-button ${
                            setupOrientation === option.value ? "is-active" : ""
                          }`}
                          disabled={isUpdatingSetupPreview}
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
                    <img
                      alt={`${setupStream.name} setup preview`}
                      className="viewer-image"
                      key={`${setupStream.stream_id}-${setupPreviewVersion}`}
                      src={`${API_BASE_URL}/camera-streams/${setupStream.stream_id}?preview=${setupPreviewVersion}`}
                    />
                    <ShelfZoneEditor
                      disabled={isSavingShelfZone || isUpdatingSetupPreview}
                      points={shelfZoneDraft}
                      onChange={setShelfZoneDraft}
                    />
                  </div>

                  <div className="upload-setup-modal__hint-bar">
                    <span>Drag each point until it touches the matching shelf corner.</span>
                    <strong>Analysis starts only after you click Start Analysis.</strong>
                  </div>
                </div>

                <aside className="upload-setup-modal__sidebar">
                  <div className="upload-setup-modal__summary">
                    <span className="viewer-mode-label">Current setup</span>
                    <div className="list-panel compact-list">
                      <div className="list-row">
                        <span>uploaded stream</span>
                        <strong>{setupStream.name}</strong>
                      </div>
                      <div className="list-row">
                        <span>rotation</span>
                        <strong>{setupOrientationLabel}</strong>
                      </div>
                      <div className="list-row">
                        <span>shelf zone</span>
                        <strong>4 draggable points</strong>
                      </div>
                    </div>
                  </div>

                  <div className="upload-setup-modal__guide-card">
                    <span className="viewer-mode-label">Point order reference</span>
                    <ShelfZonePointReference />
                  </div>

                  <div className="upload-setup-modal__actions">
                    <button className="ghost-button" type="button" onClick={resetShelfZoneDraft}>
                      Reset Trapezium
                    </button>
                    <button
                      className="upload-setup-modal__primary-button"
                      disabled={isSavingShelfZone || isUpdatingSetupPreview}
                      type="button"
                      onClick={finalizeUploadedStreamSetup}
                    >
                      {isSavingShelfZone ? "Starting..." : "Start Analysis"}
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
