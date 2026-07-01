import * as THREE from "three";

export function createEinsteinRing(): THREE.Mesh {
  const geometry = new THREE.TorusGeometry(1.55, 0.05, 8, 128);
  const material = new THREE.MeshBasicMaterial({
    color: 0xcceeff,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(geometry, material);
  // Rotate from default XY-plane to lie flat in the XZ-plane (horizontal)
  ring.rotation.x = Math.PI / 2;
  return ring;
}
