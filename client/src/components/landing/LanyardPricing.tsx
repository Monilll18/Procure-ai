"use client";
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer, Html } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';
import { Check } from 'lucide-react';

extend({ MeshLineGeometry, MeshLineMaterial });

const plans = [
    {
        name: "Starter",
        price: "$29",
        desc: "Perfect for small teams getting started.",
        features: ["User analytics", "Growth tracking", "Real-time reporting", "1 Project"],
        popular: false
    },
    {
        name: "Growth",
        price: "$79",
        desc: "Advanced analytics for scaling businesses.",
        features: ["Everything in Starter", "Funnel analysis", "Custom events", "priority support", "5 Projects"],
        popular: true
    },
    {
        name: "Enterprise",
        price: "$199",
        desc: "Complete analytics solution for large orgs.",
        features: ["Everything in Growth", "SSO & SAML", "Dedicated manager", "Unlimited Projects", "Raw data access"],
        popular: false
    }
];

export function LanyardPricing({ position = [0, 0, 30], gravity = [0, -40, 0], fov = 20, transparent = true }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section id="pricing" className="relative w-full h-[650px] md:h-[700px] flex justify-center items-center overflow-hidden bg-background">
      <div className="absolute top-10 w-full text-center z-10 pointer-events-none">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-border bg-muted/50 text-xs font-medium text-muted-foreground mb-4">
              PRICING PLANS
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 font-outfit">
              Start free, scale smart
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Grab a card and interact! Choose the perfect plan for your startup. Upgrade as you grow.
          </p>
      </div>
      
      <Canvas
        camera={{ position: [0, 0, 22] as any, fov: 20 }}
        dpr={[1, 1.5]}
        gl={{ alpha: transparent, antialias: true }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={Math.PI} />
          <Physics gravity={gravity as any} timeStep={isMobile ? 1 / 30 : 1 / 60}>
            {isMobile ? (
              plans.map((plan, i) => (
                <Band key={i} plan={plan} offset={[0, 4 - i * 3, 0]} isMobile={isMobile} />
              ))
            ) : (
              plans.map((plan, i) => (
                <Band key={i} plan={plan} offset={[(i - 1) * 4, 4, 0]} isMobile={isMobile} />
              ))
            )}
          </Physics>
          <Environment blur={0.75}>
            <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
            <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
    </section>
  );
}

function Band({ plan, offset, maxSpeed = 50, minSpeed = 0, isMobile = false }: any) {
  const band = useRef<any>(),
    fixed = useRef<any>(),
    j1 = useRef<any>(),
    j2 = useRef<any>(),
    j3 = useRef<any>(),
    card = useRef<any>();
  const vec = new THREE.Vector3(),
    ang = new THREE.Vector3(),
    rot = new THREE.Vector3(),
    dir = new THREE.Vector3();
  const segmentProps = { type: 'dynamic' as any, canSleep: true, colliders: false as any, angularDamping: 4, linearDamping: 4 };
  
  const { nodes, materials } = useGLTF('/lanyard/card.glb') as any;
  const texture = useTexture('/lanyard/lanyard.png');
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]));
  const [dragged, drag] = useState<any>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.5, 0]]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
    }
    if (fixed.current) {
      [j1, j2].forEach(ref => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={offset}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={e => {
                e.stopPropagation();
                if (e.target && (e.target as any).releasePointerCapture) {
                    (e.target as any).releasePointerCapture(e.pointerId);
                }
                drag(false);
            }}
            onPointerDown={e => {
                e.stopPropagation();
                if (e.target && (e.target as any).setPointerCapture) {
                    (e.target as any).setPointerCapture(e.pointerId);
                }
                drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={materials.base.map}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
              <Html
                transform
                position={[0, 0.05, 0.012]}
                rotation={[0, 0, 0]}
                scale={0.11}
                occlude="blending"
              >
                 <div className={"w-[320px] h-[440px] flex flex-col p-6 bg-white rounded-2xl select-none shadow-2xl pointer-events-none border-2 border-transparent"}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#8A2BE2] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-black font-outfit">{plan.name}</h3>
                    <p className="text-xs text-gray-600 mt-1 mb-2 leading-tight flex-shrink-0 min-h-[30px]">{plan.desc}</p>
                    <div className="mb-4">
                        <span className="text-4xl font-black text-black tracking-tight">{plan.price}</span>
                        <span className="text-xs text-gray-500 font-semibold">/month</span>
                    </div>
                    <ul className="space-y-2 flex-1 mt-1">
                        {plan.features.map((feature: string, j: number) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-black font-medium">
                                <Check className="h-4 w-4 text-[#8A2BE2] flex-shrink-0" />
                                <span className="leading-tight">{feature}</span>
                            </li>
                        ))}
                    </ul>
                    <button className="w-full mt-auto py-2.5 rounded-lg text-sm font-bold pointer-events-auto transition-all shadow-md active:scale-95" 
                            style={{ backgroundColor: plan.popular ? '#8A2BE2' : '#000', color: '#fff' }}
                            onPointerDown={e => e.stopPropagation()}>
                        Get Started
                    </button>
                 </div>
              </Html>
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band} frustumCulled={false}>
        {/* @ts-ignore */}
        <meshLineGeometry />
        {/* @ts-ignore */}
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-4, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}

useGLTF.preload('/lanyard/card.glb');
useTexture.preload('/lanyard/lanyard.png');
