
import { Game } from "./game";

export class App {

    game: Game = null;
    systems: Map<string, any> = new Map<string, any>();
    libraries: Map<string, any> = new Map<string, any>();

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
        for (let item of Object.keys(config.systems)) {
            let className = '';
            let classPath = config.systems[item];
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
        for (let item of Object.keys(config.libraries)) {
            let className = '';
            let classPath = config.libraries[item];
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

