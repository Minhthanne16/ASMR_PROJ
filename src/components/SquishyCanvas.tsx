import React, { useEffect, useRef } from 'react';
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
  interactionModeRef.current = interactionMode;

  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hitPointRef = useRef<THREE.Vector3 | null>(null);
  const hitNormalRef = useRef<THREE.Vector3 | null>(null);
  const squishAccumulatorRef = useRef<number>(0);

  // Global Mesh Squash & Stretch (makes the entire toy deform visibly!)
  const targetScaleRef = useRef<{ x: number; y: number; z: number }>({ x: 1, y: 1, z: 1 });
  const currentScaleRef = useRef<{ x: number; y: number; z: number }>({ x: 1, y: 1, z: 1 });
  const targetPosRef = useRef<{ y: number }>({ y: 0 });
  const currentPosRef = useRef<{ y: number }>({ y: 0 });

  // Rotation controls
  const rotationEulerRef = useRef<THREE.Euler>(new THREE.Euler(0.08, 0, 0));
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.08, y: 0 });

  // 1. Initialize Scene, Camera, Renderer, Lights, Pedestal
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene with transparent background so custom HTML/image background shows through
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 6.4);
    camera.lookAt(0, 0.05, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xfff6ee, 0.9);
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

    // Soft Rim Light from rear left (gives squishy edge cute glow)
    const rimLight = new THREE.DirectionalLight(0xdac9ff, 0.7);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    // Warm bounce light from bottom
    const bounceLight = new THREE.DirectionalLight(0xffeedd, 0.45);
    bounceLight.position.set(0, -3, 2);
    scene.add(bounceLight);

    // Circular pedestal shadow floor (semi-translucent frosted disc)
    const floorGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.08, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.05,
      transparent: true,
      opacity: 0.55
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -1.25;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Soft shadow receiver disc right under squishy
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
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Smooth camera / mesh rotation damping
      if (squishyMeshRef.current) {
        squishyMeshRef.current.rotation.x += (targetRotationRef.current.x - squishyMeshRef.current.rotation.x) * 0.12;
        squishyMeshRef.current.rotation.y += (targetRotationRef.current.y - squishyMeshRef.current.rotation.y) * 0.12;

        // Viscoelastic scale & position recovery (Slow-Rise for the entire squishy body!)
        const recoverySpeed = config.recoverySpeed;
        const scaleLerpRate = isInteractingRef.current
          ? 18.0 * dt // Responds quickly to finger movement
          : (recoverySpeed === 'super_slow'
              ? 2.2 * dt  // ~4s slow-rise memory foam!
              : (recoverySpeed === 'slow'
                  ? 3.8 * dt  // ~2.5s slow-rise!
                  : (recoverySpeed === 'medium' ? 8.0 * dt : 16.0 * dt)));

        currentScaleRef.current.x += (targetScaleRef.current.x - currentScaleRef.current.x) * Math.min(1.0, scaleLerpRate);
        currentScaleRef.current.y += (targetScaleRef.current.y - currentScaleRef.current.y) * Math.min(1.0, scaleLerpRate);
        currentScaleRef.current.z += (targetScaleRef.current.z - currentScaleRef.current.z) * Math.min(1.0, scaleLerpRate);
        currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * Math.min(1.0, scaleLerpRate);

        squishyMeshRef.current.scale.set(
          currentScaleRef.current.x,
          currentScaleRef.current.y,
          currentScaleRef.current.z
        );
        squishyMeshRef.current.position.y = currentPosRef.current.y;
      }

      // Physics deformation slow-rise update for surface vertices
      if (deformationEngineRef.current) {
        const { shouldPlayRelease } = deformationEngineRef.current.update(dt);
        if (shouldPlayRelease && config.soundEnabled) {
          asmrAudio.playRelease(2.5, config.materialType);
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

    // Handle Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
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
  }, [config.recoverySpeed, config.soundEnabled]);

  // 2. Build or Update Squishy Mesh whenever Shape changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove existing mesh if any
    if (squishyMeshRef.current) {
      scene.remove(squishyMeshRef.current);
      squishyMeshRef.current.geometry.dispose();
      if (Array.isArray(squishyMeshRef.current.material)) {
        squishyMeshRef.current.material.forEach(m => m.dispose());
      } else {
        squishyMeshRef.current.material.dispose();
      }
      squishyMeshRef.current = null;
    }

    const geometry = createSquishyGeometry(config.shape);
    const deformationEngine = new DeformationEngine(geometry);
    deformationEngine.setRecoverySpeed(config.recoverySpeed);
    deformationEngineRef.current = deformationEngine;

    // Setup material
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
    mesh.rotation.copy(rotationEulerRef.current);

    // If tomato, attach cute 5-star green stem calyx
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
    targetRotationRef.current = { x: 0.08, y: 0 };
  }, [config.shape]);

  // 3. Update Material properties (Color, Texture, Finish, Recovery Speed)
  useEffect(() => {
    if (squishyMaterialRef.current) {
      // Material finish
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

      // Face texture and diffuse color
      const oldTex = squishyMaterialRef.current.map;
      if (oldTex) oldTex.dispose();

      if (config.expression === 'none') {
        squishyMaterialRef.current.map = null;
        squishyMaterialRef.current.color.set(config.color);
      } else {
        const newTex = createFaceTexture(config.expression, config.color);
        squishyMaterialRef.current.map = newTex;
        squishyMaterialRef.current.color.set(0xffffff); // Neutral white multiplier
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
        targetRotationRef.current = { x: 0.08, y: 0 };
        if (config.soundEnabled) {
          asmrAudio.playPop();
        }
      };
    }
    if (onSqueezeAllRef) {
      onSqueezeAllRef.current = () => {
        // Dramatic whole-body pancake squash!
        targetScaleRef.current = { x: 1.45, y: 0.42, z: 1.45 };
        targetPosRef.current.y = -0.38;

        if (deformationEngineRef.current) {
          deformationEngineRef.current.squeezeAll(0.42);
        }

        if (particleSystemRef.current) {
          particleSystemRef.current.emitPuff(new THREE.Vector3(0, 0, 0), 18, config.color);
        }
        if (config.soundEnabled) {
          asmrAudio.playSquish(0.95, 'squish', config.materialType);
        }
        onSquishActivity(1.0);

        // Gradually restore global scale
        setTimeout(() => {
          targetScaleRef.current = { x: 1, y: 1, z: 1 };
          targetPosRef.current.y = 0;
        }, 120);
      };
    }
  }, [onResetRef, onSqueezeAllRef, config.soundEnabled, config.color, onSquishActivity]);

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

  // 6. Pointer Events (Desktop Mouse & Mobile Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isInteractingRef.current = true;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    squishAccumulatorRef.current = 0;

    // Check hit on squishy mesh
    const hit = getRaycastIntersection(e.clientX, e.clientY);
    const mesh = squishyMeshRef.current;

    // If Right Click (button 2) or mode is 'rotate', or missed mesh, fallback to 3D rotation
    if (e.button === 2 || interactionModeRef.current === 'rotate' || !hit || !mesh) {
      hitPointRef.current = null;
      hitNormalRef.current = null;
      return;
    }

    // World to local coordinates for mesh deformation
    const localHit = mesh.worldToLocal(hit.point.clone());
    const localNormal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);

    hitPointRef.current = localHit;
    hitNormalRef.current = localNormal;

    // Bắt đầu giữ tương tác liên tục (Active Contact)
    deformationEngineRef.current?.beginContact(localHit, localNormal, interactionModeRef.current, 0.65);

    // Initial dramatic visual squash based on mode
    if (interactionModeRef.current === 'squish') {
      targetScaleRef.current = { x: 1.18, y: 0.8, z: 1.18 };
      targetPosRef.current.y = -0.15;
      if (particleSystemRef.current) {
        particleSystemRef.current.emitPuff(hit.point, 12, config.color);
      }
      if (config.soundEnabled) {
        asmrAudio.playSquish(0.82, 'squish', config.materialType);
      }
      onSquishActivity(0.65);
      if (navigator.vibrate) navigator.vibrate(25);
    } else if (interactionModeRef.current === 'poke') {
      targetScaleRef.current = { x: 1.05, y: 0.94, z: 1.05 };
      if (particleSystemRef.current) {
        particleSystemRef.current.emitPuff(hit.point, 8, config.color);
      }
      if (config.soundEnabled) {
        asmrAudio.playSquish(0.72, 'poke', config.materialType);
      }
      onSquishActivity(0.5);
      if (navigator.vibrate) navigator.vibrate(15);
    } else if (interactionModeRef.current === 'stretch') {
      targetScaleRef.current = { x: 0.95, y: 1.12, z: 0.95 };
      if (config.soundEnabled) {
        asmrAudio.playStretch(0.5);
      }
      onSquishActivity(0.45);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractingRef.current) return;

    const dx = e.clientX - lastPointerPosRef.current.x;
    const dy = e.clientY - lastPointerPosRef.current.y;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    const mode = interactionModeRef.current;
    const mesh = squishyMeshRef.current;

    // If rotating (or missed hit)
    if (mode === 'rotate' || !hitPointRef.current || !mesh) {
      targetRotationRef.current.y += dx * 0.008;
      targetRotationRef.current.x = Math.max(-1.2, Math.min(1.2, targetRotationRef.current.x + dy * 0.008));
      return;
    }

    // Cumulative drag from initial click point
    const totalDragX = e.clientX - dragStartPosRef.current.x;
    const totalDragY = e.clientY - dragStartPosRef.current.y;
    const moveDist = Math.sqrt(dx * dx + dy * dy);
    squishAccumulatorRef.current += moveDist;

    if (mode === 'squish') {
      // DRAGGING DOWNWARD: Compresses the squishy deeper and deeper!
      const downwardDrag = Math.max(0, totalDragY);
      // Compression ratio: from 0.22 up to 0.58 (squishes up to 60% of total height!)
      const compression = Math.min(0.58, 0.2 + downwardDrag * 0.0028);

      targetScaleRef.current.y = 1.0 - compression;
      // Poisson lateral bulge: sides expand widely
      const lateralBulge = 1.0 + compression * 0.85;
      targetScaleRef.current.x = lateralBulge;
      targetScaleRef.current.z = lateralBulge;
      // Sinks onto floor as it flattens
      targetPosRef.current.y = -compression * 0.55;

      // Update surface contact denting
      const dragLocal = new THREE.Vector3(dx * 0.015, -dy * 0.015, 0);
      deformationEngineRef.current?.updateContact(hitPointRef.current, dragLocal, 1.0 + downwardDrag * 0.004);

      if (squishAccumulatorRef.current > 32) {
        squishAccumulatorRef.current = 0;
        if (config.soundEnabled) {
          asmrAudio.playSquish(0.65, 'squish', config.materialType);
        }
        onSquishActivity(0.4);
      }
    } else if (mode === 'poke') {
      // Dragging deep finger hole across surface
      const hit = getRaycastIntersection(e.clientX, e.clientY);
      if (hit) {
        const localHit = mesh.worldToLocal(hit.point.clone());
        hitPointRef.current = localHit;
        const dragLocal = new THREE.Vector3(dx * 0.02, -dy * 0.02, 0);
        deformationEngineRef.current?.updateContact(localHit, dragLocal, 1.2);

        if (squishAccumulatorRef.current > 28) {
          squishAccumulatorRef.current = 0;
          if (particleSystemRef.current) {
            particleSystemRef.current.emitPuff(hit.point, 5, config.color);
          }
          if (config.soundEnabled) {
            asmrAudio.playSquish(0.55, 'poke', config.materialType);
          }
          onSquishActivity(0.35);
        }
      }
    } else if (mode === 'stretch') {
      // Stretching outward like mochi
      const stretchDist = Math.sqrt(totalDragX * totalDragX + totalDragY * totalDragY);
      const stretchAmount = Math.min(0.75, stretchDist * 0.0035);

      targetScaleRef.current.y = 1.0 + stretchAmount;
      const pinchPerp = 1.0 / Math.sqrt(targetScaleRef.current.y);
      targetScaleRef.current.x = pinchPerp;
      targetScaleRef.current.z = pinchPerp;

      const pullVector = new THREE.Vector3(dx * 0.03, -dy * 0.03, 0);
      deformationEngineRef.current?.updateContact(hitPointRef.current, pullVector, 1.2);

      if (squishAccumulatorRef.current > 35) {
        squishAccumulatorRef.current = 0;
        if (config.soundEnabled) {
          asmrAudio.playStretch(0.6);
        }
        onSquishActivity(0.35);
      }
    }
  };

  const handlePointerUp = () => {
    if (!isInteractingRef.current) return;
    isInteractingRef.current = false;
    hitPointRef.current = null;
    hitNormalRef.current = null;

    // THẢ TAY: Bắt đầu Slow-Rise Recovery!
    targetScaleRef.current = { x: 1, y: 1, z: 1 };
    targetPosRef.current.y = 0;

    deformationEngineRef.current?.endContact();

    if (config.soundEnabled) {
      asmrAudio.playRelease(2.5, config.materialType);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none touch-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};
