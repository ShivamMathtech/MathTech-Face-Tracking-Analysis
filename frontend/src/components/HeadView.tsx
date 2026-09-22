import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { engine, useEngine } from "../services/engine";
import { Panel, fmt } from "./Common";
export default function HeadView() {
  const host = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState(true),
    [axes, setAxes] = useState(true),
    [expanded, setExpanded] = useState(false),
    [error, setError] = useState("");
  const reset = useRef(() => {});
  const s = useEngine();
  const selected = engine.selected();
  const t = selected?.status === "tracking" ? selected : undefined;
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setError(
        "WebGL is unavailable. Enable graphics acceleration to view 3D.",
      );
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.05, 4.4);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 2;
    controls.maxDistance = 8;
    reset.current = () => {
      camera.position.set(0, 0.05, 4.4);
      controls.target.set(0, 0, 0);
      controls.update();
    };
    const head = new THREE.Group();
    const geometry = new THREE.SphereGeometry(0.64, 24, 20);
    geometry.scale(1, 1.38, 0.8);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0x397cb5,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      }),
    );
    head.add(mesh);
    const noseGeometry = new THREE.ConeGeometry(0.12, 0.3, 4);
    noseGeometry.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(
      noseGeometry,
      new THREE.MeshBasicMaterial({ color: 0x43a7c7, wireframe: true }),
    );
    nose.position.set(0, 0, 0.58);
    head.add(nose);
    scene.add(head);
    const axis = new THREE.AxesHelper(1.4);
    axis.visible = axes;
    scene.add(axis);
    const floor = new THREE.GridHelper(4, 16, 0x2b5575, 0x132c40);
    floor.position.y = -1.2;
    floor.visible = grid;
    scene.add(floor);
    let raf = 0;
    const size = () => {
      const w = container.clientWidth,
        h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(size);
    observer.observe(container);
    size();
    const render = () => {
      raf = requestAnimationFrame(render);
      const target = engine.selected();
      if (target?.status === "tracking") {
        const p = target.pose;
        head.rotation.set(
          (p.pitch * Math.PI) / 180,
          (p.yaw * Math.PI) / 180,
          (p.roll * Math.PI) / 180,
        );
        head.position.set(
          (target.center.x / engine.state.width - 0.5) * 0.5,
          -(target.center.y / engine.state.height - 0.5) * 0.5,
          0,
        );
        mesh.material.opacity = 0.65;
      } else mesh.material.opacity = 0.2;
      controls.update();
      renderer.render(scene, camera);
    };
    render();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      controls.dispose();
      geometry.dispose();
      noseGeometry.dispose();
      mesh.material.dispose();
      (nose.material as THREE.Material).dispose();
      axis.geometry.dispose();
      (axis.material as THREE.Material).dispose();
      floor.geometry.dispose();
      if (Array.isArray(floor.material))
        floor.material.forEach((m) => m.dispose());
      else floor.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [grid, axes, expanded]);
  return (
    <Panel
      title="Face Tracking View"
      className={expanded ? "head-panel expanded" : "head-panel"}
      action={<span className="micro">3D · ESTIMATE</span>}
    >
      <div className="head-content">
        <div className="head-stage">
          <div className="head-render" ref={host} />
          {error && <p>{error}</p>}
          <div className="axis-key">
            <span>X Right</span>
            <span>Y Up</span>
            <span>Z Forward</span>
          </div>
        </div>
        <div className="head-info">
          <small>Face Center</small>
          <p>{t ? `${fmt(t.center.x, 0)}, ${fmt(t.center.y, 0)}` : "—"}</p>
          <small>Relative depth</small>
          <p>
            {fmt(t?.sample.depth, 3)} <em>ratio</em>
          </p>
          <small>Orientation estimate</small>
          <p>
            Yaw: {fmt(t?.pose.yaw)}°<br />
            Pitch: {fmt(t?.pose.pitch)}°<br />
            Roll: {fmt(t?.pose.roll)}°
          </p>
          <small>Speed</small>
          <p>{fmt(t?.sample.velocity)} px/s</p>
          <button className="primary" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Close 3D View" : "View 3D Model"}
          </button>
        </div>
      </div>
      <div className="head-tools">
        <button onClick={() => reset.current()}>Reset view</button>
        <label>
          <input
            type="checkbox"
            checked={grid}
            onChange={(e) => setGrid(e.target.checked)}
          />{" "}
          Grid
        </label>
        <label>
          <input
            type="checkbox"
            checked={axes}
            onChange={(e) => setAxes(e.target.checked)}
          />{" "}
          Axes
        </label>
        <span>Drag to rotate · scroll to zoom</span>
      </div>
      <span className="sr-only">{s.revision}</span>
    </Panel>
  );
}
