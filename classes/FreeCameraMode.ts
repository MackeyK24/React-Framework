import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { SceneManager, ScriptComponent, LocalMessageBus, GameModeController } from "@babylonjs-toolkit/next";
import { SceneViewerProps } from "../system/babylon";
import GameManager from "../globals";

export class FreeCameraMode extends GameModeController {
    private camera: FreeCamera | null = null;

    constructor(transform: TransformNode, scene: Scene, properties: any = {}, alias: string = "FreeCameraMode") {
        super(transform, scene, properties, alias);
    }
    
    protected async createScene(props: SceneViewerProps): Promise<void> {
        try {

            /** Initialize free camera mode */
            this.camera = new FreeCamera("FreeCamera", new Vector3(0, 5, -10), this.scene);
            const canvas = this.scene.getEngine().getRenderingCanvas();
            if (canvas)this.camera.attachControl(canvas, true);

        } catch (e) {
            console.error("Failed to initialize free camera game mode", e);
        } finally {
            GameManager.HideSplashScreen(this.scene, GameManager.HideSplashScreenDelay);
        }
    }

    protected destroy(): void {
        this.camera?.dispose();
        this.camera = null;
    }
}

SceneManager.RegisterClass("FreeCameraMode", FreeCameraMode);