import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface Photo {
  id: number;
  url: string;
  title: string;
  quote: string;
}

interface Galaxy3DProps {
  photos: Photo[];
  onSelectPhoto: (photo: Photo) => void;
}

const GALAXY_PHRASES = [
  "te quiero", "mi amor", "para siempre", "infinito ∞", "eres mi mundo",
  "nuestros sueños", "contigo todo", "alma gemela", "mi universo",
  "latido a latido", "siempre juntos", "te extraño", "mi estrella",
  "amor eterno", "cada instante", "tu sonrisa", "corazón mío",
  "te necesito", "mi hogar eres tú", "brillas en mí",
];

export default function Galaxy3D({ photos, onSelectPhoto }: Galaxy3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectPhotoRef = useRef(onSelectPhoto);

  useEffect(() => { selectPhotoRef.current = onSelectPhoto; }, [onSelectPhoto]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // ── Escena ────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(20, 18, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;

    const clock = new THREE.Clock();

    // ── Textura de partícula suave ────────────────────────────
    const particleTex = (() => {
      const c = document.createElement("canvas"); c.width = c.height = 64;
      const ctx = c.getContext("2d")!;
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.3, "rgba(255,255,255,0.6)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();

    // ── Fondo de estrellas en 4 capas ────────────────────────
    const makeStarLayer = (count: number, spread: number, size: number, color: number, opacity: number) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * spread;
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
        pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      return new THREE.Points(geo, new THREE.PointsMaterial({
        size, color, transparent: true, opacity,
        depthWrite: false, map: particleTex, blending: THREE.AdditiveBlending,
      }));
    };
    scene.add(makeStarLayer(12000, 700, 0.22, 0xffffff, 0.8));
    scene.add(makeStarLayer(4000,  600, 0.35, 0xaad4ff, 0.6));
    scene.add(makeStarLayer(3000,  550, 0.30, 0xffb6e6, 0.5));
    scene.add(makeStarLayer(600,   500, 0.55, 0xffffaa, 0.9));

    // ── Nebulosas ─────────────────────────────────────────────
    type NebulaColor = { x: number; y: number; r: number; color: string; alpha: number };
    const makeNebulaTex = (colors: NebulaColor[], size = 256) => {
      const c = document.createElement("canvas"); c.width = c.height = size;
      const ctx = c.getContext("2d")!;
      colors.forEach(({ x, y, r, color, alpha }) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const base = color.replace("A", String(alpha));
        const mid  = color.replace("A", String(alpha * 0.4));
        g.addColorStop(0, base); g.addColorStop(0.4, mid); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
      });
      return new THREE.CanvasTexture(c);
    };

    const nebulaDefs = [
      { pos: [90, 25, -60]   as [number,number,number], scale: [70, 40] as [number,number], colors: [
          { x:128,y:128,r:128, color:"rgba(200,50,180,A)",  alpha:0.45 },
          { x:80, y:100,r:90,  color:"rgba(140,20,200,A)",  alpha:0.35 },
          { x:160,y:160,r:70,  color:"rgba(255,80,150,A)",  alpha:0.30 },
      ]},
      { pos: [-80,-30,-90]   as [number,number,number], scale: [80, 50] as [number,number], colors: [
          { x:128,y:128,r:128, color:"rgba(30,100,220,A)",  alpha:0.40 },
          { x:100,y:90, r:100, color:"rgba(50,200,255,A)",  alpha:0.30 },
          { x:150,y:140,r:80,  color:"rgba(100,50,200,A)",  alpha:0.25 },
      ]},
      { pos: [-60, 50,-120]  as [number,number,number], scale: [90, 60] as [number,number], colors: [
          { x:128,y:128,r:128, color:"rgba(20,180,120,A)",  alpha:0.30 },
          { x:90, y:110,r:100, color:"rgba(50,220,100,A)",  alpha:0.20 },
          { x:170,y:80, r:80,  color:"rgba(100,200,150,A)", alpha:0.20 },
      ]},
      { pos: [120,-10,-80]   as [number,number,number], scale: [60, 45] as [number,number], colors: [
          { x:128,y:128,r:128, color:"rgba(220,80,30,A)",   alpha:0.35 },
          { x:80, y:150,r:100, color:"rgba(255,140,50,A)",  alpha:0.25 },
          { x:160,y:80, r:70,  color:"rgba(180,30,60,A)",   alpha:0.30 },
      ]},
      { pos: [0,  -50,-150]  as [number,number,number], scale: [110,75] as [number,number], colors: [
          { x:128,y:128,r:128, color:"rgba(100,0,200,A)",   alpha:0.35 },
          { x:60, y:80, r:110, color:"rgba(180,30,240,A)",  alpha:0.20 },
          { x:180,y:170,r:90,  color:"rgba(60,0,140,A)",    alpha:0.25 },
      ]},
    ];
    nebulaDefs.forEach(def => {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: makeNebulaTex(def.colors), transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      sprite.position.set(...def.pos);
      sprite.scale.set(def.scale[0], def.scale[1], 1);
      scene.add(sprite);
    });

    // ── Galaxia espiral 50k ───────────────────────────────────
    const gCount = 50000;
    const gGeo = new THREE.BufferGeometry();
    const gPos = new Float32Array(gCount * 3);
    const gCol = new Float32Array(gCount * 3);
    const cIn = new THREE.Color("#ff69b4");
    const cOut = new THREE.Color("#4b0082");
    for (let i = 0; i < gCount; i++) {
      const i3 = i * 3, r = Math.random() * 20;
      const branch = ((i % 3) / 3) * Math.PI * 2, spin = r;
      const rx = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.2 * r;
      const ry = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.2 * r;
      const rz = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.2 * r;
      gPos[i3] = Math.cos(branch + spin) * r + rx;
      gPos[i3+1] = ry;
      gPos[i3+2] = Math.sin(branch + spin) * r + rz;
      const mc = cIn.clone().lerp(cOut, r / 20);
      gCol[i3] = mc.r; gCol[i3+1] = mc.g; gCol[i3+2] = mc.b;
    }
    gGeo.setAttribute("position", new THREE.BufferAttribute(gPos, 3));
    gGeo.setAttribute("color",    new THREE.BufferAttribute(gCol, 3));
    const galaxyPoints = new THREE.Points(gGeo, new THREE.PointsMaterial({
      size: 0.1, sizeAttenuation: true, depthWrite: false,
      blending: THREE.AdditiveBlending, vertexColors: true, transparent: true, map: particleTex,
    }));
    scene.add(galaxyPoints);

    // ── Agujero negro con anillos de acreción ─────────────────
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    ));
    const coreGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x220033, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending })
    );
    scene.add(coreGlow);
    const accretionRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.18, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0xff44cc, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending })
    );
    accretionRing.rotation.x = Math.PI * 0.3;
    scene.add(accretionRing);
    const accretionRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.10, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })
    );
    accretionRing2.rotation.x = Math.PI * 0.3;
    scene.add(accretionRing2);

    // ── Corazón de partículas ─────────────────────────────────
    const heartYOffset = 15;
    const hCount = 10000;
    const hGeo = new THREE.BufferGeometry();
    const hPos = new Float32Array(hCount * 3);
    const hCol = new Float32Array(hCount * 3);
    for (let i = 0; i < hCount; i++) {
      const i3 = i * 3, t = Math.random() * Math.PI * 2, rr = 0.5 + Math.random() * 0.5;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
      hPos[i3] = x * 0.3 * rr; hPos[i3+1] = y * 0.3 * rr + heartYOffset; hPos[i3+2] = (Math.random() - 0.5) * 2;
      hCol[i3] = 1; hCol[i3+1] = 0.07; hCol[i3+2] = 0.6;
    }
    hGeo.setAttribute("position", new THREE.BufferAttribute(hPos, 3));
    hGeo.setAttribute("color",    new THREE.BufferAttribute(hCol, 3));
    const heartPoints = new THREE.Points(hGeo, new THREE.PointsMaterial({
      size: 0.15, sizeAttenuation: true, depthWrite: false,
      blending: THREE.AdditiveBlending, vertexColors: true, transparent: true, map: particleTex,
    }));
    scene.add(heartPoints);

    // ── Túnel hacia el corazón ────────────────────────────────
    const tCount = 2000;
    const tGeo = new THREE.BufferGeometry();
    const tPos2 = new Float32Array(tCount * 3);
    const tSpd = new Float32Array(tCount);
    for (let i = 0; i < tCount; i++) {
      const i3 = i * 3, a = Math.random() * Math.PI * 2, r = Math.random() * 0.5;
      tPos2[i3] = Math.cos(a) * r; tPos2[i3+1] = Math.random() * heartYOffset; tPos2[i3+2] = Math.sin(a) * r;
      tSpd[i] = 0.05 + Math.random() * 0.1;
    }
    tGeo.setAttribute("position", new THREE.BufferAttribute(tPos2, 3));
    const tunnelPoints = new THREE.Points(tGeo, new THREE.PointsMaterial({
      size: 0.05, color: 0xff69b4, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, map: particleTex,
    }));
    scene.add(tunnelPoints);

    // ── Frases flotantes ──────────────────────────────────────
    const makeTextSprite = (text: string, color: string) => {
      const c = document.createElement("canvas"); c.width = 512; c.height = 80;
      const ctx = c.getContext("2d")!;
      ctx.font = "italic 22px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowBlur = 12; ctx.shadowColor = color;
      ctx.fillStyle = color; ctx.globalAlpha = 0.7;
      ctx.fillText(text, 256, 40);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
      sp.scale.set(6, 1, 1);
      return sp;
    };
    const scatteredPhrases: THREE.Sprite[] = [];
    GALAXY_PHRASES.forEach((phrase, i) => {
      const sp = makeTextSprite(phrase, i % 2 === 0 ? "#ff69b4" : "#c084fc");
      const angle = (i / GALAXY_PHRASES.length) * Math.PI * 2 + Math.random() * 1.5;
      const radius = 5 + Math.random() * 17;
      const h = (Math.random() - 0.5) * 14;
      sp.position.set(Math.cos(angle) * radius, h, Math.sin(angle) * radius);
      sp.userData = { angle, radius, height: h, speed: (0.05 + Math.random() * 0.15) * (Math.random() < 0.5 ? 1 : -1) };
      scene.add(sp);
      scatteredPhrases.push(sp);
    });

    // ── Burbujas con fotos ────────────────────────────────────
    const bubbles: THREE.Group[] = [];
    const bubbleMeshes: THREE.Mesh[] = [];

    const makePlaceholder = () => {
      const c = document.createElement("canvas"); c.width = c.height = 256;
      const ctx = c.getContext("2d")!;
      ctx.beginPath(); ctx.arc(128, 128, 124, 0, Math.PI * 2); ctx.clip();
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, "#ff1493"); g.addColorStop(1, "#800080");
      ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "bold 90px Arial";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🩷", 128, 140);
      return c;
    };

    photos.forEach((photo, i) => {
      const group = new THREE.Group();
      const phTex = new THREE.CanvasTexture(makePlaceholder());
      const spMat = new THREE.SpriteMaterial({ map: phTex, transparent: true, depthWrite: false });
      const sprite = new THREE.Sprite(spMat);
      sprite.scale.set(3.2, 3.2, 1);
      group.add(sprite);

      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas"); c.width = c.height = 256;
        const ctx = c.getContext("2d")!;
        ctx.beginPath(); ctx.arc(128, 128, 124, 0, Math.PI * 2); ctx.clip();
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width-s)/2, (img.height-s)/2, s, s, 0, 0, 256, 256);
        ctx.strokeStyle = "rgba(255,105,180,0.9)"; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(128, 128, 120, 0, Math.PI * 2); ctx.stroke();
        const gl = ctx.createRadialGradient(128, 128, 80, 128, 128, 124);
        gl.addColorStop(0, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(255,182,193,0.25)");
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(128, 128, 124, 0, Math.PI * 2); ctx.fill();
        spMat.map = new THREE.CanvasTexture(c); spMat.needsUpdate = true;
      };
      img.src = photo.url;

      const ringDefs: [number, number, number, number][] = [
        [1.7, 0.05, 0xff69b4, 0.7], [2.05, 0.03, 0xffffff, 0.25], [2.35, 0.02, 0xcc44ff, 0.2],
      ];
      ringDefs.forEach(([r, tube, color, op]) => {
        group.add(new THREE.Mesh(
          new THREE.TorusGeometry(r, tube, 16, 100),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op })
        ));
      });

      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.8, 12, 12),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
      );
      hitMesh.userData = { photoIndex: i };
      group.add(hitMesh);
      bubbleMeshes.push(hitMesh);

      const angle = (i / photos.length) * Math.PI * 2;
      const radius = 11 + Math.random() * 6;
      const h = (Math.random() - 0.5) * 10;
      group.position.set(Math.cos(angle) * radius, h, Math.sin(angle) * radius);
      group.userData = { angle, radius, height: h, speed: 0.2 + Math.random() * 0.3 };
      scene.add(group);
      bubbles.push(group);
    });

    // ── Raycasting ────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const checkClick = (x: number, y: number) => {
      pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(bubbleMeshes);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.photoIndex;
        if (navigator.vibrate) navigator.vibrate(50);
        selectPhotoRef.current(photos[idx]);
        controls.autoRotate = false;
        for (let k = 0; k < 6; k++) {
          const h = document.createElement("div");
          h.style.cssText = `position:fixed;pointer-events:none;font-size:1.2rem;z-index:200;left:${x - 20 + Math.random() * 40}px;top:${y - 20}px;animation:floatHeart 3s ease-out forwards;animation-delay:${k * 0.12}s`;
          h.textContent = ["♡", "❤", "💕", "✨", "💫", "🌸"][k];
          document.body.appendChild(h);
          setTimeout(() => h.remove(), 3500);
        }
      }
    };

    if (!document.getElementById("heart-float-style")) {
      const style = document.createElement("style");
      style.id = "heart-float-style";
      style.textContent = `@keyframes floatHeart{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-120px) scale(0.5)}}`;
      document.head.appendChild(style);
    }

    renderer.domElement.addEventListener("click", (e) => checkClick(e.clientX, e.clientY));
    renderer.domElement.addEventListener("touchend", (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      checkClick(t.clientX, t.clientY);
    }, { passive: false });

    // ── Animación ─────────────────────────────────────────────
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      galaxyPoints.rotation.y = t * 0.05;

      const hs = 1 + Math.sin(t * 4) * 0.1;
      heartPoints.scale.set(hs, hs, hs);

      const tp = tGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < tCount; i++) {
        tp[i * 3 + 1] += tSpd[i];
        if (tp[i * 3 + 1] > heartYOffset - 2) tp[i * 3 + 1] = 0;
      }
      tGeo.attributes.position.needsUpdate = true;

      bubbles.forEach((b) => {
        b.userData.angle += b.userData.speed * 0.01;
        b.position.x = Math.cos(b.userData.angle) * b.userData.radius;
        b.position.z = Math.sin(b.userData.angle) * b.userData.radius;
        b.position.y = b.userData.height + Math.sin(t + b.userData.angle) * 0.6;
        b.children.forEach((c) => {
          if ((c as THREE.Mesh).isMesh && (c as THREE.Mesh).geometry?.type === "TorusGeometry") {
            (c as THREE.Mesh).rotation.x = t * 0.5;
          }
        });
      });

      scatteredPhrases.forEach((sp) => {
        sp.userData.angle += sp.userData.speed * 0.01;
        sp.position.x = Math.cos(sp.userData.angle) * sp.userData.radius;
        sp.position.z = Math.sin(sp.userData.angle) * sp.userData.radius;
        sp.position.y = sp.userData.height + Math.sin(t * 0.4 + sp.userData.angle) * 0.8;
      });

      coreGlow.scale.setScalar(1 + Math.sin(t * 2) * 0.15);
      accretionRing.rotation.z = t * 0.4;
      accretionRing2.rotation.z = -t * 0.6;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ────────────────────────────────────────────────
    const handleResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      gGeo.dispose(); hGeo.dispose(); tGeo.dispose();
      particleTex.dispose(); renderer.dispose(); controls.dispose();
    };
  }, [photos]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full bg-black" />;
}
