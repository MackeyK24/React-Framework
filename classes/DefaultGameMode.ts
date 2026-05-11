import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core";
import { SceneManager, ScriptComponent, LocalMessageBus } from "@babylonjs-toolkit/next";
import GameManager from "../globals";

export class DefaultGameMode extends ScriptComponent {
    private readonly onSceneReadyHandler = (data: any) => { this.onSceneReady(data); };

    constructor(transform: TransformNode, scene: Scene, properties: any = {}, alias: string = "DefaultGameMode") {
        super(transform, scene, properties, alias);
        GameManager.EventBus.OnMessage("OnSceneReady", this.onSceneReadyHandler);
    }

    protected onSceneReady(data: any): void {
        setTimeout(() => { // Note: Timeout is a workaround to ensure this runs after the scene ready event processing completes
            this.finishSceneReady(data);
        }, 1000);
    }

    protected finishSceneReady(data: any): void {
        console.log("DefaultGameMode - Ready");
    }

    public override dispose(): void {
        GameManager.EventBus.RemoveHandler("OnSceneReady", this.onSceneReadyHandler);
        super.dispose();
    }
}

SceneManager.RegisterClass("DefaultGameMode", DefaultGameMode);