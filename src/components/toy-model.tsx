"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { useEffect, useRef, useState, useMemo, Suspense } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { type Design, defaultDesign } from "@/lib/design";
import { ToyPortrait } from "./toy-portrait";
function Orb({
  position = [0, 0, 0],
  scale = [1, 1, 1],
  color,
  roughness = 0.4,
  metalness = 0,
}: {
  position?: [number, number, number];
  scale?: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <sphereGeometry args={[1, 40, 32]} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
      />
    </mesh>
  );
}
function Ring({
  position,
  scale = [1, 1, 1],
  color,
  radius = 0.14,
  rotation = [0, 0, 0],
  arc = Math.PI * 2,
}: {
  position: [number, number, number];
  scale?: [number, number, number];
  color: string;
  radius?: number;
  rotation?: [number, number, number];
  arc?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <torusGeometry args={[radius, 0.025, 10, 36, arc]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
function StarEye({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5,
        r = i % 2 ? 0.055 : 0.13;
      const x = Math.cos(a) * r,
        y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  }, []);
  return (
    <mesh position={position}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  );
}
export function ToyModel({
  config = defaultDesign,
  idle = true,
  ...props
}: {
  config?: Design;
  idle?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const c = config,
    r = c.finish === "gloss" ? 0.12 : c.finish === "matte" ? 0.9 : 0.38;
  useFrame(({ clock }) => {
    if (group.current && idle) {
      group.current.position.y =
        (props.position?.[1] ?? 0) + Math.sin(clock.elapsedTime * 1.2) * 0.035;
      group.current.rotation.z = Math.sin(clock.elapsedTime * 0.7) * 0.025;
    }
  });
  const bodyScale: [number, number, number] =
    c.bodyShape === "round"
      ? [0.72, 0.73, 0.57]
      : c.bodyShape === "bean"
        ? [0.55, 0.92, 0.5]
        : [0.68, 0.85, 0.56];
  return (
    <group ref={group} {...props}>
      <Orb
        position={[0, 1.1, 0]}
        scale={bodyScale}
        color={c.primaryColor}
        roughness={r}
      />
      <Orb
        position={[0, 2.03, 0]}
        scale={[0.93, 0.81, 0.68]}
        color={c.primaryColor}
        roughness={r}
      />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Orb
            position={[s * 0.44, 0.35, 0.15]}
            scale={[0.29, 0.26, 0.4]}
            color={c.primaryColor}
            roughness={r}
          />
          <group position={[s * 0.68, 1.12, 0]} rotation={[0, 0, s * 0.28]}>
            <Orb
              scale={[0.23, 0.49, 0.26]}
              color={c.primaryColor}
              roughness={r}
            />
          </group>
          {c.ears !== "none" && (
            <group
              position={[s * 0.56, 2.66, -0.06]}
              rotation={[0, 0, s * -0.16]}
            >
              <Orb
                scale={
                  c.ears === "long" ? [0.23, 0.68, 0.22] : [0.3, 0.33, 0.23]
                }
                color={c.primaryColor}
                roughness={r}
              />
              <Orb
                position={[0, 0.035, 0.17]}
                scale={
                  c.ears === "long" ? [0.125, 0.45, 0.055] : [0.17, 0.19, 0.06]
                }
                color={c.secondaryColor}
              />
            </group>
          )}
          {c.horns === "tiny" && (
            <mesh
              position={[s * 0.63, 2.69, 0.26]}
              rotation={[0, 0, s * -0.3]}
              castShadow
            >
              <coneGeometry args={[0.13, 0.3, 24]} />
              <meshStandardMaterial color={c.secondaryColor} />
            </mesh>
          )}
          {c.horns === "curved" && (
            <mesh
              position={[s * 0.65, 2.72, 0.16]}
              rotation={[0, 0, s === 1 ? -0.6 : Math.PI - 0.6]}
              castShadow
            >
              <torusGeometry args={[0.2, 0.075, 12, 24, Math.PI * 1.15]} />
              <meshStandardMaterial color={c.secondaryColor} />
            </mesh>
          )}
          {c.eyeStyle === "star" ? (
            <StarEye position={[s * 0.34, 2.08, 0.675]} color={c.eyeColor} />
          ) : c.eyeStyle === "round" ? (
            <>
              <Orb
                position={[s * 0.34, 2.08, 0.633]}
                scale={[0.082, 0.115, 0.045]}
                color={c.eyeColor}
              />
              <Orb
                position={[s * 0.34 - 0.024, 2.115, 0.679]}
                scale={[0.022, 0.027, 0.012]}
                color="#FFFFFF"
              />
            </>
          ) : (
            <Ring
              position={[s * 0.34, 2.07, 0.647]}
              radius={0.115}
              scale={[1, 0.55, 1]}
              rotation={[0, 0, c.eyeStyle === "sleepy" ? Math.PI : 0]}
              arc={Math.PI}
              color={c.eyeColor}
            />
          )}
          {c.eyebrows && (
            <Orb
              position={[s * 0.34, 2.29, 0.62]}
              scale={[0.115, 0.025, 0.028]}
              color={c.eyeColor}
            />
          )}
          <Orb
            position={[s * 0.57, 1.91, 0.567]}
            scale={[0.125, 0.065, 0.015]}
            color="#ECA6AC"
          />
        </group>
      ))}
      {c.mouthStyle === "smile" ? (
        <Ring
          position={[0, 1.91, 0.679]}
          radius={0.09}
          arc={Math.PI}
          rotation={[0, 0, Math.PI]}
          color={c.eyeColor}
        />
      ) : c.mouthStyle === "surprised" ? (
        <Orb
          position={[0, 1.9, 0.68]}
          scale={[0.06, 0.08, 0.02]}
          color={c.eyeColor}
        />
      ) : (
        <Orb
          position={[0, 1.91, 0.68]}
          scale={[0.046, 0.028, 0.015]}
          color={c.eyeColor}
        />
      )}
      {c.pattern === "belly" && (
        <Orb
          position={[0, 1.03, 0.475]}
          scale={[0.39, 0.44, 0.11]}
          color={c.secondaryColor}
          roughness={r}
        />
      )}
      {c.pattern === "spots" &&
        [
          [-0.3, 1.3, 0.49],
          [0.22, 1.05, 0.54],
          [-0.18, 0.75, 0.48],
        ].map((p, i) => (
          <Orb
            key={i}
            position={p as [number, number, number]}
            scale={[0.1, 0.11, 0.025]}
            color={c.secondaryColor}
          />
        ))}
      {c.tail !== "none" && (
        <Orb
          position={[0, 0.86, -0.62]}
          scale={c.tail === "puff" ? [0.32, 0.32, 0.32] : [0.19, 0.22, 0.7]}
          color={c.secondaryColor}
        />
      )}
      {c.accessory === "glasses" && (
        <group>
          <Ring position={[-0.34, 2.08, 0.73]} radius={0.23} color="#493A41" />
          <Ring position={[0.34, 2.08, 0.73]} radius={0.23} color="#493A41" />
          <Orb
            position={[0, 2.1, 0.73]}
            scale={[0.13, 0.024, 0.025]}
            color="#493A41"
          />
        </group>
      )}
      {c.accessory === "moon-necklace" && (
        <>
          <Ring
            position={[0, 1.53, 0.08]}
            rotation={[Math.PI / 2, 0, 0]}
            radius={0.54}
            color="#D2A854"
          />
          <mesh position={[0, 1.32, 0.58]} rotation={[0, 0, -0.5]}>
            <torusGeometry args={[0.12, 0.045, 12, 32, Math.PI * 1.5]} />
            <meshStandardMaterial
              color="#F0CB76"
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        </>
      )}
      {c.accessory === "scarf" && (
        <>
          <Ring
            position={[0, 1.52, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            radius={0.57}
            scale={[1, 1, 4]}
            color={c.secondaryColor}
          />
          <Orb
            position={[0.3, 1.19, 0.56]}
            scale={[0.14, 0.38, 0.07]}
            color={c.secondaryColor}
          />
        </>
      )}
      {c.accessory === "hat" && (
        <group position={[0, 2.68, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.66, 0.69, 0.09, 40]} />
            <meshStandardMaterial color={c.secondaryColor} />
          </mesh>
          <Orb
            position={[0, 0.17, 0]}
            scale={[0.43, 0.32, 0.43]}
            color={c.secondaryColor}
          />
        </group>
      )}
      {c.accessory === "helmet" && (
        <mesh position={[0, 2.09, 0]}>
          <sphereGeometry args={[1.12, 40, 32]} />
          <meshPhysicalMaterial
            color="#D9F3FF"
            transparent
            opacity={0.2}
            roughness={0.08}
            metalness={0.1}
            depthWrite={false}
          />
        </mesh>
      )}
      {c.accessory === "backpack" && (
        <Orb
          position={[0, 1.25, -0.56]}
          scale={[0.48, 0.55, 0.26]}
          color={c.secondaryColor}
        />
      )}
      {c.accessory === "wings" &&
        [-1, 1].map((s) => (
          <group
            key={s}
            rotation={[0, 0, s * -0.3]}
            position={[s * 0.63, 1.38, -0.3]}
          >
            <Orb scale={[0.52, 0.7, 0.12]} color={c.secondaryColor} />
          </group>
        ))}
      {c.accessory === "flower" && (
        <group position={[0.79, 0.9, 0.36]}>
          <mesh>
            <cylinderGeometry args={[0.025, 0.025, 0.65, 12]} />
            <meshStandardMaterial color="#6B9472" />
          </mesh>
          {Array.from({ length: 5 }, (_, i) => (
            <Orb
              key={i}
              position={[
                Math.cos(i * Math.PI * 0.4) * 0.13,
                0.4 + Math.sin(i * Math.PI * 0.4) * 0.13,
                0,
              ]}
              scale={[0.12, 0.12, 0.06]}
              color="#ECA6AC"
            />
          ))}
          <Orb
            position={[0, 0.4, 0.03]}
            scale={[0.08, 0.08, 0.06]}
            color="#E9C86C"
          />
        </group>
      )}
    </group>
  );
}
function Controls({
  resetKey,
  autoRotate,
}: {
  resetKey: number;
  autoRotate: boolean;
}) {
  const ref = useRef<OrbitControlsType>(null);
  const { gl, camera } = useThree();
  useEffect(() => {
    camera.position.set(4, 3.1, 6.4);
    ref.current?.target.set(0, 1.6, 0);
    ref.current?.update();
  }, [resetKey, camera]);
  useEffect(() => {
    gl.domElement.dataset.toyCanvas = "true";
  }, [gl]);
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enablePan={false}
      minDistance={3.8}
      maxDistance={9}
      maxPolarAngle={Math.PI / 2 + 0.06}
      target={[0, 1.6, 0]}
      autoRotate={autoRotate}
      autoRotateSpeed={0.65}
    />
  );
}
export function ToyCanvas({
  config = defaultDesign,
  hero = false,
  resetKey = 0,
  autoRotate = false,
  reduced = false,
}: {
  config?: Design;
  hero?: boolean;
  resetKey?: number;
  autoRotate?: boolean;
  reduced?: boolean;
}) {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
  }, []);
  if (webgl === false)
    return (
      <div className="canvas-fallback">
        <ToyPortrait config={config} />
        <small>3D needs WebGL. Your design is still editable.</small>
      </div>
    );
  if (webgl === null)
    return (
      <div className="canvas-loading">
        <span className="loading-orb" />A little soul is waking up…
      </div>
    );
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, 1.6]}
      camera={{ position: [4, 3.1, 6.4], fov: hero ? 36 : 39 }}
      gl={{ antialias: true, preserveDrawingBuffer: true, alpha: true }}
      aria-label="Interactive 3D collectible. Drag to rotate and scroll to zoom."
    >
      <ambientLight intensity={1.2} />
      <hemisphereLight args={["#FFF6EF", "#D1BEDD", 1.8]} />
      <directionalLight
        position={[3, 7, 5]}
        intensity={3}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 3, -2]} intensity={2} color="#D9CCFA" />
      <Suspense fallback={null}>
        <ToyModel
          config={config}
          idle={!reduced}
          rotation={[0, hero ? -0.35 : 0, 0]}
        />
        <mesh position={[0, 0.03, 0]} receiveShadow>
          <cylinderGeometry args={[1.23, 1.32, 0.2, 64]} />
          <meshStandardMaterial color="#F5ECE3" roughness={0.65} />
        </mesh>
        <ContactShadows
          position={[0, -0.08, 0]}
          opacity={0.3}
          scale={8}
          blur={2.6}
          far={5}
          resolution={256}
          frames={reduced ? 1 : undefined}
        />
        <Controls resetKey={resetKey} autoRotate={autoRotate && !reduced} />
      </Suspense>
    </Canvas>
  );
}
