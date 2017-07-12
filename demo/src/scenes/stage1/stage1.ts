
export class SceneStage1 {
    
    onInit(scene) {
        console.log("on scene init: " + scene.name);
    }

    onActivate(scene) {

        console.log("on scene activate: " + scene.name);

		let profile = scene.game.components.shooting;
		profile.progress = 0;
		profile.score = 0;
		profile.lives = 2;

		scene.reset();

		scene.systems["stage"].setPos(0, 6688);
		scene.systems["stage"].scroll(0, -1);
		scene.sprites["plot1"].active = true;

    }

	onDeactivate(scene) {

        console.log("on scene deactivate: " + scene.name);

		scene.game.libraries["audio"].musics["battle"].stop();
		scene.game.libraries["audio"].musics["boss"].stop();
		scene.game.libraries["audio"].musics["win"].stop();
		scene.game.libraries["audio"].musics["lose"].stop();

    }

    onKeyPress(scene: OGE2D.Scene, keyName: string) {
        //console.log("scene onKeyPress: " + scene.name + " - " + keyName);
		if (keyName == "Enter") {
			scene.paused = !scene.paused;
			let battlebgm = scene.game.lib("audio").musics["battle"];
			let bossbgm = scene.game.lib("audio").musics["boss"];
			if (scene.paused) {
				scene.get("stage").scrolling = false;
				if (battlebgm.isPlaying()) battlebgm.pause();
				if (bossbgm.isPlaying()) bossbgm.pause();
				scene.game.lib("audio").sounds["pause"].play();
			} else {
				scene.get("stage").scrolling = true;
				if (battlebgm.isPaused()) battlebgm.resume();
				if (bossbgm.isPaused()) bossbgm.resume();
			}
		}
    }

	getFreeEnemy(scene: OGE2D.Scene, enemyName: string): OGE2D.Sprite {
		let enemy = scene.getFreeSprite(enemyName);
		if (enemy) {
			if (enemy.components.shooting && enemy.components.shooting.maxhp)
				enemy.components.shooting.hp = enemy.components.shooting.maxhp;
		}
		return enemy;
	}

	sendEnemyBullet1(scene: OGE2D.Scene, x: number, y: number, speed: number) {
		let motion: any = scene.systems["motion"];
		let display = scene.sprites["player1"].get("display").object;
		let angle = motion.getMotionAngle(x, y, display.x, display.y);
		let bullet = scene.getFreeSprite("enemy-bullet1");
		if (bullet != null) {
			bullet.components.display.object.x = x + 4 * (angle > 270 ? 1 : -1);
			bullet.components.display.object.y = y + 8;
			motion.moveOutside(bullet, speed, angle, -8, -8, 640 + 8, 480 + 8, () => bullet.active = false);
			bullet.active = true;
		}
	}

    sendEnemy1(scene: OGE2D.Scene, x: number, y: number, speed: number) {
		let motion: any = scene.systems["motion"];
		let jsonlib = scene.game.libraries["json"];
		let pathData = jsonlib.getJson("json/paths/deepv.json");
		if (pathData == undefined || pathData == null) return;
		let enemy = this.getFreeEnemy(scene, "enemy1");
		if (enemy) {
			enemy.components.display.animation.reset("down");
			enemy.components.display.animation.play();
			motion.applyPath(enemy, x, y, speed, pathData.nodes, (spr) => enemy.active = false, 
			(spr, index, nextx, nexty) => {
				if (index == 1) {
					spr.components.display.animation.reset("up");
					spr.components.display.animation.play(false);
				}
			});
            enemy.active = true;
			scene.timeout(500 + 500 * (Math.round(Math.random() * 100) % 4), ()=> {
				if (enemy.active == false) return; 
				let pos = enemy.get("display").object;
				this.sendEnemyBullet1(scene, pos.x, pos.y + 16, Math.round(Math.abs(speed) + 1));
			});

		}
	}

	sendEnemy2(scene: OGE2D.Scene, x: number, y: number, speed: number) {
		let motion: any = scene.sys("motion");
		let jsonlib = scene.game.lib("json");
		let pathData = jsonlib.getJson("json/paths/circle.json");
		if (pathData == undefined || pathData == null) return;
		let enemy = this.getFreeEnemy(scene, "enemy2");
		if (enemy) {
			motion.applyPath(enemy, x, y, speed, pathData.nodes, (spr) => enemy.active = false, 
			(spr, index, nextx, nexty) => {
				let display = spr.components.display.object;
				display.rotation = Math.atan2(nexty - display.y, nextx - display.x);
			});
			enemy.active = true;
		}
	}

	tracePlayer(scene: OGE2D.Scene, enemy: OGE2D.Sprite, speed: number) {
		let motion: any = scene.sys("motion");
		let player = scene.spr("player1");
		let current = enemy.get("display").object;
		let target = player.get("display").object;
		let x1 = current.x, y1 = current.y;
		let x2 = target.x, y2 = target.y;
		current.rotation = Math.atan2(y2 - y1, x2 - x1);
		if (!player.active || player.components.collision.enabled == false
			|| (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) <= 10000) {
			motion.moveOutside(enemy, speed, motion.getMotionAngle(x1, y1, x2, y2), 
								-32, -32, 640 + 32, 480 + 32, (spr) => spr.enabled = false);
		} else {
			motion.moveTo(enemy, x2, y2, speed);
			scene.timeout(500, ()=> {
				if (!enemy.active) return;
				this.tracePlayer(scene, enemy, speed); // keep tracing ...
			});
		}
	}
	
	sendEnemy3(scene: OGE2D.Scene, x: number, y: number, speed: number) {
		let enemy = this.getFreeEnemy(scene, "enemy3");
		if (enemy) {
			enemy.components.display.object.x = x;
			enemy.components.display.object.y = y;
			enemy.active = true;
			this.tracePlayer(scene, enemy, speed);
		}
	}

	sendEnemyBullet4(scene: OGE2D.Scene, enemy: OGE2D.Sprite, speed: number) {
		scene.timeout(2000, () => {
			if (!enemy.active) return;
			let stage: any = scene.sys("stage");
			let motion: any = scene.sys("motion");
			let display = enemy.get("stage");
			let posX = display.x, posY = display.y;
			let direction: string = enemy.get("display").animation.current;
			for (let i=0; i<3; i++) {
				scene.timeout(80 * (i + 1), () => {
					if (!enemy.active) return;
					let bullet = scene.getFreeSprite("enemy-bullet2");
					if (bullet) {
						bullet.active = true;
						if (direction == "left") {
							stage.setSpritePos(bullet, posX - 20, posY);
							motion.moveTo(bullet, -20, posY, speed, (spr) => spr.active = false);
						} else if (direction == "right") {
							stage.setSpritePos(bullet, posX + 20, posY);
							motion.moveTo(bullet, 640+20, posY, speed, (spr) => spr.active = false);
						} else { // should be "down"
							stage.setSpritePos(bullet, posX, posY + 20);
							motion.moveTo(bullet, posX, scene.get("stage").y + 480 + 240, speed, (spr) => spr.active = false);
						}
					}
				});
			}
			scene.timeout(2000, () => this.sendEnemyBullet4(scene, enemy, speed));
		});
	}

	sendEnemy4(scene: OGE2D.Scene, x: number, y: number, direction: string) {
		let enemy = this.getFreeEnemy(scene, "enemy4");
		let stage: any = scene.sys("stage");
		if (enemy) {
			enemy.components.shooting.hp = enemy.components.shooting.maxhp;
			enemy.components.display.animation.set(direction);
			stage.setSpritePos(enemy, scene.get("stage").x + x, scene.get("stage").y + y);
			scene.timeout(20000, () => enemy.active = false);
			enemy.active = true;
			this.sendEnemyBullet4(scene, enemy, 4);
		}
	}

	sendEnemyBullet5(scene: OGE2D.Scene, enemy: OGE2D.Sprite, speed: number) {
		let motion: any = scene.sys("motion");
		scene.timeout(1000, () => {
			if (!enemy.active) return;
			let display = enemy.get("display").object;
			let posX = display.x, posY = display.y;
			for (let i=0; i<5; i++) {
				let bullet = scene.getFreeSprite("enemy-bullet1");
				if (bullet) {
					bullet.active = true;
					bullet.components.display.object.x = posX;
					bullet.components.display.object.y = posY + 28;
					let angle = 360 - 30 * (i + 1);
					if (i == 0) angle = 360 - 45;
					else if (i == 1) angle = 360 - 65;
					else if (i == 3) angle = 360 - 115;
					else if (i == 4) angle = 360 - 135;
					motion.moveOutside(bullet, speed, angle, -8, -8, 640 + 8, 480 + 8, (spr) => spr.active = false);
				} else break;
			}
			scene.timeout(1000, () => this.sendEnemyBullet5(scene, enemy, speed));
		});
	}

	sendEnemy5(scene: OGE2D.Scene, posX: number, posY: number, speed: number) {
		let motion: any = scene.sys("motion");
		let jsonlib = scene.game.lib("json");
		let pathData = jsonlib.getJson("json/paths/hill.json");
		if (pathData == undefined || pathData == null) return;
		let enemy = this.getFreeEnemy(scene, "enemy5");
		if (enemy) {
			enemy.active = true;
			enemy.components.shooting.hp = enemy.components.shooting.maxhp;
			motion.applyPath(enemy, posX, posY, speed, pathData.nodes, (self1) => {
				if (!self1.active) return;
				motion.applyPath(self1, posX, posY, 0 - speed, pathData.nodes, (self2) => self2.active = false);
			});
			this.sendEnemyBullet5(scene, enemy, 4);
		}
	}

	sendEnemy6(scene: OGE2D.Scene) {
		let motion: any = scene.sys("motion");
		let player = scene.spr("player1");
		let target = player.get("display").object;
		let posX = target.x, posY = target.y;
		let targetX = posX + 32 - Math.round(Math.random() * 16) * (Math.random() > 0.5 ? 1 : -1);
		let enemy = this.getFreeEnemy(scene, "enemy6");
		if (enemy != null) {
			enemy.components.display.object.x = targetX;
			enemy.components.display.object.y = -20;
			motion.moveTo(enemy, targetX, 480 + 40, 2, (spr) => spr.active = false,
			(spr, index, total) => {
				let motion = spr.get("motion");
				if (index % 64 == 0 && motion.speed < 32) {
					motion.speed = motion.speed * 2;
				}
			});
			enemy.active = true;
		}
	}

	sendBombBullet(scene: OGE2D.Scene, bomb: OGE2D.Sprite, speed: number) {
		let motion: any = scene.sys("motion");
		let display = bomb.get("display").object;
		let posX = display.x, posY = display.y;
		for (let i=0; i<8; i++) {
			let bullet = this.getFreeEnemy(scene, "enemy-bullet1");
			if (bullet) {
				bullet.components.display.object.x = posX;
				bullet.components.display.object.y = posY;
				motion.moveOutside(bullet, speed, 360 - 45 * i, -8, -8, 640 + 8, 480 + 8, (spr) => spr.active = false);
				bullet.active = true;
			} else break;
		}
	}

	sendBossBomb(scene: OGE2D.Scene, boss: OGE2D.Sprite, speed: number) {
		if (!boss.active) return;
		let motion: any = scene.sys("motion");
		let tween: any = scene.systems["tween"];
		let display = scene.spr("player1").get("display").object;
		let posX = boss.get("display").object.x, posY = boss.get("display").object.y;
		let angle = motion.getMotionAngle(posX, posY + 20, display.x, display.y);
		let bomb = this.getFreeEnemy(scene, "boss-bomb1");
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
            bomb.components.event["onDeactivate"] = (spr) => this.sendBombBullet(scene, spr, 2);
			bomb.active = true;
		}
		scene.timeout(2000 + 1000 * (Math.round(Math.random() * 100) % 4), () => this.sendBossBomb(scene, boss, speed));
	}

	moveBoss(scene: OGE2D.Scene, boss: OGE2D.Sprite, speed: number) {
		if (!boss.active) return;
		let motion: any = scene.sys("motion");
		let jsonlib = scene.game.lib("json");
		let pathData = jsonlib.getJson("json/paths/boss.json");
		if (pathData == null) return;
		let display = boss.get("display").object;
		motion.applyPath(boss, display.x, display.y, speed, pathData.nodes, (spr) => this.moveBoss(scene, spr, 0 - speed));
	}
	
	sendBoss1(scene: OGE2D.Scene, posX: number, posY: number, speed: number) {
		let motion: any = scene.sys("motion");
		let enemy = this.getFreeEnemy(scene, "boss1");
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
					this.moveBoss(scene, spr, speed);
					if (spr.active) this.sendBossBomb(scene, spr, 1);
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
