import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Streak = {
    x: number;
    y: number;
    z: number;
    speed: number;
    length: number;
    thickness: number;
    wobble: number;
    phase: number;
};

export const WindStreaks: React.FC = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const { geometry, material, streaks, bounds } = useMemo(() => {
        const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

        const material = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                uColor: { value: new THREE.Color('#ffffff') },
                uOpacity: { value: 0.12 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uOpacity;
                varying vec2 vUv;

                void main() {
                    // Fade at both ends (along x) + soft edges (along y)
                    float endFade = smoothstep(0.0, 0.18, vUv.x) * (1.0 - smoothstep(0.82, 1.0, vUv.x));
                    float edgeFade = 1.0 - smoothstep(0.35, 0.5, abs(vUv.y - 0.5));
                    float alpha = endFade * edgeFade * uOpacity;

                    if (alpha < 0.01) discard;
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
        });

        const bounds = {
            left: -10,
            right: 10,
            bottom: -7,
            top: 7,
        };

        const count = 120;
        const streaks: Streak[] = Array.from({ length: count }, () => {
            const z = (Math.random() - 0.5) * 8 - 1.5;
            const depthFactor = THREE.MathUtils.clamp(1.0 - Math.abs(z) / 6.5, 0.25, 1.0);

            return {
                x: THREE.MathUtils.lerp(bounds.left, bounds.right, Math.random()),
                y: THREE.MathUtils.lerp(bounds.bottom, bounds.top, Math.random()),
                z,
                speed: THREE.MathUtils.lerp(0.55, 1.35, Math.random()) * (0.6 + depthFactor),
                length: THREE.MathUtils.lerp(0.7, 1.6, Math.random()) * (0.7 + depthFactor * 0.6),
                thickness: THREE.MathUtils.lerp(0.03, 0.08, Math.random()) * (0.8 + depthFactor * 0.4),
                wobble: THREE.MathUtils.lerp(0.06, 0.16, Math.random()),
                phase: Math.random() * Math.PI * 2,
            };
        });

        return { geometry, material, streaks, bounds };
    }, []);

    useFrame((state, delta) => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const time = state.clock.elapsedTime;
        const dummy = new THREE.Object3D();

        for (let i = 0; i < streaks.length; i++) {
            const s = streaks[i];

            // Sideways wind + gentle vertical wobble
            s.x += s.speed * delta;
            s.y += Math.sin(time * 0.6 + s.phase) * s.wobble * delta;

            if (s.x > bounds.right + 1.5) {
                s.x = bounds.left - 1.5;
                s.y = THREE.MathUtils.lerp(bounds.bottom, bounds.top, Math.random());
            }

            dummy.position.set(s.x, s.y, s.z);
            dummy.rotation.set(0, 0, 0.06);
            dummy.scale.set(s.length, s.thickness, 1);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[geometry, material, streaks.length]} frustumCulled={false} />
    );
};
