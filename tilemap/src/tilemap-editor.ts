
import { autoinject, BindingEngine } from 'aurelia-framework';
import { EventAggregator, Subscription } from 'aurelia-event-aggregator';
import { Router } from 'aurelia-router';

import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';

import { ipcRenderer } from "electron";

import { TileListCanvas } from "./controls/tile-list-canvas";
import { NewTilemapDlg } from "./popups/tilemap/new-tilemap";
import { SaveTilemapDlg } from "./popups/tilemap/save-tilemap";
import { SelectTilesetDlg } from "./popups/tileset/select-tileset";
import { SelectTilemapDlg } from "./popups/tilemap/select-tilemap";
import { SetCostDlg } from "./popups/tilemap/set-cost";

import { HttpClient } from "./http-client";
import { App } from './app';
import * as UI from './ui-messages';

@autoinject()
export class TilemapEditorPage {

    tileset: any = {};
    tilesets: Array<any> = [];

    tileWidth: number = 0;
    tileHeight: number = 0;
    columnCount: number = 0;
    rowCount: number = 0;

    tilesetImage: HTMLImageElement = null;
    tilesetCanvas: HTMLCanvasElement = null;
    tilesetControl: TileListCanvas = null;

    tilemap: any = {};
    tilemapBg: HTMLCanvasElement = null;
    tilemapGrids: HTMLCanvasElement = null;
    tilemapCanvas: HTMLCanvasElement = null;
    tilemapTileCanvas: HTMLCanvasElement = null;
    cursorCanvas: HTMLCanvasElement = null;

    selectedTilesetName: string = "";

    isMouseDown: boolean = false;
    startRect: any = { x: 0, y: 0, w: 0, h: 0 };
    endRect: any = { x: 0, y: 0, w: 0, h: 0 };

    currentRect: any = { x: 0, y: 0, w: 0, h: 0 };

    gridFlags = [];
    replacementFlags = [];

    selectedArea: any = null;

    histCursor = -1;
    histRecords = [];

    subscribers: Array<Subscription> = [];

    private _loadingTilesets: Array<string> = [];

    constructor(public dialogService: DialogService, public router: Router, 
        public binding: BindingEngine, public i18n: I18N, public eventChannel: EventAggregator) {

        this.subscribers = [];
    }

    private gridFlagsChanged() {
        console.log("gridFlagsChanged");
        this.refreshTilemapGrids();
    }

    activate(parameters, routeConfig) {
        console.log("activate");
    }

    deactivate() {
        console.log("deactivate");
    }

    attached() {
        console.log("attached");
        this.isMouseDown = false;
        this.tilesetControl = (this as any).tileListCanvas;
        this.tilesetCanvas = this.tilesetControl.canvas;
        this.tilemapBg = document.getElementById("tilemap-bg") as HTMLCanvasElement;
        this.tilemapGrids = document.getElementById("tilemap-grid") as HTMLCanvasElement;
        this.tilemapCanvas = document.getElementById("tilemap-map") as HTMLCanvasElement;
        this.tilemapTileCanvas = document.getElementById("tilemap-tile") as HTMLCanvasElement;
        this.cursorCanvas = document.getElementById("cursor-rect") as HTMLCanvasElement;
        if (this.cursorCanvas) this.cursorCanvas.style.visibility = "hidden";
        if (this.tilemapCanvas) {
            this.tilemapCanvas.onmousemove = (e) => this.onMouseMove(e);
            this.tilemapCanvas.onmousedown = (e) => this.onMouseDown(e);
            this.tilemapCanvas.onmouseup = (e) => this.onMouseUp(e);
        }

        this.subscribers = [];

        this.subscribers.push(this.binding
            .collectionObserver(this.gridFlags)
            .subscribe(() => this.gridFlagsChanged()));

        this.subscribers.push(this.eventChannel.subscribe(UI.CreateNewFile, data => this.openNewTilemapDlg()));
        this.subscribers.push(this.eventChannel.subscribe(UI.OpenFile, data => this.openSelectTilemapDlg()));
        this.subscribers.push(this.eventChannel.subscribe(UI.SaveFile, data => this.saveTilemap()));
        this.subscribers.push(this.eventChannel.subscribe(UI.SaveFileAs, data => this.openSaveTilemapDlg()));
    }

    detached() {
        console.log("detached");
        for (let item of this.subscribers) item.dispose();
        this.subscribers = [];
    }

    get maxImageCanvasHeight() {
        return window.innerHeight - 150;
    }

    get maxListCanvasHeight() {
        return window.innerHeight - 180;
    }

    clearHist() {
        this.histCursor = -1;
        this.histRecords = [];
    }

    record() {
        if (this.tilemap && this.tilemap.cells && this.tilemap.cells.length > 0) {
            this.histRecords.length = this.histCursor + 1;
            this.histRecords[this.histRecords.length] = JSON.parse(JSON.stringify(this.tilemap));
            console.log(this.tilemap);
            this.histCursor = this.histRecords.length - 1;
        }
    }

    hexToRGBA(hex: string) {
        let r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16),
            a = -1;
        if (hex.length >= 9) a = parseInt(hex.slice(7, 9), 16);
        return a < 0 ? "rgb(" + r + ", " + g + ", " + b + ")"
            : "rgba(" + r + ", " + g + ", " + b + ", " + Math.round((a / 255.0) * 100) / 100 + ")";
    }

    getRect(posX: number, posY: number, isFreeStyleSelection: boolean = false) {

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
        let rect = this.getRect(e.offsetX, e.offsetY);
        if (rect.w <= 0 || rect.h <= 0) return;

        if (rect.x == this.currentRect.x && rect.y == this.currentRect.y
            && rect.w == this.currentRect.w && rect.h == this.currentRect.h) return;
        
        this.currentRect.x = rect.x;
        this.currentRect.y = rect.y;
        this.currentRect.w = rect.w;
        this.currentRect.h = rect.h;

        let going2remove = e.shiftKey === true;
        let showingGrids = this.gridFlags.length > 0;
        if (showingGrids) going2remove = false;

        if (showingGrids) {
            if (this.cursorCanvas) this.cursorCanvas.style.visibility = "hidden";
            if (!this.isMouseDown) return;
        } else {
            if (this.cursorCanvas) {
                this.cursorCanvas.style.left = rect.x + 'px';
                this.cursorCanvas.style.top = rect.y + 'px';
                this.cursorCanvas.style.visibility = "visible";
            }
        }

        let needUpdateAreaRect = this.isMouseDown;
        if (this.tilesetControl && this.tilesetControl.startRect && this.tilesetControl.endRect) {
            if (this.tilesetControl.startRect.x != this.tilesetControl.endRect.x
                || this.tilesetControl.startRect.y != this.tilesetControl.endRect.y) needUpdateAreaRect = false;
        }

        if (this.isMouseDown) {
            if (going2remove || showingGrids) needUpdateAreaRect = true;
        }

        if (needUpdateAreaRect) {
            this.endRect.x = this.currentRect.x;
            this.endRect.y = this.currentRect.y;
            this.endRect.w = this.currentRect.w;
            this.endRect.h = this.currentRect.h;
            this.refreshTilemapTiles(going2remove || showingGrids);
        }

        this.updateCursorImage(going2remove || showingGrids);
    }

    onMouseDown(e) {

        //if (this.gridFlags.length > 0) {
        //    this.isMouseDown = true;
        //    return;
        //}

        let going2remove = e.shiftKey === true;
        let showingGrids = this.gridFlags.length > 0;
        if (showingGrids) going2remove = false;

        let needUpdateAreaRect = true;
        if (this.tilesetControl && this.tilesetControl.startRect && this.tilesetControl.endRect) {
            if (this.tilesetControl.startRect.x != this.tilesetControl.endRect.x
                || this.tilesetControl.startRect.y != this.tilesetControl.endRect.y) needUpdateAreaRect = false;
        }

        if (going2remove || showingGrids) needUpdateAreaRect = true;

        if (needUpdateAreaRect) {

            this.startRect.x = this.currentRect.x;
            this.startRect.y = this.currentRect.y;
            this.startRect.w = this.currentRect.w;
            this.startRect.h = this.currentRect.h;

            this.endRect.x = this.currentRect.x;
            this.endRect.y = this.currentRect.y;
            this.endRect.w = this.currentRect.w;
            this.endRect.h = this.currentRect.h;

            if (this.startRect.w <= 0 || this.startRect.h <= 0) return;
        }

        this.isMouseDown = true;

        this.refreshTilemapTiles(going2remove || showingGrids);
    }

    onMouseUp(e) {

        let going2remove = e.shiftKey === true;
        let showingGrids = this.gridFlags.length > 0;
        if (showingGrids) going2remove = false;

        if (showingGrids) {
            if (this.startRect.x >= 0 && this.startRect.y >= 0 && this.startRect.w > 0 && this.startRect.h > 0
                && this.endRect.x >= 0 && this.endRect.y >= 0 && this.endRect.w > 0 && this.endRect.h > 0
                && (this.startRect.x != this.endRect.x || this.startRect.y != this.endRect.y)) {
                    console.log('Selected multiple tiles');
            } else {
                this.isMouseDown = false;
                if (e.ctrlKey === true && this.currentRect.w > 0 && this.currentRect.h > 0) {
                    if (e.button == 0) this.addTileCost(this.currentRect.x, this.currentRect.y, 1);
                    else if (e.button == 2) this.addTileCost(this.currentRect.x, this.currentRect.y, -1);
                }
                this.refreshTilemapGrids();
                return;
            }
        }

        let needUpdateAreaRect = true;
        if (this.tilesetControl && this.tilesetControl.startRect && this.tilesetControl.endRect) {
            if (this.tilesetControl.startRect.x != this.tilesetControl.endRect.x
                || this.tilesetControl.startRect.y != this.tilesetControl.endRect.y) needUpdateAreaRect = false;
        }

        if (going2remove || showingGrids) needUpdateAreaRect = true;

        if (needUpdateAreaRect) {
            this.endRect.x = this.currentRect.x;
            this.endRect.y = this.currentRect.y;
            this.endRect.w = this.currentRect.w;
            this.endRect.h = this.currentRect.h;
        }

        this.isMouseDown = false;

        if (showingGrids) this.refreshTilemapTiles(showingGrids);
        else {
            this.applyCurrentTiles(e.ctrlKey === true || this.replacementFlags.length > 0, going2remove);
            this.refreshTilemapTiles();
        }
    }

    setCost() {
        let showingGrids = this.gridFlags.length > 0;
        if (showingGrids) {
            if (this.startRect.x >= 0 && this.startRect.y >= 0 && this.startRect.w > 0 && this.startRect.h > 0
                && this.endRect.x >= 0 && this.endRect.y >= 0 && this.endRect.w > 0 && this.endRect.h > 0
                && (this.startRect.x != this.endRect.x || this.startRect.y != this.endRect.y)) {
                
                this.dialogService.open({viewModel: SetCostDlg, model: 0})
                .whenClosed((response) => {
                    if (!response.wasCancelled && response.output) {
                        //console.log(response.output);
                        let cost = response.output;
                        let x= 0, y = 0, pos = 0;
                        for (let row=0; row<this.tilemap.rowCount; row++) {
                            for (let col=0; col<this.tilemap.columnCount; col++) {
                                if (x >= this.startRect.x && x <= this.endRect.x && y >= this.startRect.y && y <= this.endRect.y) {
                                    let cell = this.tilemap.cells[pos];
                                    if (cell) cell.cost = cost;
                                    //console.log('cell.cost = ' + cell.cost);
                                }
                                pos++;
                                x += this.tileWidth;
                            }
                            x = 0;
                            y += this.tileHeight;
                        }
                        this.refreshTilemapGrids();
                    } else {
                        console.log('Give up setting costs of selected tiles');
                    }
                });

            }
        }
        
    }

    loadTileset(tilesetName: string, callback: (tileset: any)=>void) {
        let url = "json/tilesets/" + tilesetName + ".json";
        HttpClient.getJSON(url, "", (json) => {
            //console.log(json);
            if (this.tileWidth != json.tileWidth 
                || this.tileHeight != json.tileHeight) {
                console.log("Tileset's tile size is incorrect: " + tilesetName);
                callback(null);
                return;
            }

            let tileset = {name: json.name, tileWidth: json.tileWidth, tileHeight: json.tileHeight, obj: null, img: null};
            let url = "img/" + json.image;
            if (url.indexOf('.') < 0) url += ".png";
            let img = new Image();
            img.onload = () => {
                tileset.obj = json;
                tileset.img = img;
                if (this.tilemap) {
                    if (this.tilemap.tilesetNames) {
                        if (this.tilemap.tilesetNames.indexOf(tileset.name) < 0) this.tilemap.tilesetNames.push(tileset.name);
                    } else {
                        this.tilemap.tilesetNames = [tileset.name];
                    }
                }
                let existing = false;
                for (let item of this.tilesets) {
                    if (item.name == tileset.name) {
                        existing = true;
                        break;
                    }
                }
                if (!existing) this.tilesets.push(tileset);
                callback(tileset);
            };
            img.src = url;

        }, (errmsg) => {
            console.log("Failed to load tileset data from - " + url);
            console.log("Error - " + errmsg);
            callback(null);
        });
    }

    private loadTilesetsOneByOne(callback: ()=>void) {
        if (this._loadingTilesets.length <= 0) {
            callback();
        } else {
            this.loadTileset(this._loadingTilesets.shift(), (tileset) => {
                this.loadTilesetsOneByOne(callback);
            });
        }
    }

    loadTilesets(tilesetNames: Array<string>, callback: ()=>void) {
        this._loadingTilesets = [];
        Array.prototype.push.apply(this._loadingTilesets, tilesetNames);
        this.loadTilesetsOneByOne(callback);
    }

    openTileset(tilesetName: string) {
        let tileset = null;
        for (let item of this.tilesets) {
            if (item.name == tilesetName) {
                tileset = item;
                break;
            }
        }
        if (tileset) {
            this.tilesetImage = tileset.img;
            this.tileset = tileset.obj;
            if (this.tileset.columnCount && this.tilesetControl)
                this.tilesetControl.columnCount = this.tileset.columnCount;
        }
    }

    changeCurrentTileset() {
        this.openTileset(this.selectedTilesetName);
    }

    openSelectTilesetDlg() {
        this.dialogService.open({viewModel: SelectTilesetDlg, model: {multiple: true}})
        .whenClosed((response) => {
            if (!response.wasCancelled && response.output) {
                //console.log(response.output);
                //if (response.output.length > 0) this.openTileset(response.output[0]);
                let tilesetNames = [];
                for (let item of response.output) {
                    let existing = false;
                    for (let tileset of this.tilesets) {
                        if (tileset.name == item) {
                            existing = true;
                            break;
                        }
                    }
                    if (!existing) tilesetNames.push(item);
                }
                if (tilesetNames.length > 0) {
                    this.loadTilesets(tilesetNames, () => {
                        //console.log(this.tilesets);
                        if (this.selectedTilesetName.length <= 0 && this.tilesets.length > 0) {
                            this.selectedTilesetName = this.tilesets[0].name;
                            this.changeCurrentTileset();
                        }
                    });
                }
                
            } else {
                console.log('Give up selecting tilesets');
            }
        });
    }

    openNewTilemapDlg() {

        this.dialogService.open({viewModel: NewTilemapDlg, model: '' })
        .whenClosed((response) => {
            if (!response.wasCancelled && response.output) {
                //console.log(response.output);
                let tilemap = JSON.parse(JSON.stringify(this.tilemap));
                tilemap.name = response.output.name;
                tilemap.tileWidth = response.output.tileWidth;
                tilemap.tileHeight = response.output.tileHeight;
                tilemap.columnCount = response.output.columnCount;
                tilemap.rowCount = response.output.rowCount;
                tilemap.bgcolor = response.output.bgcolor;
                tilemap.tilesetNames = [];
                Array.prototype.push.apply(tilemap.tilesetNames, response.output.tilesetNames);
                tilemap.cells = [];
                for (let i=0; i<tilemap.columnCount*tilemap.rowCount; i++) {
                    tilemap.cells.push({ids:[-1, -1]});
                }
                //console.log(tilemap);
                this.loadTilemap(tilemap, true, () => {
                    this.clearHist();
                    this.record();
                });

            } else {
                console.log('Give up creating a new tilemap');
            }
        });
    }

    refreshTilemapBg() {
        if (this.tilemapBg) {
            let ctx = this.tilemapBg.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, this.tilemapBg.width, this.tilemapBg.height);
                this.tilemapBg.width = this.tileWidth * this.columnCount;
                this.tilemapBg.height = this.tileHeight * this.rowCount;
                //console.log(this.tilemap.bgcolor);
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, this.tilemapBg.width, this.tilemapBg.height);
            }
            ctx = this.tilemapTileCanvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, this.tilemapTileCanvas.width, this.tilemapTileCanvas.height);
            this.tilemapTileCanvas.width = this.tilemapBg.width;
            this.tilemapTileCanvas.height = this.tilemapBg.height;
        }
    }

    refreshTilemapGrids() {
        if (this.tilemapGrids) {
            let ctx = this.tilemapGrids.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, this.tilemapGrids.width, this.tilemapGrids.height);
                this.tilemapGrids.width = this.tileWidth * this.columnCount;
                this.tilemapGrids.height = this.tileHeight * this.rowCount;
                /*
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                for (let i=0; i < this.tilemapGrids.height; i += this.tileHeight) {
                    ctx.moveTo(0,i);
                    ctx.lineTo(this.tilemapGrids.width, i);
                    ctx.stroke();
                }
                for (let i=0; i < this.tilemapGrids.width; i += this.tileWidth) {
                    ctx.moveTo(i,0);
                    ctx.lineTo(i,this.tilemapGrids.height);
                    ctx.stroke();
                }
                */

                ctx.font = 'bold ' + (this.tileWidth / 2) + 'px arial, serif';
                ctx.fillStyle = 'white';

                console.log(this.tilemap);

                let x= 0, y = 0, pos = 0;
                for (let row=0; row<this.tilemap.rowCount; row++) {
                    for (let col=0; col<this.tilemap.columnCount; col++) {
                        let cell = this.tilemap.cells[pos];
                        if (cell.cost != undefined) {
                            if (cell.cost >= 0) {
                                ctx.fillStyle = 'white';
                                ctx.fillRect(x+2, y+2, this.tileWidth - 4, this.tileHeight - 4);
                                ctx.fillStyle = 'black';
                            } else {
                                ctx.fillStyle = 'red';
                                ctx.fillRect(x+2, y+2, this.tileWidth - 4, this.tileHeight - 4);
                                ctx.fillStyle = 'white';
                            }
                            //ctx.fillStyle = cell.cost >= 0 ? 'green' : 'red';
                            let cost = cell.cost.toString();
                            let text = ctx.measureText(cost);
                            //let textHeight = (text as any).actualBoundingBoxDescent - (text as any).actualBoundingBoxAscent;
                            let textHeight = 0 - (this.tileHeight / 4);
                            ctx.fillText(cost, x+(this.tileWidth-text.width)/2, y+(this.tileHeight-textHeight)/2);
                        } else {
                            ctx.fillStyle = 'white';
                            ctx.fillRect(x+2, y+2, this.tileWidth - 4, this.tileHeight - 4);
                        }
                        pos++;
                        x += this.tileWidth;
                    }
                    x = 0;
                    y += this.tileHeight;
                }
            }
        }
    }

    refreshTilemapTiles(showAreaRect?: boolean) {
        let ctx = this.tilemapTileCanvas ? this.tilemapTileCanvas.getContext('2d') : null;
        if (ctx) {
            this.tilemapTileCanvas.style.opacity = this.gridFlags.length > 0 ? '1.0' : '0.5';
            ctx.clearRect(0, 0, this.tilemapTileCanvas.width, this.tilemapTileCanvas.height);
            if (showAreaRect === true) {
                ctx.strokeStyle = "red";
                ctx.strokeRect(this.startRect.x, this.startRect.y, 
                    this.endRect.x + this.endRect.w - this.startRect.x, this.endRect.y + this.endRect.h - this.startRect.y);
            } else if (this.startRect.w > 0 && this.endRect.w > 0) {
                let tileRect = this.isMouseDown && this.tilesetControl ? this.tilesetControl.currentTileRect : null;
                if (tileRect && this.isMouseDown && this.tilesetControl.tileset && this.tilesetControl.image) {
                    for (let x = this.startRect.x; x <= this.endRect.x; x += tileRect.w) {
                        for (let y = this.startRect.y; y <= this.endRect.y; y += tileRect.h) {
                            ctx.drawImage(this.tilesetControl.image, tileRect.x, tileRect.y, tileRect.w, tileRect.h,
                                x, y, this.tileset.tileWidth, this.tileset.tileHeight);
                        }
                    }
                }
            }
        }
        
    }

    applyCurrentTiles(replacement: boolean, remove?: boolean) {

        let tilesetIndex = -1;
        let currentTilesetName = this.tilesetControl.tileset ? this.tilesetControl.tileset.name : null;
        if (currentTilesetName == null) return;
        for (let i=0; i<this.tilesets.length; i++) {
            if (this.tilesets[i].name == currentTilesetName) {
                tilesetIndex = i;
                break;
            }
        }
        if (tilesetIndex < 0 && remove !== true) return;

        let onlyOneTile = this.cursorCanvas.width == this.tileWidth && this.cursorCanvas.height == this.tileHeight;

        if (onlyOneTile) {

            let tileIndex = this.tilesetControl.currentTileIndex;
            if (tileIndex < 0  && remove !== true) return;

            //console.log("tilesetIndex: " + tilesetIndex + " , tileIndex: " + tileIndex);

            let x= 0, y = 0, pos = 0;
            for (let row=0; row<this.tilemap.rowCount; row++) {
                for (let col=0; col<this.tilemap.columnCount; col++) {
                    if (x >= this.startRect.x && x <= this.endRect.x && y >= this.startRect.y && y <= this.endRect.y) {
                        let cell = this.tilemap.cells[pos];
                        if (remove === true) {
                            if (cell.ids.length >= 4) {
                                cell.ids.length = cell.ids.length - 2;
                            } else {
                                cell.ids = [-1, -1];
                            }
                        } else {
                            if (replacement || cell.ids[0] == -1) {
                                cell.ids = [tilesetIndex, tileIndex];
                            } else {
                                cell.ids.push(tilesetIndex);
                                cell.ids.push(tileIndex);
                            }
                        }
                        if (cell.ids.length >= 2) {
                            let currentTileIndex = cell.ids[cell.ids.length - 1];
                            let currentTilesetIndex = cell.ids[cell.ids.length - 2];
                            if (currentTilesetIndex >= 0 && currentTileIndex >= 0) {
                                let tileset = this.tilesets[currentTilesetIndex];
                                let tile = tileset.obj.tiles[currentTileIndex];
                                console.log('tile.cost = ' + tile.cost);
                                cell.cost = tile.cost == undefined ? 0 : tile.cost;
                            } else {
                                cell.cost = 0;
                            }
                        }
                        //console.log('cell.cost = ' + cell.cost);
                        //console.log("added: [" + tilesetIndex + ", " + tileIndex + "] => [" + row + ", " + col + "]");
                    }
                    pos++;
                    x += this.tileWidth;
                }
                x = 0;
                y += this.tileHeight;
            }

        } else {

            if (remove === true) return;

            let tileIndexes = this.tilesetControl.getCurrentTileIndexes();
            if (tileIndexes.length <= 0) return;

            let startRect = { x: this.currentRect.x, y: this.currentRect.y, w: this.tileWidth, h: this.tileHeight };
            let endRect = { x: this.currentRect.x + this.cursorCanvas.width - this.tileWidth, 
                y: this.currentRect.y + this.cursorCanvas.height - this.tileHeight, w: this.tileWidth, h: this.tileHeight };

            let x= 0, y = 0, pos = 0, idx = -1;
            for (let row=0; row<this.tilemap.rowCount; row++) {
                for (let col=0; col<this.tilemap.columnCount; col++) {
                    if (x >= startRect.x && x <= endRect.x && y >= startRect.y && y <= endRect.y) {
                        idx++;
                        let tileIndex = tileIndexes[idx];
                        let cell = this.tilemap.cells[pos];
                        if (replacement || cell.ids[0] == -1) {
                            cell.ids = [tilesetIndex, tileIndex];
                        } else {
                            cell.ids.push(tilesetIndex);
                            cell.ids.push(tileIndex);
                        }
                        if (cell.ids.length >= 2) {
                            let currentTileIndex = cell.ids[cell.ids.length - 1];
                            let currentTilesetIndex = cell.ids[cell.ids.length - 2];
                            if (currentTilesetIndex >= 0 && currentTileIndex >= 0) {
                                let tileset = this.tilesets[currentTilesetIndex];
                                let tile = tileset.obj.tiles[currentTileIndex];
                                //console.log('tile.cost = ' + tile.cost);
                                cell.cost = tile.cost == undefined ? 0 : tile.cost;
                            } else {
                                cell.cost = 0;
                            }
                        }
                        //console.log('cell.cost = ' + cell.cost);
                    }
                    pos++;
                    x += this.tileWidth;
                }
                x = 0;
                y += this.tileHeight;
            }

        }

        this.record();

        this.refreshTilemapDisplay();

        this.startRect = { x: 0, y: 0, w: 0, h: 0 };
        this.endRect = { x: 0, y: 0, w: 0, h: 0 };
        
    }

    refreshTilemapDisplay() {
        let ctx = this.tilemapCanvas ? this.tilemapCanvas.getContext('2d') : null;
        if (ctx) {
            ctx.clearRect(0, 0, this.tilemapCanvas.width, this.tilemapCanvas.height);
            //ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
            ctx.fillStyle = this.hexToRGBA(this.tilemap.bgcolor ? this.tilemap.bgcolor : "#00000000");
            let x= 0, y = 0, pos = 0;
            for (let row=0; row<this.tilemap.rowCount; row++) {
                for (let col=0; col<this.tilemap.columnCount; col++) {
                    let cell = this.tilemap.cells[pos];
                    for (let idx=0; idx<cell.ids.length; idx+=2) {
                        let tilesetIndex = cell.ids[idx];
                        let tileIndex = cell.ids[idx+1];
                        if (tilesetIndex >= 0 && tileIndex >= 0) {
                            let tileset = this.tilesets[tilesetIndex];
                            let tile = tileset.obj.tiles[tileIndex];
                            ctx.drawImage(tileset.img, tile.offsets[0], tile.offsets[1], this.tileWidth, this.tileHeight, 
                                            x, y, this.tileWidth, this.tileHeight);
                        } else {
                            ctx.fillRect(x, y, this.tileWidth, this.tileHeight);
                        }
                    }
                    pos++;
                    x += this.tileWidth;
                }
                x = 0;
                y += this.tileHeight;
            }
        }
    }

    saveTilemap() {
        if (this.tilemap && this.tilemap.name && this.tilemap.cells.length > 0) {
            ipcRenderer.once("save-tilemap-return", (event, result) => {
                if (result.err) alert(result.err);
                else alert(this.i18n.tr("app.save-file-ok") + "\n\n" + result.url + "\n");
            });
            ipcRenderer.send("save-tilemap", this.tilemap);
        }
    }

    fillUp() {
        this.startRect.x = 0;
        this.startRect.y = 0;
        this.startRect.w = this.tileWidth;
        this.startRect.h = this.tileHeight;

        this.endRect.x = this.tilemapCanvas.width - this.tileWidth;
        this.endRect.y = this.tilemapCanvas.height - this.tileHeight;
        this.endRect.w = this.tileWidth;
        this.endRect.h = this.tileHeight;

        this.applyCurrentTiles(true);
    }

    updateCursorImage(showingAreaRect?: boolean) {

        let canvasWidth = this.tileWidth;
        let canvasHeight = this.tileHeight;
        let tileRects = this.tilesetControl ? this.tilesetControl.getCurrentTileRects() : null;
        if (showingAreaRect === true) tileRects = null;
        if (this.cursorCanvas && tileRects && tileRects.length > 0 && this.tilesetControl.tileset && this.tilesetControl.image) {
            
            if (this.tilesetControl.startRect && this.tilesetControl.endRect) {

                canvasWidth = this.tilesetControl.endRect.x + this.tilesetControl.endRect.w - this.tilesetControl.startRect.x;
                canvasHeight = this.tilesetControl.endRect.y + this.tilesetControl.endRect.h - this.tilesetControl.startRect.y;

                this.cursorCanvas.style.visibility = "visible";
                this.cursorCanvas.width = canvasWidth;
                this.cursorCanvas.height = canvasHeight;
                let ctx = this.cursorCanvas.getContext('2d');

                let x = 0, y = 0, idx = 0;
                while (ctx && idx < tileRects.length && y < canvasHeight) {
                    let tile = tileRects[idx];
                    ctx.drawImage(this.tilesetControl.image, tile.x, tile.y, tile.w, tile.h, x, y, tile.w, tile.h);
                    x += this.tileWidth;
                    if (x >= canvasWidth) {
                        x = 0;
                        y += this.tileHeight;
                    }
                    idx++;
                }

            } else {

                this.cursorCanvas.style.visibility = "visible";
                this.cursorCanvas.width = canvasWidth;
                this.cursorCanvas.height = canvasHeight;
                let ctx = this.cursorCanvas.getContext('2d');

                let tile = tileRects[0];
                ctx.drawImage(this.tilesetControl.image, tile.x, tile.y, tile.w, tile.h, 0, 0, tile.w, tile.h);

            }

        } else {

            if (this.gridFlags.length == 0 && this.cursorCanvas) {
                this.cursorCanvas.style.visibility = "visible";
                this.cursorCanvas.width = canvasWidth;
                this.cursorCanvas.height = canvasHeight;
                let ctx = this.cursorCanvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, this.cursorCanvas.width, this.cursorCanvas.height);
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = 'rgba(255,0,255,0.8)'; // fuchsia
                    ctx.strokeRect(0, 0, this.cursorCanvas.width, this.cursorCanvas.height);
                }
            }
        }

        
    }

    refreshTilemap() {
        //console.log("refreshing tilemap...");

        this.updateCursorImage();
        
        if (this.tilemapCanvas) {
            this.tilemapCanvas.width = this.tileWidth * this.columnCount;
            this.tilemapCanvas.height = this.tileHeight * this.rowCount;
        }
        this.tilemap.tilesetNames = [];
        for (let item of this.tilesets) this.tilemap.tilesetNames.push(item.name);
        if (!this.selectedTilesetName || this.tilemap.tilesetNames.indexOf(this.selectedTilesetName) < 0) {
            this.selectedTilesetName = this.tilemap.tilesetNames[0];
        }
        this.refreshTilemapBg();
        this.refreshTilemapDisplay();
        this.refreshTilemapGrids();

        this.changeCurrentTileset();
    }

    loadTilemap(tilemap: any, needReloadTilesets: boolean, callback?: ()=>void) {

        //console.log("loading tilemap - " + needReloadTilesets);

        this.tileWidth = tilemap.tileWidth;
        this.tileHeight = tilemap.tileHeight;
        this.columnCount = tilemap.columnCount;
        this.rowCount = tilemap.rowCount;

        if (needReloadTilesets) {
            this.tilesets = [];
            let tilesetNames = [];
            if (tilemap.tilesetNames == undefined) tilemap.tilesetNames = [];
            for (let item of tilemap.tilesetNames) {
                let existing = false;
                for (let tileset of this.tilesets) {
                    if (tileset.name == item) {
                        existing = true;
                        break;
                    }
                }
                if (!existing) tilesetNames.push(item);
                if (tilemap.tilesetNames.indexOf(item) < 0) tilemap.tilesetNames.push(item);
            }
            if (tilesetNames.length > 0) {
                this.loadTilesets(tilesetNames, () => {
                    this.reloadTilemap(tilemap);
                    if (callback) callback();
                });
            } else {
                this.reloadTilemap(tilemap);
                if (callback) callback();
            }
        } else {
            this.reloadTilemap(tilemap);
            if (callback) callback();
        }
        
    }

    addTileCost(posx, posy, value) {
        let x= 0, y = 0, pos = 0;
        for (let row=0; row<this.tilemap.rowCount; row++) {
            for (let col=0; col<this.tilemap.columnCount; col++) {
                if (x == posx && y == posy) {
                    let cell = this.tilemap.cells[pos];
                    if (cell.cost == undefined) cell.cost = 0;
                    cell.cost += value;
                    return;
                }
                pos++;
                x += this.tileWidth;
            }
            x = 0;
            y += this.tileHeight;
        }
    }

    reloadTilemap(tilemap) {
        this.tilemap = JSON.parse(JSON.stringify(tilemap));
        if (this.tilemap.bgcolor == undefined) this.tilemap.bgcolor = "#00000000";

        let x= 0, y = 0, pos = 0;
        for (let row=0; row<this.tilemap.rowCount; row++) {
            for (let col=0; col<this.tilemap.columnCount; col++) {
                let cell = this.tilemap.cells[pos];
                if (cell.cost == undefined && cell.ids.length >= 2) {
                    let tilesetIndex = cell.ids[cell.ids.length - 2];
                    let tileIndex = cell.ids[cell.ids.length - 1];
                    if (tilesetIndex >= 0 && tileIndex >= 0) {
                        let tileset = this.tilesets[tilesetIndex];
                        let tile = tileset.obj.tiles[tileIndex];
                        cell.cost = tile.cost == undefined ? 0 : tile.cost;
                    } else {
                        cell.cost = 0;
                    }
                }
                pos++;
                x += this.tileWidth;
            }
            x = 0;
            y += this.tileHeight;
        }

        this.refreshTilemap();
    }

    openTilemap(tilemapName: string) {
        let url = "json/tilemaps/" + tilemapName + ".json";
        HttpClient.getJSON(url, "", (json) => {
            let tilemap = json;
            //console.log(tilemap);
            this.loadTilemap(tilemap, true, () => {
                this.clearHist();
                this.record();
            });
        }, (errmsg) => {
            alert("Failed to load tilemap data from - " + url);
            alert("Error - " + errmsg);
        });
    }

    openSelectTilemapDlg() {
        this.dialogService.open({viewModel: SelectTilemapDlg})
        .whenClosed((response) => {
            if (!response.wasCancelled && response.output) {
                //console.log(response.output);
                if (response.output.length > 0) this.openTilemap(response.output[0]);
            } else {
                console.log('Give up selecting tilemap');
            }
        });
    }

    openSaveTilemapDlg() {
        this.dialogService.open({viewModel: SaveTilemapDlg, model: this.tilemap.name})
        .whenClosed((response) => {
            if (!response.wasCancelled && response.output) {
                //console.log(response.output);
                if (response.output.length > 0) this.tilemap.name = response.output;
                this.saveTilemap();
            } else {
                console.log('Give up saving tilemap');
            }
        });
    }

    undo() {
        if (this.histRecords.length > 0 && this.histCursor > 0) {
            this.histCursor--;
            this.loadTilemap(this.histRecords[this.histCursor], false);
        }
    }

    redo() {
        if (this.histRecords.length > 0 && this.histCursor < this.histRecords.length - 1) {
            this.histCursor++;
            this.loadTilemap(this.histRecords[this.histCursor], false);
        }
    }

}
