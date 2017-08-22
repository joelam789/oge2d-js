import { autoinject, customElement, bindable, observable } from 'aurelia-framework';
import { I18N } from "aurelia-i18n";

@autoinject()
@customElement('tile-list-canvas')
export class TileListCanvas {

    @bindable image: HTMLImageElement = null;
    @bindable tileset: any = null;

    selectedTiles = [];

    tileRect: any = null;

    constructor(public element: Element, public i18n: I18N) {
    }

    get canvas(): HTMLCanvasElement {
        let canvas: HTMLCanvasElement = null;
        if (this.element && this.element.children.length > 0)
            canvas = this.element.children[0] as HTMLCanvasElement;
        return canvas;
    }

    get currentTileRect() {
        let selectedTile = null;
        let canvas = this.canvas;
        let x = 0, y = 0;
        for (let tile of this.tileset.tiles) {
            for (let i=this.selectedTiles.length - 1; i >= 0; i--) {
                let rect = this.selectedTiles[i];
                if (rect.x == x && rect.y == y) {
                    selectedTile = tile;
                    break;
                }
            }
            if (selectedTile) break;
            x += this.tileset.tileWidth;
            if (x >= canvas.width) {
                x = 0;
                y += this.tileset.tileHeight;
            }
        }
        return selectedTile ? {x: selectedTile.offsets[0], y: selectedTile.offsets[1], 
                                w: this.tileset.tileWidth, h: this.tileset.tileHeight} : null;
        
    }

    get currentTileIndex() {
        let selectedTile = null;
        let canvas = this.canvas;
        let index = -1, x = 0, y = 0;
        for (let tile of this.tileset.tiles) {
            index++;
            for (let i=this.selectedTiles.length - 1; i >= 0; i--) {
                let rect = this.selectedTiles[i];
                if (rect.x == x && rect.y == y) {
                    selectedTile = tile;
                    break;
                }
            }
            if (selectedTile) break;
            x += this.tileset.tileWidth;
            if (x >= canvas.width) {
                x = 0;
                y += this.tileset.tileHeight;
            }
        }
        return selectedTile ? index : -1;
    }

    attached() {
        console.log("tile-list-canvas attached");
    }

    detached() {
        console.log("tile-list-canvas detached");
    }

    private tilesetChanged(newValue, oldValue) {
        this.selectedTiles = [];
        this.refresh();
    }

    private getRect(posX: number, posY: number) {

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

    private onTileClick(e) {
        let rect = this.getRect(e.offsetX, e.offsetY);
        if (rect.w > 0 && rect.h > 0) {
            if (e.ctrlKey === true) {
                let idx = -1;
                for (let i=0; i<this.selectedTiles.length; i++) {
                    if (this.selectedTiles[i].x == rect.x && this.selectedTiles[i].y == rect.y) {
                        idx = i;
                        break;
                    }
                }
                if (idx < 0) this.selectedTiles.push(rect);
                else this.selectedTiles.splice(idx, 1);
            } else {
                this.selectedTiles = [];
                this.selectedTiles.push(rect);
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
        let maxWidth = this.tileset.tileWidth * 8;
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
                ctx.font = "bold 8pt Arial";
                ctx.fillStyle = 'red';
                ctx.fillText(frameCount.toString(), x+2, y+10);
            }
            x += this.tileset.tileWidth;
            if (x >= maxWidth) {
                x = 0;
                y += this.tileset.tileHeight;
            }
        }
        ctx.lineWidth = 2;
        if (this.selectedTiles.length > 0) {
            ctx.strokeStyle = 'yellow';
            for (let rect of this.selectedTiles) ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
        }
    }

}
