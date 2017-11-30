import { Loader } from "./loader";

export class Preload {

    total: number;
    current: number;

    totalPackCount: number;
    loadedPackCount: number;

    private _setting: any = null;
    private _contents: Array<string> = [];
    private _loadingPacks: Array<string> = [];
    private _libraries: { [name: string]: any } = { };

    preload(setting: any, libs: { [name: string]: any }, callback: ()=>void, progress?: (current: number, total: number)=>void) {
        if (this.prepare(setting) > 0) {
            this.load(libs, callback, progress);
        } else {
            callback();
        }
    }

    prepare(setting: any) {
        if (setting == undefined || setting == null) return 0;
        this._setting = setting;
        this._contents = Object.keys(setting);
        this.total = 0;
        this.current = 0;
        for (let content of this._contents) {
            if (content == "musics") this.total += this._setting["musics"].length;
            else if (content == "sounds") this.total += this._setting["sounds"].length;
            else if (content == "images") this.total += this._setting["images"].length;
        }
        return this.total;
    }

    load(libs: { [name: string]: any }, callback: ()=>void, progress?: (current: number, total: number)=>void) {
        if (this._setting == undefined || this._setting == null 
            || libs == undefined || libs == null) {
            callback();
            return;
        }
        this._libraries = libs;
        this.loadOneByOne(callback, progress);
    }

    private loadOneByOne(callback: ()=>void, progress?: (current: number, total: number)=>void) {
        if (this._contents.length <= 0) {
            callback();
        } else {
            let content = this._contents.shift();
            if (content == "musics") {

                let musics = this._setting["musics"], urls = [];
                for (let music of musics) urls.push("audio/musics/" + music + (music.indexOf('.') >= 0 ? '' : '.mp3'));
                //console.log("loading musics: "); console.log(musics);
                this._libraries["audio"].loadMusics(urls, (objs) => this.loadOneByOne(callback, progress), (c, t) => {
                    this.current++;
                    if (progress) progress(this.current, this.total);
                });

            } else if (content == "sounds") {

                let sounds = this._setting["sounds"], urls = [];
                for (let sound of sounds) urls.push("audio/sounds/" + sound + (sound.indexOf('.') >= 0 ? '' : '.mp3'));
                //console.log("loading sounds: "); console.log(sounds);
                this._libraries["audio"].loadSounds(urls, (objs) => this.loadOneByOne(callback, progress), (c, t) => {
                    this.current++;
                    if (progress) progress(this.current, this.total);
                });

            } else if (content == "images") {

                let images = this._setting["images"], urls = [];
                for (let image of images) urls.push("img/" + image + (image.indexOf('.') >= 0 ? '' : '.png'));
                //console.log("loading images: "); console.log(images);
                this._libraries["image"].loadImages(urls, (objs) => this.loadOneByOne(callback, progress), (c, t) => {
                    this.current++;
                    if (progress) progress(this.current, this.total);
                });

            } else if (content == "jsons") {

                let jsons = this._setting["jsons"], urls = [];
                for (let json of jsons) urls.push("json/" + json + (json.indexOf('.') >= 0 ? '' : '.json'));
                //console.log("loading jsons: "); console.log(jsons);
                this._libraries["json"].loadJsons(urls, (objs) => this.loadOneByOne(callback, progress), (c, t) => {
                    this.current++;
                    if (progress) progress(this.current, this.total);
                });

            } else {

                this.loadOneByOne(callback, progress); // anyway, just keep trying to load next content

            }
        }
    }

    loadPack(url: string, callback: (loaded: any)=>void) {
        Loader.loadPack(url, callback);
    }

    loadPacks(urls: Array<string>, callback: ()=>void, progress?: (current: number, total: number, url?: string)=>void) {
        this._loadingPacks = [];
        this._loadingPacks.push(...urls);
        this.totalPackCount = this._loadingPacks.length;
        this.loadedPackCount = 0;
        this.loadPacksOneByOne(callback, progress);
    }

    private loadPacksOneByOne(callback: ()=>void, progress?: (current: number, total: number, url?: string)=>void) {
        if (this._loadingPacks.length <= 0) {
            callback();
        } else {
            let packUrl = this._loadingPacks.shift();
            this.loadPack(packUrl, (loaded) => {
                this.loadedPackCount++;
                progress(this.loadedPackCount, this.totalPackCount, packUrl);
                this.loadPacksOneByOne(callback, progress);
            })
        }
    }
}