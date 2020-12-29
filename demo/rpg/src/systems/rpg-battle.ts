
export class RpgBattle implements OGE2D.Updater {

	name: string = "rpg-battle";
	
	entry: OGE2D.Sprite = null;
	listbox: OGE2D.Sprite = null;
	profile: any = null;
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

