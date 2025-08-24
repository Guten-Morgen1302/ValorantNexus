import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WebGLGlitchEffectProps {
  trigger?: boolean;
  intensity?: number;
}

export default function WebGLGlitchEffect({ trigger = false, intensity = 1 }: WebGLGlitchEffectProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: false,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create glitch plane
    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    
    // Advanced glitch shader
    const glitchMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uTrigger: { value: trigger ? 1.0 : 0.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uTrigger;
        uniform vec2 uResolution;
        varying vec2 vUv;

        // Valorant color palette
        vec3 valorantRed = vec3(1.0, 0.275, 0.333);
        vec3 valorantMint = vec3(0.604, 0.969, 0.843);
        vec3 valorantNavy = vec3(0.059, 0.098, 0.137);

        // Random function
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        // Noise function
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          
          vec2 u = f * f * (3.0 - 2.0 * f);
          
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        // Digital glitch effect
        vec3 digitalGlitch(vec2 uv, float time) {
          vec2 glitchUv = uv;
          
          // Horizontal displacement
          float displacement = sin(time * 10.0 + uv.y * 50.0) * 0.01 * uIntensity;
          glitchUv.x += displacement;
          
          // Vertical bars
          float bars = step(0.98, sin(uv.y * 100.0 + time * 5.0));
          glitchUv.x += bars * 0.05 * uIntensity;
          
          // Color channels separation
          vec3 color = vec3(0.0);
          color.r = step(0.5, noise(glitchUv * 10.0 + time));
          color.g = step(0.5, noise(glitchUv * 10.0 + time + 100.0));
          color.b = step(0.5, noise(glitchUv * 10.0 + time + 200.0));
          
          return color;
        }

        // Scanlines effect
        float scanlines(vec2 uv, float time) {
          float scanline = sin(uv.y * uResolution.y * 1.5) * 0.5 + 0.5;
          scanline *= 0.9 + 0.1 * sin(time * 10.0);
          return scanline;
        }

        // Hexagonal pattern
        float hexPattern(vec2 uv, float time) {
          vec2 hexUv = uv * 20.0;
          vec2 hexId = floor(hexUv);
          vec2 hexLocal = fract(hexUv) - 0.5;
          
          float hexDist = abs(hexLocal.x) + abs(hexLocal.y) * 0.866;
          float hex = smoothstep(0.4, 0.45, hexDist);
          
          // Animate hex pattern
          float hexTime = time + dot(hexId, vec2(0.1, 0.13));
          hex *= 0.5 + 0.5 * sin(hexTime * 3.0);
          
          return hex;
        }

        void main() {
          vec2 uv = vUv;
          float time = uTime;
          
          vec3 color = vec3(0.0);
          float alpha = 0.0;
          
          if (uTrigger > 0.5 || uIntensity > 0.1) {
            // Digital glitch
            vec3 glitch = digitalGlitch(uv, time);
            
            // Apply Valorant colors
            color += glitch.r * valorantRed * 0.3;
            color += glitch.g * valorantMint * 0.2;
            color += glitch.b * valorantNavy * 0.1;
            
            // Scanlines
            float scan = scanlines(uv, time);
            color *= scan;
            
            // Hexagonal overlay
            float hex = hexPattern(uv, time);
            color += hex * valorantMint * 0.1;
            
            // Noise overlay
            float n = noise(uv * 100.0 + time * 2.0);
            color += n * 0.05;
            
            // Calculate alpha based on intensity and effects
            alpha = (glitch.r + glitch.g + glitch.b) * 0.3 * uIntensity;
            alpha += hex * 0.1 * uIntensity;
            alpha *= uTrigger * 0.5 + 0.3;
          }
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    const glitchPlane = new THREE.Mesh(planeGeometry, glitchMaterial);
    scene.add(glitchPlane);

    // Animation
    let time = 0;
    const animate = () => {
      time += 0.016;
      
      if (glitchMaterial.uniforms) {
        glitchMaterial.uniforms.uTime.value = time;
        glitchMaterial.uniforms.uIntensity.value = intensity;
        glitchMaterial.uniforms.uTrigger.value = trigger ? 1.0 : 0.0;
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      renderer.setSize(width, height);
      if (glitchMaterial.uniforms) {
        glitchMaterial.uniforms.uResolution.value.set(width, height);
      }
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
  }, [trigger, intensity]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ 
        mixBlendMode: 'screen',
        opacity: trigger ? 1 : 0.3 
      }}
    />
  );
}