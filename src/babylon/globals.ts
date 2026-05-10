'use client';

import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";
import { SceneManager, LocalMessageBus } from "@babylonjs-toolkit/next";

// Preload Game Mode Side Effects
import "./classes/DefaultGameMode"; 
import "./classes/PlayerControllerDemo"; 
import "./classes/RaycastVehicleDemo"; 

class GameManager {
    /** Initialize the game runtime environment */
    public static async InitializeRuntime(scene:Scene, enablePhysics:boolean = true, showLoadingScreen:boolean = true, hideEngineLoadingUI:boolean = false): Promise<void> {
        if (scene.isDisposed) return; // Note: Strict mode safety
        await SceneManager.InitializeRuntime(scene.getEngine(), { showDefaultLoadingScreen: showLoadingScreen, hideLoadingUIWithEngine: hideEngineLoadingUI });
        if (GameManager.IsDevelopmentMode) await import("@babylonjs/inspector");
        await import("@babylonjs-toolkit/dlc/DebugInformation");
        await import("@babylonjs-toolkit/dlc/DefaultCameraSystem");
        await import("@babylonjs-toolkit/dlc/MobileInputController");
        await import("@babylonjs-toolkit/dlc/ThirdPersonPlayerController");
        if (scene.isDisposed) return; // Note: Strict mode safety

        // Set React Navigation Hook (Note: Remark or remove to disable navigation from scene)
        // DEPREACTED - SceneManager.SetReactNavigationHook(scene, navigateToFunction);

        // Havok is only loaded once globally AFTER SceneManager.InitializeRuntime
        if (enablePhysics)
        {
            if (globalThis.HK == null || globalThis.HKP == null)
            {
                // @ts-ignore - This initializes fresh physics for this scene
                globalThis.HK = await HavokPhysics();
                globalThis.HKP = new HavokPlugin(false);
            }
            if (!scene.isDisposed && globalThis.HK != null && globalThis.HKP != null)
            {
                scene.enablePhysics(new Vector3(0,-9.81,0), globalThis.HKP);
            }
            const cleanupGlobals = () =>
            {
                if (globalThis["HKP"]) delete globalThis["HKP"];
                if (globalThis["HK"]) delete globalThis["HK"];
            };
            if (!scene.isDisposed)
            {
                scene.onDisposeObservable.addOnce(cleanupGlobals);
            }
            else
            {
                cleanupGlobals(); // Note: Force clean up if scene was disposed already
            }
        }
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Splash Screen State
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /** Show the splash screen */
    public static ShowSplashScreen(): void {
        const splash = document.getElementById("xbabylonjsSplashScreen");
        if (splash) splash.style.display = "block";
    }
    /** Hide the splash screen with optional delay and fade effect */
    public static HideSplashScreen(scene: Scene = null, delay: number = 0): void {
        setTimeout(() => {
            if (scene != null && !scene.isDisposed) {
                SceneManager.HideLoadingScreen(scene.getEngine());
                SceneManager.FocusRenderCanvas(scene);
            }
            const splash = document.getElementById("xbabylonjsSplashScreen");
            if (splash) {
                splash.style.opacity = "0";
                const onFadeEnd = () => {
                    splash.style.display = "none";
                    splash.removeEventListener("transitionend", onFadeEnd);
                };
                splash.addEventListener("transitionend", onFadeEnd);
            }
        }, delay);
    }
    /** Update the status text on the splash screen (Direct Access Hack) */
    public static UpdateSplashScreenStatus(text: string): void {
        const splash = document.getElementById("xbabylonjsSplashScreen");
        if (splash) {
            splash.style.display = "block";
            const status = splash.querySelector("#xbabylonjsStatusTextDiv");
            if (status) status.textContent = text;
        }
    }
    /** KEEP-FOR-REFERENCE: Navigate to the classic demo scene with optional page reload (Note: This is just an example of navigation from scene, replace or remove as needed) */
    // public static ClassicNavigateToHack(reload: boolean): void {
    //     window.history.pushState(
    //     {
    //         fromApp: true,
    //         rootPath: "/scenes/",
    //         sceneFile: "samplescene.gltf",
    //         gameMode: "PlayerControllerDemo",
    //         importMeshes: ["playerarmature.gltf"],
    //         hideSplashScreen: true
    //     },
    //     "",
    //     "/play"
    //     );
    //     if (reload) {
    //         window.location.reload();
    //     } else {
    //         window.dispatchEvent(new PopStateEvent("popstate"));
    //     }
    // }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Global Navigation State
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // /**
    //  * Executes a React router navigation to the specified route
    //  * @param scene The scene instance.
    //  * @param route The route path to navigate.
    //  * @param options The navigation options.
    //  * @optional To force a full page reload, use: window.location assign or replace to set the route. (No From App State Supported)
    //  * @optional Use { replace: true } in nav options to replace current history entry instead of pushing a new one.
    //  * @example SceneManager.NavigateTo(scene, "/babylon?scene=samplescene.gltf", { replace: true });
    //  */
    // public static NavigateTo(scene: BABYLON.Scene, route: string, options: any = null, useWindowLocation: boolean = false): void {
    //     if (useWindowLocation === true) {
    //         // Note: Force Full Page Reload Navigation
    //         if (options?.replace === true) {
    //             window.location.replace(route);
    //         } else {
    //             window.location.assign(route);
    //         }
    //         return;
    //     }
    //     //////////////////////////////////////////////////////////////////////////////////////////////////////              
    //     // React Router Navigation
    //     // Requires SetReactNavigationHook to be set on scene.
    //     // Note: Example react protected route navigate("/demo", { state: { fromApp: true } });
    //     //////////////////////////////////////////////////////////////////////////////////////////////////////              
    //     if ((scene as any).reactNavigationFunction != null) {
    //         const navOptions = { ...options, state: { ...(options?.state || {}), fromApp: true } };
    //         (scene as any).reactNavigationFunction(route, navOptions);
    //     } else {
    //         console.warn("React navigation hook is not set on the scene.");
    //     }
    // }
    // /** Sets the React router navigation hook on the scene
    //  * @param scene The scene instance.
    //  * @param navigateToFunction The react router navigate function.
    //  */
    // public static SetReactNavigationHook(scene: BABYLON.Scene, navigateToFunction: any): void {
    //     (scene as any).reactNavigationFunction = navigateToFunction;
    // }
    // /** Deletes the React router navigation hook on the scene
    //  * @param scene The scene instance.
    //  */
    // public static DeleteReactNavigationHook(scene: BABYLON.Scene): void {
    //     if ((scene as any).reactNavigationFunction != null) {
    //         (scene as any).reactNavigationFunction = null;
    //         try { delete (scene as any).reactNavigationFunction; } catch (e) { console.warn(e); }
    //     }
    // }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Global Game State
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private static _GlobalState: any = {};
    /** Global game state */
    public static get GlobalState(): any { return GameManager._GlobalState; }
    /** Load global game state from storage */
    public static LoadGameState(storage:StorageType): void {
        if (storage === StorageType.Local) {
            const savedState = localStorage.getItem("GlobalGameState");
            if (savedState) GameManager._GlobalState = JSON.parse(savedState);
        } else if (storage === StorageType.Session) {
            const savedState = sessionStorage.getItem("GlobalGameState");
            if (savedState) GameManager._GlobalState = JSON.parse(savedState);
        }
    }
    /** Save global game state to storage */
    public static SaveGameState(storage:StorageType): void {
        if (storage === StorageType.Local) {
            localStorage.setItem("GlobalGameState", JSON.stringify(GameManager._GlobalState));
        } else if (storage === StorageType.Session) {
            sessionStorage.setItem("GlobalGameState", JSON.stringify(GameManager._GlobalState));
        }
    }
    /** Reset global game state */
    public static ResetGameState(): void {
        GameManager._GlobalState = {};
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Synchronous Message Bus
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    private static _SynchronousMessageBus: LocalMessageBus | null = null;
    /** Synchronous event message bus 
     * @examples 
     * // Handle myevent message
     * GameManager.EventBus.OnMessage("myevent", (data:string) => {
     *    console.log("My Event Data: " + data);
     * });
     * // Post myevent message
     * GameManager.EventBus.PostMessage("myevent", "Hello World!");
    */
    public static get EventBus(): LocalMessageBus {
        if (GameManager._SynchronousMessageBus == null) GameManager._SynchronousMessageBus = new LocalMessageBus();
        return GameManager._SynchronousMessageBus;
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // AWS Playground Repo
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    public static get AwsPlaygroundRepo(): string { return "https://dlyp4oy8lme1v.cloudfront.net/playground/"; }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Development Mode Flag
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    public static get IsDevelopmentMode(): boolean { return process.env.NODE_ENV === "development"; }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Configuration Constants
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    public static get HideSplashScreenDelay(): number { return 3000; }
}
export enum StorageType { Local = 0, Session = 1 }

export default GameManager;