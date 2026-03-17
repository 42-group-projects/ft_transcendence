"use client";
 
import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
interface EnemyData {
  id: number;
  position: [number, number, number];
}
 
// ─── Platform ─────────────────────────────────────────────────────────────────
 
function Platform() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[5, 0.25, 5]} position={[0, -0.25, 0]} />
      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[10, 0.5, 10]} />
        <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Edge glow strips */}
      {[
        [0, 0.26, 5] as [number, number, number],
        [0, 0.26, -5] as [number, number, number],
        [5, 0.26, 0] as [number, number, number],
        [-5, 0.26, 0] as [number, number, number],
      ].map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry
            args={i < 2 ? [10, 0.02, 0.08] : [0.08, 0.02, 10]}
          />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={2}
          />
        </mesh>
      ))}
    </RigidBody>
  );
}
 
// ─── Player Ball ──────────────────────────────────────────────────────────────
 
function PlayerBall({ onFall }: { onFall: () => void }) {
  const rb = useRef<any>(null);
  const keys = useRef<Record<string, boolean>>({});
  const hasFallen = useRef(false);
 
  useEffect(() => {
    const down = (e: KeyboardEvent) => (keys.current[e.key] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.key] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
 
  useFrame(() => {
    if (!rb.current || hasFallen.current) return;
 
    const pos = rb.current.translation();
 
    // Detect fall
    if (pos.y < -3) {
      hasFallen.current = true;
      onFall();
      return;
    }
 
    const force = { x: 0, y: 0, z: 0 };
    const strength = 6;
 
    if (keys.current["ArrowUp"] || keys.current["w"] || keys.current["W"])
      force.z -= strength;
    if (keys.current["ArrowDown"] || keys.current["s"] || keys.current["S"])
      force.z += strength;
    if (keys.current["ArrowLeft"] || keys.current["a"] || keys.current["A"])
      force.x -= strength;
    if (keys.current["ArrowRight"] || keys.current["d"] || keys.current["D"])
      force.x += strength;
 
    rb.current.applyImpulse(force, true);
 
    // Cap velocity
    const vel = rb.current.linvel();
    const maxSpeed = 8;
    if (Math.abs(vel.x) > maxSpeed) rb.current.setLinvel({ ...vel, x: Math.sign(vel.x) * maxSpeed }, true);
    if (Math.abs(vel.z) > maxSpeed) rb.current.setLinvel({ ...vel, z: Math.sign(vel.z) * maxSpeed }, true);
  });
 
  return (
    <RigidBody
      ref={rb}
      colliders="ball"
      position={[0, 1, 0]}
      restitution={0.3}
      friction={0.8}
      linearDamping={1.5}
    >
      <mesh castShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#f97316"
          roughness={0.2}
          metalness={0.5}
          emissive="#f97316"
          emissiveIntensity={0.15}
        />
      </mesh>
    </RigidBody>
  );
}
 
// ─── Enemy Ball ───────────────────────────────────────────────────────────────
 
function EnemyBall({
  id,
  position,
  onFall,
}: {
  id: number;
  position: [number, number, number];
  onFall: (id: number) => void;
}) {
  const rb = useRef<any>(null);
  const hasFallen = useRef(false);
  const timer = useRef(Math.random() * 2);
 
  useFrame((_, delta) => {
    if (!rb.current || hasFallen.current) return;
 
    const pos = rb.current.translation();
    if (pos.y < -3) {
      hasFallen.current = true;
      onFall(id);
      return;
    }
 
    // Simple wandering AI
    timer.current -= delta;
    if (timer.current <= 0) {
      timer.current = 1 + Math.random() * 2;
      const angle = Math.random() * Math.PI * 2;
      const strength = 3 + Math.random() * 3;
      rb.current.applyImpulse(
        { x: Math.cos(angle) * strength, y: 0, z: Math.sin(angle) * strength },
        true
      );
    }
  });
 
  return (
    <RigidBody
      ref={rb}
      colliders="ball"
      position={position}
      restitution={0.4}
      friction={0.6}
      linearDamping={1.2}
    >
      <mesh castShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#e879f9"
          roughness={0.3}
          metalness={0.4}
          emissive="#a21caf"
          emissiveIntensity={0.2}
        />
      </mesh>
    </RigidBody>
  );
}
 
// ─── Scene ────────────────────────────────────────────────────────────────────
 
function Scene({
  enemies,
  onPlayerFall,
  onEnemyFall,
}: {
  enemies: EnemyData[];
  onPlayerFall: () => void;
  onEnemyFall: (id: number) => void;
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 12, 14]} fov={50} />
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.4}
        minDistance={10}
        maxDistance={22}
      />
 
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        castShadow
        position={[8, 16, 8]}
        intensity={1.5}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <pointLight position={[0, 6, 0]} intensity={0.6} color="#38bdf8" />
 
      {/* Sky gradient fog */}
      <fog attach="fog" args={["#0f172a", 20, 60]} />
 
      <Physics gravity={[0, -18, 0]}>
        <Platform />
        <PlayerBall onFall={onPlayerFall} />
        {enemies.map((e) => (
          <EnemyBall
            key={e.id}
            id={e.id}
            position={e.position}
            onFall={onEnemyFall}
          />
        ))}
      </Physics>
    </>
  );
}
 
// ─── HUD ──────────────────────────────────────────────────────────────────────
 
function HUD({
  score,
  status,
  onRestart,
}: {
  score: number;
  status: "playing" | "dead" | "win";
  onRestart: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "'Courier New', monospace",
      }}
    >
      {/* Score */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          color: "#38bdf8",
          fontSize: 13,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        <div style={{ opacity: 0.5, marginBottom: 2 }}>knocked off</div>
        <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
          {score}
        </div>
      </div>
 
      {/* Controls hint */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(148,163,184,0.6)",
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        WASD / Arrow keys to move
      </div>
 
      {/* Game over / win overlay */}
      {status !== "playing" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            pointerEvents: "all",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: status === "dead" ? "#f87171" : "#4ade80",
            }}
          >
            {status === "dead" ? "YOU FELL" : "YOU WIN"}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(148,163,184,0.7)",
              letterSpacing: "0.15em",
            }}
          >
            {status === "dead"
              ? "watch the edges next time"
              : `knocked off all ${score} enemies`}
          </div>
          <button
            onClick={onRestart}
            style={{
              marginTop: 12,
              padding: "12px 32px",
              background: "transparent",
              border: "1px solid #38bdf8",
              color: "#38bdf8",
              fontSize: 13,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
 
// ─── Initial enemies ──────────────────────────────────────────────────────────
 
function makeEnemies(): EnemyData[] {
  return [
    { id: 1, position: [-3, 1, -3] },
    { id: 2, position: [3, 1, -3] },
    { id: 3, position: [-3, 1, 3] },
    { id: 4, position: [3, 1, 3] },
    { id: 5, position: [0, 1, -4] },
  ];
}
 
// ─── Page ─────────────────────────────────────────────────────────────────────
 
export default function GamePage() {
  const [enemies, setEnemies] = useState<EnemyData[]>(makeEnemies);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<"playing" | "dead" | "win">("playing");
  const [key, setKey] = useState(0); // force full remount on restart
 
  const handlePlayerFall = () => {
    if (status === "playing") setStatus("dead");
  };
 
  const handleEnemyFall = (id: number) => {
    setEnemies((prev) => {
      const next = prev.filter((e) => e.id !== id);
      const newScore = score + 1;
      setScore(newScore);
      if (next.length === 0) setStatus("win");
      return next;
    });
  };
 
  const handleRestart = () => {
    setEnemies(makeEnemies());
    setScore(0);
    setStatus("playing");
    setKey((k) => k + 1);
  };
 
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0f172a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Canvas
        key={key}
        shadows
        style={{ position: "absolute", inset: 0 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0f172a"]} />
        <Scene
          enemies={enemies}
          onPlayerFall={handlePlayerFall}
          onEnemyFall={handleEnemyFall}
        />
      </Canvas>
 
      <HUD score={score} status={status} onRestart={handleRestart} />
    </div>
  );
}