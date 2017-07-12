
export class Script {

    name: string = "script";

    private _games: Map<string, any> = new Map<string, any>();
    private _scenes: Map<string, any> = new Map<string, any>();
    private _sprites: Map<string, any> = new Map<string, any>();

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

    loadGameScript(loader: any, gameName: string, callback: (loaded: any)=>void) {
        let classPath: string = "games/" + gameName + ".js";
        let gameScript = this._games.get(classPath);
        if (gameScript != undefined && gameScript != null) {
            callback(gameScript);
            return;
        }
        let className: string = "Game" + this.getClassName(gameName);
        loader.import(classPath)
        .then((loadedModule) => {
            if (loadedModule.hasOwnProperty(className)) {
                let newInstance = Object.create(loadedModule[className].prototype);
                newInstance.constructor.apply(newInstance, []);
                this._games.set(classPath, newInstance);
                callback(newInstance);
            } else callback(null);
        })
        .catch((reason) => {
            callback(null);
        });
    }

    loadSceneScript(loader: any, sceneName: string, callback: (loaded: any)=>void) {
        let classPath: string = "scenes/" + sceneName + "/"+ sceneName + ".js";
        let sceneScript = this._scenes.get(classPath);
        if (sceneScript != undefined && sceneScript != null) {
            callback(sceneScript);
            return;
        }
        let className: string = "Scene" + this.getClassName(sceneName);
        loader.import(classPath)
        .then((loadedModule) => {
            if (loadedModule.hasOwnProperty(className)) {
                let newInstance = Object.create(loadedModule[className].prototype);
                newInstance.constructor.apply(newInstance, []);
                this._scenes.set(classPath, newInstance);
                callback(newInstance);
            } else callback(null);
        })
        .catch((reason) => {
            callback(null);
        });
    }

    loadSpriteScript(loader: any, spriteName: string, callback: (loaded: any)=>void) {
        let classPath: string = "sprites/" + spriteName + ".js";
        let spriteScript = this._sprites.get(classPath);
        if (spriteScript != undefined && spriteScript != null) {
            callback(spriteScript);
            return;
        }
        let className: string = "Sprite" + this.getClassName(spriteName);
        loader.import(classPath)
        .then((loadedModule) => {
            if (loadedModule.hasOwnProperty(className)) {
                let newInstance = Object.create(loadedModule[className].prototype);
                newInstance.constructor.apply(newInstance, []);
                this._sprites.set(classPath, newInstance);
                callback(newInstance);
            } else callback(null);
        })
        .catch((reason) => {
            callback(null);
        });
    }

    loadSceneSpriteScript(loader: any, sceneName: string, spriteName: string, callback: (loaded: any)=>void) {
        let classPath: string = "scenes/" + sceneName + "/sprites/"+ spriteName + ".js";
        let spriteScript = this._sprites.get(classPath);
        if (spriteScript != undefined && spriteScript != null) {
            callback(spriteScript);
            return;
        }
        let className: string = "Scene" + this.getClassName(sceneName) + "Sprite" + this.getClassName(spriteName);
        loader.import(classPath)
        .then((loadedModule) => {
            if (loadedModule.hasOwnProperty(className)) {
                let newInstance = Object.create(loadedModule[className].prototype);
                newInstance.constructor.apply(newInstance, []);
                this._sprites.set(classPath, newInstance);
                callback(newInstance);
            } else callback(null);
        })
        .catch((reason) => {
            callback(null);
        });
    }

}
