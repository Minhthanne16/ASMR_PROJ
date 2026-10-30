import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  scale: number;
  maxLife: number;
  life: number;
  color: THREE.Color;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private instancedMesh: THREE.InstancedMesh;
  private maxParticles: number = 80;
  private dummy: THREE.Object3D = new THREE.Object3D();
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const geom = new THREE.SphereGeometry(0.08, 12, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85
    });
    this.instancedMesh = new THREE.InstancedMesh(geom, mat, this.maxParticles);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    // Hide initially
    for (let i = 0; i < this.maxParticles; i++) {
      this.dummy.position.set(0, -999, 0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.instancedMesh);
  }

  public emitPuff(origin: THREE.Vector3, count: number = 12, tintColor: string = '#ffd166') {
    const baseColor = new THREE.Color(tintColor);
    const pastelPink = new THREE.Color('#ff85a2');
    const softWhite = new THREE.Color('#ffffff');

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift(); // Remove oldest
      }

      // Random burst velocity in hemisphere
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.6;
      const vx = Math.cos(angle) * speed * 0.7;
      const vy = 0.8 + Math.random() * 1.5;
      const vz = Math.sin(angle) * speed * 0.7;

      // Color variation: mix base with soft pink and white
      const colorMix = Math.random();
      const pColor = colorMix > 0.6 ? baseColor.clone() : (colorMix > 0.3 ? pastelPink : softWhite);

      this.particles.push({
        position: origin.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3
        )),
        velocity: new THREE.Vector3(vx, vy, vz),
        scale: 0.8 + Math.random() * 1.2,
        maxLife: 0.6 + Math.random() * 0.4,
        life: 0,
        color: pColor
      });
    }
  }

  public update(dt: number) {
    const alive: Particle[] = [];
    const gravity = new THREE.Vector3(0, -2.5, 0);

    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        p.life += dt;

        if (p.life < p.maxLife) {
          alive.push(p);

          // Update physics
          p.velocity.addScaledVector(gravity, dt);
          p.position.addScaledVector(p.velocity, dt);

          // Scale shrinks as life ends
          const lifeProgress = p.life / p.maxLife;
          const currentScale = Math.sin(lifeProgress * Math.PI) * p.scale;

          this.dummy.position.copy(p.position);
          this.dummy.scale.setScalar(Math.max(0.001, currentScale));
          this.dummy.updateMatrix();
          this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
          this.instancedMesh.setColorAt(i, p.color);
        } else {
          // Dead
          this.dummy.position.set(0, -999, 0);
          this.dummy.scale.setScalar(0.001);
          this.dummy.updateMatrix();
          this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
        }
      } else {
        this.dummy.position.set(0, -999, 0);
        this.dummy.scale.setScalar(0.001);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      }
    }

    this.particles = alive;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  public destroy() {
    this.scene.remove(this.instancedMesh);
    this.instancedMesh.geometry.dispose();
    if (Array.isArray(this.instancedMesh.material)) {
      this.instancedMesh.material.forEach(m => m.dispose());
    } else {
      this.instancedMesh.material.dispose();
    }
  }
}

