import { Game } from "../core/game";
import { Scene } from "../core/scene";
import { Sprite } from "../core/sprite";
import { Updater } from "../core/updater";

export class Stage implements Updater {

    name: string = "stage";

    private _game: Game = null;

    private _loadingTilesets: Array<string> = [];
    private _loadedTilesets: Array<string> = [];

    private _tilesets:  { [name: string]: any }  = { };
    private _tilemaps:  { [name: string]: any }  = { };
    private _gamemaps:  { [name: string]: any }  = { };

    init(game: Game): boolean {
        this._game = game;
        return true;
    }

    preset(scene: Scene, callback: ()=>void) {
        let stage = scene.components["stage"];
        if (stage == undefined || stage == null) {
            if (callback) callback();
            return;
        }

        stage.maxX = stage.maxY = 0;

        let container: PIXI.Container = null;
        let display = scene.components["display"];
        if (display && display.object) container = display.object as PIXI.Container;
        if (container == undefined || container == null) {
            if (callback) callback();
            return;
        }

        let imagelib = scene.game.libraries["image"];
        if (imagelib == undefined || imagelib == null) {
            if (callback) callback();
            return;
        }

        let tilemapName: string = stage.map ? stage.map.toString() : "";
        let idx = 0, maxX = 0, maxY = 0;

        if (stage.pics && stage.pics.length > 0) {
            let urls: Array<string> = [], areas: Array<any> = [];
            for (let pic of stage.pics) {
                if (pic.indexOf('.') < 0) pic += ".png";
                urls.push("img/" + pic);
                let area = {x:0, y:0, width:0, height:0};
                let offsetX = stage.areas[idx++];
                let offsetY = stage.areas[idx++];
                area.width = stage.areas[idx++];
                area.height = stage.areas[idx++];
                offsetX = offsetX + area.width - this._game.width;
                offsetY = offsetY + area.height - this._game.height;
                if (offsetX > maxX) maxX = offsetX;
                if (offsetY > maxY) maxY = offsetY;
                areas.push(area);
            }

            if (maxX > stage.maxX) stage.maxX = maxX;
            if (maxY > stage.maxY) stage.maxY = maxY;

            idx = 0;
            imagelib.loadTextures(urls, areas, (textures) => {
                if (textures && textures.length > 0) {
                    stage.blocks = [];
                    for (let tex of textures) {
                        let pixispr = new PIXI.Sprite(tex);
                        pixispr.x = stage.areas[idx++];
                        pixispr.y = stage.areas[idx++];
                        container.addChild(pixispr);
                        stage.blocks.push(pixispr);
                        idx += 2;
                    }
                }
                if (tilemapName && tilemapName.length > 0) {
                    this.loadTilemap(tilemapName, (tilemap) => {
                        maxX = 0; maxY = 0;
                        if (tilemap && tilemap.columnCount > 0 && tilemap.tileWidth > 0) {
                            maxX = tilemap.columnCount * tilemap.tileWidth - this._game.width;
                        }
                        if (tilemap && tilemap.rowCount > 0 && tilemap.tileHeight > 0) {
                            maxY = tilemap.rowCount * tilemap.tileHeight - this._game.height;
                        }
                        if (maxX > stage.maxX) stage.maxX = maxX;
                        if (maxY > stage.maxY) stage.maxY = maxY;
                        stage.tilemap = tilemap;
                        if (tilemap) {
                            stage.gamemap = this._gamemaps[tilemapName];
                            container.addChild(stage.tilemap.display);
                        }
                        if (callback) callback();
                    });
                } else {
                    if (callback) callback();
                }
                
            });
        } else if (tilemapName && tilemapName.length > 0) {
            this.loadTilemap(tilemapName, (tilemap) => {
                maxX = 0; maxY = 0;
                if (tilemap && tilemap.columnCount > 0 && tilemap.tileWidth > 0) {
                    maxX = tilemap.columnCount * tilemap.tileWidth - this._game.width;
                }
                if (tilemap && tilemap.rowCount > 0 && tilemap.tileHeight > 0) {
                    maxY = tilemap.rowCount * tilemap.tileHeight - this._game.height;
                }
                if (maxX > stage.maxX) stage.maxX = maxX;
                if (maxY > stage.maxY) stage.maxY = maxY;
                stage.tilemap = tilemap;
                if (tilemap) {
                    stage.gamemap = this._gamemaps[tilemapName];
                    container.addChild(stage.tilemap.display);
                }
                if (callback) callback();
            });
        } else {
            if (callback) callback();
        }
		
    }

	setup(scene: Scene) {
        let stage = scene.components["stage"];
		if (stage) {
            if (!isNaN(stage.x)) {
                if (stage.x < 0) stage.x = 0;
                if (stage.x > stage.maxX) stage.x = stage.maxX;
            }
            if (!isNaN(stage.y)) {
                if (stage.y < 0) stage.y = 0;
                if (stage.y > stage.maxY) stage.y = stage.maxY;
            }
            stage.waiting = false;
            stage.looping = false;
            stage.scrolling = false;
            stage.callback = null;
        }
    }

    activate(scene: Scene) {
        let stage = scene.components["stage"];
		if (stage) {
            if (!isNaN(stage.x)) {
                if (stage.x < 0) stage.x = 0;
                if (stage.x > stage.maxX) stage.x = stage.maxX;
            }
            if (!isNaN(stage.y)) {
                if (stage.y < 0) stage.y = 0;
                if (stage.y > stage.maxY) stage.y = stage.maxY;
            }
        }
    }

    enable(sprite: Sprite) {
        let stage = sprite.scene.components["stage"];
        if (stage) {
            let display = sprite.components["display"];
            if (display && display.object) {
                if (sprite.active) {
                    let location = sprite.components["stage"];
                    if (location) {
                        display.object.x = Math.round(location.x - stage.x);
                        display.object.y = Math.round(location.y - stage.y);
                    }
                    if (display.object.visible == false) display.object.visible = true;
                } else {
                    if (display.object.visible == true) display.object.visible = false;
                }
            }
        }
    }
	
	update(scene: Scene, time: number) {
        //if (scene.paused) return;
        let stage = scene.components["stage"];
        if (stage) {

            if (stage.waiting === true) {
                if (stage.x == stage.targetX && stage.y == stage.targetY) {
                    stage.waiting = false;
                    if (stage.callback) {
                        stage.callback(scene);
                        stage.callback = null;
                        return;
                    }
                }
            }
            
            if (stage.looping === true) {
                if (stage.x == stage.endX && stage.y == stage.endY) {
                    stage.x = stage.beginX;
                    stage.y = stage.beginY;
                }
            }

            if (stage.scrolling === true) {
                let newX = stage.x + stage.speedX;
                let newY = stage.y + stage.speedY;
                if (newX >= 0 && newX <= stage.maxX) stage.x = newX;
                if (newY >= 0 && newY <= stage.maxY) stage.y = newY;
            } else if (stage.follow) {
                let target = scene.sprites[stage.follow];
                let location = target ? target.components["stage"] : null;
                if (location) {
                    let newX = Math.round(location.x - scene.game.width / 2);
                    let newY = Math.round(location.y - scene.game.height / 2);
                    if (newX >= 0 && newX <= stage.maxX) stage.x = newX;
                    if (newY >= 0 && newY <= stage.maxY) stage.y = newY;
                }
            }
            
            if (stage.blocks) {
                let idx = 0;
                for (let block of stage.blocks) {
                    block.x = 0 - stage.x + stage.areas[idx++];
                    block.y = 0 - stage.y + stage.areas[idx++];
                    idx += 2;
                }
            }
            if (stage.tilemap) {
                this.updateTilemapView(scene);
            }
            
        }
        let spriteList = scene.spriteList;
        for (let sprite of spriteList) {
            let display = sprite.components["display"];
            if (display && display.object) {
                if (sprite.active) {
                    let location = sprite.components["stage"];
                    if (location) {
                        display.object.x = Math.round(location.x - stage.x);
                        display.object.y = Math.round(location.y - stage.y);
                    }
                    if (display.object.visible == false) display.object.visible = true;
                } else {
                    if (display.object.visible == true) display.object.visible = false;
                }
            }
        }
    }

    transform(pos: any) {
        let stage = this._game.scene.components["stage"];
        return stage ? {
            x: stage.x + pos.x,
            y: stage.y + pos.y
        } : pos;
    }

    setPos(x: number, y: number, target?: any) {
        let components = target ? target.components : this._game.scene.components;
        let stage = components ? components["stage"] : null;
        if (stage) {
            stage.x = x;
            stage.y = y;
        }
    }

    setSpritePos(sprite: Sprite, x: number, y: number) {
        this.setPos(x, y, sprite);
    }

    getViewRect(): PIXI.Rectangle {
        let scene = this._game.scene;
		let rect = new PIXI.Rectangle (0, 0, scene.game.width, scene.game.height);
		let stage = scene.components["stage"];
		if (stage) {
			rect.x += stage.x;
			rect.y += stage.y;
		}
		return stage;
	}
	wait(targetX: number, targetY: number, callback: (sce?: Scene)=>void) {
        let scene = this._game.scene;
		let stage = scene.components["stage"];
		if (stage) {
            stage.waiting = true;
            stage.targetX = targetX;
            stage.targetY = targetY;
            stage.callback = callback;
        }
	}
	scroll(speedX: number, speedY: number) {
        let scene = this._game.scene;
		var stage = scene.components["stage"];
		if (stage) {
            stage.scrolling = true;
            stage.speedX = speedX;
		    stage.speedY = speedY;
        }
	}
	loop(beginX: number, beginY: number, endX: number, endY: number) {
        let scene = this._game.scene;
		let stage = scene.components["stage"];
		if (stage) {
            stage.looping = true;
            stage.beginX = beginX;
            stage.beginY = beginY;
            stage.endX = endX;
            stage.endY = endY;
        }
	}

    loadTileset(tilesetName: string, callback?: (any)=>void) {
		
		if (this._tilesets[tilesetName]) {
            if (callback) callback(this._tilesets[tilesetName]);
            return;
        }

        let jsonlib = this._game.libraries["json"];
        if (jsonlib == undefined || jsonlib == null) {
            if (callback) callback(null);
            return;
        }

        let imagelib = this._game.libraries["image"];
        if (imagelib == undefined || imagelib == null) {
            if (callback) callback(null);
            return;
        }
		
		jsonlib.loadJson("json/tilesets/" + tilesetName + ".json", (tileset) => {

            if (tileset == undefined || tileset == null) {
                console.error("Failed to load tileset: " + tilesetName);
                if (callback) callback(null);
                return;
            }

            let pic = tileset.image.toString();
            if (pic.indexOf('.') < 0) pic += ".png";
            let url = "img/" + pic;

            imagelib.loadImage(url, (tex) => {

                if (tex == undefined || tex == null) {
                    console.error("Failed to load tileset image: " + "img/" + pic);
                    if (callback) callback(null);
                    return;
                }

                tileset.texture = tex;
                let area = {x: 0, y: 0, width: tileset.tileWidth, height: tileset.tileHeight};
                for (let tile of tileset.tiles) {
                    tile.textures = [];
                    for (let i=0; i<tile.offsets.length; i+=2) {
                        area.x = tile.offsets[i];
                        area.y = tile.offsets[i+1];
                        let tiletex = imagelib.getTexture(url, area);
                        if (tiletex) tile.textures.push(tiletex);
                    }
                }

                this._tilesets[tilesetName] = tileset;

                if (callback) callback(tileset);
                return;
                
            });
        });
		
	}

    private loadTilesetsOneByOne(callback: (tilesets: Array<any>)=>void) {
        if (this._loadingTilesets.length <= 0) {
            let list = [];
            for (let item of this._loadedTilesets) list.push(item);
            this._loadedTilesets = [];
            callback(list);
            return;
        } else {
            let tilesetName = this._loadingTilesets.shift();
            this.loadTileset(tilesetName, (tileset) => {
                if (tileset) this._loadedTilesets.push(tileset);
                this.loadTilesetsOneByOne(callback);
            });
        }
    }

    loadTilesets(tilesetNames: Array<string>, callback: (tilesets: Array<any>)=>void) {
        this._loadingTilesets = [];
        this._loadedTilesets = [];
        for (let item of tilesetNames) this._loadingTilesets.push(item);
        this.loadTilesetsOneByOne((loadedTilesets) => {
            callback(loadedTilesets);
        });
    }

    loadTilemap(tilemapName: string, callback?: (any)=>void) {
		
		if (this._tilemaps[tilemapName]) {
            if (callback) callback(this._tilemaps[tilemapName]);
            return;
        }

        let jsonlib = this._game.libraries["json"];
        if (jsonlib == undefined || jsonlib == null) {
            if (callback) callback(null);
            return;
        }
		
		jsonlib.loadJson("json/tilemaps/" + tilemapName + ".json", (tilemap) => {

            if (tilemap == undefined || tilemap == null) {
                console.error("Failed to load tilemap: " + tilemapName);
                if (callback) callback(null);
                return;
            }

            tilemap.width = tilemap.tileWidth * tilemap.columnCount;
            tilemap.height = tilemap.tileHeight * tilemap.rowCount;

            tilemap.viewWidth = tilemap.width <= this._game.width ? this._game.width : tilemap.width;
            tilemap.viewHeight = tilemap.height <= this._game.height ? this._game.height : tilemap.height;

            let cellWidth: number = tilemap.tileWidth;
            let cellHeight: number = tilemap.tileHeight;

            let bgcolor = 0x00;
            if (tilemap.bgcolor) {
                let colorCode: string = tilemap.bgcolor.toString();
                if (colorCode.length >= 7 && colorCode.charAt(0) == '#') {
                    bgcolor = parseInt(colorCode.substr(1, 6), 16);
                }
                if (colorCode.length >= 9 && colorCode.charAt(0) == '#') {
                    tilemap.bgcolorOpacity = Math.round(parseInt(colorCode.substr(7, 2), 16) / 255.0 * 100) / 100.0;
                }
            }

            let graph = new PIXI.Graphics();
            graph.beginFill(bgcolor);
            graph.drawRect(0, 0, cellWidth, cellWidth);
            graph.endFill();
            tilemap.defaultTileTexture = graph.generateCanvasTexture();
            tilemap.defaultTileTextures = [tilemap.defaultTileTexture];
            
            let col: number = tilemap.viewWidth % cellWidth;
            if (col == 0) col = Math.floor(tilemap.viewWidth / cellWidth) + 1;
            else col = Math.floor((tilemap.viewWidth - col) / cellWidth) + 2;
            
            let row: number = tilemap.viewHeight % cellHeight;
            if (row == 0) row = Math.floor(tilemap.viewHeight / cellHeight) + 1;
            else row = Math.floor((tilemap.viewHeight - row) / cellHeight) + 2;

            tilemap.display = new PIXI.Container();
            tilemap.sprites = [];
            tilemap.spriteCount = col * row * 2;

            for (let i=0; i<tilemap.spriteCount; i++) {
                let tileSprite = new PIXI.extras.AnimatedSprite(tilemap.defaultTileTextures, true);
                tileSprite.visible = false;
                if (tilemap.bgcolorOpacity != undefined) tileSprite.alpha = tilemap.bgcolorOpacity;
                tilemap.display.addChild(tileSprite);
                tilemap.sprites.push(tileSprite);
            }

            tilemap.tilecosts = [];

            this.loadTilesets(tilemap.tilesetNames, (tilesets) => {

                tilemap.tilesets = [];
                for (let tilesetName of tilemap.tilesetNames) {
                    tilemap.tilesets.push(this._tilesets[tilesetName]);
                }

                for (let i=0; i<tilemap.cells.length; i++) {                
                    let cost = 0;
                    let cell = tilemap.cells[i];
                    if (cell.cost != undefined) cost = cell.cost;
                    else for (let k=0; k<cell.ids.length; k+=2) {
                        let tilesetId = cell.ids[k];
                        let tileId = cell.ids[k+1];
                        if (tilesetId >= 0 && tileId >= 0) {
                            let tile = tilemap.tilesets[tilesetId].tiles[tileId];
                            if (tile.cost != undefined) {
                                cost = tile.cost;
                                break;
                            }
                        }
                    }
                    tilemap.tilecosts.push(cost);
                }

                this._tilemaps[tilemapName] = tilemap;
                this._gamemaps[tilemapName] = new GameMap(tilemap);
                if (callback) callback(tilemap);
                return;
                
            });
        });
		
	}

    updateTilemapView(scene: Scene) {

        let stage = scene.components["stage"];
        let tilemap = stage ? stage.tilemap : null;
        if (tilemap == undefined || tilemap == null) return;

        let gapX: number = stage.x % tilemap.tileWidth;
		let gapY: number = stage.y % tilemap.tileHeight;
		let col: number = Math.round((stage.x - gapX) / tilemap.tileWidth);
		let row: number = Math.round((stage.y - gapY) / tilemap.tileHeight);
		let startX: number = col * tilemap.tileWidth;
		let startY: number = row * tilemap.tileHeight;
		let endX = stage.x + tilemap.viewWidth;
        let endY = stage.y + tilemap.viewHeight;

        if (endX > tilemap.width) endX = tilemap.width;
        if (endY > tilemap.height) endY = tilemap.height;

        let idx = 0;

        let currentRow = row;
        let currentColumn = col;
        while (startY < endY) {

			currentColumn = col;
			let currentX = startX;
			while (currentX < endX) {

                let index = currentRow * tilemap.columnCount + currentColumn;
                if (index >= 0 && index < tilemap.cells.length) {
                    
                    let cell = tilemap.cells[index];

                    let posX: number = tilemap.tileWidth * currentColumn - stage.x;
                    let posY: number = tilemap.tileHeight * currentRow - stage.y;

                    for (let k=0; k<cell.ids.length; k+=2) {

                        let spr = tilemap.sprites[idx++];
                        spr.x = posX; spr.y = posY;

                        let tilesetId = cell.ids[k];
                        let tileId = cell.ids[k+1];

                        if (tilesetId >= 0 && tileId >= 0) {

                            let tile = tilemap.tilesets[tilesetId].tiles[tileId];
                            let needToUpdateGraph = spr.textures !== tile.textures;
                            if (needToUpdateGraph) {
                                spr.gotoAndStop(0);
                                spr.textures = tile.textures;
                                spr.texture = spr.textures[0];
                                spr.alpha = 1.0;
                            }
    
                            if (spr.textures.length > 1) {
                                let animationSpeed = tile.speed && tile.speed > 0 ? tile.speed : 1;
                                if (spr.animationSpeed != animationSpeed) spr.animationSpeed = animationSpeed;
                            }
    
                            if (needToUpdateGraph) {
                                if (spr.textures.length > 1 && !scene.paused) spr.gotoAndPlay(0);
                            } else {
                                if (spr.textures.length > 1 && spr.playing === scene.paused) {
                                    if (spr.playing) spr.stop(); else spr.play();
                                }
                            }

                        } else {
                            let needToUpdateGraph = spr.textures !== tilemap.defaultTileTextures;
                            if (needToUpdateGraph) {
                                spr.gotoAndStop(0);
                                spr.textures = tilemap.defaultTileTextures;
                                spr.texture = spr.textures[0];
                                spr.alpha = tilemap.bgcolorOpacity;
                            }
                        }

                        if (spr.visible == false) spr.visible = true;

                    }

                }
				currentX += tilemap.tileWidth;
				currentColumn++;
			}
			startY += tilemap.tileHeight;
			currentRow++;
		}

        for (let i=idx; i<tilemap.sprites.length; i++) {
            let spr = tilemap.sprites[i];
            if (spr.visible) spr.visible = false;
            else break;
        }

    }
	
}

export class StepNode {
    idx: number = -1;  // the step's index in the path (a path consists of steps)
    col: number = -1; // the position of the step (on a tile) in the map
    row: number = -1; // the position of the step (on a tile) in the map
    prior: StepNode = null; // its previous step
}

export class ResultNode { // a result of a step
    idx: number = -1;  // the node's index
    dist: number = -1; // current distance to the destination (after take the step)
    step: StepNode = null; // the related step (which leads to the result)
    next: ResultNode = null; // its next node
}

// i do not merge "result" and "step" into one record
// actually i also need to put them into two different linked lists
// coz i think this could help to describe/understand Dynamic Programming more easily

export class PathFinder {

    tilemap: any = null;

    eight: boolean = false;

    steps: Array<StepNode> = null;
    footprints: Array<ResultNode> = null;

    openQueue: ResultNode = null;
    closedQueue: ResultNode = null;

    travelCosts: Array<number> = null;

    constructor(tilemap) {
        this.tilemap = tilemap;
        this.travelCosts = new Array<number>(tilemap.tilecosts.length);
    }

    clear() {
        this.steps = [];
        this.footprints = [];
        this.openQueue = null;
        this.closedQueue = null;
        this.travelCosts.fill(0);
    }

    dist(startX: number, startY: number, endX: number, endY: number) {
        return Math.abs(endX - startX) + Math.abs(endY - startY);
    }
    
    private add(footprint: ResultNode) { // put an open path to open queue
        if (!footprint) return;
        let prior: ResultNode = null;
        let current: ResultNode = this.openQueue;
        while (current != null && footprint.idx + footprint.dist > current.idx + current.dist) {
            prior = current;
            current = current.next;
        }
        // the best is always at the top (this.openQueue)
        if (prior) prior.next = footprint;
        else this.openQueue = footprint;
        footprint.next = current;
    }
    
    private archive(footprint: ResultNode) { // put a closed path to closed queue
        if (!footprint) return;
        let prior: ResultNode = null;
        let current: ResultNode = this.closedQueue;
        while (current != null) {
            // longer is worse, shorter is better (we are going to find out the shortest way)
            let worse = footprint.dist == current.dist ? footprint.idx > current.idx : footprint.dist > current.dist;
            if (worse) {
                prior = current;
                current = current.next;
            } else break;
        }
        // the best is always at the top (this.closedQueue)
        if (prior) prior.next = footprint;
        else this.closedQueue = footprint;
        footprint.next = current;
    }

    private pop(): ResultNode { // get current best open path
        let top = this.openQueue;
        if (this.openQueue) this.openQueue = this.openQueue.next;
        if (top) top.next = null;
        return top;
    }

    private createStep(prior: StepNode, column: number, row: number): StepNode {
        let step = new StepNode();
        step.idx = prior ? prior.idx + 1 : 1;
        step.col = column;
        step.row = row;
        step.prior = prior;
        this.steps.push(step);
        return step;
    }

    private createFootprint(step: StepNode, dist: number): ResultNode {
        let footprint = new ResultNode();
        footprint.idx = step ? step.idx : 0;
        footprint.step = step;
        footprint.dist = dist;
        footprint.next = null;
        this.footprints.push(footprint);
        return footprint;
    }

    private test(startX: number, startY: number, endX: number, endY: number, prior: StepNode): boolean {

        if (startX < 0 || startY < 0 
            || startX >= this.tilemap.columnCount
            || startY >= this.tilemap.rowCount) return false; // out of the map

        let idx = this.tilemap.columnCount * startY + startX;
        if (this.tilemap.tilecosts[idx] < 0) return false; // inaccessible
        
        let len = 1;
        if (prior) len = prior.idx + 1;
        if (this.travelCosts[idx] > 0 && len >= this.travelCosts[idx]) return false; // not the best so far
        
        this.travelCosts[idx] = len;

        let step = this.createStep(prior, startX, startY);
        let footprint = this.createFootprint(step, this.dist(startX, startY, endX, endY));

        this.add(footprint);

        return true;
    }

    private getFootprint(startX: number, startY: number, endX: number, endY: number): ResultNode {
        if (!this.test(startX, startY, endX, endY, null)) return null;
        let footprint = this.pop(); // get current best open path
        while (footprint) { // continue to process the best open path if it exists (not null)
            let step = footprint.step;
            if (step) {

                let x = step.col;
                let y = step.row;
                if (x == endX && y == endY) {
                    this.archive(footprint); // archive the closed path (reached the destination already)
                    break; // no need to continue
                }

                let up    = this.test(x,   y-1, endX, endY, step);
                let right = this.test(x+1, y,   endX, endY, step);
                let down  = this.test(x,   y+1, endX, endY, step);
                let left  = this.test(x-1, y,   endX, endY, step);

                let isOpen = up && right && down && left; // all of its neighbor cells are accessible

                if (this.eight) {

                    let upRight = false, downRight = false, downLeft = false, upLeft = false;

                    if (up || right)   upRight   = this.test(x+1, y-1, endX, endY, step);
                    if (down || right) downRight = this.test(x+1, y+1, endX, endY, step);
                    if (down || left)  downLeft  = this.test(x-1, y+1, endX, endY, step);
                    if (up || left)    upLeft    = this.test(x-1, y-1, endX, endY, step);

                    let needToArchive = !isOpen;

                    if ((!needToArchive) && (up || right))   needToArchive = needToArchive || !upRight;
                    if ((!needToArchive) && (down || right)) needToArchive = needToArchive || !downRight;
                    if ((!needToArchive) && (down || left))  needToArchive = needToArchive || !downLeft;
                    if ((!needToArchive) && (up || left))    needToArchive = needToArchive || !upLeft;

                    if (needToArchive) this.archive(footprint);

                } else {

                    if (!isOpen) this.archive(footprint); // archive it if it is not an open path

                }
            }
            footprint = this.pop(); // keep trying to get current best open path
        }
        return this.closedQueue; // return the best
    }

    find(startX: number, startY: number, endX: number, endY: number): Array<any> {
        this.clear();
        let best = this.getFootprint(startX, startY, endX, endY);
        let step = best ? best.step : null;
        let path = step ? new Array<any>(step.idx) : null;
        let idx = step ? step.idx : -1;
        while (step) {
            idx--;
            if (idx >= 0) path[idx] = {x: step.col, y: step.row};
            step = step.prior;
        }
        return path;
    }
    
}

export class VisitNode {
    mp: number = -1;  // the explorer's movement points left when get here (reach this node)
    col: number = -1; // the position of the node (a tile) in the map
    row: number = -1; // the position of the node (a tile) in the map
    next: VisitNode = null; // its next node
}

export class RangeFinder {
    
    tilemap: any = null;

    nodes: Array<VisitNode> = null;

    current: VisitNode = null;
    next: VisitNode = null;

    history: Array<number> = null;

    constructor(tilemap) {
        this.tilemap = tilemap;
        this.history = new Array<number>(tilemap.tilecosts.length);
    }

    clear() {
        this.nodes = [];
        this.current = null;
        this.next = null;
        this.history.fill(-1);
    }

    private add(col: number, row: number, mp: number): VisitNode { // add a visit node
        let node = new VisitNode();
        node.mp = mp;
        node.col = col;
        node.row = row;
        node.next = this.next;
        this.next = node;
        return this.next;
    }

    private test(col: number, row: number, mp: number): boolean {
        if (col < 0 || row < 0 
            || col >= this.tilemap.columnCount
            || row >= this.tilemap.rowCount) return false; // out of the map

        let idx = this.tilemap.columnCount * row + col;
        let cost = this.tilemap.tilecosts[idx];
        if (cost < 0 || cost > mp) return false; // inaccessible

        let rest = mp - cost;
        if (this.history[idx] > rest) return false; // not the best so far

        this.history[idx] = rest;
        this.add(col, row, rest);
    }

    private travel(col: number, row: number, mp: number) {
        // add start point to node list
        this.add(col, row, mp);
        this.history[this.tilemap.columnCount * row + col] = mp;
        // start to travel...
        while(this.next) {
            this.current = this.next;
            this.next = null;
            while(this.current) {
                let x = this.current.col;
                let y = this.current.row;
                let rest = this.current.mp;
                this.test(x,   y-1, rest);
                this.test(x+1, y,   rest);
                this.test(x,   y+1, rest);
                this.test(x-1, y,   rest);
                this.current = this.current.next;
            }
        }
    }

    find(x: number, y: number, mp: number): Array<any> {
        this.clear();
        this.travel(x, y, mp);
        let range = new Array<any>();
        for(let i=0; i<this.tilemap.columnCount; i++) {
            for(let j=0; j<this.tilemap.rowCount; j++) {
                if (this.history[this.tilemap.columnCount * j + i] >= 0) {
                    range.push({x: i, y: j});
                }
            }
        }
        return range;
    }
}

export class GameMap {
    tilemap: any = null;
    pathFinder: PathFinder = null;
    rangeFinder: RangeFinder = null;
    constructor(tilemap) {
        this.tilemap = tilemap;
        this.pathFinder = new PathFinder(tilemap);
        this.rangeFinder = new RangeFinder(tilemap);
    }
    pixelToTile(x: number, y: number) {
        return this.tilemap 
                ? { x: Math.floor(x/this.tilemap.tileWidth), 
                    y: Math.floor(y/this.tilemap.tileHeight) }
                : null;
    }
    tileToPixel(x: number, y: number) {
        return this.tilemap 
                ? { x: x * this.tilemap.tileWidth + Math.floor(this.tilemap.tileWidth / 2), 
                    y: y * this.tilemap.tileHeight + Math.floor(this.tilemap.tileHeight / 2) }
                : null;
    }
    align(x: number, y: number) {
        let pos = this.pixelToTile(x, y);
        return pos ? this.tileToPixel(pos.x, pos.y) : null;
    }
    findPath(startX: number, startY: number, endX: number, endY: number): Array<any> {
        return this.pathFinder.find(startX, startY, endX, endY);
    }
    findRange(x: number, y: number, mp: number): Array<any> {
        return this.rangeFinder.find(x, y, mp);
    }
}
