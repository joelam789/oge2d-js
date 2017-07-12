import { Loader } from "./loader"

export class Texture {

    name: string = "image";

    private _images: Map<string, any> = new Map<string, any>();
    private _textures: Map<string, any> = new Map<string, any>();

    private _imagesToLoad: number = 0;
    private _loadedImages: Array<any> = [];
    private _loadingImageUrls: Array<string> = [];

    private _loadingUrls: Array<string> = [];
    private _loadingAreas: Array<any> = [];
    private _loadedTextures: Array<any> = [];

    private _loadingSheetNames: Array<string> = [];
    private _loadedSheetUrls: Map<string, Array<string>> = new Map<string, Array<string>>();
    private _loadedSheetAreas: Map<string, Array<any>> = new Map<string, Array<any>>();
    private _loadedSheets: Map<string, Array<any>> = new Map<string, Array<any>>();

    loadSheets(names: Array<string>, urls: Map<string, Array<string>>, areas: Map<string, Array<any>>, callback: (sheets: Map<string, Array<any>>)=>void) {
        if (urls.size != areas.size) {
            callback(null);
            return;
        }
        this._loadingSheetNames = [];
        this._loadedSheets.clear();
        this._loadedSheetUrls.clear();
        this._loadedSheetAreas.clear();

        for (let item of names) this._loadingSheetNames.push(item);
        urls.forEach((value, key) => {
            this._loadedSheetUrls.set(key, value);
        });
        areas.forEach((value, key) => {
            this._loadedSheetAreas.set(key, value);
        });

        this.loadSheetsOneByOne(callback);
    }

    private loadSheetsOneByOne(callback: (sheets: Map<string, Array<any>>)=>void) {
        if (this._loadedSheetUrls.size != this._loadedSheetAreas.size) {
            callback(null);
            return;
        }
        if (this._loadingSheetNames.length <= 0) {
            let map = new Map<string, Array<any>>();
            this._loadedSheets.forEach((value, key) => {
                map.set(key, value);
            });
            this._loadedSheets.clear();
            this._loadedSheetUrls.clear();
            this._loadedSheetAreas.clear();
            callback(map);
            return;
        } else {
            let sheetName = this._loadingSheetNames.shift();
            let urls = this._loadedSheetUrls.get(sheetName);
            let areas = this._loadedSheetAreas.get(sheetName);
            if (sheetName && urls && areas) {
                this.loadTextures(urls, areas, (pics) => {
                    this._loadedSheets.set(sheetName, pics);
                    this._loadedSheetUrls.delete(sheetName);
                    this._loadedSheetAreas.delete(sheetName);
                    this.loadSheetsOneByOne(callback);
                });
            } else callback(null);
            
        }
    }

    loadTextures(urls: Array<string>, areas: Array<any>, callback: (textures: Array<any>)=>void) {
        if (urls.length != areas.length) {
            callback([]);
            return;
        }
        this._loadingUrls = [];
        this._loadingAreas = [];
        this._loadedTextures = [];
        for (let item of urls) this._loadingUrls.push(item);
        for (let item of areas) this._loadingAreas.push(item);
        this.loadTexturesOneByOne(callback);
    }

    private loadTexturesOneByOne(callback: (textures: Array<any>)=>void) {
        if (this._loadingUrls.length != this._loadingAreas.length) {
            callback([]);
            return;
        }
        if (this._loadingUrls.length <= 0) {
            let list = [];
            for (let item of this._loadedTextures) list.push(item);
            this._loadedTextures = [];
            callback(list);
            return;
        } else {
            let url = this._loadingUrls.shift();
            let area = this._loadingAreas.shift();
            this.loadTexture(url, area, (tex) => {
                if (tex) this._loadedTextures.push(tex);
                this.loadTexturesOneByOne(callback);
            });
        }
    }

    getTexture(url: string, area: any): any {
        let texId = url + "," + area.x + "," + area.y + "," + area.width + "," + area.height;
        let tex = this._textures.get(texId);
        if (tex != undefined && tex != null) return tex;
        let img = this._images.get(url);
        if (img != undefined && img != null) {
            let newTex = new PIXI.Texture(img, new PIXI.Rectangle(area.x, area.y, area.width, area.height));
            if (newTex) this._textures.set(texId, newTex);
            if (newTex) return newTex;
        }
        return null;
    }

    loadTexture(url: string, area: any, callback: (texture: any)=>void) {
        let texId = url + "," + area.x + "," + area.y + "," + area.width + "," + area.height;
        let tex = this._textures.get(texId);
        if (tex != undefined && tex != null) {
            callback(tex);
            return;
        }
        this.loadImage(url, (img) => {
            if (img) {
                img.update();
                let newTex = new PIXI.Texture(img, new PIXI.Rectangle(area.x, area.y, area.width, area.height));
                if (newTex) this._textures.set(texId, newTex);
                callback(newTex);
            } else callback(null);
        });
    }

    loadImages(urls: Array<string>, callback: (objs: Array<any>)=>void, progress?: (current: number, total: number)=>void) {
		if (urls && urls.length > 0) {
            this._loadedImages = [];
			this._loadingImageUrls = [];
			Array.prototype.push.apply(this._loadingImageUrls, urls);
            this._imagesToLoad = this._loadingImageUrls.length;
			this.loadImagesOneByOne(callback, progress);
        } else {
			callback([]);
		}
	}

	private loadImagesOneByOne(callback: (loaded: Array<any>)=>void, progress?: (current: number, total: number)=>void) {
		if (this._loadingImageUrls.length <= 0) {
            let list = [];
			Array.prototype.push.apply(list, this._loadedImages);
            this._loadedImages = [];
            callback(list);
        } else {
            let url = this._loadingImageUrls.shift();
            this.loadImage(url, (obj) => {
                if (progress) progress(this._imagesToLoad - this._loadingImageUrls.length, this._imagesToLoad);
                if (obj) this._loadedImages.push(obj);
                this.loadImagesOneByOne(callback, progress);
            });
        }
	}

    loadImage(url: string, callback: (img: any)=>void) {
        let tex = this._images.get(url);
        if (tex != undefined && tex != null) {
            callback(tex);
            return;
        }
        let fmt = "";
        let pos = url.lastIndexOf('.');
        if (pos > 0) fmt = url.substring(pos + 1);
        if (fmt.length <= 0) fmt = "png";
        Loader.loadBytes(url, (content) => {
            if (this._images.get(url)) return; // not support multiple reqests to load same thing, so just do nothing ...
            if (content != undefined && content != null && content.length > 0) {
                let image = new Image();
                image.addEventListener("load", (event) => {
                    if (this._images.get(url)) return;
                    let newTexture = new PIXI.Texture(new PIXI.BaseTexture(image));
                    if (newTexture) this._images.set(url, newTexture);
                    callback(newTexture);
                });
                image.src = "data:image/" + fmt.toLowerCase() + ";base64," + this.bytesToBase64(content);
            } else callback(null);
        });
    }

    // public method for encoding an Uint8Array to base64
    bytesToBase64 (input) {
        let keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        let output = "";
        let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        let i = 0;

        while (i < input.length) {
            chr1 = input[i++];
            chr2 = i < input.length ? input[i++] : Number.NaN; // not sure if the index 
            chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) + keyStr.charAt(enc4);
        }
        return output;
    }
}
