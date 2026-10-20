/* Three.js objects are mutable by design: R3F mutates them inside useFrame and
   effects, outside React's render. The compiler's immutability rule doesn't
   apply to them. */
/* eslint-disable react-hooks/immutability */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { journey, poseAt } from "../../lib/journey";
import type { Pose } from "../../lib/journey";

const INK = new THREE.Color("#282b4a");
const PAPER = new THREE.Color("#eeebda");

/* Plate footprint (x by z) and thickness. */
const W = 3.2;
const D = 2.2;
const H = 0.12;

export type Quality = "high" | "lite";

/**
 * The shared environment: four layer plates (interface, APIs, data,
 * infrastructure) at the core, framed by rotating square portals and a ring
 * of columns over a reflective floor. Everything is posed from scroll by
 * `poseAt()`; frames render on demand only while something is moving.
 */
export default function JourneyScene({ quality, still }: { quality: Quality; still: boolean }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={quality === "high" ? [1, 1.75] : [1, 1.25]}
      gl={{ antialias: quality === "high", powerPreference: "high-performance", alpha: false }}
      camera={{ fov: 36, near: 0.1, far: 120, position: [0, 4, 21] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <color attach="background" args={[INK]} />
      <fog attach="fog" args={[INK, 14, 46]} />
      <Environment />
      <ambientLight intensity={0.35} color={PAPER} />
      <directionalLight position={[6, 9, 7]} intensity={1.5} color={PAPER} />
      <directionalLight position={[-8, 3, -6]} intensity={0.6} color={PAPER} />
      <Rig still={still} />
      <Core />
      <Portals />
      <Columns count={quality === "high" ? 28 : 14} />
      <Floor />
    </Canvas>
  );
}

/* Neutral studio reflections for the metal surfaces, generated once. */
function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const tex = pmrem.fromScene(room, 0.04).texture;
    scene.environment = tex;
    scene.environmentIntensity = 0.45;
    return () => {
      scene.environment = null;
      tex.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/* ---------- camera ---------- */

const INTRO_MS = 2200;

function Rig({ still }: { still: boolean }) {
  const { camera, invalidate } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  const pointer = useRef({ x: 0, y: 0 });
  const born = useRef(0);

  useEffect(() => {
    journey.invalidate = invalidate;
    born.current = performance.now();
    invalidate();
    return () => {
      journey.invalidate = () => {};
    };
  }, [invalidate]);

  useFrame(() => {
    const p = poseAt(journey.y);
    // intro: drift in from further back once, on load
    const t = still ? 1 : Math.min(1, (performance.now() - born.current) / INTRO_MS);
    const intro = 1 - Math.pow(1 - t, 3);

    // pointer parallax, damped
    const px = pointer.current;
    px.x += (journey.pointer.x - px.x) * 0.06;
    px.y += (journey.pointer.y - px.y) * 0.06;

    camera.position.set(p.cx + px.x * 0.6, p.cy - px.y * 0.35 + (1 - intro) * 2, p.cz + (1 - intro) * 7);
    look.set(p.tx + px.x * 0.15, p.ty, p.tz);
    camera.lookAt(look);

    const settling = Math.abs(journey.pointer.x - px.x) + Math.abs(journey.pointer.y - px.y) > 0.001;
    if (t < 1 || settling) invalidate();
  });
  return null;
}

/* ---------- the core: four layer plates ---------- */

const rect = (x0: number, z0: number, x1: number, z1: number) => [
  x0, 0, z0, x1, 0, z0, x1, 0, z0, x1, 0, z1, x1, 0, z1, x0, 0, z1, x0, 0, z1, x0, 0, z0,
];
const seg = (x0: number, z0: number, x1: number, z1: number) => [x0, 0, z0, x1, 0, z1];

/** Line drawings on each plate's top face: what each layer is. */
const GLYPHS: number[][] = [
  // interface: a window with sidebar and cards
  [...rect(-1.35, -0.9, 1.35, 0.9), ...seg(-1.35, -0.6, 1.35, -0.6), ...rect(-1.2, -0.45, -0.55, 0.75), ...rect(-0.4, -0.45, 0.4, 0.1), ...rect(0.55, -0.45, 1.2, 0.1), ...rect(-0.4, 0.25, 1.2, 0.75)],
  // APIs: services joined by routes
  [...rect(-1.2, -0.35, -0.5, 0.35), ...rect(-0.35, -0.75, 0.35, -0.15), ...rect(-0.35, 0.15, 0.35, 0.75), ...rect(0.5, -0.35, 1.2, 0.35), ...seg(-0.5, 0, -0.35, -0.45), ...seg(-0.5, 0, -0.35, 0.45), ...seg(0.35, -0.45, 0.5, 0), ...seg(0.35, 0.45, 0.5, 0)],
  // data: tables
  [...rect(-1.35, -0.85, 1.35, 0.85), ...seg(-1.35, -0.45, 1.35, -0.45), ...seg(-1.35, -0.05, 1.35, -0.05), ...seg(-1.35, 0.35, 1.35, 0.35), ...seg(-0.45, -0.85, -0.45, 0.85), ...seg(0.45, -0.85, 0.45, 0.85)],
  // infrastructure: racks of servers
  [...rect(-1.3, -0.8, -0.5, 0.8), ...rect(-0.4, -0.8, 0.4, 0.8), ...rect(0.5, -0.8, 1.3, 0.8), ...seg(-1.3, -0.25, 1.3, -0.25), ...seg(-1.3, 0.25, 1.3, 0.25)],
];

function roundedPlate() {
  const r = 0.28;
  const s = new THREE.Shape();
  const x = -W / 2;
  const y = -D / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + W - r, y);
  s.quadraticCurveTo(x + W, y, x + W, y + r);
  s.lineTo(x + W, y + D - r);
  s.quadraticCurveTo(x + W, y + D, x + W - r, y + D);
  s.lineTo(x + r, y + D);
  s.quadraticCurveTo(x, y + D, x, y + D - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: H, bevelEnabled: false, curveSegments: 6 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -H / 2, 0);
  return g;
}

/** Where plate i sits in each layout, blended by the pose's weights. */
function placePlate(i: number, p: Pose, o: THREE.Object3D) {
  const sum = p.stack + p.grid + p.line + p.corridor || 1;
  const ws = p.stack / sum;
  const wg = p.grid / sum;
  const wl = p.line / sum;
  const wc = p.corridor / sum;
  const k = 1.5 - i; // +1.5 top … −1.5 bottom

  // stack: layered, separating with `explode`
  const sy = k * (0.42 + p.explode * 0.95);
  // grid: four modules standing up, facing the camera
  const gx = i % 2 ? 1.85 : -1.85;
  const gy = i < 2 ? 1.3 : -1.3;
  // line: a row of stages
  const lx = (i - 1.5) * 3.9;
  // corridor: alternating either side of the camera's path
  const cx = i % 2 ? 2.7 : -2.7;
  const cz = -i * 5.5 - 2;

  o.position.set(gx * wg + lx * wl + cx * wc, sy * ws + gy * wg, cz * wc);
  o.rotation.set((Math.PI / 2) * (wg + wc * 0.92) + 0.35 * wl, (i % 2 ? -0.42 : 0.42) * wc, 0);
}

function Core() {
  const group = useRef<THREE.Group>(null);
  const plates = useRef<(THREE.Group | null)[]>([]);
  const links = useRef<THREE.LineSegments>(null);

  const { geo, edges, glyphs, mats, linkGeo } = useMemo(() => {
    const geo = roundedPlate();
    const edges = new THREE.EdgesGeometry(geo, 30);
    const glyphs = GLYPHS.map((pts) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      g.translate(0, H / 2 + 0.004, 0);
      return g;
    });
    const mats = [0, 1, 2, 3].map(() => ({
      body: new THREE.MeshPhysicalMaterial({
        color: INK,
        metalness: 0.65,
        roughness: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        emissive: PAPER,
        emissiveIntensity: 0,
        transparent: true,
      }),
      line: new THREE.LineBasicMaterial({ color: PAPER, transparent: true }),
    }));
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(6 * 2 * 3), 3));
    return { geo, edges, glyphs, mats, linkGeo };
  }, []);

  useEffect(
    () => () => {
      geo.dispose();
      edges.dispose();
      glyphs.forEach((g) => g.dispose());
      mats.forEach((m) => {
        m.body.dispose();
        m.line.dispose();
      });
      linkGeo.dispose();
    },
    [geo, edges, glyphs, mats, linkGeo],
  );

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const linkMat = useMemo(() => new THREE.LineBasicMaterial({ color: PAPER, transparent: true, opacity: 0 }), []);
  useEffect(() => () => linkMat.dispose(), [linkMat]);

  useFrame(() => {
    const p = poseAt(journey.y);
    const g = group.current;
    if (!g) return;
    g.rotation.y = p.spin * (p.stack / (p.stack + p.grid + p.line + p.corridor || 1));

    const pos = linkGeo.getAttribute("position") as THREE.BufferAttribute;
    const centres: THREE.Vector3[] = [];
    plates.current.forEach((o, i) => {
      if (!o) return;
      placePlate(i, p, o);
      const on = journey.highlight === i;
      const m = mats[i];
      m.body.opacity = p.presence * 0.92;
      m.body.emissiveIntensity = on ? 0.16 : 0;
      m.line.opacity = p.presence * (on ? 1 : 0.55);
    });
    g.updateMatrixWorld(true);
    plates.current.forEach((o) => o && centres.push(o.getWorldPosition(tmp).clone()));

    // the six connections between the four layers
    let n = 0;
    for (let a = 0; a < centres.length; a++)
      for (let b = a + 1; b < centres.length; b++) {
        pos.setXYZ(n++, centres[a].x, centres[a].y, centres[a].z);
        pos.setXYZ(n++, centres[b].x, centres[b].y, centres[b].z);
      }
    pos.needsUpdate = true;
    linkMat.opacity = p.links * p.presence * 0.4;
    if (links.current) links.current.visible = p.links > 0.01;
  });

  return (
    <>
      <group ref={group}>
        {mats.map((m, i) => (
          <group
            key={i}
            ref={(el) => {
              plates.current[i] = el;
            }}
          >
            <mesh geometry={geo} material={m.body} />
            <lineSegments geometry={edges} material={m.line} />
            <lineSegments geometry={glyphs[i]} material={m.line} />
          </group>
        ))}
      </group>
      <lineSegments ref={links} geometry={linkGeo} material={linkMat} frustumCulled={false} />
    </>
  );
}

/* ---------- surroundings ---------- */

/** Square portals (a torus with four segments) around the core, turned by scroll at different rates. */
function Portals() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const sizes = [4.6, 6.2, 8.2];
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: PAPER, metalness: 0.9, roughness: 0.3, transparent: true }), []);
  useEffect(() => () => mat.dispose(), [mat]);

  useFrame(() => {
    const p = poseAt(journey.y);
    const s = journey.y * 0.00022;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.set(Math.PI / 2 + Math.sin(s + i) * 0.25, s * (i % 2 ? -1 : 1) * (1 + i * 0.4), 0);
    });
    mat.opacity = p.portals * 0.45;
    refs.current.forEach((m) => m && (m.visible = mat.opacity > 0.01));
  });

  return (
    <group position={[0, -0.2, 0]}>
      {sizes.map((r, i) => (
        <mesh
          key={r}
          ref={(el) => {
            refs.current[i] = el;
          }}
          material={mat}
        >
          <torusGeometry args={[r, 0.022, 4, 4]} />
        </mesh>
      ))}
    </group>
  );
}

/** A ring of tall columns: the architecture the camera moves within. */
function Columns({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    // a ring wide enough that the camera's path never comes near a column,
    // leaving a gap in front of the opening shot
    let n = 0;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 27 + (i % 3) * 3;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r - 8;
      if (z > 4 && Math.abs(x) < 16) continue;
      const h = 9 + (i % 4) * 3;
      o.position.set(x, -3.2 + h / 2, z);
      o.scale.set(1, h, 1);
      o.updateMatrix();
      m.setMatrixAt(n++, o.matrix);
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.35, 1, 0.35]} />
      <meshStandardMaterial color={INK} metalness={0.8} roughness={0.25} emissive={PAPER} emissiveIntensity={0.05} />
    </instancedMesh>
  );
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.2, -6]}>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial color={INK} metalness={0.85} roughness={0.32} />
    </mesh>
  );
}
