
import { Scene } from "./scene";
import { Sprite } from "./sprite";
import { Updater } from "./updater";

export class Game {

    name: string = "";
    container: any = null;

    width: number = 0;
    height: number = 0;

    fps: number = 0;

    ticks: number = 0;
    deltaTime: number = 0;

    script: any = null;

    scenes: { [name: string]: Scene } = { };
    systems: { [name: string]: Updater } = { };
    libraries: { [name: string]: any } = { };
    components: any = { };

    basics: Array<string> = []; // the names of the basic systems

    private _currentScene: Scene = null;
    private _loadingScenes: Array<string> = [ ];

    private _scenesToLoad: number = 0;

    constructor(name: string) {
        this.name = name;
    }
    
    get scene(): Scene {
        return this._currentScene;
    }
    set scene(value: Scene) {
        if (value) {
            if (this._currentScene) {
                for (let system of this._currentScene.systemList)
                    if (system.deactivate) system.deactivate(this._currentScene); // disable old scene
                let eventSystem: any = this.systems["event"];
                if (eventSystem) eventSystem.callEvent(this._currentScene, "onDeactivate");
            }
            this._currentScene = value;
            if (this._currentScene) {
                for (let system of this._currentScene.systemList)
                    if (system.activate) system.activate(this._currentScene); // enable new scene
                let eventSystem: any = this.systems["event"];
                if (eventSystem) eventSystem.callEvent(this._currentScene, "onActivate");
            }
        }
    }

    init(config: any, systems: Map<string, any>, libraries: Map<string, any>, callback: (game: Game)=>void) {
        if (config.components) this.components = config.components;
        libraries.forEach((value, key) => this.libraries[key] = value);
        let firstSystems = [], secondSystems = [], eventSystem: any = null;
        systems.forEach((value, key) => {
            this.systems[key] = value;
            if (key == "event") eventSystem = value;
            if (this.components.hasOwnProperty(key)) firstSystems.push(value);
            else secondSystems.push(value);
        });

        if (config.basics) Array.prototype.push.apply(this.basics, config.basics);

        this.preloadPacks(config.packs, () => {

            let scriptlib = this.libraries["script"];
            if (scriptlib && config.script === true) {
                scriptlib.loadGameScript(this.libraries["systemjs"], this.name, (loadedScript) => {
                    this.script = loadedScript;
                    for (let item of firstSystems) if (item.init) item.init(this);
                    for (let item of secondSystems) if (item.init) item.init(this);
                    if (eventSystem) eventSystem.callEvent(this, "onInit");
                    this.loadScenes(config.scenes, ()=> {
                        if (config.scenes && config.scenes.length > 0) this.scene = this.scenes[config.scenes[0]];
                        callback(this);
                    });
                });
            } else {
                for (let item of firstSystems) if (item.init) item.init(this);
                for (let item of secondSystems) if (item.init) item.init(this);
                this.loadScenes(config.scenes, ()=> {
                    if (config.scenes && config.scenes.length > 0) this.scene = this.scenes[config.scenes[0]];
                    callback(this);
                });
            }

        });
        
    }

    private preloadPacks(packs: Array<string>, callback: ()=>void) {

        if (packs && packs.length > 0) {
            let packFiles: Array<string> = [];
            for (let pack of packs) {
                let packFile = pack.indexOf('.') < 0 ? (pack + ".pack") : pack;
                packFiles.push(packFile);
            }
            console.log("preloading pack file(s) ... ");
            let preloadlib = this.libraries["preload"];
            preloadlib.loadPacks(packFiles, callback, (current, total, url) => {
                console.log("preloaded " + url + " (" + current + "/" + total + ")");
            });
        } else {
            callback();
        }

    }

    private loadScenesOneByOne(callback: ()=>void, progress?: (percentage: number)=>void) {
        if (this._loadingScenes.length > 0) {
            let sceneName = this._loadingScenes.shift();
            this.loadScene(sceneName, (scene) => {
                this.loadScenesOneByOne(callback, progress);
            }, (sceneProgress) => {
                let totalProgress = (100.0 / this._scenesToLoad) * ((this._scenesToLoad - (this._loadingScenes.length + 1)) + (sceneProgress / 100.0));
                totalProgress = Math.round(totalProgress * 100) / 100;
                if (totalProgress > 100) totalProgress = 100;
                if (progress) progress(totalProgress);
                //else console.log("loading progress: " + totalProgress + "%");
            });
        } else callback();
    }

    loadScenes(sceneNames: Array<string>, callback: ()=>void, progress?: (percentage: number)=>void) {
        if (sceneNames == undefined || sceneNames == null || sceneNames.length <= 0) {
            if (progress) progress(100);
            callback();
            return;
        }
        this._loadingScenes = [];
        if (sceneNames) for (let sceneName of sceneNames) this._loadingScenes.push(sceneName);
        this._scenesToLoad = this._loadingScenes.length;
        this.loadScenesOneByOne(callback, progress);
    }

    loadScene(sceneName: string, callback: (loaded: Scene)=>void, progress?: (percentage: number)=>void) {
        let jsonlib = this.libraries["json"];
        if (jsonlib == undefined || jsonlib == null) {
            callback(null);
            return;
        }
        let targetScene = this.scenes[sceneName];
        if (targetScene) {
            if (progress) progress(100);
            callback(targetScene);
            return;
        }
        jsonlib.loadJson("json/scenes/" + sceneName + "/" + sceneName + ".json", (config) => {
            if (config == undefined || config == null) {
                callback(null);
                return;
            }
            let newScene = new Scene(this, sceneName);
            newScene.init(config, (scene) => {
                if (scene) this.scenes[scene.name] = scene;
                callback(scene);
            }, progress);
        });
    }

    get(componentName: string) {
        return this.components[componentName];
    }
    sys(systemName: string) {
        return this.systems[systemName];
    }
    lib(libraryName: string) {
        return this.libraries[libraryName];
    }

    call(functionName: string, ...args: any[]) {
        if (this.script && this.script[functionName]) {
            let params = [];
            Array.prototype.push.apply(params, args);
            return Reflect.apply(this.script[functionName], this.script, params);
        }
        return undefined;
    }

    update(deltaTime: number) {
        this.deltaTime = deltaTime;
        this.ticks += deltaTime;
        if (this.scene != null) this.scene.update(deltaTime);
        let event = this.components["event"];
        if (this.script) {
            if (event && event.queue) {
                for (let evt of event.queue) {
                    let callbackName = event[evt.name];
                    if (callbackName) {
                        if (this.script[callbackName]) {
                            this.script[callbackName](this, evt.data);
                        }
                    }
                }
            }
            let callback = event ? event["onUpdate"] : undefined;
            if (callback && this.script[callback]) this.script[callback](this);
        }
        if (event) {
            if (event.queue == undefined || event.queue == null) event.queue = [];
            else if (event.queue.length > 0) event.queue = [];
        }
    }

}


