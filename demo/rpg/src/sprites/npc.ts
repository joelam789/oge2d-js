
export class SpriteNpc {

	walkOnTile(spr: any, dir: string, speed: number = 2, callback = null) {
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
		if (rpg && !rpg.isOccupiedTile(spr.scene, null, newTile.x, newTile.y)
			&& gamemap.getTileCost(newTile.x, newTile.y) === 0 ) {
			state.moving = true;
			state.next = { x: posX, y: posY };
			rpg.occupyTile(spr, newTile.x, newTile.y);
			motion.moveTo(spr, posX, posY, speed, () => {
				state.moving = false;
				state.next = null;
				let oldTile = gamemap.pixelToTile(posX - dx, posY - dy);
				rpg.leaveTile(spr, oldTile.x, oldTile.y);
				this.walkOneStep(spr, speed, callback);
			});
		} else this.walkOneStep(spr, speed, callback);
	}

	walkOneStep(spr: any, speed: number = 2, callback = null) {
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
				&& !rpg.isOccupiedTile(spr.scene, null, step.x, step.y)) {
				let pos = gamemap.tileToPixel(step.x, step.y);
				let nextdir = rpg.getDirection({x: posX, y: posY}, pos);
				this.walkOnTile(spr, nextdir, speed, callback);
			} else {
				this.stopWalking(spr, "", callback);
			}
		} else this.stopWalking(spr, "", callback);
	}

	walkToTile(spr: any, x: number, y: number, speed: number = 2, callback = null) {

		let state = spr.get("movement");
		let gamemap = spr.scene.get("stage").gamemap;

		let currentX = state.next && state.next.x >= 0 ? state.next.x : spr.get("stage").x;
		let currentY = state.next && state.next.y >= 0 ? state.next.y : spr.get("stage").y;

		let start = gamemap.pixelToTile(currentX, currentY);
		let end = {x: x, y: y};
		
		let path = gamemap.findPath(start.x, start.y, end.x, end.y, false, (cx, cy, val) => {
            return spr.scene.sys("rpg").isOccupiedTile(spr.scene, null, cx, cy) ? -1 : val;
		});
		
		if (path && path.length > 0) {
			state.path = [];
			state.path.push(...path);
			state.target = { x: end.x, y: end.y };
			if (!state.moving) this.walkOneStep(spr, speed, callback);
		} else {
			let dir = spr.scene.sys("rpg").getDirection(start , end);
			if (dir) spr.get("display").animation.set(dir);
			if (callback) callback();
		}
	}

	stopWalking(spr: any, dir: string = "", callback = null) {
		let rpg = spr.scene.sys("rpg");
		let state = spr.get("movement");
		let anima = spr.get("display").animation;
		let gamemap = spr.scene.get("stage").gamemap;
		let posX = spr.get("stage").x;
		let posY = spr.get("stage").y;
		if (state) {
			state.path = [];
			state.moving = false;
			let newdir = "";
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
			if (state.target) state.target = null;
			if (callback) callback();
		}
	}

	walkOnMap(spr: any) {
		let rpg = spr.scene.sys("rpg");
		let state = spr.get("movement");
		let gamemap = spr.scene.get("stage").gamemap;
		if (rpg && state && gamemap && !state.waiting && state.auto === true) {
			spr.scene.timeout(1000 * (Math.floor(Math.random() * 2) + 1) * 2, () => {
				if (state.waiting === true) {
					this.walkOnMap(spr);
					return;
				}
				let currentX = spr.get("stage").x;
				let currentY = spr.get("stage").y;
				let start = gamemap.pixelToTile(currentX, currentY);
				let steps = Math.floor(Math.random() * 2) + 1; // 1 ~ 2 steps
				let range = gamemap.findRange(start.x, start.y, steps, false, (cx, cy, val) => {
					if (cx < 0 || cx > state.start.x + 2) return -1;
					if (cy < 0 || cy > state.start.y + 2) return -1;
					if (spr.scene.sys("rpg").isOccupiedTile(spr.scene, null, cx, cy)) return -1;
					return val >= 0 ? 1 : -1;
				});
				if (range && range.length > 0) {
					let idx = Math.floor(Math.random() * range.length);
					this.walkToTile(spr, range[idx].x, range[idx].y, 2, () => this.walkOnMap(spr));
				} else {
					this.walkOnMap(spr);
				}
			});
		} else {
			spr.scene.timeout(1000 * (Math.floor(Math.random() * 2) + 1) * 2, () => this.walkOnMap(spr));
		}
	}

	wait(spr, waiting: boolean = true) {
		let state = spr.get("movement");
		if (state) state.waiting = waiting;
	}

	onUpdate(sprite) {
		// ...
	}

	onSceneActivate(sprite) {
		//console.log("[Base] Npc - onSceneActivate: " + sprite.name);
		let rpg = sprite.scene.sys("rpg");
		if (rpg) {
			rpg.alignToTile(sprite);
			rpg.occupyCurrentTile(sprite);
		}
		let state = sprite.get("movement");
		if (state) state.waiting = false;
		let gamemap = sprite.scene.get("stage").gamemap;
		if (gamemap && state && state.auto === true) {
			let currentX = sprite.get("stage").x;
			let currentY = sprite.get("stage").y;
			let start = gamemap.pixelToTile(currentX, currentY);
			state.start = {
				x: start.x,
				y: start.y
			}
			this.walkOnMap(sprite);
		}
	}

}
