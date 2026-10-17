# Later XR roadmap

MVP is a 2D game and is NOT currently a VR game. After desktop is stable:
1. Build an independent WebGL/Three.js 3D world renderer driven by the same world schema and NPC high-level strategies.
2. Implement OpenXR/WebXR controller input through XRInputSource, separate movement direction from HMD head rotation.
3. Replace DOM combat prompts/dialogue with deliberate immersive UI surfaces. Validate field of view, font legibility and comfort on Quest 3.
4. Keep NPC movement and collision deterministic and separate from display refresh. Minimize draw calls and profiling cost.
5. Test on real headset over HTTPS; desktop emulator tests are insufficient.
Do not label VR as delivered until an actual headset test passes.
