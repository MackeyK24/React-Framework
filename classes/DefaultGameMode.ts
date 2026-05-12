import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core";
import { SceneManager, ScriptComponent, LocalMessageBus, GameModeController } from "@babylonjs-toolkit/next";
import { SceneViewerProps } from "../system/babylon";
import GameManager from "../globals";

export class DefaultGameMode extends GameModeController {
    
    constructor(transform: TransformNode, scene: Scene, properties: any = {}, alias: string = "DefaultGameMode") {
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

    protected async createScene(props: SceneViewerProps): Promise<void> {
        try {

            /* Game mode initialization here */
            
        } catch (e) {
            console.error("Failed to initialize default game mode", e);
        } finally {
            GameManager.HideSplashScreen(this.scene, GameManager.HideSplashScreenDelay);
        }
    }
}

SceneManager.RegisterClass("DefaultGameMode", DefaultGameMode);