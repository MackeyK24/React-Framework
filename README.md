# React Framework Submodule

The Babylon Toolkit React Framework submodule is a starting template for your project to enable the interactive scene viewer.

To add submodule:
```
git submodule add https://github.com/MackeyK24/React-Framework.git src/babylon
git commit -m "Add React-Framework as babylon submodule"
```

To remove submodule:
```
git submodule deinit -f src/babylon
git rm -f src/babylon
rm -rf .git/modules/src/babylon
git commit -m "Removed babylon submodule"
```

Note: Once the submodule has been added, to update, its best make sure any changes are backed up. Remove the submodule to clean add the submodule again to get new updates.

---

# WEBGPU Script Engine Location

```
await webgpuEngine.initAsync(
    { jsPath: "scripts/glslang.js", wasmPath: "scripts/glslang.wasm" },
    { jsPath: "scripts/twgsl.js", wasmPath: "scripts/twgsl.wasm" }
);
```