
export class Rpg implements OGE2D.Updater {

	name: string = "rpg";
	
	stage: any = null;
	player: OGE2D.Sprite = null;
	dialog: OGE2D.Sprite = null;
	profile: any = null;
	keyboard: any = null;
	holdon: boolean = false;

	init(game: OGE2D.Game): boolean {
		this.profile = game.components.rpg;
		console.log("rpg system is loaded successfully");
		return true;
	}

	activate(scene: OGE2D.Scene) {
		this.player = null;
		this.dialog = null;
		this.holdon = false;
		this.stage = scene.systems["stage"];
		this.keyboard = scene.systems["keyboard"];
		let rpg = scene.components["rpg"];
		if (rpg) {
			this.cleanupMap(scene);
			if (rpg.player) this.player = scene.sprites[rpg.player];
			if (this.stage && this.player) {
				let profile = scene.game.get("rpg");
				if (profile) profile.controllable = true;
				this.stage.follow(scene, this.player.name);
			}
			if (rpg.dialog) this.dialog = scene.sprites[rpg.dialog];
		}
	}

	update(scene: OGE2D.Scene, time: number) {
		this.handleKeyboard(scene);
	}



	checkMovementControl() {
		if (!this.keyboard) return null;
		if (this.keyboard.states["ArrowUp"]) return "up";
		else if (this.keyboard.states["ArrowDown"]) return "down";
		else if (this.keyboard.states["ArrowLeft"]) return "left";
		else if (this.keyboard.states["ArrowRight"]) return "right";
		return "";
	}

	checkActionControl() {
		if (!this.keyboard) return null;
		if (this.keyboard.states[" "]) return "check";
		//else if (this.keyboard.states["Escape"]) return "menu";
		return "";
	}

	cleanupMap(scene: OGE2D.Scene) {
		let rpg = scene.components["rpg"];
		if (!rpg) return;
		if (rpg.tempMarks) {
			rpg.tempMarks.forEach((value, key, map) => value.length = 0);
		} else {
			rpg.tempMarks = new Map<string, Array<string>>();
		}
	}

	occupyTile(spr: OGE2D.Sprite, tileX: number, tileY: number) {
		let rpg = spr.scene.components["rpg"];
		let gamemap = spr.scene.get("stage").gamemap;
		if (gamemap && rpg && rpg.tempMarks) {
			let key = tileX + "_" + tileY;
			if (rpg.tempMarks.has(key)) {
				let list = rpg.tempMarks.get(key);
				if (list.indexOf(spr.name) < 0) list.push(spr.name);
			} else {
				let list = [spr.name];
				rpg.tempMarks.set(key, list);
			}
		}
	}

	leaveTile(spr: OGE2D.Sprite, tileX: number, tileY: number) {
		let rpg = spr.scene.components["rpg"];
		let gamemap = spr.scene.get("stage").gamemap;
		if (gamemap && rpg && rpg.tempMarks) {
			let key = tileX + "_" + tileY;
			if (rpg.tempMarks.has(key)) {
				let list = rpg.tempMarks.get(key);
				let idx = list ? list.indexOf(spr.name) : -1;
				if (idx >= 0) list.splice(idx, 1);
			}
		}
	}

	occupyCurrentTile(spr: OGE2D.Sprite) {
		let rpg = spr.scene.components["rpg"];
		let gamemap = spr.scene.get("stage").gamemap;
		if (gamemap && rpg && rpg.tempMarks) {
			let pos =  spr.get("stage");
			let tile = gamemap.pixelToTile(pos.x, pos.y);
			this.occupyTile(spr, tile.x, tile.y);
		}
	}

	isOccupiedTile(scene: OGE2D.Scene, exceptNames: Array<string>, tileX: number, tileY: number): boolean {
		let rpg = scene.components["rpg"];
		let gamemap = scene.get("stage").gamemap;
		if (gamemap && rpg && rpg.tempMarks) {
			let key = tileX + "_" + tileY;
			if (rpg.tempMarks.has(key)) {
				let list = rpg.tempMarks.get(key);
				if (!list || list.length == 0) return false;
				if (!exceptNames || exceptNames.length == 0) return true;
				for (let item of list) {
					if (exceptNames.indexOf(item) < 0) return true;
				}
				return false;
			}
		}
		return false;
	}

	alignToTile(spr: OGE2D.Sprite) {
		let gamemap = spr.scene.get("stage").gamemap;
		if (gamemap) {
			let posX = spr.get("stage").x;
			let posY = spr.get("stage").y;
			let pos = gamemap.align(posX, posY);
			if (pos) {
				spr.get("stage").x = pos.x;
				spr.get("stage").y = pos.y;
			}
		}
	}

	getDirection(pos, next): string {
		if (pos.x == next.x) {
			if (pos.y > next.y) return "up";
			else if (pos.y < next.y) return "down";
		} else if (pos.y == next.y) {
			if (pos.x > next.x) return "left";
			else if (pos.x < next.x) return "right";
		}
		return null;
	}

	getCurrentTile(spr: OGE2D.Sprite) {
		let gamemap = spr.scene.get("stage").gamemap;
		if (gamemap) {
			let posX = spr.get("stage").x;
			let posY = spr.get("stage").y;
			return gamemap.pixelToTile(posX, posY);
			
		}
		return null;
	}

	getNextTile(spr: OGE2D.Sprite) {
		let anima = spr.get("display").animation;
		let gamemap = spr.scene.get("stage").gamemap;
		if (anima && gamemap) {
			let dx = 0, dy = 0;
			let dir = anima.current;
			if (dir.indexOf("_") >= 0) {
				let parts = anima.current.split("_");
				if (parts && parts.length >= 2) dir = parts[1];
			}
			switch (dir) {
				case "up": dy = -32; break;
				case "down": dy = 32; break;
				case "left": dx = -32; break;
				case "right": dx = 32; break;
				default: return null;
			}
			let posX = spr.get("stage").x + dx;
			let posY = spr.get("stage").y + dy;
			return gamemap.pixelToTile(posX, posY);
		}
		return null;
	}

	getPlotOnTile(scene: OGE2D.Scene, x: number, y: number) {
		for (let item in scene.sprites) {
			let spr = scene.sprites[item];
			//console.log(spr.name, spr.template);
			if (spr && spr.template == "plot") {
				let rpg = spr.get("rpg");
				//console.log(spr.name, rpg);
				if (rpg) {
					let tile = null;
					if (rpg.tile) tile = rpg.tile;
					else if (rpg.npc) {
						let npc = scene.sprites[rpg.npc];
						let gamemap = scene.get("stage").gamemap;
						if (npc && gamemap) {
							let posX = npc.get("stage").x;
							let posY = npc.get("stage").y;
							tile = gamemap.pixelToTile(posX, posY);
						}
					}
					if (tile && tile.x == x && tile.y == y) return spr;
				}
				
			}
		}
		return null;
	}

	getPlotNpc(plot: OGE2D.Sprite) {
		let rpg = plot.get("rpg");
		if (rpg && rpg.npc) {
			let npc = plot.scene.sprites[rpg.npc];
			if (npc) return npc;
		}
		return null;
	}

	startNpcWaiting(npc: OGE2D.Sprite) {
		let state = npc.get("movement");
		if (state) state.waiting = true;
	}

	stopNpcWaiting(scene: OGE2D.Scene) {
		let gamemap = scene.get("stage").gamemap;
		if (!gamemap) return null;
		for (let item in scene.sprites) {
			let spr = scene.sprites[item];
			if (spr && spr.template == "npc") {
				let state = spr.get("movement");
				if (state) state.waiting = false;
			}
		}
		return null;
	}

	isNpcWalking(npc: OGE2D.Sprite) {
		let state = npc.get("movement");
		return state && (state.moving || state.walking);
	}

	isTalking() {
		return this.dialog && this.dialog.active;
	}

	isAnswering() {
		return this.dialog && this.dialog.active 
				&& this.dialog.code && this.dialog.code.isAnswering();
	}

	selectAnswer() {
		if (this.dialog && this.dialog.active && this.dialog.code) this.dialog.code.selectAnswer();
	}

	onSceneMapClick(scene, event) {
        let pos = event.data.getLocalPosition(scene.components["display"].object);
        //console.log("scene onPointerdown: " + scene.name + " - x=" + pos.x + " , y=" + pos.y);
        let target = scene.systems["stage"].transform(pos);
        let rpg = scene.components["rpg"];
        let player = scene.sprites[rpg.player];
        if (player) player.code.walkTo(player, target.x, target.y);
    }

	handleKeyboard(scene: OGE2D.Scene) { // handle (virtual) controller

		if (scene.paused) return;

		if (this.keyboard == undefined || this.keyboard == null) return;
		if (this.profile == undefined || this.profile == null) return;
		if (this.profile.controllable !== true) return;

		let jbuttons = (window as any).vbuttons;
		if (jbuttons) {
			let isUp = jbuttons.up;
			let isDown = jbuttons.down;
			let isLeft = jbuttons.left;
			let isRight = jbuttons.right;
			if (isUp || isDown || isLeft || isRight) {
				this.keyboard.states["ArrowUp"] = isUp;
				this.keyboard.states["ArrowDown"] = isDown;
				this.keyboard.states["ArrowLeft"] = isLeft;
				this.keyboard.states["ArrowRight"] = isRight;
			} else {
				this.keyboard.states["ArrowUp"] = false;
				this.keyboard.states["ArrowDown"] = false;
				this.keyboard.states["ArrowLeft"] = false;
				this.keyboard.states["ArrowRight"] = false;
			}
			this.keyboard.states[" "] = jbuttons.b1 === true;
			this.keyboard.states["Escape"] = jbuttons.b2 === true;
		}

		let profile = scene.game.get("rpg");

		let playerAction = this.player && this.player.active ? this.player.code : null;
		if (playerAction) {
			let speed = profile ? profile.movespeed : 1;
			let dir = this.checkMovementControl();
			let act = this.checkActionControl();
			let walking = false;
			let talking = this.isTalking();
			if (dir && !talking) {
				let state = this.player.get("movement");
				if (state) {
					state.path = [];
					state.target = null;
				}
				playerAction.walkOnTile(this.player, dir, speed);
				walking = true;
			}
			if (talking && !this.holdon) {
				if (this.isAnswering()) {
					if (dir && (dir == "up" || dir == "down")) {
						this.dialog.code.moveCursor(dir);
						this.holdon = true;
						this.player.scene.timeout(200, () => this.holdon = false);
					}
					if (act && !this.holdon) {
						this.selectAnswer();
						this.holdon = true;
						this.player.scene.timeout(200, () => this.holdon = false);
					}
				}
			}
			if (act && !this.holdon) {
				if (talking) {
					this.dialog.code.next();
					this.holdon = true;
					this.player.scene.timeout(500, () => this.holdon = false);
				} else if (!walking) {
					let tile = this.getNextTile(this.player);
					let plot = tile ? this.getPlotOnTile(this.player.scene, tile.x, tile.y) : null;
					if (plot) {
						let npc = this.getPlotNpc(plot);
						let npcWalking = npc && this.isNpcWalking(npc);
						if (npc && !npcWalking) {
							this.startNpcWaiting(npc);
							let anima = npc.get("display").animation;
							let npcTile = this.getCurrentTile(npc);
							let playerTile = this.getCurrentTile(this.player);
							let npcDir = this.getDirection(npcTile, playerTile);
							if (npcDir && anima) anima.set(npcDir);
						}
						if (!npc || (npc && !npcWalking)) {
							plot.active = true;
							this.holdon = true;
							this.player.scene.timeout(500, () => this.holdon = false);
						}
					}
				}
			}
		}
	}

}

