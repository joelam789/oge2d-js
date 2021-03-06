
export class Script {

    name: string = "script";

    private _games: Map<string, any> = new Map<string, any>();
    private _scenes: Map<string, any> = new Map<string, any>();
    private _sprites: Map<string, any> = new Map<string, any>(); // not include sprites in scenes
    private _modules: Map<string, any> = new Map<string, any>();

    private getClassName(fileName: string): string {
        let className: string = "", lastPart = fileName, lastChar = '?', currentChar = '';
        for (let i=0; i<lastPart.length; i++) {
            currentChar = lastPart.charAt(i);
            if (/[^a-zA-Z0-9]/.test(currentChar) == false) {
                if (/[^a-zA-Z0-9]/.test(lastChar) == false) className += currentChar;
                else className += currentChar.toUpperCase();
            }
            lastChar = currentChar;
        }
        return className;
    }

    private getValidClassNameFromModule(className: string, scriptModule: any): string {
        let validName = className ? className : null;
        if (!scriptModule) return validName; // if module is null then any name is valid
        if (scriptModule.hasOwnProperty(validName)) return validName;
        for (let item of Object.keys(scriptModule)) {
            if (item && (typeof scriptModule[item] == "function")) {
                validName = item;
                break; // just get the first valid one
            }
        }
        return validName ? validName : null;
    }

    loadGameScript(loader: any, gameName: string, callback: (loaded: any)=>void) {
        let classPath: string = "games/" + gameName + ".js";
        let gameScript = this._games.get(classPath);
        if (gameScript != undefined && gameScript != null) {
            callback(gameScript);
            return;
        }
        let className: string = "Game" + this.getClassName(gameName);
        let scriptModule = this._modules.get(classPath);
        if (scriptModule != undefined && scriptModule != null) {
            className = this.getValidClassNameFromModule(className, scriptModule);
            if (scriptModule.hasOwnProperty(className)) {
                let newInstance = Object.create(scriptModule[className].prototype);
                newInstance.constructor.apply(newInstance, []);
                newInstance.helper = this;
                this._games.set(classPath, newInstance);
                callback(newInstance);
            } else callback(null);
        } else {
            loader.import(classPath)
            .then((loadedModule) => {
                if (loadedModule) this._modules.set(classPath, loadedModule);
                className = this.getValidClassNameFromModule(className, loadedModule);
                if (loadedModule && loadedModule.hasOwnProperty(className)) {
                    let newInstance = Object.create(loadedModule[className].prototype);
                    newInstance.constructor.apply(newInstance, []);
                    newInstance.helper = this;
                    this._games.set(classPath, newInstance);
                    callback(newInstance);
                } else callback(null);
            })
            .catch((reason) => {
                console.error("Failed to load game script:");
                console.error(reason);
                callback(null);
            });
        }

        
    }

    loadSceneScript(loader: any, sceneName: string, callback: (loaded: any)=>void) {
        let classPath: string = "scenes/" + sceneName + "/"+ sceneName + ".js";
        let sceneScript = this._scenes.get(classPath);
        if (sceneScript != undefined && sceneScript != null) {
            callback(sceneScript);
            return;
        }
        let className: string = "Scene" + this.getClassName(sceneName);
        let scriptModule = this._modules.get(classPath);
        if (scriptModule != undefined && scriptModule != null) {
            className = this.getValidClassNameFromModule(className, scriptModule);
            if (scriptModule.hasOwnProperty(className)) {
                let newInstance = Object.create(scriptModule[className].prototype);
                newInstance.constructor.apply(newInstance, []);
                newInstance.helper = this;
                this._scenes.set(classPath, newInstance);
                callback(newInstance);
            } else callback(null);
        } else {
            loader.import(classPath)
            .then((loadedModule) => {
                if (loadedModule) this._modules.set(classPath, loadedModule);
                className = this.getValidClassNameFromModule(className, loadedModule);
                if (loadedModule && loadedModule.hasOwnProperty(className)) {
                    let newInstance = Object.create(loadedModule[className].prototype);
                    newInstance.constructor.apply(newInstance, []);
                    newInstance.helper = this;
                    this._scenes.set(classPath, newInstance);
                    callback(newInstance);
                } else callback(null);
            })
            .catch((reason) => {
                console.error("Failed to load scene [" + sceneName + "] script:");
                console.error(reason);
                callback(null);
            });
        }

        
    }

    loadSpriteScript(loader: any, spriteName: string, callback: (loaded: any)=>void) {
        let classPath: string = "sprites/" + spriteName + ".js";
        let spriteScript = this._sprites.get(classPath);
        if (spriteScript != undefined && spriteScript != null) {
            callback(spriteScript);
            return;
        }
        let className: string = "Sprite" + this.getClassName(spriteName);
        let scriptModule = this._modules.get(classPath);
        if (scriptModule != undefined && scriptModule != null) {
            className = this.getValidClassNameFromModule(className, scriptModule);
            if (scriptModule.hasOwnProperty(className)) {
                let newInstance = Object.create(scriptModule[className].prototype);
                newInstance.constructor.apply(newInstance, []);
                newInstance.helper = this;
                this._sprites.set(classPath, newInstance);
                callback(newInstance);
            } else callback(null);
        } else {
            loader.import(classPath)
            .then((loadedModule) => {
                if (loadedModule) this._modules.set(classPath, loadedModule);
                className = this.getValidClassNameFromModule(className, loadedModule);
                if (loadedModule && loadedModule.hasOwnProperty(className)) {
                    let newInstance = Object.create(loadedModule[className].prototype);
                    newInstance.constructor.apply(newInstance, []);
                    newInstance.helper = this;
                    this._sprites.set(classPath, newInstance);
                    callback(newInstance);
                } else callback(null);
            })
            .catch((reason) => {
                console.error("Failed to load sprite [" + spriteName + "] script:");
                console.error(reason);
                callback(null);
            });
        }
    }

    loadSceneSpriteScript(loader: any, sceneName: string, spriteName: string, callback: (loaded: any)=>void) {
        let classPath: string = "scenes/" + sceneName + "/sprites/"+ spriteName + ".js";
        let className: string = "Scene" + this.getClassName(sceneName) + "Sprite" + this.getClassName(spriteName);
        let scriptModule = this._modules.get(classPath);
        if (scriptModule != undefined && scriptModule != null) {
            className = this.getValidClassNameFromModule(className, scriptModule);
            if (scriptModule.hasOwnProperty(className)) {
                let newInstance = Object.create(scriptModule[className].prototype);
                newInstance.constructor.apply(newInstance, []);
                newInstance.helper = this;
                callback(newInstance);
            } else callback(null);
        } else {
            loader.import(classPath)
            .then((loadedModule) => {
                if (loadedModule) this._modules.set(classPath, loadedModule);
                className = this.getValidClassNameFromModule(className, loadedModule);
                if (loadedModule && loadedModule.hasOwnProperty(className)) {
                    let newInstance = Object.create(loadedModule[className].prototype);
                    newInstance.constructor.apply(newInstance, []);
                    newInstance.helper = this;
                    callback(newInstance);
                } else callback(null);
            })
            .catch((reason) => {
                console.error("Failed to load scene sprite [" + sceneName + " - " + spriteName + "] script:");
                console.error(reason);
                callback(null);
            });
        }
    }

    get(script: any, propName: string): any {
        if (script) {
            if (script[propName] != undefined) return script[propName];
            else return this.get(script.base, propName);
        } else return null;
    }

    set(script: any, propName: string, propValue: any): any {
        if (script) {
            if (script[propName] != undefined) script[propName] = propValue;
            else this.set(script.base, propName, propValue);
            return true;
        }
        return false;
    }

    call(script: any, functionName: string, ...args: any[]) {
        if (script) {
            if (script[functionName]) return script[functionName](...args);
            else return this.call(script.base, functionName, ...args);
        }
        return undefined;
    }

    proxy(script: any) {
        let ret = null;
        if (script && script.helper) {
            let win = window as any;
            if (win && win.Proxy) {
                ret = new win.Proxy(script, {
                    get: function(target, name) {
                        return target.helper.get(target, name);
                    },
                    set: function(target, name, value) {
                        return target.helper.set(target, name, value);
                    }
                });
            }
        }
        return ret;
    }

}
