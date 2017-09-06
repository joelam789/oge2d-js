
export class Shooting implements OGE2D.Updater {

	name: string = "shooting";

	collision: any = null;
	keyboard: any = null;
	motion: any = null;
	tween: any = null;
	audio: any = null;

	player: OGE2D.Sprite = null;
	profile: any = null;

	init(game: OGE2D.Game): boolean {
		this.collision = game.systems["collision"];
		this.profile = game.components.shooting;
		if (this.collision) this.collision.onCollision = (spr1, spr2) => this.handleCollision(spr1, spr2);
		if (this.collision) console.log("shooting system is loaded successfully");
		else console.log("failed to load shooting system (missing collision detection)");
		return true;
	}

	activate(scene: OGE2D.Scene) {
		this.player = null;
		this.keyboard = scene.systems["keyboard"];
		this.motion = scene.systems["motion"];
		this.tween = scene.systems["tween"];
		this.audio = scene.game.libraries["audio"];
		let shooting = scene.components["shooting"];
		if (shooting) {
			if (shooting.player) this.player = scene.sprites[shooting.player];
		}
	}

	update(scene: OGE2D.Scene, time: number) {
		this.handleKeyboard(scene);
		if (this.collision) this.collision.update(scene, time);
		this.updatePlayerInfoDisplay(scene);
	}

	updatePlayerInfoDisplay(scene: OGE2D.Scene) {
		if (this.profile == undefined || this.profile == null) return;
		scene.spr("bar1").get("display").object.scale.x = 250 * this.profile.hp / 100;
		scene.spr("label1").get("display").object.text = "x" + this.profile.lives;
		scene.spr("label2").get("display").object.text = "x" + this.profile.bombs;
		scene.spr("label3").get("display").object.text = "Score: " + this.profile.score;
	}

	handleKeyboard(scene: OGE2D.Scene) {
		if (scene.paused) return;
		if (this.keyboard == undefined || this.keyboard == null) return;
		if (this.player == undefined || this.player == null) return;
		if (this.profile == undefined || this.profile == null) return;
		if (this.profile.controllable !== true) return;

		let joystick = (window as any).vjoystick;
		if (joystick) {
			let isUp = joystick.up();
			let isDown = joystick.down();
			let isLeft = joystick.left();
			let isRight = joystick.right();
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
			this.keyboard.states["Control"] = joystick.b1 === true;
			this.keyboard.states["Shift"] = joystick.b2 === true;
		}

		let display = this.player.components["display"];
		if (this.player.active && display && display.object) {
			let speed = 4, deltax = 0, deltay = 0;
			if (this.keyboard.states["ArrowUp"]) deltay -= speed;
			if (this.keyboard.states["ArrowDown"]) deltay += speed;
			if (this.keyboard.states["ArrowLeft"]) deltax -= speed;
			if (this.keyboard.states["ArrowRight"]) deltax += speed;
			if (deltax != 0 || deltay != 0) {
				let rect = display.object.getBounds(false);
				if (rect.left + deltax > 0 && rect.right + deltax < scene.game.width
					&& rect.top + deltay > 0 && rect.bottom + deltay < scene.game.height - 25) {
					display.object.x += deltax;
					display.object.y += deltay;
				}
			}

			if (this.keyboard.states["Control"]) {
				let interval = this.keyboard.ticks["Control"] ? scene.ticks - this.keyboard.ticks["Control"] : scene.ticks;
				if (interval >= 120) {
					let bullet = scene.getFreeSprite("player-bullet-a1");
					let position = bullet ? bullet.components.display.object : null;
					if (bullet && position && this.motion) {
						position.x = display.object.x;
						position.y = display.object.y - 40;
						bullet.active = true;
						this.motion.moveTo(bullet, position.x, -40, 8, (spr) => spr.active = false);
						if (this.audio) this.audio.sounds["shoot"].play();
					}
					this.keyboard.ticks["Control"] = scene.ticks;
				}
			}

			if (this.keyboard.states["Shift"] && this.profile && this.profile.bombs > 0
				&& scene.getFreeSpriteCount("player-bomb1") >= 3) {
				this.profile.bombs = this.profile.bombs - 1;
				let posX = display.object.x - 80;
				let posY = 640 + 48;
				for (let i=0; i<3; i++) {
					let friend = scene.getFreeSprite("player-bomb1");
					let position = friend ? friend.components.display.object : null;
					if (friend && position) {
						position.x = posX;
						position.y = posY;
						friend.active = true;
						this.motion.moveTo(friend, posX, display.object.y - 48, 8, (self1) => {
							scene.timeout(8000, () => {
								this.motion.moveTo(self1, self1.get("display").object.x, -60, 8, (self2) => self2.active = false);
							});
						});
						posX += 80;
					} else break;
				}
			}
		}
	}

	handleCollision(spr1: OGE2D.Sprite, spr2: OGE2D.Sprite) {

		if (this.profile == undefined || this.profile == null) return;
		if (spr1.active == false || spr2.active == false) return;

		let player: OGE2D.Sprite = null;
		let playerBullet: OGE2D.Sprite = null;
		let enemy: OGE2D.Sprite = null;
		let enemyBullet: OGE2D.Sprite = null;
		let friend: OGE2D.Sprite = null;

		if (spr1.components.shooting && spr2.components.shooting) {
			switch(spr1.components.shooting.role) {
				case "player": player = spr1; break;
				case "player-bullet": playerBullet = spr1; break;
				case "enemy": enemy = spr1; break;
				case "enemy-bullet": enemyBullet = spr1; break;
				case "friend": friend = spr1; break;
			}
			switch(spr2.components.shooting.role) {
				case "player": player = spr2; break;
				case "player-bullet": playerBullet = spr2; break;
				case "enemy": enemy = spr2; break;
				case "enemy-bullet": enemyBullet = spr2; break;
				case "friend": friend = spr2; break;
			}
		}

		if (enemy) {
			let display = enemy.components.display.object;
			if (display.y - display.height / 2 <= 0 || display.x + display.width / 4 <= 0) {
				return; // skip if not enter screen
			}
		}

		if (player && enemy) {
			this.profile.hp -= enemy.components.shooting.power;
			if (this.profile.hp < 0) this.profile.hp = 0;
			enemy.components.shooting.hp -= this.profile.power;
			if (enemy.components.shooting.hp < 0) enemy.components.shooting.hp = 0;
		} else if (player && enemyBullet) {
			this.profile.hp -= enemyBullet.components.shooting.power;
			if (this.profile.hp < 0) this.profile.hp = 0;
			enemyBullet.active = false;
		} else if (enemy && playerBullet) {
			enemy.components.shooting.hp -= playerBullet.components.shooting.power;
			if (enemy.components.shooting.hp < 0) enemy.components.shooting.hp = 0;
			playerBullet.active = false;
		} else if (friend && enemyBullet) {
			enemyBullet.active = false;
		}

		if (enemy && (player || playerBullet)) {
			if (enemy.components.shooting.hp > 0) {
				this.tween.get(enemy.components.display.object)
								.set({tint:0xff7777})
								.wait(200)
								.set({tint:0xffffff});
				if (this.audio) this.audio.sounds["hit"].play();
			} else {
				let boom = enemy.scene.getFreeSprite(enemy.components.shooting.boom + "1");
				let display = boom ? boom.get("display") : null;
				if (boom && display) {
					display.object.x = enemy.components.display.object.x;
					display.object.y = enemy.components.display.object.y;
					display.animation.onComplete = null;
					display.animation.reset();
					display.animation.play(false);
					boom.active = true;
				}
				this.profile.score += enemy.components.shooting.score;
				if (this.audio) {
					if (enemy.components.shooting.boom == "boom-a") this.audio.sounds["boom1"].play();
					else this.audio.sounds["boom2"].play();
				}
				enemy.active = false;
			}
		}

		if (player && (enemy || enemyBullet)) {
			if (this.profile.hp > 0) {
				this.tween.get(player.components.display.object)
								.set({tint:0xff7777})
								.wait(200)
								.set({tint:0xffffff});
			} else {
				let boom = player.scene.getFreeSprite("boom-b1");
				let display = boom ? boom.get("display") : null;
				if (boom && display) {
					display.object.x = player.components.display.object.x;
					display.object.y = player.components.display.object.y;
					display.animation.onComplete = (spr) => {
						spr.active = false;
						spr.scene.spr("reborn1").active = true;
					};
					display.animation.reset();
					display.animation.play(false);
					boom.active = true;
				}
				if (this.audio) this.audio.sounds["boom2"].play();
				player.active = false;
			}
		}
	}

}

