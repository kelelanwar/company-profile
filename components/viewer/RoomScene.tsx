"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Mesh, type Material, type MeshStandardMaterial, type Object3D } from "three";
import { demoRoom, type RoomPiece } from "@/lib/data";

/** Softens the Kenney palette so the demo reads closer to Geost's tone. */
const tonedMaterials = new WeakSet<Material>();

function toneMaterial(material: Material) {
  if (tonedMaterials.has(material)) return;

  const color = (material as MeshStandardMaterial).color;
  if (!color) return;

  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL(hsl.h, hsl.s * 0.45, Math.min(hsl.l, 0.88));

  tonedMaterials.add(material);
}

function disposeObject(object: Object3D) {
  object.traverse((child) => {
    if (!(child instanceof Mesh)) return;

    child.geometry.dispose();
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

function Piece({ piece }: { piece: RoomPiece }) {
  const url = `/models/kenney/${piece.model}.glb`;
  const { scene } = useGLTF(url);

  const object = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach(toneMaterial);
      }
    });
    return cloned;
  }, [scene]);

  useEffect(() => {
    return () => {
      disposeObject(object);
      useGLTF.clear(url);
    };
  }, [object, url]);

  return (
    <primitive
      object={object}
      position={piece.position}
      rotation={[0, piece.rotationY ?? 0, 0]}
      scale={piece.scale ?? 1}
    />
  );
}

/** Interactive demo interior assembled from the Kenney furniture kit. */
export function RoomScene() {
  return (
    <group position={demoRoom.offset} scale={demoRoom.scale}>
      {demoRoom.pieces.map((piece, index) => (
        <Piece key={`${piece.model}-${index}`} piece={piece} />
      ))}
    </group>
  );
}
