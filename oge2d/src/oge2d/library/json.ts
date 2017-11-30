
import { Loader } from "./loader"

export class Json {

    name: string = "json";

    private _objectsToLoad: number = 0;
	private _loadedObjects: Array<any> = [];
	private _loadingObjectUrls: Array<string> = [];

    private _texts: Map<string, string> = new Map<string, string>();

    loadString(url: string, callback: (str: string)=>void) {
        let text = this._texts.get(url);
        if (text != undefined && text != null) {
            callback(text);
            return;
        }
        Loader.loadText(url, (content) => {
            if (this._texts.get(url)) return; // not support multiple reqests to load same thing, so just do nothing ...
            if (content != undefined && content != null) {
                if (content.length > 0) this._texts.set(url, content); // only cache non-empty string
                callback(content);
            } else callback("");
        });
    }

    loadJsons(urls: Array<string>, callback: (objs: Array<any>)=>void, progress?: (current: number, total: number)=>void) {
		this._loadedObjects = [];
        this._loadingObjectUrls = [];
        this._loadingObjectUrls.push(...urls);
        this._objectsToLoad = this._loadingObjectUrls.length;
        this.loadJsonsOneByOne(callback, progress);
	}

	private loadJsonsOneByOne(callback: (loaded: Array<any>)=>void, progress?: (current: number, total: number)=>void) {
		if (this._loadingObjectUrls.length <= 0) {
            let list = [];
			list.push(...this._loadedObjects);
            this._loadedObjects = [];
            callback(list);
        } else {
            let url = this._loadingObjectUrls.shift();
            this.loadJson(url, (obj) => {
				if (progress) progress(this._objectsToLoad - this._loadingObjectUrls.length, this._objectsToLoad);
                if (obj) this._loadedObjects.push(obj);
                this.loadJsonsOneByOne(callback, progress);
            });
        }
	}

    loadJson(url: string, callback: (obj: any)=>void) {
        this.loadString(url, (str) => {
            let json = null;
            if (str != undefined && str != null && str.length > 0) {
                try {
                    json = JSON.parse(str);
                } catch (e) {
                    json = null;
                    console.error("Failed to parse json string from " + url);
                    console.error(e);
                }
            }
            if (json == undefined) json = null;
            callback(json);
        });
    }

    getJson(url: string): any {
        let json = null;
        let text = this._texts.get(url);
        if (text != undefined && text != null && text.length > 0) {
            try {
                json = JSON.parse(text);
            } catch (e) {
                json = null;
                console.error("Failed to parse json string from " + url);
                console.error(e);
            }
            if (json == undefined) json = null;
        }
        return json;
    }

}
