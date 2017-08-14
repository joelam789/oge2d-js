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

        let tilemapName: string = stage.map ? stage.map.toString() : "";
		if (tilemapName && tilemapName.length > 0) {
            this.loadTilemap(tilemapName, (tilemap) => {

                let maxX = 0, maxY = 0;
                if (tilemap && tilemap.columnCount > 0 && tilemap.tileWidth > 0) {
                    maxX = tilemap.columnCount * tilemap.tileWidth - this._game.width;
                }
                if (tilemap && tilemap.rowCount > 0 && tilemap.tileHeight > 0) {
                    maxY = tilemap.rowCount * tilemap.tileHeight - this._game.height;
                }
                stage.maxX = maxX > 0 ? maxX : 0;
			    stage.maxY = maxY > 0 ? maxY : 0;
                stage.tilemap = tilemap;
                container.addChild(stage.tilemap.display);
                if (callback) callback();
            });

		} else {

            let imagelib = scene.game.libraries["image"];
            if (imagelib == undefined || imagelib == null) {
                if (callback) callback();
                return;
            }

            let idx = 0, maxX = 0, maxY = 0;
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

            stage.maxX = maxX > 0 ? maxX : 0;
            stage.maxY = maxY > 0 ? maxY : 0;

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
                if (callback) callback();
            });
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
            } else if (stage.tilemap) {
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

            let cellWidth: number = tilemap.tileWidth;
            let cellHeight: number = tilemap.tileHeight;

            let bgcolor = 0xff0000;
            if (tilemap.backgroundColor) {
                let colorCode: string = tilemap.backgroundColor.toString();
                if (colorCode.length > 1 && colorCode.charAt(0) == '#') {
                    bgcolor = parseInt(colorCode.substring(1), 16);
                }
            }

            let graph = new PIXI.Graphics();
            graph.beginFill(bgcolor);
            graph.drawRect(0, 0, cellWidth, cellWidth);
            graph.endFill();
            tilemap.defaultTileTexture = graph.generateCanvasTexture();
            
            let col: number = this._game.width % cellWidth;
            if (col == 0) col = Math.floor(this._game.width / cellWidth) + 1;
            else col = Math.floor((this._game.width - col) / cellWidth) + 2;
            
            let row: number = this._game.height % cellHeight;
            if (row == 0) row = Math.floor(this._game.height / cellHeight) + 1;
            else row = Math.floor((this._game.height - row) / cellHeight) + 2;

            tilemap.display = new PIXI.Container();
            tilemap.sprites = [];
            tilemap.spriteCount = col * row * 2;

            for (let i=0; i<tilemap.spriteCount; i++) {
                let tileSprite = new PIXI.extras.AnimatedSprite([tilemap.defaultTileTexture], true);
                tileSprite.visible = false;
                tilemap.display.addChild(tileSprite);
                tilemap.sprites.push(tileSprite);
            }

            this.loadTilesets(tilemap.tilesetNames, (tilesets) => {

                tilemap.tilesets = [];
                for (let tilesetName of tilemap.tilesetNames) {
                    tilemap.tilesets.push(this._tilesets[tilesetName]);
                }

                this._tilemaps[tilemapName] = tilemap;
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
		let endX = stage.x + scene.game.width;
		let endY = stage.y + scene.game.height;

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

                        let tile = tilemap.tilesets[cell.ids[k]].tiles[cell.ids[k+1]];

                        let spr = tilemap.sprites[idx++];
                        spr.x = posX; spr.y = posY;

                        let needToUpdateGraph = spr.textures !== tile.textures;
                        if (needToUpdateGraph) {
                            spr.gotoAndStop(0);
                            spr.textures = tile.textures;
                            spr.texture = spr.textures[0];
                        }

                        let animationSpeed = tile.speed && tile.speed > 0 && spr.textures.length > 1 ? tile.speed : 1;
                        if (spr.animationSpeed != animationSpeed) spr.animationSpeed = animationSpeed;

                        if (needToUpdateGraph) {
                            if (spr.textures.length > 1 && !scene.paused) spr.gotoAndPlay(0);
                            else spr.gotoAndStop(0);
                        } else {
                            if (spr.textures.length > 1 && spr.playing === scene.paused) {
                                if (spr.playing) spr.stop(); else spr.play();
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

