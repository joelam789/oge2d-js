import { autoinject, customElement, bindable, observable } from 'aurelia-framework';
import { I18N } from "aurelia-i18n";

@autoinject()
@customElement('tile-list-canvas')
export class TileListCanvas {

    @bindable image: HTMLImageElement = null;
    @bindable tileset: any = null;

    @observable columnCount = 8;
    selectedRects = [];

    isMouseDown: boolean = false;
    startRect: any = null;
    endRect: any = null;
    currentRect: any = { x: 0, y: 0, w: 0, h: 0 };

    tileRect: any = null;

    private _canvas: HTMLCanvasElement = null;

    constructor(public element: Element, public i18n: I18N) {
    }

    private findCanvas(element: Element) {
        let canvas: HTMLCanvasElement = element as HTMLCanvasElement;
        if (canvas && canvas.getContext) return canvas;
        else {
            canvas = null;
            if (element && element.children && element.children.length > 0) {
                for (let i=0; i<element.children.length; i++) {
                    canvas = this.findCanvas(element.children[i]);
                    if (canvas) return canvas;
                }
            }
        }
        return canvas;
    }

    get canvas(): HTMLCanvasElement {
        if (this._canvas == null) this._canvas = this.findCanvas(this.element);
        return this._canvas;
    }

    getCurrentTileRect(tileset, rects) {
        let selectedTile = null;
        let canvas = this.canvas;
        let x = 0, y = 0;
        for (let tile of tileset.tiles) {
            for (let i=rects.length - 1; i >= 0; i--) {
                let rect = rects[i];
                if (rect.x == x && rect.y == y) {
                    selectedTile = tile;
                    break;
                }
            }
            if (selectedTile) break;
            x += tileset.tileWidth;
            if (x >= canvas.width) {
                x = 0;
                y += tileset.tileHeight;
            }
        }
        return selectedTile ? {x: selectedTile.offsets[0], y: selectedTile.offsets[1], 
                                w: tileset.tileWidth, h: tileset.tileHeight} : null;
        
    }

    getCurrentTileRects() {

        let rects = [], keys = [];
        if (this.startRect && this.endRect) {
            for (let x = this.startRect.x; x <= this.endRect.x; x += this.tileset.tileWidth) {
                for (let y = this.startRect.y; y <= this.endRect.y; y += this.tileset.tileHeight) {
                    let rect = {x: x, y: y, w: this.tileset.tileWidth, h: this.tileset.tileHeight};
                    let key = rect.x + "," + rect.y;
                    if (keys.indexOf(key) < 0) {
                        keys.push(key);
                        rects.push(rect);
                    }
                }
            }
        } else {
            for (let rect of this.selectedRects) {
                let key = rect.x + "," + rect.y;
                if (keys.indexOf(key) < 0) {
                    keys.push(key);
                    rects.push(rect);
                    break;
                }
            }
        }

        let selectedTiles = [];
        if (this.tileset && this.tileset.tiles && this.tileset.tiles.length > 0) {
            let canvas = this.canvas;
            let x = 0, y = 0;
            for (let tile of this.tileset.tiles) {
                for (let i=rects.length - 1; i >= 0; i--) {
                    let rect = rects[i];
                    if (rect.x == x && rect.y == y) {
                        selectedTiles.push(tile);
                        break;
                    }
                }
                x += this.tileset.tileWidth;
                if (x >= canvas.width) {
                    x = 0;
                    y += this.tileset.tileHeight;
                }
            }
        }

        let selectedTileSrcRects = [];
        for (let tile of selectedTiles) {
            selectedTileSrcRects.push( {x: tile.offsets[0], y: tile.offsets[1], 
                w: this.tileset.tileWidth, h: this.tileset.tileHeight} );
        }

        return selectedTileSrcRects;
        
    }

    get currentTileRect() {
        return this.getCurrentTileRect(this.tileset, this.selectedRects);
        
    }

    getCurrentTileIndex(tileset, rects) {
        let selectedTile = null;
        let canvas = this.canvas;
        let index = -1, x = 0, y = 0;
        if (rects && rects.length > 0) {
            for (let tile of tileset.tiles) {
                index++;
                for (let i=rects.length - 1; i >= 0; i--) {
                    let rect = rects[i];
                    if (rect.x == x && rect.y == y) {
                        selectedTile = tile;
                        break;
                    }
                }
                if (selectedTile) break;
                x += tileset.tileWidth;
                if (x >= canvas.width) {
                    x = 0;
                    y += tileset.tileHeight;
                }
            }
        }
        return selectedTile ? index : -1;
    }

    getCurrentTileIndexes() {

        let rects = [], keys = [];
        if (this.startRect && this.endRect) {
            for (let x = this.startRect.x; x <= this.endRect.x; x += this.tileset.tileWidth) {
                for (let y = this.startRect.y; y <= this.endRect.y; y += this.tileset.tileHeight) {
                    let rect = {x: x, y: y, w: this.tileset.tileWidth, h: this.tileset.tileHeight};
                    let key = rect.x + "," + rect.y;
                    if (keys.indexOf(key) < 0) {
                        keys.push(key);
                        rects.push(rect);
                    }
                }
            }
        } else {
            for (let rect of this.selectedRects) {
                let key = rect.x + "," + rect.y;
                if (keys.indexOf(key) < 0) {
                    keys.push(key);
                    rects.push(rect);
                    break;
                }
            }
        }

        let selectedIndexes = [];
        if (this.tileset && this.tileset.tiles && this.tileset.tiles.length > 0) {
            let canvas = this.canvas;
            let index = -1, x = 0, y = 0;
            for (let tile of this.tileset.tiles) {
                index++;
                for (let i=rects.length - 1; i >= 0; i--) {
                    let rect = rects[i];
                    if (rect.x == x && rect.y == y) {
                        let idx = index;
                        selectedIndexes.push(idx);
                        break;
                    }
                }
                x += this.tileset.tileWidth;
                if (x >= canvas.width) {
                    x = 0;
                    y += this.tileset.tileHeight;
                }
            }
        }

        return selectedIndexes;
        
    }

    get currentTileIndex() {
        return this.getCurrentTileIndex(this.tileset, this.selectedRects);
    }

    getSelectedRects() {
        let rects = [], keys = [];
        for (let rect of this.selectedRects) {
            let key = rect.x + "," + rect.y;
            if (keys.indexOf(key) < 0) {
                keys.push(key);
                rects.push(rect);
            }
        }
        if (this.startRect && this.endRect) {
            for (let x = this.startRect.x; x <= this.endRect.x; x += this.tileset.tileWidth) {
                for (let y = this.startRect.y; y <= this.endRect.y; y += this.tileset.tileHeight) {
                    let rect = {x: x, y: y, w: this.tileset.tileWidth, h: this.tileset.tileHeight};
                    let key = rect.x + "," + rect.y;
                    if (keys.indexOf(key) < 0) {
                        keys.push(key);
                        rects.push(rect);
                    }
                }
            }
        }
        return rects;
    }

    attached() {
        console.log("tile-list-canvas attached");
    }

    detached() {
        console.log("tile-list-canvas detached");
    }

    private tilesetChanged(newValue, oldValue) {
        this.startRect = null;
        this.endRect = null;
        let rect = null;
        if (this.selectedRects.length == 1) rect = this.selectedRects[0];
        this.selectedRects = [];
        if (rect) this.selectedRects.push(rect);
        this.refresh();
    }

    private columnCountChanged(newValue, oldValue) {
        this.selectedRects = [];
        this.startRect = null;
        this.endRect = null;
        this.refresh();
    }


    getRect(posX: number, posY: number) {

        let rect = this.tileset ? { x: 0, y: 0, w: this.tileset.tileWidth, h: this.tileset.tileHeight }
                                :  { x: 0, y: 0, w: 0, h: 0 }

        if (rect.w <= 0 || rect.h <= 0) return rect;

        while (rect.x < posX) rect.x += this.tileset.tileWidth;
        while (rect.y < posY) rect.y += this.tileset.tileHeight;
        if (rect.x > posX) rect.x -= this.tileset.tileWidth;
        if (rect.y > posY) rect.y -= this.tileset.tileHeight;
        
        if (rect.x < 0) {
            rect.x = 0;
            rect.w = this.tileset.tileWidth;
        }

        if (rect.y < 0) {
            rect.y = 0;
            rect.h = this.tileset.tileHeight;
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

        if (this.isMouseDown 
            && this.startRect && this.endRect 
            && e.ctrlKey !== true) {
            if (!this.endRect) this.endRect = { x: 0, y: 0, w: 0, h: 0 };
            this.endRect.x = this.currentRect.x;
            this.endRect.y = this.currentRect.y;
            this.endRect.w = this.currentRect.w;
            this.endRect.h = this.currentRect.h;
            this.refresh();
        }
    }

    onMouseDown(e) {
        //console.log(e);
        let rect = this.getRect(e.offsetX, e.offsetY);
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
        this.refresh();  
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

        let event = new CustomEvent('tile-click', {
            detail: e,
            bubbles: true
        });
        this.element.dispatchEvent(event);
    }

    private onTileClick(e) {
        let rect = this.getRect(e.offsetX, e.offsetY);
        if (rect.w > 0 && rect.h > 0) {
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
            } else {
                this.selectedRects = [];
                this.selectedRects.push(rect);
            }
            this.refresh();
        }
        let event = new CustomEvent('tile-click', {
            detail: e,
            bubbles: true
        });
        this.element.dispatchEvent(event);
    }

    private onTileDoubleClick(e) {
        let event = new CustomEvent('tile-dblclick', {
            detail: e,
            bubbles: true
        });
        this.element.dispatchEvent(event);
    }

    private refresh() {
        if (this.image == undefined || this.image == null) return;
        if (this.tileset == undefined || this.tileset == null) return;
        if (this.tileset.tiles == undefined || this.tileset.tiles == null) return;
        let canvas = this.canvas;
        let ctx = canvas ? canvas.getContext('2d') : null;
        if (ctx == undefined || ctx == null) return;
        let maxWidth = this.tileset.tileWidth * this.columnCount;
        let maxHeight = this.tileset.tileHeight * Math.ceil(this.tileset.tiles.length / Math.ceil(maxWidth / this.tileset.tileWidth));
        if (maxWidth < this.tileset.tileWidth) maxWidth = this.tileset.tileWidth;
        if (maxHeight < this.tileset.tileHeight) maxHeight = this.tileset.tileHeight;
        if (canvas.width != maxWidth) canvas.width = maxWidth;
        if (canvas.height != maxHeight) canvas.height = maxHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let x = 0, y = 0;
        for (let tile of this.tileset.tiles) {
            ctx.drawImage(this.image, tile.offsets[0], tile.offsets[1], this.tileset.tileWidth, this.tileset.tileHeight,
                            x, y, this.tileset.tileWidth, this.tileset.tileHeight);
            let frameCount = tile.offsets.length / 2;
            if (frameCount > 1) {
                ctx.font = "bold 8pt arial, serif";
                ctx.fillStyle = 'rgba(255,0,255,0.8)';
                ctx.fillText(frameCount.toString(), x+2, y+10);
            }
            x += this.tileset.tileWidth;
            if (x >= maxWidth) {
                x = 0;
                y += this.tileset.tileHeight;
            }
        }
        ctx.lineWidth = 2;
        //console.log(this.selectedRects);
        if (this.startRect && this.endRect) {
            ctx.strokeStyle = 'rgba(255,0,255,0.8)';
            ctx.strokeRect(this.startRect.x, this.startRect.y, 
                this.endRect.x + this.endRect.w - this.startRect.x, this.endRect.y + this.endRect.h - this.startRect.y);
        } else if (this.selectedRects.length > 0) {
            ctx.strokeStyle = 'yellow';
            for (let rect of this.selectedRects) ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        }
    }

}
