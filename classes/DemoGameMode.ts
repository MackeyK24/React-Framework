import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core";
import { SceneManager, ScriptComponent, LocalMessageBus, GameModeController } from "@babylonjs-toolkit/next";
import { ThirdPersonPlayerController } from "@babylonjs-toolkit/dlc";
import { SceneViewerProps } from "../system/babylon";
import GameManager from "../globals";

export class DemoGameMode extends GameModeController {
    
    constructor(transform: TransformNode, scene: Scene, properties: any = {}, alias: string = "DemoGameMode") {
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
        /* Destroy component function */
    }

    /* Game Mode Controller Functions */

    protected async onSceneReady(props: SceneViewerProps): Promise<void> {
        setTimeout(async () => {

            console.log("DemoGameMode - Ready");
            await this.initializeGameMode(props);

        }, 1000); // Note: Timeout is ensure this runs after the main scene ready event processing completes
    }

    protected async initializeGameMode(props: SceneViewerProps): Promise<void> {
        try {
            /** Initialize the demo player controller game mode */
            const player = this.scene.getNodeByName("PlayerArmature") as TransformNode;
            if (player != null) {
                const controller = new ThirdPersonPlayerController(player, this.scene, { arrowKeyRotation: true, smoothMotionSpeed:true, smoothChangeRate: 25.0 });
                controller.enableInput = true;
                controller.attachCamera = true;
                controller.moveSpeed = 5.335;
                controller.walkSpeed = 2.0;
                controller.jumpSpeed = 12.0;
            }
        } catch (e) {
            console.error("Failed to initialize demo game mode", e);
        } finally {
            GameManager.HideSplashScreen(this.scene, GameManager.HideSplashScreenDelay);
        }
    }
}

SceneManager.RegisterClass("DemoGameMode", DemoGameMode);