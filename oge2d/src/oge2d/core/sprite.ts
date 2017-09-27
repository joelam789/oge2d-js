
import { Game } from "./game";
import { Scene } from "./scene";
import { Updater } from "./updater";

export class Sprite {

    name: string = "";

    game: Game = null;
    scene: Scene = null;

    origin: Sprite = null;

    script: any = null;
    plot: Plot = null;

    template: string = "";

    components: any = { };

    private _active: boolean = false;

    get active(): boolean {
        return this._active;
    }
    set active(value: boolean) {
        if (value == this._active) return;
        let systems = this.scene.systemList;
        this._active = value;
        if (this._active) {
            for (let system of systems) if (system.enable) system.enable(this);
            let eventSystem: any = this.scene.systems["event"];
            if (eventSystem) eventSystem.callEvent(this, "onActivate");
        } else {
            for (let system of systems) if (system.disable) system.disable(this);
            let eventSystem: any = this.scene.systems["event"];
            if (eventSystem) eventSystem.callEvent(this, "onDeactivate");
        }
    }

    constructor(scene: Scene, name: string) {
        this.game = scene.game;
        this.scene = scene;
        this.name = name;
    }

    get(componentName: string) {
        return this.components[componentName];
    }

    call(functionName: string, ...args: any[]) {
        if (this.script && this.script.helper) {
            let params = Array.from(args);
            this.script.helper.caller = this.name; // just for reference...
            return this.script.helper.call(this.script, functionName, params);
        }
    }

}

export class Plot {

    done: boolean = false;

    private _spr: Sprite = null;
    private _gen: Generator = null;
    private _wait: Array<string> = [];
    private _func: GeneratorFunction = null;

    constructor(spr: Sprite, genfunc: GeneratorFunction) {
        this._spr = spr;
        this._func = genfunc;
        this.reset();
    }

    get available(): boolean {
        return this._gen != undefined && this._gen != null;
    }

    reset() {
        this._gen = this._func ? this._func(this._spr) : null;
        this.done = false;
        this._wait = [];
    }

    pause(...signals: string[]): number {
        if (signals) {
            let count = 0;
            for (let signal of signals) {
                let idx = this._wait.indexOf(signal);
                if (idx < 0) {
                    this._wait.push(signal);
                    count++;
                }
            }
            return count;
        }
        return 0;
    }

    resume(...signals: string[]): number {
        if (signals) {
            let count = 0;
            for (let signal of signals) {
                let idx = this._wait.indexOf(signal);
                if (idx >= 0) {
                    this._wait.splice(idx, 1);
                    count++;
                }
            }
            return count;
        }
        return 0;
    }

    wait(target?: number | string): number {
        if (target == undefined) return this.pause("::::");
        if (typeof target == "string") {
            return this.pause(target);
        } else {
            if (target <= 0) return;
            this._spr.scene.timeout(target, () => this.resume("::timer::"));
            return this.pause("::timer::");
        }
    }

    signal(value?: string): number {
        return value ? this.resume(value) : this.resume("::::");
    }

    next(): any {
        if (this._wait.length > 0) return null;
        let ret = this._gen ? this._gen.next() : null;
        if (ret) {
            this.done = ret.done;
            return ret.value;
        }
        return null;
    }
}
