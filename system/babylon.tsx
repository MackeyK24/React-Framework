'use client';

import { Scene } from "@babylonjs/core/scene";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Nullable } from "@babylonjs/core/types";
import { Observer } from "@babylonjs/core/Misc/observable";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { ISceneLoaderProgressEvent, ImportMeshAsync, LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { SceneManager, ScriptComponent, Utilities } from "@babylonjs-toolkit/next";
import { useCallback } from "react";
import { useUnifiedNavigation } from "./platform";
import BaseSceneViewer from "./viewer";
import CustomOverlay from "../custom/overlay";
import SplashScreen from "../custom/splash";
import GameManager from "../globals";
import "./babylon.css";

export declare type SceneViewerProps = {
  fullPage?: boolean;
  gameMode?: string;
  sceneUrl?: string;
  assetFiles?: string[];
  importMeshes?: string[];
  auxiliaryData?: any;
  allowQueryParams?: boolean;
  enableCustomOverlay?: boolean;
};

type AssetProgressMessage = {
  assetName?: string;
  fileName?: string;
  rootPath?: string;
  sceneFile?: string;
  loadedBytes?: number;
  totalBytes?: number;
  percent?: number;
  aggregateLoadedBytes?: number;
  aggregateTotalBytes?: number;
  aggregatePercent?: number;
  completedAssets?: number;
  totalAssets?: number;
  overallPercent?: number;
  dependencyUrl?: string;
  message?: string;
};

/**
 * ES6 Interactive Babylon Toolkit Scene Viewer (GLTF)
 */
function BabylonSceneViewer(props: SceneViewerProps & React.CanvasHTMLAttributes<HTMLCanvasElement>) {
  const { fullPage, gameMode, sceneUrl, assetFiles, importMeshes, auxiliaryData, allowQueryParams, enableCustomOverlay  } = props;
  const { location } = useUnifiedNavigation();
  const createScene = useCallback(async (scene:Scene) => {
    if (scene.isDisposed) return; // Note: Strict mode safety
    let disposed = false;
    let disposeObserver = scene.onDisposeObservable.add(() => { disposed = true; });
    let rootPath: string | null = sceneUrl != null && sceneUrl !== "" ? sceneUrl.substring(0, sceneUrl.lastIndexOf("/") + 1) : null;
    let sceneFile: string | null = sceneUrl != null && sceneUrl !== "" ? sceneUrl.substring(sceneUrl.lastIndexOf("/") + 1) : null;
    let gameModeController: ScriptComponent = null;
    let gameModeAuxiliaryData:string | undefined = auxiliaryData;
    let gameModeReadyInvoked: boolean = false;
    const invokeGameModeReady = async (): Promise<void> => {
      if (gameModeReadyInvoked || disposed || scene.isDisposed) return;
      if (gameModeController != null) {
        if (gameModeController["initSceneReady"] != null && typeof gameModeController["initSceneReady"] === "function") {
          gameModeReadyInvoked = true;
          await gameModeController["initSceneReady"](gameModeAuxiliaryData);
        }
      }
    };
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    // STEP 1 - Initialize the global runtime scene properties and react navigation system
    ///////////////////////////////////////////////////////////////////////////////////////////////////////
    try {
      GameManager.ShowSplashScreen(); // Note: Always Show Game Manager Splash Screen
      await GameManager.InitializeRuntime(scene, true, false, false);
      if (disposed || scene.isDisposed) return; // Note: Strict mode safety
      ////////////////////////////////////////////////////////////////////////////////////////////////////////
      // STEP 2 - Load the babylon scene assets (GLTF) using the toolkit assets manager
      ////////////////////////////////////////////////////////////////////////////////////////////////////////
      let isDevelopment: boolean = process.env.NODE_ENV === "development";
      let defaultPageUrl: URL = new URL(window.location.href.replace("#?", "?"));
      let babylonGameMode:string | undefined = gameMode || "DefaultGameMode";
      let babylonAssetFiles:string[] | undefined = assetFiles;
      let babylonImportMeshes:string[] | undefined = importMeshes;
      if (allowQueryParams === true) {
        ////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Unified Navigation Adapter Support (React Router, Next.js, Remix, etc.)
        ////////////////////////////////////////////////////////////////////////////////////////////////////////
        babylonGameMode = location?.state?.gameMode || babylonGameMode;
        let locSceneUrl = location?.state?.sceneUrl || null;
        if (locSceneUrl != null && locSceneUrl !== "") {
          rootPath = locSceneUrl.substring(0, locSceneUrl.lastIndexOf("/") + 1);
          sceneFile = locSceneUrl.substring(locSceneUrl.lastIndexOf("/") + 1);
        }
        babylonAssetFiles = location?.state?.assetFiles || babylonAssetFiles;
        babylonImportMeshes = location?.state?.importMeshes || babylonImportMeshes;
        ////////////////////////////////////////////////////////////////////////////////////////////////////////
        gameModeAuxiliaryData = location?.state?.auxiliaryData || gameModeAuxiliaryData;
        ////////////////////////////////////////////////////////////////////////////////////////////////////////
        if (isDevelopment === true) { // Note: Unity Editor Development Preview Query Param Support
          babylonGameMode = defaultPageUrl.searchParams.get("mode") || babylonGameMode;
          let devSceneUrl = defaultPageUrl.searchParams.get("scene") || null;
          if (devSceneUrl != null && devSceneUrl !== "") {
            rootPath = devSceneUrl.substring(0, devSceneUrl.lastIndexOf("/") + 1);
            sceneFile = devSceneUrl.substring(devSceneUrl.lastIndexOf("/") + 1);
          }
        }
      }
      let babylonRootPath: string = rootPath || GameManager.AwsPlaygroundRepo; // Note: Default to AWS Playground Repo
      let babylonSceneFile: string = sceneFile || "_blank";
      // Instantiate Game Mode Script Component Before Loading Assets (Set Auxiliary Data As Script Component Property Bag)
      if (babylonGameMode != null && babylonGameMode !== "") {
        const ScriptComponentClass = Utilities.InstantiateClass(babylonGameMode);
        if (ScriptComponentClass != null) {
            gameModeController = new ScriptComponentClass(new TransformNode("GameMode", scene), scene, {});
            if (gameModeController != null) {
              SceneManager.AttachScriptComponent(gameModeController, babylonGameMode, false);
            } else {
              Tools.Warn("Failed to instantiate script class: " + babylonGameMode);
            }
        } else {
            Tools.Warn("Failed to locate script class: " + babylonGameMode);
        }
      }
      // Validate blank scene file case (Allow blank scene file names and bail out early if detected. This allows the scene to be loaded without assets.
      if (babylonSceneFile == null || babylonSceneFile === "" || (babylonSceneFile != null && (babylonSceneFile.toLowerCase() === "_blank" || babylonSceneFile.toLowerCase() === "blank") || babylonSceneFile.toLowerCase() === "none")) {
        await invokeGameModeReady();
        return; // Note: Bail Out Early
      }
      // Load runtime assets with SceneLoader to get byte-level progress callbacks.
      const totalTopLevelAssets: number = 1 + (babylonImportMeshes?.length || 0) + (babylonAssetFiles?.length || 0);
      let completedTopLevelAssets: number = 0;
      const loadedByFile: Map<string, number> = new Map<string, number>();
      const totalByFile: Map<string, number> = new Map<string, number>();
      const formatMb = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(2);
      const postAssetMessage = (messageName: string, data: AssetProgressMessage): void => { GameManager.EventBus.PostMessage(messageName, data); };
      const postOverallProgressMessage = (assetName: string): void => {
        postAssetMessage("OnLoadProgress", {
          assetName,
          fileName: assetName,
          rootPath: babylonRootPath,
          sceneFile: babylonSceneFile,
          completedAssets: completedTopLevelAssets,
          totalAssets: totalTopLevelAssets,
          overallPercent: totalTopLevelAssets > 0 ? (completedTopLevelAssets / totalTopLevelAssets) * 100 : 100,
          message: `Overall progress ${completedTopLevelAssets}/${totalTopLevelAssets} assets`
        });
      };
      const logProgress = (fileName: string, event: ISceneLoaderProgressEvent): void => {
        loadedByFile.set(fileName, event.loaded);
        if (event.lengthComputable) {
          totalByFile.set(fileName, event.total);
        }
        let aggregateLoaded: number = 0;
        let aggregateTotal: number = 0;
        loadedByFile.forEach((value: number) => { aggregateLoaded += value; });
        totalByFile.forEach((value: number) => { aggregateTotal += value; });
        const filePercent: string = event.lengthComputable && event.total > 0 ? ((event.loaded / event.total) * 100).toFixed(1) + "%" : "n/a";
        const aggregatePercent: string = aggregateTotal > 0 ? ((aggregateLoaded / aggregateTotal) * 100).toFixed(1) + "%" : "n/a";
        postAssetMessage("OnAssetProgress", {
          assetName: fileName,
          fileName,
          rootPath: babylonRootPath,
          sceneFile: babylonSceneFile,
          loadedBytes: event.loaded,
          totalBytes: event.lengthComputable ? event.total : undefined,
          percent: event.lengthComputable && event.total > 0 ? (event.loaded / event.total) * 100 : undefined,
          aggregateLoadedBytes: aggregateLoaded,
          aggregateTotalBytes: aggregateTotal > 0 ? aggregateTotal : undefined,
          aggregatePercent: aggregateTotal > 0 ? (aggregateLoaded / aggregateTotal) * 100 : undefined,
          completedAssets: completedTopLevelAssets,
          totalAssets: totalTopLevelAssets,
          message: event.lengthComputable
            ? `Loading ${fileName} ${formatMb(event.loaded)}MB / ${formatMb(event.total)}MB (${filePercent})`
            : `Loading ${fileName} ${formatMb(event.loaded)}MB / unknown`
        });
      };
      const makeGltfPluginOptions = (fileName: string) => ({
        gltf: {
          preprocessUrlAsync: async (url: string) => {
            postAssetMessage("OnAssetDependency", {
              assetName: fileName,
              fileName,
              rootPath: babylonRootPath,
              sceneFile: babylonSceneFile,
              dependencyUrl: url,
              completedAssets: completedTopLevelAssets,
              totalAssets: totalTopLevelAssets,
              message: `Dependency request for ${fileName}: ${url}`
            });
            return url;
          }
        }
      });
      // Primary scene import.
      postOverallProgressMessage(babylonSceneFile);
      await ImportMeshAsync(babylonSceneFile, scene, {
        meshNames: null,
        rootUrl: babylonRootPath,
        onProgress: (event: ISceneLoaderProgressEvent) => {
          logProgress(babylonSceneFile, event);
        },
        pluginOptions: makeGltfPluginOptions(babylonSceneFile)
      });
      completedTopLevelAssets++;
      postOverallProgressMessage(babylonSceneFile);
      postAssetMessage("OnAssetComplete", {
        assetName: babylonSceneFile,
        fileName: babylonSceneFile,
        rootPath: babylonRootPath,
        sceneFile: babylonSceneFile,
        completedAssets: completedTopLevelAssets,
        totalAssets: totalTopLevelAssets,
        message: `Completed ${babylonSceneFile} (${completedTopLevelAssets}/${totalTopLevelAssets})`
      });
      // Optional additional mesh imports.
      if (babylonImportMeshes != null && babylonImportMeshes.length > 0) {
        for (const meshFile of babylonImportMeshes) {
          postOverallProgressMessage(meshFile);
          await ImportMeshAsync(meshFile, scene, {
            meshNames: "",
            rootUrl: babylonRootPath,
            onProgress: (event: ISceneLoaderProgressEvent) => {
              logProgress(meshFile, event);
            },
            pluginOptions: makeGltfPluginOptions(meshFile)
          });
          completedTopLevelAssets++;
          postOverallProgressMessage(meshFile);
          postAssetMessage("OnAssetComplete", {
            assetName: meshFile,
            fileName: meshFile,
            rootPath: babylonRootPath,
            sceneFile: babylonSceneFile,
            completedAssets: completedTopLevelAssets,
            totalAssets: totalTopLevelAssets,
            message: `Completed ${meshFile} (${completedTopLevelAssets}/${totalTopLevelAssets})`
          });
        }
      }
      // Optional asset containers for prefab-style content.
      if (babylonAssetFiles != null && babylonAssetFiles.length > 0) {
        for (const assetFile of babylonAssetFiles) {
          postOverallProgressMessage(assetFile);
          const loadedContainer = await LoadAssetContainerAsync(assetFile, scene, {
            rootUrl: babylonRootPath,
            onProgress: (event: ISceneLoaderProgressEvent) => {
              logProgress(assetFile, event);
            },
            pluginOptions: makeGltfPluginOptions(assetFile)
          });
          if (loadedContainer != null) {
            const assetTaskKey: string = assetFile.toLowerCase();
            SceneManager.RegisterAssetContainer(scene, assetTaskKey, loadedContainer);
          }
          completedTopLevelAssets++;
          postOverallProgressMessage(assetFile);
          postAssetMessage("OnAssetComplete", {
            assetName: assetFile,
            fileName: assetFile,
            rootPath: babylonRootPath,
            sceneFile: babylonSceneFile,
            completedAssets: completedTopLevelAssets,
            totalAssets: totalTopLevelAssets,
            message: `Completed ${assetFile} (${completedTopLevelAssets}/${totalTopLevelAssets})`
          });
        }
      }
      // Final overall completion message.
      postAssetMessage("OnLoadComplete", {
        assetName: babylonSceneFile,
        fileName: babylonSceneFile,
        rootPath: babylonRootPath,
        sceneFile: babylonSceneFile,
        completedAssets: completedTopLevelAssets,
        totalAssets: totalTopLevelAssets,
        overallPercent: totalTopLevelAssets > 0 ? (completedTopLevelAssets / totalTopLevelAssets) * 100 : 100,
        message: `Load complete: ${completedTopLevelAssets}/${totalTopLevelAssets} assets`
      });
      if (disposed || scene.isDisposed) return; // Note: Strict mode safety
    } catch (error) {
      console.error("Failed to load babylon scene assets", error);
    } finally {
      /////////////////////////////////////////////////////////////////////////////////////////////////////
      // STEP 3 - Finalize scene setup after assets are loaded and hide the loading screen
      /////////////////////////////////////////////////////////////////////////////////////////////////////
      try {
        await invokeGameModeReady();
      } catch (e) {
        console.error("Failed to initialize game mode", e);
      }
      try {
        if (!disposed && !scene.isDisposed && disposeObserver) {
          scene.onDisposeObservable.remove(disposeObserver);
        }
      } catch (e) {
        console.error("Failed to remove dispose observer", e);
      }
    }
  }, [gameMode, sceneUrl, assetFiles, importMeshes, auxiliaryData, allowQueryParams, location]);

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  // OPTIONAL: Add custom loading div over the root div and disable the default loading screen
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (    
    <div className={fullPage ? "page-viewer" : "div-viewer"}>
      <SplashScreen />
      <BaseSceneViewer webgpu={true} antialias={true} adaptToDeviceRatio={true} onCreateScene={createScene} className="canvas" />
      {props.enableCustomOverlay && <CustomOverlay />}
    </div>
  );
}

export default BabylonSceneViewer;