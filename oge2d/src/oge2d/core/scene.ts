
import { Game } from "./game";
import { Sprite } from "./sprite";
import { Updater } from "./updater";

export class Scene {

    game: Game = null;
    name: string = "";

    ticks: number = 0;

    paused: boolean = false;

    script: any = null;

    private _systems: Array<Updater> = [];
    private _sprites: Array<Sprite> = [];

    private _timers: Array<Timer> = [];

    private _presettingSystems: Array<string> = [];
    private _preparingSystems: Array<string> = [];

    private _loadingSprites: Array<string> = [];
    private _pendingSpriteClones: Array<Sprite> = [];

    private _preloadItemCount: number = 0;
    private _spritesToLoad: number = 0;

    pools: { [name: string]: Array<Sprite> }  = { };

    sprites: { [name: string]: Sprite }  = { };
    systems: { [name: string]: Updater } = { };
    components: any = { };

    constructor(game: Game, name: string) {
        this.game = game;
        this.name = name;
    }

    get systemList(): Array<Updater> {
        return this._systems;
    }

    get spriteList(): Array<Sprite> {
        return this._sprites;
    }

    get active(): boolean {
        return this.game && this.game.scene == this;
    }

    init(config: any, callback: (scene: Scene)=>void, progress?: (percentage: number)=>void) {
        let systemNames: Array<string> = [], systemObjects: Array<any> = [];
        let displaySystemObject = null, eventSystemObject = null;
        if (this.game.basics) Array.prototype.push.apply(systemNames, this.game.basics);
        if (config.systems) {
            for (let systemName of config.systems) 
                if (systemNames.indexOf(systemName) < 0) systemNames.push(systemName);
        }
        for (let systemName of Object.keys(this.game.systems)) {
            if (systemNames.indexOf(systemName) >= 0) {
                let system = this.game.systems[systemName];
                if (system) {
                    if (systemName == "display") displaySystemObject = system;
                    else if (systemName == "event") eventSystemObject = system;
                    else systemObjects.push(system);
                    this.systems[systemName] = system;
                }
            }
        }
        if (displaySystemObject) this._systems.push(displaySystemObject);
        if (eventSystemObject) this._systems.push(eventSystemObject);
        for (let system of systemObjects) this._systems.push(system);

        if (config.components) this.components = config.components;

        this._loadingSprites = [];
        if (config.sprites) for (let spriteName of config.sprites) this._loadingSprites.push(spriteName);
        this._spritesToLoad = this._loadingSprites.length;

        this._presettingSystems = [];
        for (let system of this._systems) this._presettingSystems.push(system.name);

        this.preload(config.preload, () => this.presetSystems(() => {

            let scriptlib = this.game.libraries["script"];
            if (scriptlib && config.script === true) {
                scriptlib.loadSceneScript(this.game.libraries["systemjs"], this.name, (loadedScript) => {
                    this.script = loadedScript;
                    let eventSystem: any = this.systems["event"];
                    if (eventSystem) eventSystem.callEvent(this, "onInit");
                    this.loadSprites(() => {
                        for (let system of this._systems) if (system.setup) system.setup(this);
                        callback(this);
                    }, (c, t) => {
                        if (progress) progress(Math.round(((c+this._preloadItemCount) * 10000.0) / (t + this._preloadItemCount)) / 100);
                    });
                });
            } else {
                this.loadSprites(() => {
                    for (let system of this._systems) if (system.setup) system.setup(this);
                    callback(this);
                }, (c, t) => {
                    if (progress) progress(Math.round(((c+this._preloadItemCount) * 10000.0) / (t + this._preloadItemCount)) / 100);
                });
            }

        }), (c, t) => {

            if (progress) progress(Math.round((c * 10000.0) / (t + this._spritesToLoad)) / 100);

        });
        
    }

    private preload(setting: any, callback: ()=>void, progress?: (current: number, total: number)=>void) {
        let preloadlib = this.game.libraries["preload"];
        if (setting == undefined || setting == null 
            || preloadlib == undefined || preloadlib == null) {
            callback();
            return;
        }
        this._preloadItemCount = preloadlib.prepare(setting);
        if (this._preloadItemCount <= 0) callback();
        else preloadlib.load(this.game.libraries, callback, progress);
    }

    private presetSystems(callback: ()=>void) {
        if (this._presettingSystems.length > 0) {
            let systemName = this._presettingSystems.shift();
            let system = this.systems[systemName];
            if (system && system.preset) {
                system.preset(this, () => this.presetSystems(callback));
            } else {
                this.presetSystems(callback);
            }
        } else callback();
    }

    private prepareSprite(sprite: Sprite, callback: ()=>void) {
        if (this._preparingSystems.length > 0) {
            let systemName = this._preparingSystems.shift();
            let system = this.systems[systemName];
            if (system && system.prepare) {
                system.prepare(sprite, () => this.prepareSprite(sprite, callback));
            } else {
                this.prepareSprite(sprite, callback);
            }
        } else callback();
    }

    addSprite(sprite: Sprite) {
        if (sprite == undefined || sprite == null) return;
        if (this.sprites[sprite.name]) return;
        this._sprites.push(sprite);
        this.sprites[sprite.name] = sprite;
        let poolName = sprite.origin ? sprite.origin.name : sprite.name;
        let pool = poolName ? this.pools[poolName] : null;
        if (pool && pool.indexOf(sprite) < 0) pool.push(sprite);
        for (let system of this._systems) if (system.include) system.include(sprite);
    }

    removeSprite(sprite: Sprite) {
        if (sprite == undefined || sprite == null) return;
        let poolName = sprite.origin ? sprite.origin.name : sprite.name;
        let pool = poolName ? this.pools[poolName] : null;
        if (pool && pool.length > 0) {
            let index = pool.indexOf(sprite);
            if (index >= 0) pool.splice(index, 1);
        }
        if (this.sprites[sprite.name]) this.sprites[sprite.name] = undefined;
        let idx = this._sprites.indexOf(sprite);
        if (idx >= 0) {
            this._sprites.splice(idx, 1);
            for (let system of this._systems) if (system.exclude) system.exclude(sprite);
        }
    }

    private loadSprites(callback: ()=>void, progress?: (current: number, total: number)=>void) {
        if (this._loadingSprites.length > 0) {
            let spriteName = this._loadingSprites.shift();
            if (this.sprites[spriteName]) {
                if (progress) progress(this._spritesToLoad - this._loadingSprites.length, this._spritesToLoad);
                this.loadSprites(callback, progress);
            } else {
                this.loadSprite(spriteName, (sprite) => {
                    if (progress) progress(this._spritesToLoad - this._loadingSprites.length, this._spritesToLoad);
                    this.loadSprites(callback, progress);
                });
            }
        } else callback();
    }

    private addNewSprite(newSprite: Sprite, isActive: boolean, callback: (loaded: Sprite)=>void) {
        this._preparingSystems = [];
        for (let system of this._systems) this._preparingSystems.push(system.name);
        this.prepareSprite(newSprite, () => {
            if (!this.sprites[newSprite.name]) this.addSprite(newSprite);
            if (isActive) newSprite.active = true; // the default value of "active" is "false"
            if (callback) callback(newSprite);
        });
    }

    private addNewSpriteWithClones(newSprite: Sprite, isActive: boolean, total: number, callback: (loaded: Sprite)=>void) {
        if (total == undefined || isNaN(total) || total <= 1) {
            this.addNewSprite(newSprite, isActive, callback);
            return;
        }
        let pool = [newSprite];
        this._pendingSpriteClones = [];
        for (let i=0; i<total-1; i++) {
            let clone = new Sprite(newSprite.scene, newSprite.name + "_" + (i+1));
            clone.origin = newSprite;
            clone.script = newSprite.script;
            clone.template = newSprite.template;
            clone.components = JSON.parse(JSON.stringify(newSprite.components));
            this._pendingSpriteClones.push(clone);
            pool.push(clone);
        }
        this.pools[newSprite.name] = pool;
        this.addNewSprite(newSprite, isActive, (loadedNewSprite) => {
            this.addNewSpriteClones(newSprite, isActive, () => {
                callback(newSprite);
            })
        });
        
    }

    private addNewSpriteClones(newSprite: Sprite, isActive: boolean, callback: ()=>void) {
        if (this._pendingSpriteClones.length > 0) {
            let clone = this._pendingSpriteClones.shift();
            if (clone) {
                this.addNewSprite(clone, isActive, (newClone) => {
                    this.addNewSpriteClones(newSprite, isActive, callback);
                });
            } else {
                this.addNewSpriteClones(newSprite, isActive, callback);
            }
        } else callback();
    }

    loadSprite(spriteName: string, callback: (loaded: Sprite)=>void) {
        let jsonlib = this.game.libraries["json"];
        if (jsonlib == undefined || jsonlib == null) {
            callback(null);
            return;
        }
        jsonlib.loadJson("json/scenes/" + this.name + "/sprites/" + spriteName + ".json", (config) => {
            if (config == undefined || config == null) {
                callback(null);
                return;
            }
            let newSprite = new Sprite(this, spriteName);
            if (config.template) {
                newSprite.template = config.template.toString();
                jsonlib.loadJson("json/sprites/" + newSprite.template + ".json", (baseConfig) => {
                    if (baseConfig && baseConfig.components) {
                        this.mergeComponents(baseConfig.components, config.components);
                        newSprite.components = baseConfig.components;
                    } else {
                        if (config.components) newSprite.components = config.components;
                    }
                    let scriptlib = this.game.libraries["script"];
                    if (scriptlib) {
                        if (config.script === true) {
                            scriptlib.loadSceneSpriteScript(this.game.libraries["systemjs"], this.name, spriteName, (newSprScript) => {
                                newSprite.script = newSprScript;
                                if (baseConfig && baseConfig.script === true) {
                                    scriptlib.loadSpriteScript(this.game.libraries["systemjs"], newSprite.template, (sprScript) => {
                                        newSprite.script.base = sprScript;
                                        let eventSystem: any = this.systems["event"];
                                        if (eventSystem) eventSystem.callEvent(newSprite, "onInit");
                                        this.addNewSpriteWithClones(newSprite, config.active, config.count, callback);
                                    });
                                } else {
                                    let eventSystem: any = this.systems["event"];
                                    if (eventSystem) eventSystem.callEvent(newSprite, "onInit");
                                    this.addNewSpriteWithClones(newSprite, config.active, config.count, callback);
                                }
                            });
                        } else if (baseConfig && baseConfig.script === true) {
                            scriptlib.loadSpriteScript(this.game.libraries["systemjs"], newSprite.template, (baseScript) => {
                                newSprite.script = { base: baseScript };
                                let eventSystem: any = this.systems["event"];
                                if (eventSystem) eventSystem.callEvent(newSprite, "onInit");
                                this.addNewSpriteWithClones(newSprite, config.active, config.count, callback);
                            });
                        } else {
                            this.addNewSpriteWithClones(newSprite, config.active, config.count, callback);
                        }
                    } else {
                        this.addNewSpriteWithClones(newSprite, config.active, config.count, callback);
                    }
                });
            } else {
                let scriptlib = this.game.libraries["script"];
                if (scriptlib) {
                    if (config.script === true) {
                        scriptlib.loadSceneSpriteScript(this.game.libraries["systemjs"], this.name, spriteName, (loadedScript) => {
                            newSprite.script = loadedScript;
                            let eventSystem: any = this.systems["event"];
                            if (eventSystem) eventSystem.callEvent(newSprite, "onInit");
                            this.addNewSpriteWithClones(newSprite, config.active, config.count, callback);
                        });
                    } else {
                        this.addNewSpriteWithClones(newSprite, config.active, config.count, callback);
                    }
                } else {
                    this.addNewSpriteWithClones(newSprite, config.active, config.count, callback);
                }
            }
        });
    }

    mergeComponents(baseComponents: any, newComponents: any) {
        if (baseComponents && newComponents) {
            for (let key of Object.keys(newComponents)) {
                if (baseComponents[key]) {
                    if (typeof baseComponents[key] == "object" && typeof newComponents[key] == "object") {
                        for (let itemName of Object.keys(newComponents[key])) {
                            baseComponents[key][itemName] = newComponents[key][itemName];
                        }
                    } else baseComponents[key] = newComponents[key];
                } else baseComponents[key] = newComponents[key];
            }
        }
    }

    reset() {
        this.ticks = 0; // reset it
        this._timers = []; // clear timers
        // reload scene's components
        let jsonlib = this.game.libraries["json"];
        if (jsonlib == undefined || jsonlib == null) return;
        let sceneConfig = jsonlib.getJson("json/scenes/" + this.name + "/" + this.name + ".json");
        if (sceneConfig == undefined || sceneConfig == null) return;
        this.mergeComponents(this.components, sceneConfig.components);
        let componentMap = new Map<string, any>();
        // reload sprites' components
        for (let sprite of this._sprites) {
            if (sprite.origin) continue; // handle clones later
            let spriteConfig = jsonlib.getJson("json/scenes/" + this.name + "/sprites/" + sprite.name + ".json");
            if (spriteConfig == undefined || spriteConfig == null) continue;
            let baseConfig = null, components = null;
            if (sprite.template) baseConfig = jsonlib.getJson("json/sprites/" + sprite.template + ".json");
            if (baseConfig && baseConfig.components) {
                this.mergeComponents(baseConfig.components, spriteConfig.components);
                components = baseConfig.components;
            } else {
                if (spriteConfig.components) components = spriteConfig.components;
            }
            if (components) {
                this.mergeComponents(sprite.components, components);
                componentMap.set(sprite.name, components);
            }
            if (spriteConfig.active != undefined) sprite.active = spriteConfig.active;
        }
        for (let sprite of this._sprites) { // handle clones here
            if (sprite.origin == undefined || sprite.origin == null) continue;
            this.mergeComponents(sprite.components, componentMap.get(sprite.origin.name));
            sprite.active = sprite.origin.active;
        }
        for (let system of this._systems) if (system.refresh) system.refresh(this);
    }

    getFreeSprite(poolName?: string): Sprite {
        if (poolName && poolName.length > 0) {
            let pool = this.pools[poolName];
            if (pool && pool.length > 0) {
                for (let spr of pool) {
                    if (spr.active == false) return spr;
                }
            }
        } else {
            for (let spr of this._sprites) {
                if (spr.active == false) return spr;
            }
        }
        return null;
    }

    getFreeSpriteCount(poolName?: string): number {
        let count = 0;
        if (poolName && poolName.length > 0) {
            let pool = this.pools[poolName];
            if (pool && pool.length > 0) {
                for (let spr of pool) {
                    if (spr.active == false) count++;
                }
            }
        } else {
            for (let spr of this._sprites) {
                if (spr.active == false) count++;
            }
        }
        return count;
    }

    get(componentName: string) {
        return this.components[componentName];
    }
    sys(systemName: string) {
        return this.systems[systemName];
    }
    spr(spriteName: string) {
        return this.sprites[spriteName];
    }

    timeout(ms: number, callback: (targetObj?: any)=>void, target?: any) {
        let timer = new Timer();
        timer.start = this.ticks;
        timer.timeout= ms;
        timer.target = target;
        timer.callback = callback;
        this._timers.push(timer);
    }

    update(deltaTime: number) {
        if (this.paused == false) {
            this.ticks += deltaTime;
            let timers = [];
            for (let timer of this._timers) {
                if (this.ticks - timer.start >= timer.timeout) {
                    if (timer.callback) timer.callback(timer.target);
                } else timers.push(timer);
            }
            if (timers.length != this._timers.length) {
                this._timers = [];
                if (timers.length > 0) Array.prototype.push.apply(this._timers, timers);
            }
        }
        for (let system of this._systems) {
            if (system.update) system.update(this, deltaTime);
        }
    }

}

export class Timer {
    start: number = -1;
    timeout: number = 0;
    target: any = null;
    callback: (targetObj?: any)=>void = null;
}

