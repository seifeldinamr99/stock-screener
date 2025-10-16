import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const RELATIONSHIP_COLORS = {
  Partner: 0x0ea5e9,
  Supplier: 0xf97316,
  Subsidiary: 0x22c55e,
  Investor: 0xa855f7,
  Competitor: 0xf97373,
  Default: 0x38bdf8
};

const createNodeColor = (relationshipType) => {
  const key = relationshipType && RELATIONSHIP_COLORS[relationshipType]
    ? relationshipType
    : 'Default';
  return RELATIONSHIP_COLORS[key];
};

const goldenSpiralPosition = (index, total, radius) => {
  const phi = Math.acos(-1 + (2 * index) / total);
  const theta = Math.sqrt(total * Math.PI) * phi;
  const x = radius * Math.cos(theta) * Math.sin(phi);
  const y = radius * Math.sin(theta) * Math.sin(phi);
  const z = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

const NetworkCanvas = forwardRef(({ data, autoRotate, onSelectCompany }, ref) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  const animationIdRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const selectedNodeRef = useRef(null);

  const clearNetwork = useCallback(() => {
    if (!sceneRef.current) return;

    nodesRef.current.forEach(({ mesh }) => {
      sceneRef.current.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    edgesRef.current.forEach(({ line }) => {
      sceneRef.current.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });

    nodesRef.current = [];
    edgesRef.current = [];
    selectedNodeRef.current = null;
  }, []);

  const buildNetwork = useCallback(() => {
    if (!sceneRef.current) return;

    clearNetwork();

    const scene = sceneRef.current;

    // Lenovo hub
    const lenovoMaterial = new THREE.MeshPhongMaterial({
      color: 0x0d9488,
      emissive: 0x0f766e,
      emissiveIntensity: 0.5,
      shininess: 120
    });
    const lenovoMesh = new THREE.Mesh(
      new THREE.SphereGeometry(10, 32, 32),
      lenovoMaterial
    );
    scene.add(lenovoMesh);
    nodesRef.current.push({ mesh: lenovoMesh, data: { company_name: 'Lenovo' } });

    if (!Array.isArray(data) || data.length === 0) {
      return;
    }

    const radius = 180;
    data.forEach((company, index) => {
      const position = goldenSpiralPosition(index + 1, data.length + 1, radius);
      const color = createNodeColor(company.relationship_type);

      const material = new THREE.MeshPhongMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        shininess: 80
      });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 16), material);
      sphere.position.copy(position);
      scene.add(sphere);

      nodesRef.current.push({ mesh: sphere, data: company });

      const geometry = new THREE.BufferGeometry().setFromPoints([
        position,
        new THREE.Vector3(0, 0, 0)
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.35,
        linewidth: 2
      });
      const line = new THREE.Line(geometry, lineMaterial);
      scene.add(line);
      edgesRef.current.push({ line, data: company });
    });
  }, [clearNetwork, data]);

  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.update();
    }
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationIdRef.current = requestAnimationFrame(animate);
  }, [autoRotate]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      1,
      1000
    );
    camera.position.set(0, 0, 320);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.6;
    controls.minDistance = 80;
    controls.maxDistance = 500;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(60, 80, 100);
    scene.add(dirLight);

    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current || !containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      rendererRef.current.setSize(clientWidth, clientHeight);
      cameraRef.current.aspect = clientWidth / clientHeight;
      cameraRef.current.updateProjectionMatrix();
    };

    const handlePointerMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerDown = () => {
      if (!raycasterRef.current || !cameraRef.current || !sceneRef.current) return;
      raycasterRef.current.setFromCamera(pointerRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(
        nodesRef.current.map(({ mesh }) => mesh)
      );

      if (intersects.length > 0) {
        const mesh = intersects[0].object;
        const node = nodesRef.current.find((entry) => entry.mesh === mesh);
        if (node && node.data) {
          if (selectedNodeRef.current && selectedNodeRef.current.mesh !== mesh) {
            selectedNodeRef.current.mesh.scale.set(1, 1, 1);
          }
          mesh.scale.set(1.4, 1.4, 1.4);
          selectedNodeRef.current = node;
          onSelectCompany(node.data);
        }
      } else if (selectedNodeRef.current) {
        selectedNodeRef.current.mesh.scale.set(1, 1, 1);
        selectedNodeRef.current = null;
        onSelectCompany(null);
      }
    };

    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    buildNetwork();
    animate();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      controls.dispose();
      renderer.dispose();
      clearNetwork();
      scene.clear();
      container.removeChild(renderer.domElement);
    };
  }, [animate, autoRotate, buildNetwork, clearNetwork, onSelectCompany]);

  useEffect(() => {
    buildNetwork();
  }, [buildNetwork]);

  useEffect(() => {
    animate();
    return () => cancelAnimationFrame(animationIdRef.current);
  }, [animate]);

  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 0, 320);
    controlsRef.current.target.set(0, 0, 0);
  }, []);

  const focusLenovo = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 0, 150);
    controlsRef.current.target.set(0, 0, 0);
  }, []);

  useImperativeHandle(ref, () => ({
    resetCamera,
    focusLenovo
  }), [focusLenovo, resetCamera]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#0f172a'
      }}
    />
  );
});

export default NetworkCanvas;
