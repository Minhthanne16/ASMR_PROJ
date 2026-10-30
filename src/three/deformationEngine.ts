import * as THREE from 'three';
import type { RecoverySpeed, InteractionMode } from '../types';

interface ActiveContact {
  point: THREE.Vector3;
  normal: THREE.Vector3;
  mode: InteractionMode;
  depth: number;
  radius: number;
  pullVector: THREE.Vector3;
}

export class DeformationEngine {
  private geometry: THREE.BufferGeometry;
  private originalPositions: Float32Array;
  private currentPositions: Float32Array;
  private velocities: Float32Array;
  private vertexCount: number;

  // Recovery tuning parameters (Stiffness and Viscous Damping)
  private stiffness: number = 8.0;
  private damping: number = 6.2;

  // Active user contact hold
  private activeContact: ActiveContact | null = null;
  private isDeformed: boolean = false;
  private hasTriggeredReleaseSound: boolean = false;

  constructor(geometry: THREE.BufferGeometry) {
    this.geometry = geometry;
    const posAttr = geometry.attributes.position;
    this.vertexCount = posAttr.count;

    // Clone original shape
    this.originalPositions = new Float32Array(posAttr.array);
    this.currentPositions = posAttr.array as Float32Array;
    this.velocities = new Float32Array(this.vertexCount * 3);

    this.setRecoverySpeed('slow');
  }

  public setRecoverySpeed(speed: RecoverySpeed) {
    switch (speed) {
      case 'super_slow':
        // Overdamped viscoelastic: slow, smooth, luxurious memory foam expansion
        this.stiffness = 3.5;
        this.damping = 4.4;
        break;
      case 'slow':
        this.stiffness = 7.5;
        this.damping = 6.0;
        break;
      case 'medium':
        this.stiffness = 15.0;
        this.damping = 7.5;
        break;
      case 'fast':
        // Underdamped jelly: juicy elastic wobble!
        this.stiffness = 38.0;
        this.damping = 4.8;
        break;
    }
  }

  /**
   * Bắt đầu nhấn giữ tương tác (chạm ngón tay/chuột vào squishy)
   */
  public beginContact(
    localPoint: THREE.Vector3,
    localNormal: THREE.Vector3,
    mode: InteractionMode,
    initialDepth: number = 0.55
  ) {
    const radius = mode === 'squish' ? 1.6 : (mode === 'poke' ? 0.95 : 1.3);

    this.activeContact = {
      point: localPoint.clone(),
      normal: localNormal.clone().normalize(),
      mode,
      depth: initialDepth,
      radius,
      pullVector: new THREE.Vector3(0, 0, 0)
    };

    this.isDeformed = true;
    this.hasTriggeredReleaseSound = false;
  }

  /**
   * Cập nhật lực đè hoặc độ kéo dãn khi di chuyển chuột
   */
  public updateContact(
    localPoint: THREE.Vector3,
    dragDelta: THREE.Vector3,
    depthMultiplier: number = 1.0
  ) {
    if (!this.activeContact) return;

    this.activeContact.point.copy(localPoint);
    this.activeContact.depth = Math.min(1.1, Math.max(0.35, 0.55 * depthMultiplier));
    this.activeContact.pullVector.copy(dragDelta);
    this.isDeformed = true;
  }

  /**
   * Thả tay ra: Bắt đầu giai đoạn phục hồi đàn hồi chậm (Slow-Rise Recovery)
   */
  public endContact() {
    this.activeContact = null;
    // Keep isDeformed = true so the recovery update loop restores it
  }

  /**
   * Bóp dẹp toàn diện (Squeeze All button)
   */
  public squeezeAll(compressionY: number = 0.45) {
    const orig = this.originalPositions;
    const curr = this.currentPositions;
    const vel = this.velocities;

    for (let i = 0; i < this.vertexCount; i++) {
      const idx = i * 3;
      // Nén mạnh trục Y
      curr[idx + 1] = orig[idx + 1] * compressionY;
      // Phồng to trục X và Z (Poisson volume preservation)
      const bulge = 1 + (1 - compressionY) * 0.5;
      curr[idx] = orig[idx] * bulge;
      curr[idx + 2] = orig[idx + 2] * bulge;

      vel[idx] = 0;
      vel[idx + 1] = 0;
      vel[idx + 2] = 0;
    }

    this.isDeformed = true;
    this.hasTriggeredReleaseSound = false;
    this.applyUpdates();
  }

  /**
   * Vòng lặp vật lý (chạy mỗi frame 60 FPS)
   */
  public update(deltaTime: number): {
    totalDisplacement: number;
    shouldPlayRelease: boolean;
  } {
    if (!this.isDeformed && !this.activeContact) {
      return { totalDisplacement: 0, shouldPlayRelease: false };
    }

    const dt = Math.min(deltaTime, 0.04);
    const orig = this.originalPositions;
    const curr = this.currentPositions;
    const vel = this.velocities;

    let totalDisp = 0;
    let anyMoving = false;

    // 1. ÁP DỤNG BIẾN DẠNG KHI ĐANG NHẤN GIỮ (ACTIVE HOLD)
    if (this.activeContact) {
      const contact = this.activeContact;
      const hitX = contact.point.x;
      const hitY = contact.point.y;
      const hitZ = contact.point.z;
      const norm = contact.normal;
      const R = contact.radius;
      const depth = contact.depth;
      const mode = contact.mode;
      const pull = contact.pullVector;

      for (let i = 0; i < this.vertexCount; i++) {
        const idx = i * 3;
        const dx = orig[idx] - hitX;
        const dy = orig[idx + 1] - hitY;
        const dz = orig[idx + 2] - hitZ;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < R * R * 1.6) {
          const dist = Math.sqrt(distSq);
          const u = dist / R;

          let targetX = orig[idx];
          let targetY = orig[idx + 1];
          let targetZ = orig[idx + 2];

          if (mode === 'poke') {
            // Vết lõm ngón tay sâu + vành nhô lên xung quanh (crater lip)
            if (u <= 1.0) {
              const falloff = Math.pow(1 - u * u, 2);
              targetX -= norm.x * depth * falloff;
              targetY -= norm.y * depth * falloff;
              targetZ -= norm.z * depth * falloff;
            } else if (u > 1.0 && u < 1.35) {
              // Vành mút xốp đùn lên xung quanh vết lõm
              const lip = Math.sin(((u - 1.0) / 0.35) * Math.PI) * 0.16 * depth;
              targetX += norm.x * lip;
              targetY += norm.y * lip;
              targetZ += norm.z * lip;
            }
          } else if (mode === 'squish') {
            // Nén dẹp bề mặt + phồng hông bảo toàn thể tích
            if (u <= 1.0) {
              const falloff = Math.cos(u * Math.PI * 0.5);
              // Nén theo hướng ấn
              targetX -= norm.x * depth * falloff;
              targetY -= norm.y * depth * falloff;
              targetZ -= norm.z * depth * falloff;

              // Phồng hông vuông góc với hướng nén
              const perpX = dx - (dx * norm.x + dy * norm.y + dz * norm.z) * norm.x;
              const perpY = dy - (dx * norm.x + dy * norm.y + dz * norm.z) * norm.y;
              const perpZ = dz - (dx * norm.x + dy * norm.y + dz * norm.z) * norm.z;
              const perpLen = Math.sqrt(perpX * perpX + perpY * perpY + perpZ * perpZ) + 0.001;

              const lateralBulge = depth * falloff * 0.42;
              targetX += (perpX / perpLen) * lateralBulge;
              targetY += (perpY / perpLen) * lateralBulge;
              targetZ += (perpZ / perpLen) * lateralBulge;
            }
          } else if (mode === 'stretch') {
            // Kéo dãn theo vector chuột
            if (u <= 1.2) {
              const factor = Math.pow(1 - Math.min(1, u / 1.2), 1.4);
              targetX += pull.x * factor * 1.5;
              targetY += pull.y * factor * 1.5;
              targetZ += pull.z * factor * 1.5;
            }
          }

          // Làm mềm điểm lún: co giãn mượt mà về target
          const complianceSpeed = 22.0 * dt;
          curr[idx] += (targetX - curr[idx]) * Math.min(0.85, complianceSpeed);
          curr[idx + 1] += (targetY - curr[idx + 1]) * Math.min(0.85, complianceSpeed);
          curr[idx + 2] += (targetZ - curr[idx + 2]) * Math.min(0.85, complianceSpeed);

          vel[idx] = 0;
          vel[idx + 1] = 0;
          vel[idx + 2] = 0;
        }
      }
    }

    // 2. VISCOELASTIC SLOW-RISE RECOVERY CHO CÁC ĐIỂM KHÔNG BỊ GIỮ
    const k = this.stiffness;
    const d = this.damping;

    for (let i = 0; i < this.vertexCount; i++) {
      const idx = i * 3;

      const diffX = orig[idx] - curr[idx];
      const diffY = orig[idx + 1] - curr[idx + 1];
      const diffZ = orig[idx + 2] - curr[idx + 2];

      const distSq = diffX * diffX + diffY * diffY + diffZ * diffZ;

      if (distSq > 0.00002) {
        anyMoving = true;
        totalDisp += Math.sqrt(distSq);

        // Lực phục hồi lò xo có giảm chấn F = k * delta - d * v
        const fx = diffX * k - vel[idx] * d;
        const fy = diffY * k - vel[idx + 1] * d;
        const fz = diffZ * k - vel[idx + 2] * d;

        vel[idx] += fx * dt;
        vel[idx + 1] += fy * dt;
        vel[idx + 2] += fz * dt;

        curr[idx] += vel[idx] * dt;
        curr[idx + 1] += vel[idx + 1] * dt;
        curr[idx + 2] += vel[idx + 2] * dt;
      } else if (!this.activeContact) {
        // Đã phục hồi hoàn toàn
        curr[idx] = orig[idx];
        curr[idx + 1] = orig[idx + 1];
        curr[idx + 2] = orig[idx + 2];
        vel[idx] = 0;
        vel[idx + 1] = 0;
        vel[idx + 2] = 0;
      }
    }

    let shouldPlayRelease = false;
    if (!this.hasTriggeredReleaseSound && !this.activeContact && totalDisp > 6.0) {
      shouldPlayRelease = true;
      this.hasTriggeredReleaseSound = true;
    }

    if (!anyMoving && !this.activeContact) {
      this.isDeformed = false;
      this.hasTriggeredReleaseSound = false;
    }

    this.applyUpdates();

    return { totalDisplacement: totalDisp, shouldPlayRelease };
  }

  /**
   * Reset ngay lập tức về hình dáng ban đầu
   */
  public reset() {
    this.currentPositions.set(this.originalPositions);
    this.velocities.fill(0);
    this.activeContact = null;
    this.isDeformed = false;
    this.hasTriggeredReleaseSound = false;
    this.applyUpdates();
  }

  private applyUpdates() {
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}
