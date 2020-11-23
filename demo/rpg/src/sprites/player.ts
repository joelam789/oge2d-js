
export class SpritePlayer {

	walkOnTile(spr: any, dir: string, speed: number = 2) {
		let rpg = spr.scene.sys("rpg");
		let state = spr.get("movement");
		let anima = spr.get("display").animation;
		let motion = spr.scene.systems["motion"];
		let gamemap = spr.scene.get("stage").gamemap;
		if (!state || !anima || !motion || !gamemap) return;
		if (state.moving === true) return;
		let dx = 0, dy = 0;
		switch (dir) {
			case "up": anima.set("run_up"); dy = -32; break;
			case "down": anima.set("run_down"); dy = 32; break;
			case "left": anima.set("run_left"); dx = -32; break;
			case "right": anima.set("run_right"); dx = 32; break;
			default: return;
		}
		let posX = spr.get("stage").x + dx;
		let posY = spr.get("stage").y + dy;
		let newTile = gamemap.pixelToTile(posX, posY);
		if (rpg && !rpg.isOccupiedTile(spr.scene, [spr.name], newTile.x, newTile.y)
			&& gamemap.getTileCost(newTile.x, newTile.y) === 0 ) {
			state.moving = true;
			state.next = { x: posX, y: posY };
			rpg.occupyTile(spr, newTile.x, newTile.y);
			motion.moveTo(spr, posX, posY, speed, () => {
				state.moving = false;
				state.next = null;
				let oldTile = gamemap.pixelToTile(posX - dx, posY - dy);
				rpg.leaveTile(spr, oldTile.x, oldTile.y);
				let newInput = rpg.checkMovementControl();
				if (newInput) {
					state.path = [];
					state.target = null;
				} else this.walkOneStep(spr, speed);
			});
		} else this.walkOneStep(spr, speed);
	}

	walkOneStep(spr: any, speed: number = 2) {
		let rpg = spr.scene.sys("rpg");
		let state = spr.get("movement");
		let anima = spr.get("display").animation;
		let gamemap = spr.scene.get("stage").gamemap;
		if (!state || !anima || !gamemap) return;
		if (state.moving === true) return;
		let posX = spr.get("stage").x;
		let posY = spr.get("stage").y;
		if (state.path.length > 0) {
			let step = state.path.shift();
			if (gamemap.getTileCost(step.x, step.y) === 0 
				&& !rpg.isOccupiedTile(spr.scene, [spr.name], step.x, step.y)) {
				let pos = gamemap.tileToPixel(step.x, step.y);
				let nextdir = rpg.getDirection({x: posX, y: posY}, pos);
				this.walkOnTile(spr, nextdir, speed);
			} else {
				if (state.path.length > 0 && state.target) {
					let last = gamemap.tileToPixel(state.target.x, state.target.y);
					this.walkTo(spr, last.x, last.y, speed);
				} else this.stopWalking(spr);
			}
		} else this.stopWalking(spr);
	}

	walkToTile(spr: any, x: number, y: number, speed: number = 2) {

		let state = spr.get("movement");
		let gamemap = spr.scene.get("stage").gamemap;

		let currentX = state.next && state.next.x >= 0 ? state.next.x : spr.get("stage").x;
		let currentY = state.next && state.next.y >= 0 ? state.next.y : spr.get("stage").y;

		let start = gamemap.pixelToTile(currentX, currentY);
		let end = {x: x, y: y};
		
		let path = gamemap.findPath(start.x, start.y, end.x, end.y, false, (cx, cy, val) => {
            return spr.scene.sys("rpg").isOccupiedTile(spr.scene, [spr.name], cx, cy) ? -1 : val;
		});

		//console.log("walkToTile", x, y);
		
		if (path && path.length > 0) {
			state.path = [];
			state.path.push(...path);
			state.target = { x: end.x, y: end.y };
			if (!state.moving) this.walkOneStep(spr, speed);
		} else {
			state.path = [];
			state.target = { x: end.x, y: end.y };
			this.stopWalking(spr);
		}
	}

	walkTo(spr: any, x: number, y: number, speed: number = 2) {

		let rpg = spr.scene.sys("rpg");
		if (rpg && rpg.isTalking()) return;

		let state = spr.get("movement");
		let gamemap = spr.scene.get("stage").gamemap;

		let profile = spr.scene.game.get("rpg");
		if (profile && profile.controllable === false) return;

		let tile = gamemap.pixelToTile(x, y);

		this.walkToTile(spr, tile.x, tile.y, speed);
	}

	stopWalking(spr: any, dir: string = "") {
		let rpg = spr.scene.sys("rpg");
		let state = spr.get("movement");
		let anima = spr.get("display").animation;
		let gamemap = spr.scene.get("stage").gamemap;
		let posX = spr.get("stage").x;
		let posY = spr.get("stage").y;
		let plot = null;
		if (state) {
			state.path = [];
			state.moving = false;
			let newdir = "";
			let tile = null;
			if (state.target) {
				let pos = gamemap.pixelToTile(posX, posY);
				newdir = rpg.getDirection(pos, state.target);
			}
			if (anima) {
				if (dir) anima.set(dir);
				else if (newdir) anima.set(newdir);
				else {
					let parts = anima.current.split("_");
					if (parts && parts.length >= 2) anima.set(parts[1]);
				}
			}
			if (state.target) {
				tile = rpg.getNextTile(spr);
				if (tile && tile.x == state.target.x && tile.y == state.target.y)
					plot = rpg.getPlotOnTile(spr.scene, tile.x, tile.y);
				state.target = null;
			}
			if (plot) {
				let npc = rpg.getPlotNpc(plot);
				let npcWalking = npc && rpg.isNpcWalking(npc);
				if (npc && tile && !rpg.isNpcWalking(npc)) {
					rpg.startNpcWaiting(npc);
					let npcAnima = npc.get("display").animation;
					let npcTile = rpg.getCurrentTile(npc);
					let playerTile = rpg.getCurrentTile(spr);
					let npcDir = npcTile ? rpg.getDirection(npcTile, playerTile) : null;
					if (npcDir && npcAnima) npcAnima.set(npcDir);
				}
				if (!npc || (npc && !npcWalking)) plot.active = true;
			}
		}
	}

	onUpdate(sprite) {
		// ...
	}

	onSceneActivate(sprite) {
		//console.log("[Base] Player - onSceneActivate: " + sprite.name);
		let rpg = sprite.scene.sys("rpg");
		let gamemap = sprite.scene.get("stage").gamemap;
		let tile = sprite.get("tile");
		if (tile && gamemap) {
			let pos = gamemap.tileToPixel(tile.x, tile.y);
			sprite.get("stage").x = pos.x;
			sprite.get("stage").y = pos.y;
		}
		if (rpg) {
			rpg.alignToTile(sprite);
			rpg.occupyCurrentTile(sprite);
		}
		let state = sprite.get("movement");
		if (state) {
			state.moving = false;
			state.next = null;
		}
	}

}
