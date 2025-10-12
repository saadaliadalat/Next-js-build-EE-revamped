"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;

    // ==================== SCENE INITIALIZATION ====================
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00045);

    // Ultra-premium renderer with maximum quality
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";
    container.appendChild(renderer.domElement);

    // Cinematic camera
    const camera = new THREE.PerspectiveCamera(
      isMobile ? 50 : 40,
      container.clientWidth / container.clientHeight,
      0.1,
      3000
    );
    camera.position.set(0, 0, 700);

    // ==================== STUDIO LIGHTING SYSTEM ====================
    // Main key light - soft directional
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(600, 500, 400);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 4096;
    keyLight.shadow.mapSize.height = 4096;
    scene.add(keyLight);

    // Fill lights - multiple angles for soft shadows
    const fillLight1 = new THREE.PointLight(0xe4e4e7, 2.0, 2000);
    fillLight1.position.set(-500, 300, 400);
    scene.add(fillLight1);

    const fillLight2 = new THREE.PointLight(0xd4d4d8, 1.5, 1800);
    fillLight2.position.set(400, -200, 300);
    scene.add(fillLight2);

    // Rim lights for edge definition
    const rimLight1 = new THREE.PointLight(0xfafafa, 2.5, 2200);
    rimLight1.position.set(0, -400, -600);
    scene.add(rimLight1);

    const rimLight2 = new THREE.PointLight(0xffffff, 1.8, 2000);
    rimLight2.position.set(300, 500, -500);
    scene.add(rimLight2);

    // Ambient base
    const ambient = new THREE.AmbientLight(0x71717a, 0.5);
    scene.add(ambient);

    // Dramatic spotlights
    const spotLight1 = new THREE.SpotLight(0xffffff, 3.0, 2000, Math.PI / 5, 0.15, 2);
    spotLight1.position.set(500, 700, 800);
    scene.add(spotLight1);

    const spotLight2 = new THREE.SpotLight(0xfafafa, 2.2, 1800, Math.PI / 6, 0.2, 1.8);
    spotLight2.position.set(-400, 600, 700);
    scene.add(spotLight2);

    // Accent lights for depth
    const accentLight1 = new THREE.PointLight(0xffffff, 1.8, 1600);
    accentLight1.position.set(350, -350, 250);
    scene.add(accentLight1);

    const accentLight2 = new THREE.PointLight(0xe4e4e7, 1.5, 1500);
    accentLight2.position.set(-300, 400, -300);
    scene.add(accentLight2);

    // ==================== ULTRA-PREMIUM GLOBE ====================
    const globeRadius = 200;
    
    // Main globe body - multiple layers for depth
    const globeGeo = new THREE.SphereGeometry(globeRadius, 128, 128);
    
    // Inner dark core
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x09090b,
      metalness: 0.4,
      roughness: 0.6,
      transparent: true,
      opacity: 0.5,
      emissive: 0x18181b,
      emissiveIntensity: 0.15,
      clearcoat: 0.3,
    });
    const core = new THREE.Mesh(globeGeo, coreMat);
    scene.add(core);

    // Mid-layer with glass effect
    const midGeo = new THREE.SphereGeometry(globeRadius + 1, 96, 96);
    const midMat = new THREE.MeshPhysicalMaterial({
      color: 0x27272a,
      metalness: 0.2,
      roughness: 0.3,
      transparent: true,
      opacity: 0.3,
      transmission: 0.5,
      thickness: 0.8,
      ior: 1.5,
    });
    const midLayer = new THREE.Mesh(midGeo, midMat);
    core.add(midLayer);

    // High-detail wireframe with latitude/longitude lines
    const latLines = 32;
    const lonLines = 64;
    
    // Create latitude lines
    for (let i = 0; i <= latLines; i++) {
      const lat = (i / latLines) * Math.PI;
      const points = [];
      
      for (let j = 0; j <= lonLines; j++) {
        const lon = (j / lonLines) * Math.PI * 2;
        const x = globeRadius * Math.sin(lat) * Math.cos(lon);
        const y = globeRadius * Math.cos(lat);
        const z = globeRadius * Math.sin(lat) * Math.sin(lon);
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x71717a,
        transparent: true,
        opacity: i % 4 === 0 ? 0.25 : 0.12, // Emphasize major lines
      });
      const line = new THREE.Line(lineGeo, lineMat);
      core.add(line);
    }

    // Create longitude lines
    for (let i = 0; i < lonLines; i++) {
      const lon = (i / lonLines) * Math.PI * 2;
      const points = [];
      
      for (let j = 0; j <= latLines; j++) {
        const lat = (j / latLines) * Math.PI;
        const x = globeRadius * Math.sin(lat) * Math.cos(lon);
        const y = globeRadius * Math.cos(lat);
        const z = globeRadius * Math.sin(lat) * Math.sin(lon);
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x71717a,
        transparent: true,
        opacity: i % 8 === 0 ? 0.25 : 0.12, // Emphasize meridians
      });
      const line = new THREE.Line(lineGeo, lineMat);
      core.add(line);
    }

    // Glowing edge definition
    const edgesGeo = new THREE.EdgesGeometry(globeGeo, 15);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0xfafafa,
      transparent: true,
      opacity: 0.18,
      linewidth: 1.5,
    });
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);
    core.add(edges);

    // Inner atmospheric glow
    const innerGlowGeo = new THREE.SphereGeometry(globeRadius - 5, 64, 64);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    core.add(innerGlow);

    // Outer volumetric aura - multiple layers
    const auraLayers = [
      { radius: globeRadius + 20, opacity: 0.06, color: 0xffffff },
      { radius: globeRadius + 40, opacity: 0.04, color: 0xe4e4e7 },
      { radius: globeRadius + 65, opacity: 0.025, color: 0xd4d4d8 },
    ];

    auraLayers.forEach(layer => {
      const auraGeo = new THREE.SphereGeometry(layer.radius, 48, 48);
      const auraMat = new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.opacity,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      });
      const aura = new THREE.Mesh(auraGeo, auraMat);
      core.add(aura);
    });

    // Rotating outer shell with different speed
    const shellGeo = new THREE.SphereGeometry(globeRadius + 2, 64, 64);
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.15,
      wireframe: true,
    });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    core.add(shell);

    // ==================== PREMIUM TRUST MARKERS ====================
    const trustMarkers = [
      { lat: 40.7128, lon: -74.0060, label: "Secure", description: "Military-grade encryption", color: 0xfafafa },
      { lat: 51.5074, lon: -0.1278, label: "Verified", description: "SOC 2 Type II + ISO 27001", color: 0xffffff },
      { lat: 35.6762, lon: 139.6503, label: "Transparent", description: "Real-time audit trails", color: 0xe4e4e7 },
      { lat: 1.3521, lon: 103.8198, label: "Regulated", description: "SEC + FCA compliant", color: 0xfafafa },
      { lat: -33.8688, lon: 151.2093, label: "Insured", description: "$500M coverage pool", color: 0xffffff },
      { lat: 52.5200, lon: 13.4050, label: "Audited", description: "Big Four verified", color: 0xe4e4e7 },
      { lat: 37.7749, lon: -122.4194, label: "Reliable", description: "99.99% uptime SLA", color: 0xfafafa },
      { lat: 22.3193, lon: 114.1694, label: "Trusted", description: "100K+ institutions", color: 0xffffff },
      { lat: 55.7558, lon: 37.6173, label: "Protected", description: "Multi-sig cold storage", color: 0xd4d4d8 },
      { lat: -23.5505, lon: -46.6333, label: "Licensed", description: "Multi-jurisdiction ops", color: 0xe4e4e7 },
      { lat: 25.2048, lon: 55.2708, label: "Backed", description: "Tier-1 VCs + banks", color: 0xfafafa },
      { lat: 19.4326, lon: -99.1332, label: "Proven", description: "$2B+ daily volume", color: 0xffffff },
    ];

    interface TrustMarker {
      dot: THREE.Mesh;
      innerGlow: THREE.Mesh;
      outerGlow: THREE.Mesh;
      ring: THREE.Mesh;
      pulseRing1: THREE.Mesh;
      pulseRing2: THREE.Mesh;
      beam: THREE.Mesh;
      data: typeof trustMarkers[0];
      pulsePhase: number;
    }

    const markerObjects: TrustMarker[] = [];

    trustMarkers.forEach((marker, index) => {
      // Convert lat/lon to 3D position
      const phi = (90 - marker.lat) * (Math.PI / 180);
      const theta = (marker.lon + 180) * (Math.PI / 180);
      
      const x = -(globeRadius + 3) * Math.sin(phi) * Math.cos(theta);
      const y = (globeRadius + 3) * Math.cos(phi);
      const z = (globeRadius + 3) * Math.sin(phi) * Math.sin(theta);

      // Core marker - high detail sphere
      const dotGeo = new THREE.SphereGeometry(4, 32, 32);
      const dotMat = new THREE.MeshPhysicalMaterial({
        color: marker.color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: marker.color,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(x, y, z);
      core.add(dot);

      // Inner intense glow
      const innerGlowGeo = new THREE.SphereGeometry(6, 24, 24);
      const innerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });
      const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
      innerGlow.position.copy(dot.position);
      core.add(innerGlow);

      // Outer soft glow
      const outerGlowGeo = new THREE.SphereGeometry(10, 24, 24);
      const outerGlowMat = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
      });
      const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
      outerGlow.position.copy(dot.position);
      core.add(outerGlow);

      // Permanent ring
      const ringGeo = new THREE.RingGeometry(8, 9, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(dot.position);
      ring.lookAt(0, 0, 0);
      core.add(ring);

      // First pulse ring
      const pulseRing1Geo = new THREE.RingGeometry(10, 11, 48);
      const pulseRing1Mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const pulseRing1 = new THREE.Mesh(pulseRing1Geo, pulseRing1Mat);
      pulseRing1.position.copy(dot.position);
      pulseRing1.lookAt(0, 0, 0);
      core.add(pulseRing1);

      // Second pulse ring (delayed)
      const pulseRing2Geo = new THREE.RingGeometry(10, 11, 48);
      const pulseRing2Mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const pulseRing2 = new THREE.Mesh(pulseRing2Geo, pulseRing2Mat);
      pulseRing2.position.copy(dot.position);
      pulseRing2.lookAt(0, 0, 0);
      core.add(pulseRing2);

      // Vertical beam effect
      const beamGeo = new THREE.CylinderGeometry(0.5, 1.5, 80, 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: marker.color,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(x, y, z);
      const direction = new THREE.Vector3(x, y, z).normalize();
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      core.add(beam);

      markerObjects.push({
        dot,
        innerGlow,
        outerGlow,
        ring,
        pulseRing1,
        pulseRing2,
        beam,
        data: marker,
        pulsePhase: index * (Math.PI * 2 / trustMarkers.length),
      });
    });

    // ==================== PREMIUM CONNECTION NETWORK ====================
    const connectionLines: THREE.Line[] = [];
    
    // Connect nearby markers with animated lines
    for (let i = 0; i < markerObjects.length; i++) {
      for (let j = i + 1; j < markerObjects.length; j++) {
        const distance = markerObjects[i].dot.position.distanceTo(markerObjects[j].dot.position);
        
        // Only connect if reasonably close
        if (distance < globeRadius * 1.5) {
          const curve = new THREE.QuadraticBezierCurve3(
            markerObjects[i].dot.position.clone(),
            new THREE.Vector3(0, 0, 0),
            markerObjects[j].dot.position.clone()
          );
          
          const points = curve.getPoints(32);
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          const lineMat = new THREE.LineBasicMaterial({
            color: 0xfafafa,
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
          });
          const line = new THREE.Line(lineGeo, lineMat);
          core.add(line);
          connectionLines.push(line);
        }
      }
    }

    // ==================== DATA FLOW PARTICLES ====================
    // Particles flowing along connection lines
    const flowParticleCount = 60;
    const flowParticles: { mesh: THREE.Mesh; lineIndex: number; progress: number; speed: number }[] = [];

    for (let i = 0; i < flowParticleCount; i++) {
      const particleGeo = new THREE.SphereGeometry(1, 8, 8);
      const particleMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const particle = new THREE.Mesh(particleGeo, particleMat);
      
      flowParticles.push({
        mesh: particle,
        lineIndex: Math.floor(Math.random() * connectionLines.length),
        progress: Math.random(),
        speed: 0.002 + Math.random() * 0.003,
      });
      
      core.add(particle);
    }

    // ==================== ATMOSPHERIC PARTICLES ====================
    const particleCount = isMobile ? 100 : 200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = globeRadius + 50 + Math.random() * 150;
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(theta);
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.08;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
      
      sizes[i] = Math.random() * 2 + 1;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const particleMat = new THREE.PointsMaterial({
      size: 3,
      color: 0xfafafa,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ==================== ORBITAL RINGS ====================
    const createOrbitRing = (radius: number, tilt: number, opacity: number) => {
      const points = [];
      for (let i = 0; i <= 128; i++) {
        const angle = (i / 128) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * Math.sin(tilt),
          Math.sin(angle) * radius * Math.cos(tilt)
        ));
      }
      
      const ringGeo = new THREE.BufferGeometry().setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({
        color: 0xfafafa,
        transparent: true,
        opacity: opacity,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Line(ringGeo, ringMat);
    };

    const orbitRing1 = createOrbitRing(globeRadius + 90, 0.3, 0.15);
    const orbitRing2 = createOrbitRing(globeRadius + 110, -0.5, 0.12);
    const orbitRing3 = createOrbitRing(globeRadius + 130, 0.7, 0.1);
    scene.add(orbitRing1, orbitRing2, orbitRing3);

    // ==================== ANIMATION ENGINE ====================
    let time = 0;
    const startTime = performance.now();

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // ==================== RENDER LOOP ====================
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      time = (performance.now() - startTime) * 0.001;

      // Ultra-smooth parallax
      mouseX += (targetMouseX - mouseX) * 0.015;
      mouseY += (targetMouseY - mouseY) * 0.015;

      // Globe rotation - elegant and slow
      core.rotation.y += 0.0008;
      core.rotation.x = Math.sin(time * 0.08) * 0.03;
      
      // Counter-rotate shell for depth
      shell.rotation.y -= 0.0005;

      // Orbit rings rotation
      orbitRing1.rotation.z += 0.0003;
      orbitRing2.rotation.z -= 0.0004;
      orbitRing3.rotation.z += 0.0002;

      // Trust markers - sophisticated pulse animation
      markerObjects.forEach((marker, index) => {
        const pulseSpeed = 1.5;
        const pulse = Math.sin(time * pulseSpeed + marker.pulsePhase);
        const normalizedPulse = (pulse + 1) / 2;

        // Core dot animations
        const dotMat = marker.dot.material as THREE.MeshPhysicalMaterial;
        dotMat.emissiveIntensity = 0.8 + normalizedPulse * 0.5;
        marker.dot.scale.setScalar(1 + normalizedPulse * 0.25);

        // Glow layers
        const innerGlowMat = marker.innerGlow.material as THREE.MeshBasicMaterial;
        innerGlowMat.opacity = 0.5 + normalizedPulse * 0.3;
        marker.innerGlow.scale.setScalar(1 + normalizedPulse * 0.4);

        const outerGlowMat = marker.outerGlow.material as THREE.MeshBasicMaterial;
        outerGlowMat.opacity = 0.25 + normalizedPulse * 0.15;
        marker.outerGlow.scale.setScalar(1 + normalizedPulse * 0.5);

        // Ring pulse
        const ringMat = marker.ring.material as THREE.MeshBasicMaterial;
        ringMat.opacity = 0.5 - normalizedPulse * 0.2;
        marker.ring.scale.setScalar(1 + normalizedPulse * 0.1);

        // First pulse ring
        if (normalizedPulse > 0.7) {
          const phase1 = (normalizedPulse - 0.7) / 0.3;
          const pulse1Mat = marker.pulseRing1.material as THREE.MeshBasicMaterial;
          marker.pulseRing1.scale.setScalar(1 + phase1 * 2.5);
          pulse1Mat.opacity = 0.8 * (1 - phase1);
        } else {
          (marker.pulseRing1.material as THREE.MeshBasicMaterial).opacity = 0;
        }

        // Second pulse ring (delayed)
        if (normalizedPulse > 0.85) {
          const phase2 = (normalizedPulse - 0.85) / 0.15;
          const pulse2Mat = marker.pulseRing2.material as THREE.MeshBasicMaterial;
          marker.pulseRing2.scale.setScalar(1 + phase2 * 3);
          pulse2Mat.opacity = 0.6 * (1 - phase2);
        } else {
          (marker.pulseRing2.material as THREE.MeshBasicMaterial).opacity = 0;
        }

        // Beam intensity
        const beamMat = marker.beam.material as THREE.MeshBasicMaterial;
        beamMat.opacity = 0.15 + normalizedPulse * 0.1;
      });

      // Animate connection lines
      connectionLines.forEach((line, index) => {
        const lineMat = line.material as THREE.LineBasicMaterial;
        lineMat.opacity = 0.12 + Math.sin(time * 2 + index) * 0.06;
      });

      // Flow particles along connections
      flowParticles.forEach(fp => {
        if (connectionLines[fp.lineIndex]) {
          fp.progress += fp.speed;
          if (fp.progress > 1) {
            fp.progress = 0;
            fp.lineIndex = Math.floor(Math.random() * connectionLines.length);
          }

          const line = connectionLines[fp.lineIndex];
          const positions = line.geometry.attributes.position.array;
          const pointCount = positions.length / 3;
          const index = Math.floor(fp.progress * (pointCount - 1));
          
          if (index < pointCount - 1) {
            const t = (fp.progress * (pointCount - 1)) - index;
            const x1 = positions[index * 3];
            const y1 = positions[index * 3 + 1];
            const z1 = positions[index * 3 + 2];
            const x2 = positions[(index + 1) * 3];
            const y2 = positions[(index + 1) * 3 + 1];
            const z2 = positions[(index + 1) * 3 + 2];
            
            fp.mesh.position.set(
              x1 + (x2 - x1) * t,
              y1 + (y2 - y1) * t,
              z1 + (z2 - z1) * t
            );
            
            (fp.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 * Math.sin(fp.progress * Math.PI);
          }
        }
      });

      // Atmospheric particle drift
      const particlePositions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] += velocities[i * 3];
        particlePositions[i * 3 + 1] += velocities[i * 3 + 1];
        particlePositions[i * 3 + 2] += velocities[i * 3 + 2];

        const distance = Math.sqrt(
          particlePositions[i * 3] ** 2 +
          particlePositions[i * 3 + 1] ** 2 +
          particlePositions[i * 3 + 2] ** 2
        );

        if (distance > globeRadius + 250 || distance < globeRadius + 50) {
          velocities[i * 3] *= -0.95;
          velocities[i * 3 + 1] *= -0.95;
          velocities[i * 3 + 2] *= -0.95;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Dynamic lighting choreography
      spotLight1.position.x = 500 + Math.sin(time * 0.25) * 300;
      spotLight1.position.y = 700 + Math.cos(time * 0.3) * 200;
      spotLight1.intensity = 3.0 + Math.sin(time * 0.5) * 0.5;

      spotLight2.position.x = -400 + Math.cos(time * 0.28) * 250;
      spotLight2.position.z = 700 + Math.sin(time * 0.35) * 200;
      spotLight2.intensity = 2.2 + Math.sin(time * 0.6) * 0.4;

      fillLight1.intensity = 2.0 + Math.sin(time * 0.4) * 0.3;
      fillLight2.intensity = 1.5 + Math.cos(time * 0.45) * 0.25;
      
      accentLight1.intensity = 1.8 + Math.sin(time * 0.7) * 0.3;
      accentLight1.position.x = 350 + Math.sin(time * 0.3) * 150;
      
      accentLight2.intensity = 1.5 + Math.cos(time * 0.65) * 0.25;
      accentLight2.position.y = 400 + Math.cos(time * 0.4) * 100;

      rimLight1.intensity = 2.5 + Math.sin(time * 0.55) * 0.4;
      rimLight2.intensity = 1.8 + Math.cos(time * 0.5) * 0.3;

      // Cinematic camera parallax
      const parallaxStrength = 35;
      const parallaxY = 25;
      camera.position.x += (mouseX * parallaxStrength - camera.position.x) * 0.025;
      camera.position.y += (mouseY * parallaxY - camera.position.y) * 0.025;
      
      // Subtle camera drift for life
      camera.position.x += Math.sin(time * 0.1) * 0.3;
      camera.position.y += Math.cos(time * 0.12) * 0.2;
      
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // ==================== RESPONSIVE RESIZE ====================
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    };
    window.addEventListener("resize", handleResize);

    // ==================== SCROLL INTERACTION ====================
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const fadeDistance = container.clientHeight * 0.8;
      const scrollProgress = Math.min(scrollTop / fadeDistance, 1);
      
      // Smooth fade out
      const opacity = Math.max(0, 1 - scrollProgress * 1.2);
      renderer.domElement.style.opacity = `${opacity}`;
      
      // Subtle zoom and rotation on scroll
      camera.position.z = 700 - scrollProgress * 80;
      core.rotation.y += scrollProgress * 0.001;
    };
    window.addEventListener("scroll", handleScroll);

    // ==================== CLEANUP ====================
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => mat.dispose());
            } else {
              object.material.dispose();
            }
          }
        } else if (object instanceof THREE.Line || object instanceof THREE.Points) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) (object.material as THREE.Material).dispose();
        }
      });

      renderer.dispose();
      
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        zIndex: 5,
        pointerEvents: "none",
        mixBlendMode: "screen",
        opacity: 1,
        transition: "opacity 0.4s ease-out",
      }}
    />
  );
}