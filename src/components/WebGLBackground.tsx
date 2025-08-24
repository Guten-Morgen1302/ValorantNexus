import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WebGLBackgroundProps {
  intensity?: number;
  particleCount?: number;
}

export default function WebGLBackground({ intensity = 1, particleCount = 2000 }: WebGLBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f1923, 0.002);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0f1923, 0.1);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Valorant-themed colors
    const valorantColors = [
      0xFF4655, // Valorant Red
      0x9AF7D7, // Valorant Mint
      0xECE8E1, // Off White
      0x1B2733, // Charcoal
    ];

    // Create particles
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random positions
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;

      // Random velocities
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

      // Random colors from Valorant palette
      const color = new THREE.Color(valorantColors[Math.floor(Math.random() * valorantColors.length)]);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle material with custom shader
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 3.0 },
        uIntensity: { value: intensity }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSize;
        uniform float uIntensity;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;
          
          vec3 pos = position;
          
          // Add wave motion
          pos.x += sin(uTime + position.y * 0.01) * 2.0;
          pos.y += cos(uTime + position.x * 0.01) * 2.0;
          pos.z += sin(uTime + position.x * 0.01 + position.y * 0.01) * 1.0;
          
          // Pulsing effect
          float pulse = sin(uTime * 2.0 + length(position) * 0.05) * 0.5 + 0.5;
          vAlpha = pulse * uIntensity;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = uSize * (300.0 / -mvPosition.z) * pulse;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Create circular particles with glow
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
          alpha *= vAlpha;
          
          // Add glow effect
          float glow = 1.0 - smoothstep(0.0, 0.3, dist);
          
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Create hexagonal grid background
    const hexGeometry = new THREE.RingGeometry(0.5, 0.6, 6);
    const hexMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFF4655, 
      transparent: true, 
      opacity: 0.1,
      wireframe: true 
    });

    for (let i = 0; i < 50; i++) {
      const hex = new THREE.Mesh(hexGeometry, hexMaterial);
      hex.position.set(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 100
      );
      hex.rotation.z = Math.random() * Math.PI;
      scene.add(hex);
    }

    // Animation
    let time = 0;
    const animate = () => {
      time += 0.016;
      
      // Update particle material uniforms
      if (particleMaterial.uniforms) {
        particleMaterial.uniforms.uTime.value = time;
      }

      // Move particles
      const positions = particles.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];

        // Wrap around boundaries
        if (Math.abs(positions[i3]) > 50) velocities[i3] *= -1;
        if (Math.abs(positions[i3 + 1]) > 50) velocities[i3 + 1] *= -1;
        if (Math.abs(positions[i3 + 2]) > 50) velocities[i3 + 2] *= -1;
      }
      particles.attributes.position.needsUpdate = true;

      // Rotate camera slightly
      camera.position.x = Math.sin(time * 0.1) * 0.5;
      camera.position.y = Math.cos(time * 0.1) * 0.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      scene.clear();
    };
  }, [intensity, particleCount]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}