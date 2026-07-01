import * as THREE from "three";

interface OrbitingBody {
  mesh: THREE.Mesh;
  radius: number;
  angle: number;
  angularSpeed: number;
  inclination: number;
}

export interface OrbitingBodies {
  group: THREE.Group;
  update: (dt: number) => void;
}

/**
 * A handful of glowing spheres on stable, inclined circular orbits well
 * outside the accretion disk's inner radius, so they never get pulled in.
 */
export function createOrbitingBodies(): OrbitingBodies {
  const group = new THREE.Group();

  const configs = [
    { radius: 16, inclination: THREE.MathUtils.degToRad(18), color: 0xfff2cc },
    { radius: 16, inclination: THREE.MathUtils.degToRad(18), color: 0xcce8ff },
    { radius: 20, inclination: THREE.MathUtils.degToRad(-32), color: 0xffd9cc },
    { radius: 20, inclination: THREE.MathUtils.degToRad(-32), color: 0xe0ccff },
  ];

  const bodies: OrbitingBody[] = configs.map((config, i) => {
    const geometry = new THREE.SphereGeometry(0.35, 24, 24);
    const material = new THREE.MeshBasicMaterial({ color: config.color });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    return {
      mesh,
      radius: config.radius,
      angle: (i % 2) * Math.PI + Math.random() * 0.5,
      angularSpeed: 0.12 + Math.random() * 0.03,
      inclination: config.inclination,
    };
  });

  function update(dt: number) {
    for (const body of bodies) {
      body.angle += body.angularSpeed * dt;
      const x = body.radius * Math.cos(body.angle);
      const z = body.radius * Math.sin(body.angle);
      const y = z * Math.sin(body.inclination);
      const zTilted = z * Math.cos(body.inclination);
      body.mesh.position.set(x, y, zTilted);
    }
  }

  return { group, update };
}
