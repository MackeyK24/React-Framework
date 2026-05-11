'use client';

import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";
import { SceneManager, LocalMessageBus } from "@babylonjs-toolkit/next";
import { INavigationState, UnifiedNavigateFunction, UnifiedNavigationOptions } from "./system/platform";

// Preload Game Mode Side Effects
import "./classes/DefaultGameMode"; 
import "./classes/FreeCameraMode"; 
import "./classes/DemoGameMode";

class GameManager {
    /** Initialize the game runtime environment */
    public static async InitializeRuntime(scene:Scene, navigateToFunction: UnifiedNavigateFunction | null = null, enablePhysics:boolean = true, showLoadingScreen:boolean = true, hideEngineLoadingUI:boolean = false): Promise<void> {
        if (scene.isDisposed) return; // Note: Strict mode safety
        await SceneManager.InitializeRuntime(scene.getEngine(), { showDefaultLoadingScreen: showLoadingScreen, hideLoadingUIWithEngine: hideEngineLoadingUI });
        if (GameManager.IsDevelopmentMode) await import("@babylonjs/inspector");
        await import("@babylonjs-toolkit/dlc/DebugInformation");
        await import("@babylonjs-toolkit/dlc/DefaultCameraSystem");
        await import("@babylonjs-toolkit/dlc/MobileInputController");
        await import("@babylonjs-toolkit/dlc/ThirdPersonPlayerController");
        if (scene.isDisposed) return; // Note: Strict mode safety

        // Set React Navigation Hook
        GameManager.SetReactNavigationHook(navigateToFunction);

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

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Window Location State
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Sets the window location to navigate to a new route.
     * @param route The route path to navigate.
     * @param options The navigation options.
     * @optional Use { replace: true } in nav options to replace current history entry instead of pushing a new one.
     * @example GameManager.SetWindowLocation("/play?scene=samplescene.gltf&mode=FreeCameraMode", { replace: true });
     */
    public static SetWindowLocation(route: string, options: any = null): void {
        // Note: Force Full Page Reload Navigation
        if (options?.replace === true) {
            window.location.replace(route);
        } else {
            window.location.assign(route);
        }
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Global Navigation State
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static ReactNavigationFunction: UnifiedNavigateFunction | null = null;
    /**
     * Executes a cross-platform navigation to the specified route.
     * @param route The route path to navigate to.
     * @param state Optional navigation state to pass to the destination route.
     *
     * @example
     * GameManager.NavigateTo("/play", {
     *     gameMode: "DefaultGameMode",
     *     rootPath: GameManager.AwsPlaygroundRepo,
     *     sceneFile: "samplescene.gltf",
     * });
     */
    public static NavigateTo(route: string, state: INavigationState | null = null): void {
        //////////////////////////////////////////////////////////////////////////////////////////////////////              
        // Cross Platform Router Navigation (React, Next.js, Gatsby, etc.)
        // Requires Unified Navigation Adapter to be setup in host project.
        //////////////////////////////////////////////////////////////////////////////////////////////////////              
        if (GameManager.ReactNavigationFunction != null) {
            const navOptions: UnifiedNavigationOptions = {
                state: {
                    ...(state ?? {}),
                    fromApp: true,
                },
            };
            GameManager.ReactNavigationFunction(route, navOptions);
        } else {
            console.warn("React navigation hook is not set on the game manager.");
        }
    }
    /** Checks if the React router navigation hook is set on the game manager.
     * @returns True if the React navigation hook is set, false otherwise.
     */
    public static HasReactNavigationHook(): boolean {
        return GameManager.ReactNavigationFunction != null;
    }
    /** Sets the React router navigation hook on the game manager for in-game navigation from scenes and UI components.
     * @param navigateToFunction The react router navigate function.
     */
    public static SetReactNavigationHook(navigateToFunction: UnifiedNavigateFunction | null): void {
        GameManager.ReactNavigationFunction = navigateToFunction;
    }
    /** Deletes the React router navigation hook on the game manager to prevent memory leaks and unintended navigation after scene disposal.
     */
    public static DeleteReactNavigationHook(): void {
        if (GameManager.ReactNavigationFunction != null) {
            GameManager.ReactNavigationFunction = null;
        }
    }

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