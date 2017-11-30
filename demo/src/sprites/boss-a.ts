export class SpriteBossA {
	
	explode(scene: OGE2D.Scene, bomb: OGE2D.Sprite, speed: number) {
		let motion: any = scene.sys("motion");
		let display = bomb.get("display").object;
		let posX = display.x, posY = display.y;
		for (let i=0; i<8; i++) {
			let bullet = scene.getFreeSprite("enemy-bullet-a1");
			if (bullet) {
				bullet.components.display.object.x = posX;
				bullet.components.display.object.y = posY;
				motion.moveOutside(bullet, speed, 360 - 45 * i, -8, -8, 640 + 8, 480 + 8, (spr) => spr.active = false);
				bullet.active = true;
			} else break;
		}
	}

	sendBomb(scene: OGE2D.Scene, boss: OGE2D.Sprite, speed: number) {
		if (!boss.active) return;
		let script = scene.game.lib("script");
		let motion: any = scene.sys("motion");
		let tween: any = scene.systems["tween"];
		let display = scene.spr("player1").get("display").object;
		let posX = boss.get("display").object.x, posY = boss.get("display").object.y;
		let angle = motion.getMotionAngle(posX, posY + 20, display.x, display.y);
		let bomb = script.call(this, "getFreeEnemy", scene, "boss-bomb-a1");
		if (bomb) {
			bomb.components.display.object.tint = 0xffffff;
			bomb.components.display.object.x = posX + 10 * (angle > 270 ? 1 : -1);
			bomb.components.display.object.y = posY + 20;
			motion.moveOutside(bomb, speed, angle, -8, -8, 640 + 8, 480 + 8, (spr) => spr.active = false);
			scene.timeout(1000 + 1000 * (Math.round(Math.random() * 100) % 4), () => {
				tween.get(bomb.components.display.object).to({tint:0xff7777}, 200).wait(300).call(() => {
					if (bomb.active) bomb.active = false;
				});
			});
			if (bomb.components.event == undefined) bomb.components.event = { };
			bomb.components.event["onDeactivate"] = (spr) => this.explode(scene, spr, 2);
			bomb.active = true;
		}
		scene.timeout(2000 + 1000 * (Math.round(Math.random() * 100) % 4), () => this.sendBomb(scene, boss, speed));
	}

	move(scene: OGE2D.Scene, boss: OGE2D.Sprite, speed: number) {
		if (!boss.active) return;
		let motion: any = scene.sys("motion");
		let jsonlib = scene.game.lib("json");
		let pathData = jsonlib.getJson("json/paths/boss.json");
		if (pathData == null) return;
		let display = boss.get("display").object;
		motion.applyPath(boss, display.x, display.y, speed, pathData.nodes, (spr) => this.move(scene, spr, 0 - speed));
	}

	go(scene: OGE2D.Scene, posX: number, posY: number, speed: number) {
		let script = scene.game.lib("script");
		let motion: any = scene.sys("motion");
		let enemy = script.call(this, "getFreeEnemy", scene, "boss-a1");
		if (enemy) {
			let x = 0, y = 0;
			if (posY < 0) {
				x = posX;
				y = posY + 256;
				enemy.active = true;
			} else if (posX < 0) {
				x = posX + 256;
				y = posY;
				enemy.active = true;
			} else if (posX > 0 && posY > 0) {
				x = posX - 256;
				y = posY;
				enemy.active = true;
			} else {
				enemy.active = false;
			}
			if (enemy.active) {
				enemy.components.display.object.x = posX;
				enemy.components.display.object.y = posY;
				motion.moveTo(enemy, x, y, speed * 2, (spr) => {
					this.move(scene, spr, speed);
					if (spr.active) this.sendBomb(scene, spr, 1);
				});
				if (enemy.components.event == undefined) enemy.components.event = { };
				enemy.components.event["onDeactivate"] = (spr) => {
					let profile = enemy.game.components.shooting;
					profile.progress = profile.progress + 35;
					if (profile.progress >= 100) {
						console.log("stage clear");
						scene.spr("game-over1").active = true;
					}
				};
			}
		}
	}
	
}
