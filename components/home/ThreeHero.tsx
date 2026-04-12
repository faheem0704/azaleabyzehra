"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeHero() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.set(0, 0, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Cloth mesh — subdivided plane with wave animation
    const geometry = new THREE.PlaneGeometry(5, 5, 60, 60);
    const positionAttr = geometry.attributes.position;
    const originalPositions = new Float32Array(positionAttr.array.length);
    originalPositions.set(positionAttr.array as Float32Array);

    const material = new THREE.MeshPhongMaterial({
      color: 0xc9956c,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18,
      shininess: 80,
      specular: new THREE.Color(0xffd4b0),
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI * 0.1;
    scene.add(mesh);

    // Wire overlay for depth
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xb07850,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    });
    const wireMesh = new THREE.Mesh(geometry.clone(), wireMat);
    wireMesh.rotation.x = -Math.PI * 0.1;
    scene.add(wireMesh);

    // Ambient particles
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xd4a882,
      size: 0.018,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Lights
    const ambient = new THREE.AmbientLight(0xfff4ea, 0.8);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffd4a0, 1.2);
    dirLight.position.set(2, 3, 2);
    scene.add(dirLight);
    const pointLight = new THREE.PointLight(0xc9956c, 1.5, 10);
    pointLight.position.set(-2, 1, 1);
    scene.add(pointLight);

    // Mouse parallax
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // Resize
    const onResize = () => {
      const w2 = mount.clientWidth;
      const h2 = mount.clientHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    window.addEventListener("resize", onResize);

    // Animate
    let rafId: number;
    let t = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      t += 0.008;

      // Wave the cloth
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        pos.setZ(
          i,
          Math.sin(ox * 1.2 + t) * 0.18 +
            Math.cos(oy * 1.1 + t * 0.7) * 0.14 +
            Math.sin((ox + oy) * 0.6 + t * 1.2) * 0.08
        );
      }
      pos.needsUpdate = true;
      geometry.computeVertexNormals();

      // Mouse parallax on camera
      camera.position.x += (mouse.x * 0.3 - camera.position.x) * 0.04;
      camera.position.y += (mouse.y * 0.2 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      // Particles drift
      particles.rotation.y = t * 0.06;
      particles.rotation.x = t * 0.03;

      mesh.rotation.z = Math.sin(t * 0.4) * 0.03;
      wireMesh.rotation.z = mesh.rotation.z;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
