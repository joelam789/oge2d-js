
export class RpgBattle implements OGE2D.Updater {

	name: string = "rpg-battle";
	
	entry: OGE2D.Sprite = null;
	listbox: OGE2D.Sprite = null;
	profile: any = null;
	gamepad: any = null;
	keyboard: any = null;
	holdon: boolean = false;

	init(game: OGE2D.Game): boolean {
		this.profile = game.components.rpg;
		console.log("rpg-battle system is loaded successfully");
		return true;
	}

	activate(scene: OGE2D.Scene) {
		this.listbox = null;
		this.holdon = false;
		this.gamepad = scene.systems["gamepad"];
		this.keyboard = scene.systems["keyboard"];
		let rpg = scene.components["rpg"];
		if (rpg) {
			//this.cleanupMap(scene);
			if (rpg.listbox) this.listbox = scene.sprites[rpg.listbox];
			if (rpg.entry) this.entry = scene.sprites[rpg.entry];
		}
		if (this.entry) {
			// show it when fade-in done
			scene.timeout(500, () => this.entry.active = true);
		}
	}

	update(scene: OGE2D.Scene, time: number) {
		this.handleKeyboard(scene);
	}

	checkMovementControl() {
		if (!this.keyboard) return null;
		if (this.keyboard.keys["ArrowUp"]) return "up";
		else if (this.keyboard.keys["ArrowDown"]) return "down";
		else if (this.keyboard.keys["ArrowLeft"]) return "left";
		else if (this.keyboard.keys["ArrowRight"]) return "right";
		return "";
	}

	checkActionControl() {
		if (!this.keyboard) return null;
		if (this.keyboard.keys[" "]) return "check";
		//else if (this.keyboard.keys["Escape"]) return "menu";
		return "";
	}

	cleanup(scene: OGE2D.Scene) {
		let rpg = scene.components["rpg"];
		if (!rpg) return;
	}

	isListing() {
		return this.listbox && this.listbox.active 
				&& this.listbox.code && this.listbox.code.isListing();
	}

	selectItem() {
		if (this.listbox && this.listbox.active && this.listbox.code) this.listbox.code.selectItem();
	}

	onSceneBattleClick(scene, event) {
        let pos = event.data.getLocalPosition(scene.components["display"].object);
        console.log("scene onPointerdown: " + scene.name + " - x=" + pos.x + " , y=" + pos.y);
        //let target = scene.systems["stage"].transform(pos);
    }

	handleKeyboard(scene: OGE2D.Scene) { // handle (virtual) controller

		if (scene.paused) return;

		if (this.keyboard == undefined || this.keyboard == null) return;
		if (this.profile == undefined || this.profile == null) return;
		if (this.profile.controllable !== true) return;

		if (this.gamepad) {
			let firstGamepad = this.gamepad.getFirstGamepad();
			if (firstGamepad) {
				this.keyboard.keys["ArrowUp"] = firstGamepad.keys["up"];
				this.keyboard.keys["ArrowDown"] = firstGamepad.keys["down"];
				this.keyboard.keys["ArrowLeft"] = firstGamepad.keys["left"];
				this.keyboard.keys["ArrowRight"] = firstGamepad.keys["right"];
				this.keyboard.keys[" "] = firstGamepad.keys["b0"];
				this.keyboard.keys["Escape"] = firstGamepad.keys["b1"];
			}
		}

		let jbuttons = (window as any).vbuttons;
		if (jbuttons) {
			let isUp = jbuttons.up;
			let isDown = jbuttons.down;
			let isLeft = jbuttons.left;
			let isRight = jbuttons.right;
			if (isUp || isDown || isLeft || isRight) {
				this.keyboard.keys["ArrowUp"] = isUp;
				this.keyboard.keys["ArrowDown"] = isDown;
				this.keyboard.keys["ArrowLeft"] = isLeft;
				this.keyboard.keys["ArrowRight"] = isRight;
			} else {
				this.keyboard.keys["ArrowUp"] = false;
				this.keyboard.keys["ArrowDown"] = false;
				this.keyboard.keys["ArrowLeft"] = false;
				this.keyboard.keys["ArrowRight"] = false;
			}
			this.keyboard.keys[" "] = jbuttons.b1 === true;
			this.keyboard.keys["Escape"] = jbuttons.b2 === true;
		}

		let profile = scene.game.get("rpg");
		if (!profile) return;
		
		let dir = this.checkMovementControl();
		let act = this.checkActionControl();

		if ((dir || act) && !this.holdon) {
			//console.log("arrows", this.isListing());
			if (this.isListing()) {
				if (dir && (dir == "up" || dir == "down")) {
					this.listbox.code.moveCursor(dir);
					this.holdon = true;
					this.listbox.scene.timeout(200, () => this.holdon = false);
				}
				if (act && !this.holdon) {
					this.selectItem();
					this.holdon = true;
					this.listbox.scene.timeout(200, () => this.holdon = false);
				}
			}
		}
	}

}

