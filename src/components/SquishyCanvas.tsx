import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { SquishyConfig, InteractionMode } from '../types';
import { createSquishyGeometry, createTomatoCalyx } from '../three/squishyModels';
import { DeformationEngine } from '../three/deformationEngine';
import { ParticleSystem } from '../three/particleSystem';
import { createFaceTexture } from '../utils/faceTexture';
import { asmrAudio } from '../audio/asmrAudio';

interface SquishyCanvasProps {
  config: SquishyConfig;
  interactionMode: InteractionMode;
  onSquishActivity: (intensity: number) => void;
  onResetRef?: React.MutableRefObject<(() => void) | null>;
  onSqueezeAllRef?: React.MutableRefObject<(() => void) | null>;
}

export const SquishyCanvas: React.FC<SquishyCanvasProps> = ({
  config,
  interactionMode,
  onSquishActivity,
  onResetRef,
  onSqueezeAllRef
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const deformationEngineRef = useRef<DeformationEngine | null>(null);

  // References to keep Three.js resources across renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const squishyMeshRef = useRef<THREE.Mesh | null>(null);
  const squishyMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Interaction tracking state
  const isInteractingRef = useRef<boolean>(false);
  const interactionModeRef = useRef<InteractionMode>(interactionMode);
  useEffect(() => {
    interactionModeRef.current = interactionMode;
  }, [interactionMode]);

  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hitPointRef = useRef<THREE.Vector3 | null>(null);
  const hitNormalRef = useRef<THREE.Vector3 | null>(null);
  const squishAccumulatorRef = useRef<number>(0);
  const lastHoverSoundTimeRef = useRef<number>(0);

  // Multi-touch tracking for pinch-zoom and 2-finger rotate on mobile
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);

  // Hover & Proximity Leaning (magnetic cursor attraction)
  const hoverTargetRef = useRef<{ rotX: number; rotY: number }>({ rotX: 0, rotY: 0 });

  // Global Mesh Squash & Stretch (makes the entire toy deform visibly!)
  const targetScaleRef = useRef<{ x: number; y: number; z: number }>({ x: 1, y: 1, z: 1 });
  const currentScaleRef = useRef<{ x: number; y: number; z: number }>({ x: 1, y: 1, z: 1 });
  const targetPosRef = useRef<{ y: number }>({ y: 0 });
  const currentPosRef = useRef<{ y: number }>({ y: 0 });

  // Spring-wobble oscillation state for realistic jelly/foam physics
  const wobbleTimeRef = useRef<number>(0);
  const wobbleAmplitudeRef = useRef<number>(0);

  // Base rotation (can be spun by user)
  const baseRotationRef = useRef<{ x: number; y: number }>({ x: 0.08, y: 0 });

  // Helper to adjust camera distance based on mobile vs desktop
  const getOptimalCameraZ = useCallback((width: number, height: number) => {
    const isPortrait = height > width;
    if (width < 640) {
      return isPortrait ? 7.6 : 6.8;
    } else if (width < 1024) {
      return isPortrait ? 7.0 : 6.4;
    }
    return 6.2;
  }, []);

  // 1. Initialize Scene, Camera, Renderer, Lights, Pedestal
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // Camera with responsive Z distance
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.35, getOptimalCameraZ(width, height));
    camera.lookAt(0, 0.05, 0);
    cameraRef.current = camera;

    // High performance renderer with soft shadows
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient and Directional Lights
    const ambientLight = new THREE.AmbientLight(0xfff8f2, 1.05);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.35);
    dirLight.position.set(4, 7, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 15;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Warm soft rim light
    const rimLight = new THREE.DirectionalLight(0xedd9ff, 0.75);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    // Bounce light from table
    const bounceLight = new THREE.DirectionalLight(0xffeedd, 0.5);
    bounceLight.position.set(0, -3, 2);
    scene.add(bounceLight);

    // Soft pedestal shadow floor
    const floorGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.08, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.05,
      transparent: true,
      opacity: 0.5
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -1.25;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Soft shadow receiver disc
    const shadowDiscGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.22 });
    const shadowDisc = new THREE.Mesh(shadowDiscGeo, shadowMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = -1.24;
    shadowDisc.receiveShadow = true;
    scene.add(shadowDisc);

    // Particles
    const particles = new ParticleSystem(scene);
    particleSystemRef.current = particles;

    // Animation Loop
    let lastTime = performance.now();
    const animate = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (squishyMeshRef.current) {
        // Organic combined rotation = user base spin + magnetic hover lean
        const targetRotX = baseRotationRef.current.x + hoverTargetRef.current.rotX;
        const targetRotY = baseRotationRef.current.y + hoverTargetRef.current.rotY;

        squishyMeshRef.current.rotation.x += (targetRotX - squishyMeshRef.current.rotation.x) * 0.14;
        squishyMeshRef.current.rotation.y += (targetRotY - squishyMeshRef.current.rotation.y) * 0.14;

        // Dynamic harmonic wobble / jiggle resonance
        let wobbleScaleY = 0;
        let wobbleScaleXZ = 0;
        if (wobbleAmplitudeRef.current > 0.001) {
          wobbleTimeRef.current += dt * 26.0;
          wobbleAmplitudeRef.current *= Math.exp(-dt * 6.5); // Exponential damping
          const wave = Math.sin(wobbleTimeRef.current) * wobbleAmplitudeRef.current;
          wobbleScaleY = wave;
          wobbleScaleXZ = -wave * 0.5; // Poisson volume preservation
        }

        // Viscoelastic scale & position recovery
        const recoverySpeed = config.recoverySpeed;
        const scaleLerpRate = isInteractingRef.current
          ? 20.0 * dt
          : (recoverySpeed === 'super_slow'
              ? 2.4 * dt
              : (recoverySpeed === 'slow'
                  ? 4.0 * dt
                  : (recoverySpeed === 'medium' ? 8.5 * dt : 18.0 * dt)));

        currentScaleRef.current.x += (targetScaleRef.current.x - currentScaleRef.current.x) * Math.min(1.0, scaleLerpRate);
        currentScaleRef.current.y += (targetScaleRef.current.y - currentScaleRef.current.y) * Math.min(1.0, scaleLerpRate);
        currentScaleRef.current.z += (targetScaleRef.current.z - currentScaleRef.current.z) * Math.min(1.0, scaleLerpRate);
        currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * Math.min(1.0, scaleLerpRate);

        squishyMeshRef.current.scale.set(
          Math.max(0.2, currentScaleRef.current.x + wobbleScaleXZ),
          Math.max(0.2, currentScaleRef.current.y + wobbleScaleY),
          Math.max(0.2, currentScaleRef.current.z + wobbleScaleXZ)
        );
        squishyMeshRef.current.position.y = currentPosRef.current.y;
      }

      // Physics deformation slow-rise update for surface vertices
      if (deformationEngineRef.current) {
        const { shouldPlayRelease } = deformationEngineRef.current.update(dt);
        if (shouldPlayRelease && config.soundEnabled) {
          asmrAudio.playRelease(2.5, config.materialType, config.soundProfile);
        }
      }

      // Particle system update
      if (particleSystemRef.current) {
        particleSystemRef.current.update(dt);
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Responsive window resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.position.z = getOptimalCameraZ(w, h);
      camera.updateProjectionMatrix();
      camera.lookAt(0, 0.05, 0);
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particles.destroy();
    };
  }, [config.recoverySpeed, config.soundEnabled, config.materialType, getOptimalCameraZ]);

  // 2. Build or Update Squishy Mesh whenever Shape changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (squishyMeshRef.current) {
      scene.remove(squishyMeshRef.current);
      squishyMeshRef.current.geometry.dispose();
      if (Array.isArray(squishyMeshRef.current.material)) {
        squishyMeshRef.current.material.forEach((m) => m.dispose());
      } else {
        squishyMeshRef.current.material.dispose();
      }
      squishyMeshRef.current = null;
    }

    const geometry = createSquishyGeometry(config.shape);
    const deformationEngine = new DeformationEngine(geometry);
    deformationEngine.setRecoverySpeed(config.recoverySpeed);
    deformationEngineRef.current = deformationEngine;

    // Setup tactile material
    const faceTex = createFaceTexture(config.expression, config.color);
    const material = new THREE.MeshPhysicalMaterial({
      color: config.expression === 'none' ? new THREE.Color(config.color) : new THREE.Color(0xffffff),
      map: faceTex,
      roughness: config.materialType === 'matte' ? 0.88 : (config.materialType === 'glossy' ? 0.18 : 0.72),
      metalness: 0.04,
      clearcoat: config.materialType === 'glossy' ? 0.95 : 0.04,
      clearcoatRoughness: 0.1,
      sheen: config.materialType === 'velvet' ? 0.9 : 0.35,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color(0xffffff)
    });
    squishyMaterialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(baseRotationRef.current.x, baseRotationRef.current.y, 0);

    if (config.shape === 'tomato') {
      const calyx = createTomatoCalyx();
      calyx.position.set(0, 0.72, 0);
      mesh.add(calyx);
    }

    scene.add(mesh);
    squishyMeshRef.current = mesh;

    // Reset scales and position
    targetScaleRef.current = { x: 1, y: 1, z: 1 };
    currentScaleRef.current = { x: 1, y: 1, z: 1 };
    targetPosRef.current = { y: 0 };
    currentPosRef.current = { y: 0 };
  }, [config.shape]);

  // 3. Update Material properties
  useEffect(() => {
    if (squishyMaterialRef.current) {
      if (config.materialType === 'matte') {
        squishyMaterialRef.current.roughness = 0.88;
        squishyMaterialRef.current.clearcoat = 0.04;
        squishyMaterialRef.current.sheen = 0.35;
      } else if (config.materialType === 'glossy') {
        squishyMaterialRef.current.roughness = 0.18;
        squishyMaterialRef.current.clearcoat = 0.95;
        squishyMaterialRef.current.sheen = 0.1;
      } else if (config.materialType === 'velvet') {
        squishyMaterialRef.current.roughness = 0.72;
        squishyMaterialRef.current.clearcoat = 0.0;
        squishyMaterialRef.current.sheen = 0.95;
      }

      const oldTex = squishyMaterialRef.current.map;
      if (oldTex) oldTex.dispose();

      if (config.expression === 'none') {
        squishyMaterialRef.current.map = null;
        squishyMaterialRef.current.color.set(config.color);
      } else {
        const newTex = createFaceTexture(config.expression, config.color);
        squishyMaterialRef.current.map = newTex;
        squishyMaterialRef.current.color.set(0xffffff);
      }

      squishyMaterialRef.current.needsUpdate = true;
    }

    if (deformationEngineRef.current) {
      deformationEngineRef.current.setRecoverySpeed(config.recoverySpeed);
    }
  }, [config.color, config.materialType, config.expression, config.recoverySpeed]);

  // 4. Expose Reset and SqueezeAll to parent
  useEffect(() => {
    if (onResetRef) {
      onResetRef.current = () => {
        if (deformationEngineRef.current) {
          deformationEngineRef.current.reset();
        }
        targetScaleRef.current = { x: 1, y: 1, z: 1 };
        targetPosRef.current = { y: 0 };
        baseRotationRef.current = { x: 0.08, y: 0 };
        hoverTargetRef.current = { rotX: 0, rotY: 0 };
        wobbleAmplitudeRef.current = 0.12;
        wobbleTimeRef.current = 0;
        if (config.soundEnabled) {
          asmrAudio.playPop();
        }
      };
    }
    if (onSqueezeAllRef) {
      onSqueezeAllRef.current = () => {
        targetScaleRef.current = { x: 1.45, y: 0.42, z: 1.45 };
        targetPosRef.current.y = -0.38;

        if (deformationEngineRef.current) {
          deformationEngineRef.current.squeezeAll(0.42);
        }

        if (particleSystemRef.current) {
          particleSystemRef.current.emitPuff(new THREE.Vector3(0, 0, 0), 18, config.color);
        }
        if (config.soundEnabled) {
          asmrAudio.playSquish(0.95, 'squish', config.materialType, 0, config.soundProfile);
        }
        onSquishActivity(1.0);

        setTimeout(() => {
          targetScaleRef.current = { x: 1, y: 1, z: 1 };
          targetPosRef.current.y = 0;
          wobbleAmplitudeRef.current = 0.22;
          wobbleTimeRef.current = 0;
        }, 120);
      };
    }
  }, [onResetRef, onSqueezeAllRef, config.soundEnabled, config.color, config.materialType, onSquishActivity]);

  // 5. Raycasting helper
  const getRaycastIntersection = (clientX: number, clientY: number): THREE.Intersection | null => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const mesh = squishyMeshRef.current;
    if (!container || !camera || !mesh) return null;

    const rect = container.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const intersects = raycaster.intersectObject(mesh, false);

    return intersects.length > 0 ? intersects[0] : null;
  };

  // Calculate binaural stereo panning based on pointer X
  const getStereoPan = (clientX: number): number => {
    return (clientX / (window.innerWidth || 1)) * 2 - 1;
  };

  // 6. Pointer Events (Desktop Mouse & Mobile Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch: If 2 fingers touch on mobile, switch to pinch/rotate mode
    if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchDistRef.current = dist;
      return;
    }

    isInteractingRef.current = true;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    squishAccumulatorRef.current = 0;

    const hit = getRaycastIntersection(e.clientX, e.clientY);
    const mesh = squishyMeshRef.current;
    const panX = getStereoPan(e.clientX);

    // If Right Click (button 2) or mode is 'rotate', or missed mesh, rotate squishy
    if (e.button === 2 || interactionModeRef.current === 'rotate' || !hit || !mesh) {
      hitPointRef.current = null;
      hitNormalRef.current = null;
      return;
    }

    const localHit = mesh.worldToLocal(hit.point.clone());
    const localNormal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);

    hitPointRef.current = localHit;
    hitNormalRef.current = localNormal;

    // Begin contact deformation
    deformationEngineRef.current?.beginContact(localHit, localNormal, interactionModeRef.current, 0.65);

    if (interactionModeRef.current === 'squish') {
      targetScaleRef.current = { x: 1.18, y: 0.8, z: 1.18 };
      targetPosRef.current.y = -0.15;
      if (particleSystemRef.current) {
        particleSystemRef.current.emitPuff(hit.point, 12, config.color);
      }
      if (config.soundEnabled) {
        asmrAudio.playSquish(0.82, 'squish', config.materialType, panX, config.soundProfile);
      }
      onSquishActivity(0.65);
      if (navigator.vibrate) navigator.vibrate(20);
    } else if (interactionModeRef.current === 'poke') {
      targetScaleRef.current = { x: 1.05, y: 0.94, z: 1.05 };
      if (particleSystemRef.current) {
        particleSystemRef.current.emitPuff(hit.point, 8, config.color);
      }
      if (config.soundEnabled) {
        asmrAudio.playSquish(0.72, 'poke', config.materialType, panX, config.soundProfile);
      }
      onSquishActivity(0.5);
      if (navigator.vibrate) navigator.vibrate(12);
    } else if (interactionModeRef.current === 'stretch') {
      targetScaleRef.current = { x: 0.95, y: 1.12, z: 0.95 };
      if (config.soundEnabled) {
        asmrAudio.playStretch(0.5, panX);
      }
      onSquishActivity(0.45);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Multi-touch pinch zoom & rotate on mobile
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointersRef.current.size >= 2) {
      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (initialPinchDistRef.current) {
        const deltaDist = dist - initialPinchDistRef.current;
        // Two-finger rotate Y
        baseRotationRef.current.y += (pts[0].x - lastPointerPosRef.current.x) * 0.005;
        // Adjust camera Z zoom
        if (cameraRef.current) {
          cameraRef.current.position.z = Math.max(4.5, Math.min(9.5, cameraRef.current.position.z - deltaDist * 0.005));
        }
      }
      initialPinchDistRef.current = dist;
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // 🌟 TÍNH NĂNG RÊ CHUỘT XUNG QUANH (HOVER / PROXIMITY INTERACTION):
      // Squishy tự động hướng và nghiêng nhẹ theo con trỏ chuột, tạo cảm giác sống động!
      if (!isInteractingRef.current) {
        hoverTargetRef.current = {
          rotY: ndcX * 0.28,
          rotX: -ndcY * 0.22
        };

        // Khi rê chuột gần hoặc quét qua bề mặt squishy (không cần click), tạo độ nhún gợn sóng nhẹ!
        const hit = getRaycastIntersection(e.clientX, e.clientY);
        if (hit && squishyMeshRef.current) {
          const localHit = squishyMeshRef.current.worldToLocal(hit.point.clone());
          deformationEngineRef.current?.nudgeProximity(localHit, 0.06);

          const now = performance.now();
          if (now - lastHoverSoundTimeRef.current > 180 && config.soundEnabled) {
            lastHoverSoundTimeRef.current = now;
            asmrAudio.playHoverNudge(ndcX);
          }
        }
      }
    }

    if (!isInteractingRef.current) return;

    const dx = e.clientX - lastPointerPosRef.current.x;
    const dy = e.clientY - lastPointerPosRef.current.y;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    const mode = interactionModeRef.current;
    const mesh = squishyMeshRef.current;
    const panX = getStereoPan(e.clientX);

    // If rotating (or missed hit)
    if (mode === 'rotate' || !hitPointRef.current || !mesh) {
      baseRotationRef.current.y += dx * 0.008;
      baseRotationRef.current.x = Math.max(-1.2, Math.min(1.2, baseRotationRef.current.x + dy * 0.008));
      return;
    }

    const totalDragX = e.clientX - dragStartPosRef.current.x;
    const totalDragY = e.clientY - dragStartPosRef.current.y;
    const moveDist = Math.sqrt(dx * dx + dy * dy);
    squishAccumulatorRef.current += moveDist;

    if (mode === 'squish') {
      const downwardDrag = Math.max(0, totalDragY);
      const compression = Math.min(0.58, 0.2 + downwardDrag * 0.0028);

      targetScaleRef.current.y = 1.0 - compression;
      const lateralBulge = 1.0 + compression * 0.85;
      targetScaleRef.current.x = lateralBulge;
      targetScaleRef.current.z = lateralBulge;
      targetPosRef.current.y = -compression * 0.55;

      const dragLocal = new THREE.Vector3(dx * 0.015, -dy * 0.015, 0);
      deformationEngineRef.current?.updateContact(hitPointRef.current, dragLocal, 1.0 + downwardDrag * 0.004);

      if (squishAccumulatorRef.current > 48) {
        squishAccumulatorRef.current = 0;
        if (config.soundEnabled) {
          asmrAudio.playSquish(0.48, 'squish', config.materialType, panX, config.soundProfile);
        }
        onSquishActivity(0.35);
      }
    } else if (mode === 'poke') {
      const hit = getRaycastIntersection(e.clientX, e.clientY);
      if (hit) {
        const localHit = mesh.worldToLocal(hit.point.clone());
        hitPointRef.current = localHit;
        const dragLocal = new THREE.Vector3(dx * 0.02, -dy * 0.02, 0);
        deformationEngineRef.current?.updateContact(localHit, dragLocal, 1.2);

        if (squishAccumulatorRef.current > 40) {
          squishAccumulatorRef.current = 0;
          if (particleSystemRef.current) {
            particleSystemRef.current.emitPuff(hit.point, 4, config.color);
          }
          if (config.soundEnabled) {
            asmrAudio.playSquish(0.42, 'poke', config.materialType, panX, config.soundProfile);
          }
          onSquishActivity(0.3);
        }
      }
    } else if (mode === 'stretch') {
      const stretchDist = Math.sqrt(totalDragX * totalDragX + totalDragY * totalDragY);
      const stretchAmount = Math.min(0.75, stretchDist * 0.0035);

      targetScaleRef.current.y = 1.0 + stretchAmount;
      const pinchPerp = 1.0 / Math.sqrt(targetScaleRef.current.y);
      targetScaleRef.current.x = pinchPerp;
      targetScaleRef.current.z = pinchPerp;

      const pullVector = new THREE.Vector3(dx * 0.03, -dy * 0.03, 0);
      deformationEngineRef.current?.updateContact(hitPointRef.current, pullVector, 1.2);

      if (squishAccumulatorRef.current > 50) {
        squishAccumulatorRef.current = 0;
        if (config.soundEnabled) {
          asmrAudio.playStretch(0.45, panX);
        }
        onSquishActivity(0.3);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      initialPinchDistRef.current = null;
    }

    if (!isInteractingRef.current) return;
    isInteractingRef.current = false;
    hitPointRef.current = null;
    hitNormalRef.current = null;

    // Trigger elastic wobble jiggle resonance upon release
    wobbleAmplitudeRef.current = 0.18;
    wobbleTimeRef.current = 0;

    targetScaleRef.current = { x: 1, y: 1, z: 1 };
    targetPosRef.current.y = 0;

    deformationEngineRef.current?.endContact();

    if (config.soundEnabled) {
      asmrAudio.playRelease(2.5, config.materialType, config.soundProfile);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none touch-none overflow-hidden"
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};
