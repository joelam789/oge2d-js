declare module OGE2D {
	export interface Updater {
	    name: string;
	    init?(game: Game): boolean;
	    preset?(scene: Scene, callback: () => void): any;
	    prepare?(sprite: Sprite, callback: () => void): any;
	    setup?(scene: Scene): any;
	    activate?(scene: Scene): any;
	    deactivate?(scene: Scene): any;
	    include?(sprite: Sprite): any;
	    exclude?(sprite: Sprite): any;
	    enable?(sprite: Sprite): any;
	    disable?(sprite: Sprite): any;
	    refresh?(scene: Scene): any;
	    update?(scene: Scene, time: number): any;
	}
	
	export class Sprite {
	    name: string;
	    game: Game;
	    scene: Scene;
	    origin: Sprite;
		script: any;
		code: any;
		base: any;
	    plot: Plot;
	    template: string;
	    components: any;
	    private _active;
	    active: boolean;
	    constructor(scene: Scene, name: string);
	    get(componentName: string): any;
		call(functionName: string, ...args: any[]): any;
	}
	export class Plot {
	    done: boolean;
	    private _spr;
	    private _gen;
	    private _wait;
	    private _func;
	    constructor(spr: Sprite, genfunc: GeneratorFunction);
	    readonly available: boolean;
	    reset(): void;
	    pause(...signals: string[]): number;
	    resume(...signals: string[]): number;
	    wait(target?: number | string | Array<string>): number;
		signal(value?: string): number;
	    next(): any;
	}
	
	export class Scene {
	    game: Game;
	    name: string;
	    ticks: number;
	    paused: boolean;
		script: any;
		code: any;
	    private _systems;
	    private _sprites;
	    private _timers;
	    private _presettingSystems;
	    private _preparingSystems;
	    private _loadingSprites;
	    private _pendingSpriteClones;
	    private _preloadItemCount;
	    private _spritesToLoad;
		private _localSpriteNames;
		private _spriteSceneNames;
	    pools: {
	        [name: string]: Array<Sprite>;
	    };
	    sprites: {
	        [name: string]: Sprite;
	    };
	    systems: {
	        [name: string]: Updater;
	    };
	    components: any;
	    constructor(game: Game, name: string);
	    readonly systemList: Array<Updater>;
	    readonly spriteList: Array<Sprite>;
	    readonly active: boolean;
	    init(config: any, callback: (scene: Scene) => void, progress?: (percentage: number) => void): void;
	    private preload(setting, callback, progress?);
	    private presetSystems(callback);
	    private prepareSprite(sprite, callback);
	    addSprite(sprite: Sprite): void;
	    removeSprite(sprite: Sprite): void;
	    private loadSprites(callback, progress?);
	    private addNewSprite(newSprite, isActive, callback);
	    private addNewSpriteWithClones(newSprite, isActive, total, callback);
	    private addNewSpriteClones(newSprite, isActive, callback);
	    loadSprite(spriteName: string, callback: (loaded: Sprite) => void): void;
	    mergeComponents(baseComponents: any, newComponents: any): void;
		reset(): void;
	    private extractSpriteTemplate(components, scripts);
	    private loadSpriteTemplate(templateName, components, scripts, callback);
	    private reloadSpriteTemplate(templateName);
		getLocalSpriteNames(): Array<string>;
	    getFreeSprite(poolName?: string): Sprite;
	    getFreeSpriteCount(poolName?: string): number;
	    get(componentName: string): any;
	    sys(systemName: string): Updater;
	    spr(spriteName: string): Sprite;
		call(functionName: string, ...args: any[]): any;
	    timeout(ms: number, callback: (targetObj?: any) => void, target?: any): void;
	    update(deltaTime: number): void;
	}
	export class Timer {
	    start: number;
	    timeout: number;
	    target: any;
	    callback: (targetObj?: any) => void;
	}
	
	export class Game {
	    name: string;
	    container: any;
	    width: number;
	    height: number;
	    fps: number;
	    ticks: number;
	    deltaTime: number;
		script: any;
		code: any;
	    scenes: {
	        [name: string]: Scene;
	    };
	    systems: {
	        [name: string]: Updater;
	    };
	    libraries: {
	        [name: string]: any;
	    };
	    components: any;
		basics: Array<string>;
		private _lastScene;
		private _nextScene;
	    private _currentScene;
	    private _loadingScenes;
	    private _scenesToLoad;
	    constructor(name: string);
		readonly lastScene: Scene;
		readonly nextScene: Scene;
		scene: Scene;
	    init(config: any, systems: Map<string, any>, libraries: Map<string, any>, callback: (game: Game) => void): void;
	    private preloadPacks(packs, callback);
	    private loadScenesOneByOne(callback, progress?);
	    loadScenes(sceneNames: Array<string>, callback: () => void, progress?: (percentage: number) => void): void;
	    loadScene(sceneName: string, callback: (loaded: Scene) => void, progress?: (percentage: number) => void): void;
	    get(componentName: string): any;
	    sys(systemName: string): Updater;
	    lib(libraryName: string): any;
		call(functionName: string, ...args: any[]): any;
	    update(deltaTime: number): void;
	}
	
	export class App {
	    game: Game;
	    systems: Map<string, any>;
	    libraries: Map<string, any>;
	    constructor(config?: any);
	    load(config: any, callback: (loaded?: any) => void): void;
	    loadGame(name?: string, parent?: string, callback?: (loaded?: any) => void): void;
	    loadModules(loader: any, config: any, callback: (loaded?: Array<any>) => void): void;
	    loadSystems(loader: any, config: any, callback: (loaded?: Map<string, any>) => void): void;
	    loadLibraries(loader: any, config: any, callback: (loaded?: Map<string, any>) => void): void;
	}
}
