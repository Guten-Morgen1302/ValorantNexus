import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Interactive3DLogoProps {
  text: string;
  size?: number;
  hover?: boolean;
}

export default function Interactive3DLogo({ text, size = 1, hover = false }: Interactive3DLogoProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: "high-performance"
    });
    const containerSize = 200 * size;
    renderer.setSize(containerSize, containerSize);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create 3D text geometry (simplified as geometric shapes)
    const logoGroup = new THREE.Group();

    // Create letter-like shapes for "NYXXUS"
    const shapes: THREE.Mesh[] = [];
    
    // Create geometric representation
    const letterWidth = 0.8;
    const letterSpacing = 1.2;
    const totalWidth = text.length * letterSpacing;
    const startX = -totalWidth / 2;

    for (let i = 0; i < text.length; i++) {
      const letterGroup = new THREE.Group();
      
      // Main letter body
      const letterGeometry = new THREE.BoxGeometry(letterWidth, 2, 0.2);
      const letterMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFF4655,
        shininess: 100,
        transparent: true,
        opacity: 0.9
      });
      const letterMesh = new THREE.Mesh(letterGeometry, letterMaterial);
      
      // Add glow effect
      const glowGeometry = new THREE.BoxGeometry(letterWidth * 1.1, 2.1, 0.3);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x9AF7D7,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      
      letterGroup.add(glowMesh);
      letterGroup.add(letterMesh);
      
      letterGroup.position.x = startX + i * letterSpacing;
      logoGroup.add(letterGroup);
      shapes.push(letterMesh);
    }

    scene.add(logoGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xFF4655, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const accentLight = new THREE.DirectionalLight(0x9AF7D7, 0.8);
    accentLight.position.set(-5, -5, 5);
    scene.add(accentLight);

    // Particle system around logo
    const particleCount = 100;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Circular distribution around logo
      const radius = 3 + Math.random() * 2;
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const height = (Math.random() - 0.5) * 4;
      
      particlePositions[i3] = Math.cos(angle) * radius;
      particlePositions[i3 + 1] = height;
      particlePositions[i3 + 2] = Math.sin(angle) * radius;

      // Valorant colors
      const color = new THREE.Color(Math.random() > 0.5 ? 0xFF4655 : 0x9AF7D7);
      particleColors[i3] = color.r;
      particleColors[i3 + 1] = color.g;
      particleColors[i3 + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleSystem);

    // Animation
    let time = 0;
    const animate = () => {
      time += 0.016;
      
      // Rotate logo group
      logoGroup.rotation.y = Math.sin(time * 0.5) * 0.1;
      logoGroup.rotation.x = Math.cos(time * 0.3) * 0.05;
      
      // Individual letter animations
      shapes.forEach((shape, index) => {
        const offset = index * 0.3;
        shape.rotation.z = Math.sin(time + offset) * 0.1;
        shape.position.y = Math.sin(time * 2 + offset) * 0.1;
        
        // Hover effects
        if (isHovered || hover) {
          shape.rotation.y = Math.sin(time * 2 + offset) * 0.2;
          const material = shape.material as THREE.MeshPhongMaterial;
          material.emissive.setHex(0x330011);
        } else {
          const material = shape.material as THREE.MeshPhongMaterial;
          material.emissive.setHex(0x000000);
        }
      });

      // Animate particles
      const positions = particlesGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const originalY = positions[i3 + 1];
        positions[i3 + 1] = originalY + Math.sin(time * 2 + i * 0.1) * 0.02;
        
        // Rotate particles around logo
        const angle = time * 0.5 + (i / particleCount) * Math.PI * 2;
        const radius = 3 + Math.sin(time + i * 0.1) * 0.5;
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 2] = Math.sin(angle) * radius;
      }
      particlesGeometry.attributes.position.needsUpdate = true;

      // Camera subtle movement
      camera.position.x = Math.sin(time * 0.2) * 0.1;
      camera.position.y = Math.cos(time * 0.15) * 0.1;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      scene.clear();
    };
  }, [text, size, hover, isHovered]);

  return (
    <div
      ref={mountRef}
      className="relative inline-block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: 200 * size, height: 200 * size }}
    />
  );
}