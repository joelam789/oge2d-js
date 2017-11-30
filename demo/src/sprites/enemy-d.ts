export class SpriteEnemyD {

	fire(scene: OGE2D.Scene, enemy: OGE2D.Sprite, speed: number) {
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
					let bullet = scene.getFreeSprite("enemy-bullet-b1");
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
			scene.timeout(2000, () => this.fire(scene, enemy, speed));
		});
	}

	go(scene: OGE2D.Scene, x: number, y: number, direction: string) {
		let script = scene.game.lib("script");
		let enemy = script.call(this, "getFreeEnemy", scene, "enemy-d1");
		let stage: any = scene.sys("stage");
		if (enemy) {
			enemy.components.shooting.hp = enemy.components.shooting.maxhp;
			enemy.components.display.animation.set(direction);
			stage.setSpritePos(enemy, scene.get("stage").x + x, scene.get("stage").y + y);
			scene.timeout(20000, () => enemy.active = false);
			enemy.active = true;
			this.fire(scene, enemy, 4);
		}
	}
	
}
