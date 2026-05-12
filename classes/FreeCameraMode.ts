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

    protected awake(): void {
        /* Init component function */
    }

    protected start(): void {
        /* Start component function */
    }

    protected ready(): void {
        /* Execute when ready function */
    }

    protected update(): void {
        /* Update render loop function */
    }

    protected late(): void {
        /* Late update render loop function */
    }

    protected step(): void {
        /* Before physics step function (remove empty function for performance) */
    }

    protected fixed(): void {
        /* After physics step function (remove empty function for performance) */
    }

    protected after(): void {
        /* After update render loop function */
    }

    protected reset(): void {
        /* Reset component function */
    }

    protected destroy(): void {
        this.camera?.dispose();
        this.camera = null;
    }

    /* Game Mode Controller Functions */
    
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
}

SceneManager.RegisterClass("FreeCameraMode", FreeCameraMode);