export class SpriteEnemyA {
	fire(scene: OGE2D.Scene, x: number, y: number, speed: number) {
		let motion: any = scene.systems["motion"];
		let display = scene.sprites["player1"].get("display").object;
		let angle = motion.getMotionAngle(x, y, display.x, display.y);
		let bullet = scene.getFreeSprite("enemy-bullet-a1");
		if (bullet != null) {
			bullet.components.display.object.x = x + 4 * (angle > 270 ? 1 : -1);
			bullet.components.display.object.y = y + 8;
			motion.moveOutside(bullet, speed, angle, -8, -8, 640 + 8, 480 + 8, () => bullet.active = false);
			bullet.active = true;
		}
	}

	go(scene: OGE2D.Scene, x: number, y: number, speed: number) {
		let motion: any = scene.systems["motion"];
		let script = scene.game.libraries["script"];
		let jsonlib = scene.game.libraries["json"];
		let pathData = jsonlib.getJson("json/paths/deepv.json");
		if (pathData == undefined || pathData == null) return;
		let enemy = script.call(this, "getFreeEnemy", scene, "enemy-a1");
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
				this.fire(scene, pos.x, pos.y + 16, Math.round(Math.abs(speed) + 1));
			});
		}
	}
	
}
