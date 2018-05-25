
import { autoinject } from 'aurelia-framework';
import { EventAggregator, Subscription } from 'aurelia-event-aggregator';
import { Router } from 'aurelia-router';

import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';

import { ipcRenderer } from "electron";

import { SelectTilesetDlg } from "./popups/tileset/select-tileset";
import { SaveTilesetDlg } from "./popups/tileset/save-tileset";
import { NewTilesetDlg } from "./popups/tileset/new-tileset";
import { EditTileDlg } from "./popups/tileset/edit-tile";

import { TileListCanvas } from "./controls/tile-list-canvas";

import { HttpClient } from "./http-client";
import { App } from './app';
import * as UI from './ui-messages';

@autoinject()
export class TilesetEditorPage {

    image: HTMLImageElement = null;
    listCanvas: HTMLCanvasElement = null;
    listControl: TileListCanvas = null;
    imageCanvas: HTMLCanvasElement = null;
    cursorCanvas: HTMLCanvasElement = null;
    imageName: string = "";
    tileWidth: number = 0;
    tileHeight: number = 0;
    freeSelectionFlags = [];
    selectedRects = [];
    isMouseDown: boolean = false;
    startRect: any = null;
    endRect: any = null;
    currentRect: any = { x: 0, y: 0, w: 0, h: 0 };
    tileset: any = {};

    subscribers: Array<Subscription> = [];
    
    constructor(public dialogService: DialogService, public router: Router, 
                public i18n: I18N, public eventChannel: EventAggregator) {

        this.subscribers = [];

    }

    activate(parameters, routeConfig) {
        console.log("activate");
    }

    deactivate() {
        console.log("deactivate");
    }

    attached() {
        console.log("attached");
        this.listControl = (this as any).tileListCanvas;
        this.listCanvas = this.listControl.canvas;
        this.imageCanvas = document.getElementById("tileset-img") as HTMLCanvasElement;
        this.cursorCanvas = document.getElementById("cursor-rect") as HTMLCanvasElement;
        if (this.imageCanvas) {
            this.imageCanvas.ondblclick = (e) => this.onDoubleClick(e);
            this.imageCanvas.onmousemove = (e) => this.onMouseMove(e);
            this.imageCanvas.onmousedown = (e) => this.onMouseDown(e);
            this.imageCanvas.onmouseup = (e) => this.onMouseUp(e);
        }

        this.subscribers = [];
        this.subscribers.push(this.eventChannel.subscribe(UI.CreateNewFile, data => this.openNewTilesetDlg()));
        this.subscribers.push(this.eventChannel.subscribe(UI.OpenFile, data => this.openSelectTilesetDlg()));
        this.subscribers.push(this.eventChannel.subscribe(UI.SaveFile, data => this.saveTileset()));
        this.subscribers.push(this.eventChannel.subscribe(UI.SaveFileAs, data => this.openSaveTilesetDlg()));
    }

    detached() {
        console.log("detached");
        for (let item of this.subscribers) item.dispose();
        this.subscribers = [];
    }
 
    created() {
        console.log("created");
    }

    canActivate() {
        console.log("canActivate");
    }

    getRect(posX: number, posY: number, isFreeStyleSelection: boolean) {

        let rect = { x: 0, y: 0, w: this.tileWidth, h: this.tileHeight };

        if (rect.w <= 0 || rect.h <= 0) return rect;

        if (isFreeStyleSelection) {
            rect.x = posX - Math.round(this.tileWidth / 2);
            rect.y = posY - Math.round(this.tileHeight / 2);
        } else {
            while (rect.x < posX) rect.x += this.tileWidth;
            while (rect.y < posY) rect.y += this.tileHeight;
            if (rect.x > posX) rect.x -= this.tileWidth;
            if (rect.y > posY) rect.y -= this.tileHeight;
        }
        
        if (rect.x < 0) {
            rect.x = 0;
            rect.w = this.tileWidth;
        }

        if (rect.y < 0) {
            rect.y = 0;
            rect.h = this.tileHeight;
        }

        return rect;
    }

    onMouseMove(e) {
        let rect = this.getRect(e.offsetX, e.offsetY, this.freeSelectionFlags.length > 0);
        if (rect.w <= 0 || rect.h <= 0) return;

        if (rect.x == this.currentRect.x && rect.y == this.currentRect.y
            && rect.w == this.currentRect.w && rect.h == this.currentRect.h) return;
        
        this.currentRect.x = rect.x;
        this.currentRect.y = rect.y;
        this.currentRect.w = rect.w;
        this.currentRect.h = rect.h;

        //this.refreshCanvas();
        if (this.cursorCanvas) {
            this.cursorCanvas.style.left = rect.x + 'px';
            this.cursorCanvas.style.top = rect.y + 'px';
        }

        if (this.isMouseDown 
            && this.freeSelectionFlags.length <= 0
            && this.startRect && this.endRect 
            && e.ctrlKey !== true) {
            if (!this.endRect) this.endRect = { x: 0, y: 0, w: 0, h: 0 };
            this.endRect.x = this.currentRect.x;
            this.endRect.y = this.currentRect.y;
            this.endRect.w = this.currentRect.w;
            this.endRect.h = this.currentRect.h;
            this.refreshImageCanvas();
        }
    }

    onMouseDown(e) {
        //console.log(e);
        let rect = this.getRect(e.offsetX, e.offsetY, this.freeSelectionFlags.length > 0);
        if (rect.w <= 0 || rect.h <= 0) return;

        if (!this.startRect) this.startRect = { x: 0, y: 0, w: 0, h: 0 };
        if (!this.endRect) this.endRect = { x: 0, y: 0, w: 0, h: 0 };

        this.startRect.x = this.currentRect.x;
        this.startRect.y = this.currentRect.y;
        this.startRect.w = this.currentRect.w;
        this.startRect.h = this.currentRect.h;

        this.endRect.x = this.currentRect.x;
        this.endRect.y = this.currentRect.y;
        this.endRect.w = this.currentRect.w;
        this.endRect.h = this.currentRect.h;

        if (this.startRect.w <= 0 || this.startRect.h <= 0) return;

        this.isMouseDown = true;

        if (e.ctrlKey === true) {
            let idx = -1;
            for (let i=0; i<this.selectedRects.length; i++) {
                if (this.selectedRects[i].x == rect.x && this.selectedRects[i].y == rect.y) {
                    idx = i;
                    break;
                }
            }
            if (idx < 0) this.selectedRects.push(rect);
            else this.selectedRects.splice(idx, 1);
            this.startRect = null;
            this.endRect = null;
        } else {
            this.selectedRects = [];
            this.selectedRects.push(rect);
        }
        
        this.refreshImageCanvas();
    }

    onMouseUp(e) {

        if (!this.endRect) this.endRect = { x: 0, y: 0, w: 0, h: 0 };
        
        this.endRect.x = this.currentRect.x;
        this.endRect.y = this.currentRect.y;
        this.endRect.w = this.currentRect.w;
        this.endRect.h = this.currentRect.h;

        this.isMouseDown = false;

        if (e.ctrlKey === true) {
            this.startRect = null;
            this.endRect = null;
        }
    }

    onDoubleClick(e) {
        let rect = this.getRect(e.offsetX, e.offsetY, this.freeSelectionFlags.length > 0);
        if (rect.w <= 0 || rect.h <= 0) return;
        this.addNewTile();
    }

    refreshImageCanvas() {
        if (this.image == undefined || this.image == null) return;
        let ctx = this.imageCanvas ? this.imageCanvas.getContext('2d') : null;
        if (ctx) {
            ctx.clearRect(0, 0, this.image.width, this.image.height);
            ctx.drawImage(this.image, 0, 0);
            ctx.lineWidth = 2;
            if (this.selectedRects.length > 1) {
                ctx.strokeStyle = 'rgba(0,0,255,0.7)';
                for (let rect of this.selectedRects) ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
            }
            if (this.startRect && this.endRect) {
                ctx.strokeStyle = 'rgba(0,255,0,0.7)';
                ctx.strokeRect(this.startRect.x, this.startRect.y, 
                    this.endRect.x + this.endRect.w - this.startRect.x, this.endRect.y + this.endRect.h - this.startRect.y);
            }
        } 
    }

    get maxImageCanvasHeight() {
        return window.innerHeight - 150;
    }

    get maxListCanvasHeight() {
        return window.innerHeight - 180;
    }

    addNewTile() {
        if (this.selectedRects.length <= 0) return;
        if (this.tileset.tiles == undefined || this.tileset.tiles == null) this.tileset.tiles = [];
        let tileset = JSON.parse(JSON.stringify(this.tileset));
        let tile = {
            id: tileset.tiles.length,
            cost: 0, speed: 0,
            offsets: []
        };
        for (let rect of this.selectedRects) {
            tile.offsets.push(rect.x);
            tile.offsets.push(rect.y);
        }
        if (this.selectedRects.length > 1) tile.speed = 0.1; // 60fps * 0.1 = 6fps
        if (this.listControl) {
            let currentIndex = this.listControl.currentTileIndex;
            if (currentIndex >= 0) {
                let tiles = [];
                for (let i=0; i<currentIndex; i++) tiles.push(tileset.tiles[i]);
                tiles.push(tile);
                for (let i=currentIndex; i<tileset.tiles.length; i++) tiles.push(tileset.tiles[i]);
                tileset.tiles = tiles;
            } else tileset.tiles.push(tile);
        } else tileset.tiles.push(tile);
        for (let i=0; i<tileset.tiles.length; i++) tileset.tiles[i].id = i;
        this.tileset = tileset;
    }

    editTile() {

        let selectedTileRects = this.listControl ? this.listControl.getSelectedRects() : null;

        if (selectedTileRects == undefined || selectedTileRects == null) selectedTileRects = [];
        if (this.tileset.tiles == undefined || this.tileset.tiles == null) this.tileset.tiles = [];
        if (selectedTileRects.length <= 0 || this.tileset.tiles.length <= 0) return;
        
        let selectedTile = null;
        let x = 0, y = 0;
        for (let tile of this.tileset.tiles) {
            for (let i=selectedTileRects.length - 1; i >= 0; i--) {
                let rect = selectedTileRects[i];
                if (rect.x == x && rect.y == y) {
                    selectedTile = tile;
                    break;
                }
            }
            if (selectedTile) break;
            x += this.tileWidth;
            if (x >= this.listCanvas.width) {
                x = 0;
                y += this.tileHeight;
            }
        }
        
        if (!selectedTile) return;

        this.dialogService.open({viewModel: EditTileDlg, model: { 
                                    tile: selectedTile, 
                                    image: this.image,
                                    tileWidth: this.tileWidth, 
                                    tileHeight: this.tileHeight }})
        .whenClosed((response) => {
            if (!response.wasCancelled && response.output) {
                //console.log(response.output);
                selectedTile.cost = response.output.cost;
                selectedTile.speed = response.output.speed;
            } else {
                console.log('Give up editing current tile');
            }
        });
    }

    autoAddTiles() {
        if (this.image == undefined || this.image == null) return;
        if (!this.startRect || !this.endRect) return;
        if (this.tileset.tiles == undefined || this.tileset.tiles == null) this.tileset.tiles = [];
        let newTiles = [];
        let tileset = JSON.parse(JSON.stringify(this.tileset));
        let selectedArea = { x: this.startRect.x, y: this.startRect.y, 
            w: this.endRect.x + this.endRect.w - this.startRect.x, h: this.endRect.y + this.endRect.h - this.startRect.y };
        let x = selectedArea.x, y = selectedArea.y;
        while (y + this.tileHeight <= selectedArea.y + selectedArea.h) {
            while (x + this.tileWidth <= selectedArea.x + selectedArea.w) {
                newTiles.push({
                    id: 0,
                    cost: 0, speed: 0,
                    offsets: [x, y]
                });
                x += this.tileWidth;
            }
            x = selectedArea.x;
            y += this.tileHeight;
        }
        if (this.listControl) {
            let currentIndex = this.listControl.currentTileIndex;
            if (currentIndex >= 0) {
                let tiles = [];
                for (let i=0; i<currentIndex; i++) tiles.push(tileset.tiles[i]);
                for (let i=0; i<newTiles.length; i++) tiles.push(newTiles[i]);
                for (let i=currentIndex; i<tileset.tiles.length; i++) tiles.push(tileset.tiles[i]);
                tileset.tiles = tiles;
            } else for (let i=0; i<newTiles.length; i++) tileset.tiles.push(newTiles[i]);
        } else for (let i=0; i<newTiles.length; i++) tileset.tiles.push(newTiles[i]);
        for (let i=0; i<tileset.tiles.length; i++) tileset.tiles[i].id = i;
        this.tileset = tileset;
    }

    clear() {
        let tileset = JSON.parse(JSON.stringify(this.tileset));
        tileset.tiles = [];
        this.tileset = tileset;
    }

    removeTiles() {
        let selectedTileRects = this.listControl ? this.listControl.getSelectedRects() : null;

        if (selectedTileRects == undefined || selectedTileRects == null) selectedTileRects = [];
        if (this.tileset.tiles == undefined || this.tileset.tiles == null) this.tileset.tiles = [];
        if (selectedTileRects.length <= 0 || this.tileset.tiles.length <= 0) return;

        let tileset = JSON.parse(JSON.stringify(this.tileset));

        let remains = [];
        let colCount = Math.ceil(this.listCanvas.width / this.tileWidth);
        let x = 0, y = 0;
        for (let tile of tileset.tiles) {
            let selected = false;
            for (let rect of selectedTileRects) {
                if (rect.x == x && rect.y == y) {
                    selected = true;
                    break;
                }
            }
            if (!selected) remains.push(tile);
            x += this.tileWidth;
            if (x >= this.listCanvas.width) {
                x = 0;
                y += this.tileHeight;
            }
        }
        tileset.tiles = remains;
        this.tileset = tileset;
    }

    saveTileset() {
        if (this.tileset.image && this.tileset.name && this.tileset.tiles.length > 0) {
            ipcRenderer.once("save-tileset-return", (event, result) => {
                if (result.err) alert(result.err);
                else alert(this.i18n.tr("app.save-file-ok") + "\n\n" + result.url + "\n");
            });
            if (this.listControl) this.tileset.columnCount = this.listControl.columnCount;
            ipcRenderer.send("save-tileset", this.tileset);
        }
    }

    openTileset(tilesetName: string) {
        let url = "json/tilesets/" + tilesetName + ".json";
        HttpClient.getJSON(url, "", (json) => {
            let tileset = json;
            for (let i=0; i<tileset.tiles.length; i++) {
                tileset.tiles[i].id = i;
                if (tileset.tiles[i].cost == undefined) tileset.tiles[i].cost = 0;
                if (tileset.tiles[i].speed == undefined) tileset.tiles[i].speed = 0;
            }
            //console.log(tileset);
            this.tileWidth = tileset.tileWidth;
            this.tileHeight = tileset.tileHeight;
            if (this.cursorCanvas) {
                this.cursorCanvas.style.visibility = "visible";
                this.cursorCanvas.width = this.tileWidth;
                this.cursorCanvas.height = this.tileHeight;
                let ctx = this.cursorCanvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, this.cursorCanvas.width, this.cursorCanvas.height);
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = 'rgba(255,0,0,0.7)';
                    ctx.strokeRect(0, 0, this.cursorCanvas.width, this.cursorCanvas.height);
                }
            }

            let url = "img/" + tileset.image;
            if (url.indexOf('.') < 0) url += ".png";
            let ctx = this.imageCanvas ? this.imageCanvas.getContext('2d') : null;
            if (ctx) {
                this.image = new Image();
                this.image.onload = () => {
                    this.imageCanvas.width = this.image.width;
                    this.imageCanvas.height = this.image.height;
                    ctx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
                    ctx.drawImage(this.image, 0, 0);
                    this.tileset = tileset;
                    if (tileset.columnCount && this.listControl) this.listControl.columnCount = tileset.columnCount;
                };
                this.image.src = url;
            }

        }, (errmsg) => {
            alert("Failed to load tileset data from - " + url);
            alert("Error - " + errmsg);
        });
    }

    openNewTilesetDlg() {

        this.dialogService.open({viewModel: NewTilesetDlg, model: '' })
        .whenClosed((response) => {
            if (!response.wasCancelled && response.output) {
                //console.log(response.output);
                let tileset = JSON.parse(JSON.stringify(this.tileset));
                let imgfilepath = response.output.image.replace(/\\/g, '/');
                tileset.image = "tilesets/" + imgfilepath.substring(imgfilepath.lastIndexOf('/')+1);
                tileset.name = response.output.name;
                tileset.tileWidth = response.output.tileWidth;
                tileset.tileHeight = response.output.tileHeight;
                tileset.tiles = [];
                this.tileWidth = tileset.tileWidth;
                this.tileHeight = tileset.tileHeight;
                if (this.cursorCanvas) {
                    this.cursorCanvas.style.visibility = "visible";
                    this.cursorCanvas.width = this.tileWidth;
                    this.cursorCanvas.height = this.tileHeight;
                    let ctx = this.cursorCanvas.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, this.cursorCanvas.width, this.cursorCanvas.height);
                        ctx.lineWidth = 4;
                        ctx.strokeStyle = 'rgba(255,0,0,0.7)';
                        ctx.strokeRect(0, 0, this.cursorCanvas.width, this.cursorCanvas.height);
                    }
                }
                let newTilesetSetting = response.output;
                ipcRenderer.once("copy-tileset-img-return", (event, img) => {
                    if (img.err) alert(img.err);
                    else if (img.url) {
                        let ctx = this.imageCanvas ? this.imageCanvas.getContext('2d') : null;
                        if (ctx) {
                            this.image = new Image();
                            this.image.onload = () => {
                                this.imageCanvas.width = this.image.width;
                                this.imageCanvas.height = this.image.height;
                                ctx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
                                ctx.drawImage(this.image, 0, 0);
                                this.tileset = tileset;
                            };
                            this.image.src = img.url;
                        }
                    }
                });
                ipcRenderer.send("copy-tileset-img", newTilesetSetting.image);

            } else {
                console.log('Give up creating a new tileset');
            }
        });
    }

    openSelectTilesetDlg() {
        this.dialogService.open({viewModel: SelectTilesetDlg, model: {multiple: false}})
        .whenClosed((response) => {
            if (!response.wasCancelled && response.output) {
                //console.log(response.output);
                if (response.output.length > 0) this.openTileset(response.output[0]);
            } else {
                console.log('Give up selecting tilesets');
            }
        });
    }

    openSaveTilesetDlg() {
        this.dialogService.open({viewModel: SaveTilesetDlg, model: this.tileset.name})
        .whenClosed((response) => {
            if (!response.wasCancelled && response.output) {
                //console.log(response.output);
                if (response.output.length > 0) this.tileset.name = response.output;
                this.saveTileset();
            } else {
                console.log('Give up saving tileset');
            }
        });
    }

}
