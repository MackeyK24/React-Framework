import { TransformNode } from "@babylonjs/core";
import { Scene } from "@babylonjs/core/scene";
import { SceneManager, GameModeController } from "@babylonjs-toolkit/next";
import { ThirdPersonPlayerController } from "@babylonjs-toolkit/dlc";

export class DemoGameMode extends GameModeController {
    
    constructor(transform: TransformNode, scene: Scene, properties: any = {}, alias: string = "DemoGameMode") {
        super(transform, scene, properties, alias);
    }
    
    protected async createScene(props: any): Promise<void> {
        // Initialize the third person player controller
        const player = this.scene.getNodeByName("PlayerArmature") as TransformNode;
        if (player != null) {
            const controller = new ThirdPersonPlayerController(player, this.scene, { arrowKeyRotation: true, smoothMotionSpeed:true, smoothChangeRate: 25.0 });
            controller.enableInput = true;
            controller.attachCamera = true;
            controller.moveSpeed = 5.335;
            controller.walkSpeed = 2.0;
            controller.jumpSpeed = 12.0;
        }
    }
}

SceneManager.RegisterClass("DemoGameMode", DemoGameMode);