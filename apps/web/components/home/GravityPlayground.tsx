"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Conceptual teaching visual, deliberately not an experimental NASA record or safety predictor.
 */
export function GravityPlayground() {
  const [gravity, setGravity] = useState<"earth" | "orbit">("earth");
  const [airflow, setAirflow] = useState(30);
  const [predicted, setPredicted] = useState(false);
  const zero = gravity === "orbit";
  const y = Math.round(airflow / 10);
  return (
    <section className="cosmic-playground" aria-labelledby="cosmic-playground-heading" data-guide="playground">
      <div className="cosmic-playground-top">
        <div>
          <p className="cosmic-eyebrow">Interactive discovery // 01</p>
          <h2 className="display" id="cosmic-playground-heading">The flame that forgot which way is up.</h2>
          <p>Change gravity and airflow. Discover the forces behind changing flame shapes in this <strong>conceptual illustration</strong>.</p>
        </div>
        <Link href="/story" className="cosmic-playground-link">Play the full mission <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="cosmic-playground-grid">
        <div className="cosmic-playground-stage" data-gravity={gravity} data-airflow={airflow > 60 ? "high" : "low"} aria-label={zero ? "Conceptual rounded blue flame in zero gravity" : "Conceptual rising orange flame under Earth gravity"}>
          <div className="cosmic-stage-stars" aria-hidden="true" />
          <div className="cosmic-stage-orbit" aria-hidden="true" />
          <div className="cosmic-stage-axis" aria-hidden="true"><span>Y</span><span>0</span></div>
          <div className="cosmic-flame-field" aria-hidden="true">
            <div className="cosmic-flame-halo" />
            <div className="cosmic-flame-core" />
            <div className="cosmic-flame-inner" />
            <div className="cosmic-flame-base" />
            <div className="cosmic-air-vector" />
          </div>
          <div className="cosmic-stage-meta"><span>FIG 01 / EDUCATIONAL MODEL</span><span>{zero ? "MICROGRAVITY" : "EARTH GRAVITY"}</span></div>
          <div className="cosmic-stage-flow">Airflow / {y === 0 ? "still" : y < 4 ? "gentle" : y < 8 ? "moderate" : "strong"}</div>
        </div>
        <div className="cosmic-playground-controls">
          <p className="cosmic-eyebrow">Environment console</p>
          <h3 className="display">Change the conditions</h3>
          <fieldset>
            <legend>Gravity environment</legend>
            <div className="cosmic-gravity-options">
              <button type="button" aria-pressed={!zero} onClick={() => {setGravity("earth");setPredicted(false);}}>🌍 <span>Earth</span><small>1g</small></button>
              <button type="button" aria-pressed={zero} onClick={() => {setGravity("orbit");setPredicted(false);}}>✦ <span>Orbit</span><small>Microgravity</small></button>
            </div>
          </fieldset>
          <label className="cosmic-slider-label" htmlFor="cosmic-airflow">Airflow <output>{airflow}%</output></label>
          <input id="cosmic-airflow" type="range" min="0" max="100" step="10" value={airflow} onChange={(event)=>{setAirflow(Number(event.target.value));setPredicted(false);}}/>
          <div className="cosmic-slider-ends"><span>Still</span><span>Fast</span></div>
          <div className="cosmic-discovery-box" aria-live="polite">
            <strong>{predicted ? "What the physics suggests" : "Your hypothesis"}</strong>
            <p>{predicted ? (zero ? "With weak buoyancy in microgravity, imposed airflow can become especially important. Real outcomes still depend on fuel, oxygen, pressure and geometry." : "On Earth, buoyant hot gases tend to rise, producing an elongated flame. Strong imposed airflow can alter its shape.") : "Will your flame keep pointing upward, or change shape? Make a guess, then reveal the explanation."}</p>
          </div>
          <button type="button" className="cosmic-reveal" onClick={() => setPredicted((value)=>!value)}>{predicted ? "Hide explanation" : "Reveal the science"} <span aria-hidden="true">→</span></button>
          <p className="cosmic-playground-disclaimer">Animation is illustrative, not a NASA measurement, numerical solver, or hazard assessment. <Link href="/sources">Inspect NASA evidence ↗</Link></p>
        </div>
      </div>
    </section>
  );
}
