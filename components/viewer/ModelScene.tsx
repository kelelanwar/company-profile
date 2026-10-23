"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Box3, Mesh, Vector3 } from "three";

type Props = {
  /** Public path of a Draco/compressed .glb, e.g. `/models/villa-ubud.glb`. */
  url: string;
};

function disposeObject(object: import("three").Object3D) {
  object.traverse((child) => {
    if (!(child instanceof Mesh)) return;

    child.geometry.dispose();
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

/** Loads a real project model, centers it, and scales it to a 4-unit footprint. */
export function ModelScene({ url }: Props) {
  const { scene } = useGLTF(url);

  const model = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new Box3().setFromObject(cloned);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const longest = Math.max(size.x, size.y, size.z) || 1;

    return {
      cloned,
      scale: 4 / longest,
      offset: [-center.x, -box.min.y, -center.z] as [number, number, number],
    };
  }, [scene]);

  useEffect(() => {
    return () => {
      disposeObject(model.cloned);
      useGLTF.clear(url);
    };
  }, [model, url]);

  return (
    <group scale={model.scale}>
      <primitive object={model.cloned} position={model.offset} />
    </group>
  );
}
