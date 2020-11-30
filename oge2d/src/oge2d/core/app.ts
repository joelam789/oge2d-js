
import { Game } from "./game";

export class App {

    game: Game = null;
    systems: Map<string, any> = new Map<string, any>();
    libraries: Map<string, any> = new Map<string, any>();

    getFileNameFromPath(filepath: string, needExt: boolean = false): string {
        let filename = filepath.split('\\').pop().split('/').pop();
        if (!needExt) {
            let idx = filename.lastIndexOf('.');
            if (idx >= 0) filename = filename.substring(0, idx);
        }
        return filename;
    }
    getFileMapFromArray(files: Array<string>): any {
        let fileMap = {};
        for (let item of files) {
            let key = this.getFileNameFromPath(item);
            if (!key) key = item;
            if (key) fileMap[key] = item;
        }
        return fileMap;
    }

    constructor(config?: any) {
        if (config && config.systems) {
            for (let item of Object.keys(config.systems)) {
                this.systems.set(item, config.systems[item]);
            }
        }
        if (config && config.libraries) {
            for (let item of Object.keys(config.libraries)) {
                this.libraries.set(item, config.libraries[item]);
            }
        }
        if (config) {
            let win: any = window as any;
            if (win.SystemJS) this.libraries.set("systemjs", win.SystemJS);
            else if (win.System) this.libraries.set("systemjs", win.System);
        }
    }

    load(config: any, callback: (loaded?: any)=>void) {
        let win: any = window as any;
        let loader = win.SystemJS || win.System;
        this.loadModules(loader, config, () => {
            this.loadGame(config.game, config.container, (game) => {
                callback(game);
            })
        })
    }

    loadGame(name?: string, parent?: string, callback?: (loaded?: any)=>void) {
        let gameName = name && name.length > 0 ? name : "game";
        let jsonlib = this.libraries.get("json");
        if (jsonlib == undefined || jsonlib == null) {
            if (callback) callback(null);
            return;
        }
        jsonlib.loadJson("json/games/" + gameName + ".json", (gameConfig) => {
            if (gameConfig == undefined || gameConfig == null) {
                if (callback) callback(null);
                return;
            }
            let newGame = new Game(gameName);
            let gameContainer = parent && parent.length > 0 
                                ? document.getElementById(parent)
                                : document.body;
            newGame.container = gameContainer ? gameContainer : document.body;
            newGame.init(gameConfig, this.systems, this.libraries, (game) => {
                if (callback) callback(game);
            });
        });
    }

    loadModules(loader: any, config: any, callback: (loaded?: Array<any>)=>void) {
        let modules = [];
        this.loadSystems(loader, config, (loadedSystems) => {
            loadedSystems.forEach((value, key) => modules.push(value));
            this.loadLibraries(loader, config, (loadedLibraries) => {
                loadedLibraries.forEach((value, key) => modules.push(value));
                callback(modules);
            });
        });
    }

    loadSystems(loader: any, config: any, callback: (loaded?: Map<string, any>)=>void) {
        if (config == undefined || config == null 
            || config.systems == undefined || config.systems == null) {
            callback(this.systems);
            return;
        }
        let loadings = [], classNames: Map<string, string> = new Map<string, string>();
        let configSystems = config.systems;
        if (Array.isArray(configSystems)) configSystems = this.getFileMapFromArray(configSystems);
        for (let item of Object.keys(configSystems)) {
            let className = '';
            let classPath = configSystems[item];
            let pathParts = classPath.split('/');
            let lastPart = pathParts[pathParts.length - 1];
            let lastChar = '?', currentChar = '';
            for (let i=0; i<lastPart.length; i++) {
                currentChar = lastPart.charAt(i);
                if (/[^a-zA-Z0-9]/.test(currentChar) == false) {
                    if (/[^a-zA-Z0-9]/.test(lastChar) == false) className += currentChar;
                    else className += currentChar.toUpperCase();
                }
                lastChar = currentChar;
            }
            classNames.set(item, className);
            loadings.push(loader.import(classPath));
        }
        Promise.all(loadings).then((modules) => {
            classNames.forEach((value, key) => {
                for (let item of modules) {
                    if (item.hasOwnProperty(value)) {
                        let newInstance = Object.create(item[value].prototype);
                        newInstance.constructor.apply(newInstance, []);
                        this.systems.set(key, newInstance);
                        break;
                    }
                }
            });
            callback(this.systems);
        });
    }

    loadLibraries(loader: any, config: any, callback: (loaded?: Map<string, any>)=>void) {
        if (loader) this.libraries.set("systemjs", loader);
        if (config == undefined || config == null 
            || config.libraries == undefined || config.libraries == null) {
            callback(this.libraries);
            return;
        }
        let loadings = [], classNames: Map<string, string> = new Map<string, string>();
        let configLibraries = config.libraries;
        if (Array.isArray(configLibraries)) configLibraries = this.getFileMapFromArray(configLibraries);
        for (let item of Object.keys(configLibraries)) {
            let className = '';
            let classPath = configLibraries[item];
            let pathParts = classPath.split('/');
            let lastPart = pathParts[pathParts.length - 1];
            let lastChar = '?', currentChar = '';
            for (let i=0; i<lastPart.length; i++) {
                currentChar = lastPart.charAt(i);
                if (/[^a-zA-Z0-9]/.test(currentChar) == false) {
                    if (/[^a-zA-Z0-9]/.test(lastChar) == false) className += currentChar;
                    else className += currentChar.toUpperCase();
                }
                lastChar = currentChar;
            }
            classNames.set(item, className);
            loadings.push(loader.import(classPath));
        }
        Promise.all(loadings).then((modules) => {
            classNames.forEach((value, key) => {
                for (let item of modules) {
                    if (item.hasOwnProperty(value)) {
                        let newInstance = Object.create(item[value].prototype);
                        newInstance.constructor.apply(newInstance, []);
                        this.libraries.set(key, newInstance);
                        break;
                    }
                }
            });
            callback(this.libraries);
        });
    }
    
}

