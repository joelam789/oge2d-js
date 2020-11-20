export class SpriteEnemyF {

	go(scene: OGE2D.Scene) {
		let script = scene.game.lib("script");
		let motion: any = scene.sys("motion");
		let player = scene.spr("player1");
		let target = player.get("display").object;
		let posX = target.x, posY = target.y;
		let targetX = posX + Math.round(Math.random() * 32) * (Math.random() > 0.5 ? 1 : -1);
		let enemy = script.call(this, "getFreeEnemy", scene, "enemy-f1");
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
	
}
