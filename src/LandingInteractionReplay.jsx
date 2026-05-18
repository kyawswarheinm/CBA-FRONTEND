import { useEffect, useMemo, useRef, useState } from "react";
import "./LandingInteractionReplay.css";

const REPLAY_URL = "/background_replay_events.json";
const EVENT_TRAIL_SECONDS = 0.95;
const MAX_VISIBLE_EVENTS = 48;

function normalizedAge(nowSeconds, eventTimeSeconds, durationSeconds) {
  let age = nowSeconds - eventTimeSeconds;
  if (age < 0) {
    age += durationSeconds;
  }
  return age;
}

export default function LandingInteractionReplay() {
  const [payload, setPayload] = useState(null);
  const [playheadSeconds, setPlayheadSeconds] = useState(0);
  const mountStartedAtRef = useRef(performance.now());

  useEffect(() => {
    let ignore = false;

    async function loadReplay() {
      try {
        const response = await fetch(REPLAY_URL, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Could not load the background replay data.");
        }

        const nextPayload = await response.json();
        if (!ignore) {
          setPayload(nextPayload);
        }
      } catch {
        if (!ignore) {
          setPayload(null);
        }
      }
    }

    loadReplay();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const durationSeconds = Number(payload?.duration_seconds ?? 0);
    if (!durationSeconds) {
      return undefined;
    }

    let frameId = 0;

    function tick(now) {
      const elapsedSeconds = (now - mountStartedAtRef.current) / 1000;
      setPlayheadSeconds(elapsedSeconds % durationSeconds);
      frameId = window.requestAnimationFrame(tick);
    }

    frameId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [payload?.duration_seconds]);

  const visibleEvents = useMemo(() => {
    const durationSeconds = Number(payload?.duration_seconds ?? 0);
    const allEvents = payload?.events ?? [];
    if (!durationSeconds || !allEvents.length) {
      return [];
    }

    return allEvents
      .map((event) => {
        const age = normalizedAge(playheadSeconds, Number(event.time_seconds ?? 0), durationSeconds);
        return { ...event, age };
      })
      .filter((event) => event.age >= 0 && event.age <= EVENT_TRAIL_SECONDS)
      .sort((left, right) => left.age - right.age)
      .slice(-MAX_VISIBLE_EVENTS);
  }, [payload, playheadSeconds]);

  if (!visibleEvents.length) {
    return null;
  }

  return (
    <div className="landing-replay" aria-hidden="true">
      {visibleEvents.map((event) => {
        const freshness = Math.max(0, 1 - event.age / EVENT_TRAIL_SECONDS);
        const scale = 0.88 + freshness * 0.16;

        return (
          <div
            className={`landing-replay__event ${event.interaction_type}`}
            key={event.id}
            style={{
              left: `${Number(event.x ?? 0) * 100}%`,
              top: `${Number(event.y ?? 0) * 100}%`,
              opacity: 0.18 + freshness * 0.82,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
            title={`${event.display_label} at ${Number(event.time_seconds ?? 0).toFixed(2)}s`}
          >
            <span className="landing-replay__event-name">{event.display_label}</span>
          </div>
        );
      })}
    </div>
  );
}
