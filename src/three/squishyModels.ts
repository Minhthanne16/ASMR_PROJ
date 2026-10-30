import * as THREE from 'three';
import type { SquishyShape } from '../types';

/**
 * Offsets the horizontal U coordinate of sphere geometry by +0.25
 * so that the front vertex (+Z facing the camera) is located at UV (0.5, 0.5),
 * matching the center of facial textures!
 */
function alignSphereUVs(geom: THREE.BufferGeometry) {
  const uv = geom.attributes.uv;
  if (!uv) return;
  for (let i = 0; i < uv.count; i++) {
    let u = uv.getX(i) + 0.25;
    if (u > 1) u -= 1;
    uv.setX(i, u);
  }
  uv.needsUpdate = true;
}

/**
 * Creates high-detail procedural geometries for each squishy shape.
 * Vertices are densely distributed to allow smooth, organic soft-body deformation.
 */
export function createSquishyGeometry(shape: SquishyShape): THREE.BufferGeometry {
  switch (shape) {
    case 'bun':
      return createBunGeometry();
    case 'cheese':
      return createCheeseGeometry();
    case 'cat':
      return createCatGeometry();
    case 'toast':
      return createToastGeometry();
    case 'peach':
      return createPeachGeometry();
    case 'avocado':
      return createAvocadoGeometry();
    case 'tomato':
      return createTomatoGeometry();
    default:
      return new THREE.SphereGeometry(1.25, 64, 64);
  }
}

/**
 * 1. BÁNH BAO (Steamed Dumpling / Baozi)
 * A soft squashed sphere with pleated folds converging to a top knot.
 */
function createBunGeometry(): THREE.BufferGeometry {
  const geom = new THREE.SphereGeometry(1.25, 80, 80);
  alignSphereUVs(geom);

  const pos = geom.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const angle = Math.atan2(v.z, v.x);
    const heightNorm = (v.y + 1.25) / 2.5; // 0 (bottom) to 1 (top)

    // Squish vertically to make a plump dumpling
    v.y *= 0.76;

    // Flatten bottom slightly so it sits nicely on the pedestal
    if (v.y < -0.45) {
      const bottomFactor = Math.abs(v.y + 0.45);
      v.y += bottomFactor * 0.45;
    }

    // Top knot and spiral pleats (10 delicate folds)
    if (heightNorm > 0.45) {
      const pleatFactor = Math.pow((heightNorm - 0.45) / 0.55, 1.8);
      const folds = Math.sin(angle * 10 + heightNorm * 1.5) * 0.06 * pleatFactor;
      v.x += folds * Math.cos(angle);
      v.z += folds * Math.sin(angle);

      // Top pinch knot
      if (heightNorm > 0.88) {
        const knotPinch = (heightNorm - 0.88) / 0.12;
        v.y += knotPinch * 0.22;
        v.x *= 1 - knotPinch * 0.35;
        v.z *= 1 - knotPinch * 0.35;
      }
    }

    // Gentle side puffiness
    v.x *= 1.12;
    v.z *= 1.12;

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * 2. PHÔ MAI THỤY SĨ (Swiss Cheese Wedge)
 * Triangular wedge with rounded corners and procedural holes.
 */
function createCheeseGeometry(): THREE.BufferGeometry {
  const geom = new THREE.CylinderGeometry(1.35, 1.35, 0.85, 72, 48, false, 0, Math.PI * 0.38);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();

  // Defined positions for cute cheese craters
  const holes = [
    { pos: new THREE.Vector3(0.8, 0.15, 0.3), r: 0.28, depth: 0.18 },
    { pos: new THREE.Vector3(0.5, -0.15, 0.6), r: 0.24, depth: 0.14 },
    { pos: new THREE.Vector3(0.95, -0.08, 0.65), r: 0.2, depth: 0.12 },
    { pos: new THREE.Vector3(0.3, 0.2, 0.2), r: 0.22, depth: 0.13 },
  ];

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Center the wedge around origin
    v.x -= 0.45;
    v.z -= 0.3;

    // Apply cheese crater depressions
    for (const hole of holes) {
      const dist = v.distanceTo(hole.pos);
      if (dist < hole.r) {
        const factor = Math.cos((dist / hole.r) * Math.PI * 0.5);
        const dir = v.clone().sub(hole.pos).normalize();
        v.sub(dir.multiplyScalar(factor * hole.depth));
      }
    }

    // Soft round beveling
    v.y *= 0.95;

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * 3. MÈO BÉO DANGO (Chubby Cat)
 * Round spherical cat body with integrated cute ears and chubby cheeks.
 */
function createCatGeometry(): THREE.BufferGeometry {
  const geom = new THREE.SphereGeometry(1.22, 80, 80);
  alignSphereUVs(geom);

  const pos = geom.attributes.position;
  const v = new THREE.Vector3();

  // Cat ear centers
  const leftEar = new THREE.Vector3(-0.62, 0.92, 0.35);
  const rightEar = new THREE.Vector3(0.62, 0.92, 0.35);

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Bottom flat squish
    if (v.y < -0.4) {
      v.y += Math.abs(v.y + 0.4) * 0.35;
    }

    // Chubby low belly & wide cheeks
    if (v.y < 0.15 && v.y > -0.6) {
      const cheekFactor = 1 + Math.cos(v.y * 3.8) * 0.18;
      v.x *= cheekFactor;
      v.z *= cheekFactor * 1.05;
    }

    // Grow pointy cute cat ears on top
    const distLeft = v.distanceTo(leftEar);
    if (distLeft < 0.55) {
      const earPull = Math.pow(1 - distLeft / 0.55, 1.6);
      v.x -= earPull * 0.28;
      v.y += earPull * 0.52;
      v.z += earPull * 0.18;
    }

    const distRight = v.distanceTo(rightEar);
    if (distRight < 0.55) {
      const earPull = Math.pow(1 - distRight / 0.55, 1.6);
      v.x += earPull * 0.28;
      v.y += earPull * 0.52;
      v.z += earPull * 0.18;
    }

    // Little tail bump at back
    if (v.z < -0.85 && v.y < -0.15) {
      const tailFactor = Math.pow(Math.abs(v.z + 0.85) / 0.45, 2);
      v.z -= tailFactor * 0.25;
      v.y += tailFactor * 0.2;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * 4. BÁNH MÌ GỐI (Toast Slice)
 * Slice of bread with the classic rounded twin lobes at top and pillowy sides.
 */
function createToastGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BoxGeometry(1.75, 1.75, 0.65, 48, 48, 24);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Twin rounded lobes on the top
    if (v.y > 0.3) {
      const topNorm = (v.y - 0.3) / 0.6;
      // Indent in center top
      const centerDip = Math.exp(-Math.pow(v.x / 0.35, 2)) * 0.28 * topNorm;
      v.y -= centerDip;

      // Two rounded crests on left and right
      const lobeLeft = Math.exp(-Math.pow((v.x + 0.45) / 0.4, 2)) * 0.22 * topNorm;
      const lobeRight = Math.exp(-Math.pow((v.x - 0.45) / 0.4, 2)) * 0.22 * topNorm;
      v.y += (lobeLeft + lobeRight);
    }

    // Slight waist indentation at the sides
    if (v.y > -0.15 && v.y < 0.45) {
      const waist = Math.sin((v.y + 0.15) * Math.PI) * 0.09;
      if (v.x > 0) v.x -= waist;
      else v.x += waist;
    }

    // Soft round pillow bulge front and back
    const faceFactor = 1 - Math.min(1, Math.sqrt(v.x * v.x + v.y * v.y) / 1.3);
    if (v.z > 0) {
      v.z += faceFactor * 0.18;
    } else {
      v.z -= faceFactor * 0.18;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * 5. QUẢ ĐÀO MỌNG (Juicy Peach)
 * Heart/peach curve with deep vertical cleft and plump cheeks.
 */
function createPeachGeometry(): THREE.BufferGeometry {
  const geom = new THREE.SphereGeometry(1.22, 80, 80);
  alignSphereUVs(geom);

  const pos = geom.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Heart pinch on bottom tip
    if (v.y < -0.2) {
      const tipFactor = Math.abs(v.y + 0.2) / 1.05;
      v.x *= 1 - tipFactor * 0.45;
      v.z *= 1 - tipFactor * 0.45;
      v.y -= tipFactor * 0.16;
    }

    // Wide peach top lobes
    if (v.y > 0.2) {
      const topFactor = (v.y - 0.2) / 1.05;
      v.x *= 1 + topFactor * 0.25;
      v.z *= 1 + topFactor * 0.2;
    }

    // The signature peach cleft along front vertical (x = 0, z > 0)
    if (v.z > 0) {
      const cleftX = Math.exp(-Math.pow(v.x / 0.25, 2));
      const cleftY = Math.max(0, 1 - Math.pow(v.y / 1.35, 2));
      v.z -= cleftX * cleftY * 0.28;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * 6. CỤC BƠ MẬP (Chubby Avocado)
 * Pear shape with a round protruding seed in the center belly.
 */
function createAvocadoGeometry(): THREE.BufferGeometry {
  const geom = new THREE.SphereGeometry(1.25, 80, 80);
  alignSphereUVs(geom);

  const pos = geom.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Pear shape tapering: top narrower, bottom wider
    if (v.y > 0) {
      const taper = v.y / 1.25;
      v.x *= 1 - taper * 0.36;
      v.z *= 1 - taper * 0.36;
      v.y *= 1.12;
    } else {
      const bulb = Math.abs(v.y) / 1.25;
      v.x *= 1 + bulb * 0.22;
      v.z *= 1 + bulb * 0.22;
    }

    // Flatten front face slightly
    if (v.z > 0.3) {
      v.z = 0.3 + (v.z - 0.3) * 0.45;
    }

    // Avocado round seed bulge in lower belly (z > 0, y around -0.3)
    const seedCenter = new THREE.Vector3(0, -0.28, 0.35);
    const distToSeed = v.distanceTo(seedCenter);
    if (distToSeed < 0.5) {
      const bulge = Math.cos((distToSeed / 0.5) * Math.PI * 0.5) * 0.28;
      v.z += bulge;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * Default color palette presets for each squishy
 */
export const SHAPE_METADATA: Record<SquishyShape, {
  name: string;
  vietnameseName: string;
  defaultColor: string;
  colorPresets: string[];
  description: string;
  emoji: string;
}> = {
  bun: {
    name: 'Steamed Bun',
    vietnameseName: 'Bánh Bao Xốp',
    defaultColor: '#fff9ea',
    colorPresets: ['#fff9ea', '#ffd6e0', '#d8f3dc', '#ffe5b4', '#e8dff5'],
    description: 'Trắng mịn bồng bềnh, múi xoắn mềm xốp bóp cực êm tay',
    emoji: '🥟'
  },
  cheese: {
    name: 'Swiss Cheese',
    vietnameseName: 'Phô Mai Thụy Sĩ',
    defaultColor: '#ffd166',
    colorPresets: ['#ffd166', '#ffb703', '#f4a261', '#ffe882', '#ff9f1c'],
    description: 'Miếng phô mai vàng ươm nhiều lỗ tròn ngộ nghĩnh',
    emoji: '🧀'
  },
  cat: {
    name: 'Chubby Cat',
    vietnameseName: 'Mèo Béo Dango',
    defaultColor: '#f7c59f',
    colorPresets: ['#f7c59f', '#ffcbf2', '#b8c0ff', '#e0aaff', '#e2ece9'],
    description: 'Mèo cục tròn xoe với đôi tai vểnh và má bầu bĩnh',
    emoji: '🐱'
  },
  toast: {
    name: 'Toast Slice',
    vietnameseName: 'Bánh Mì Gối',
    defaultColor: '#ffe8cc',
    colorPresets: ['#ffe8cc', '#ffd6a5', '#eddcd2', '#f3c68f', '#faedcd'],
    description: 'Lát bánh mì nướng mềm ruột xốp viền thơm lừng',
    emoji: '🍞'
  },
  peach: {
    name: 'Juicy Peach',
    vietnameseName: 'Quả Đào Mọng',
    defaultColor: '#ff9aa2',
    colorPresets: ['#ff9aa2', '#ffb7b2', '#ffdac1', '#e2f0cb', '#f8bbd0'],
    description: 'Trái đào hình tim phúng phính bóp dẹp phồng chậm mê ly',
    emoji: '🍑'
  },
  avocado: {
    name: 'Chubby Avocado',
    vietnameseName: 'Cục Bơ Mập',
    defaultColor: '#c7f9cc',
    colorPresets: ['#c7f9cc', '#a7c957', '#e9edc9', '#80b918', '#b5e48c'],
    description: 'Quả bơ xanh tươi với chiếc hạt tròn trịa đáng yêu',
    emoji: '🥑'
  },
  tomato: {
    name: 'Juicy Tomato',
    vietnameseName: 'Quả Cà Chua',
    defaultColor: '#ff4d4d',
    colorPresets: ['#ff4d4d', '#ff6b6b', '#ee5253', '#f368e0', '#ffa502', '#2ed573'],
    description: 'Trái cà chua đỏ mọng múp míp với cuống lá xanh siêu xinh',
    emoji: '🍅'
  }
};

/**
 * 7. QUẢ CÀ CHUA (Juicy Tomato)
 * Plump round body, indented top stem cavity, 5 gentle lobes.
 */
function createTomatoGeometry(): THREE.BufferGeometry {
  const geom = new THREE.SphereGeometry(1.25, 80, 80);
  alignSphereUVs(geom);

  const pos = geom.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const angle = Math.atan2(v.z, v.x);
    const r = Math.sqrt(v.x * v.x + v.z * v.z);

    // Tomato is slightly squat/oblate
    v.y *= 0.82;

    // 5 subtle tomato lobes around perimeter
    const lobeFactor = Math.sin(angle * 5) * 0.05 * Math.sin(Math.min(1, r / 1.1) * Math.PI);
    v.x += lobeFactor * Math.cos(angle);
    v.z += lobeFactor * Math.sin(angle);

    // Top center depression (where the stem cavity sits)
    if (v.y > 0.35 && r < 0.65) {
      const dipFactor = Math.cos((r / 0.65) * Math.PI * 0.5);
      v.y -= dipFactor * 0.35;
    }

    // Bottom slight flat
    if (v.y < -0.45) {
      v.y += Math.abs(v.y + 0.45) * 0.35;
    }

    // Plump side belly
    v.x *= 1.12;
    v.z *= 1.12;

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geom.computeVertexNormals();
  return geom;
}

/**
 * Cuống lá 5 cánh hình sao cho quả cà chua
 */
export function createTomatoCalyx(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'tomato-calyx';

  const calyxMat = new THREE.MeshStandardMaterial({
    color: 0x42b850,
    roughness: 0.72,
    metalness: 0.05
  });

  // 5 star leaf petals radiating outward
  const petalGeo = new THREE.ConeGeometry(0.12, 0.45, 5);
  petalGeo.rotateX(Math.PI / 2); // Lay flat

  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const leaf = new THREE.Mesh(petalGeo, calyxMat);
    leaf.position.set(Math.cos(angle) * 0.22, 0.02, Math.sin(angle) * 0.22);
    leaf.rotation.y = -angle + Math.PI / 2;
    leaf.rotation.x = 0.22; // slight droop onto tomato surface
    leaf.scale.set(1.15, 0.35, 1.35);
    leaf.castShadow = true;
    group.add(leaf);
  }

  // Little central curved stem stalk
  const stalkGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.32, 12);
  const stalk = new THREE.Mesh(stalkGeo, calyxMat);
  stalk.position.set(0.04, 0.18, 0.02);
  stalk.rotation.z = -0.25; // cute jaunty tilt
  stalk.castShadow = true;
  group.add(stalk);

  return group;
}
