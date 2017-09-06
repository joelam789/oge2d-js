export class SpriteEnemyE {

	fire(scene: OGE2D.Scene, enemy: OGE2D.Sprite, speed: number) {
		let motion: any = scene.sys("motion");
		scene.timeout(1000, () => {
			if (!enemy.active) return;
			let display = enemy.get("display").object;
			let posX = display.x, posY = display.y;
			for (let i=0; i<5; i++) {
				let bullet = scene.getFreeSprite("enemy-bullet-a1");
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
			scene.timeout(1000, () => this.fire(scene, enemy, speed));
		});
	}

	go(scene: OGE2D.Scene, posX: number, posY: number, speed: number) {
		let motion: any = scene.sys("motion");
		let script = scene.game.lib("script");
		let jsonlib = scene.game.lib("json");
		let pathData = jsonlib.getJson("json/paths/hill.json");
		if (pathData == undefined || pathData == null) return;
		let enemy = script.call(this, "getFreeEnemy", [scene, "enemy-e1"]);
		if (enemy) {
			enemy.active = true;
			enemy.components.shooting.hp = enemy.components.shooting.maxhp;
			motion.applyPath(enemy, posX, posY, speed, pathData.nodes, (self1) => {
				if (!self1.active) return;
				motion.applyPath(self1, posX, posY, 0 - speed, pathData.nodes, (self2) => self2.active = false);
			});
			this.fire(scene, enemy, 4);
		}
	}
	
}
