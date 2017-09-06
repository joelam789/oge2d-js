export class SpriteEnemyC {

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

	go(scene: OGE2D.Scene, x: number, y: number, speed: number) {
		let script = scene.game.lib("script");
		let enemy = script.call(this, "getFreeEnemy", [scene, "enemy-c1"]);
		if (enemy) {
			enemy.components.display.object.x = x;
			enemy.components.display.object.y = y;
			enemy.active = true;
			this.tracePlayer(scene, enemy, speed);
		}
	}
	
}
