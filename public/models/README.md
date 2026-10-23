# Models

Draco-compressed `.glb` files only — never commit `.skp`, `.blend`, or `.max`.

## Converting a SketchUp portfolio

1. **SketchUp route** — install a glTF exporter, then
   `File -> Export -> glTF/GLB`. Enable Draco compression if prompted.
2. **Blender route** — `File -> Import` the `.dae`/`.skp`, clean up materials,
   then `File -> Export -> glTF 2.0` with format `glTF Binary (.glb)` and
   compression `Draco`.
3. Keep the result **under 15 MB**. Remove hidden geometry, reduce texture size
   to 2048 px, and bake lights if the model is heavy.
4. Save as `<slug>.glb` (matching `data/projects.json`) plus
   `poster-<slug>.webp` (1600x900) for the card and loading state.
5. Add `"modelUrl": "/models/<slug>.glb"` to that project entry.

The detail page falls back to the photo gallery while `modelUrl` is `null`.
