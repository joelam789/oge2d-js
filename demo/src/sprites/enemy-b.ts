export class SpriteEnemyB {

	go(scene: OGE2D.Scene, x: number, y: number, speed: number) {
		let motion: any = scene.sys("motion");
		let script = scene.game.lib("script");
		let jsonlib = scene.game.lib("json");
		let pathData = jsonlib.getJson("json/paths/circle.json");
		if (pathData == undefined || pathData == null) return;
		let enemy = script.call(this, "getFreeEnemy", [scene, "enemy-b1"]);
		if (enemy) {
			motion.applyPath(enemy, x, y, speed, pathData.nodes, (spr) => enemy.active = false, 
			(spr, index, nextx, nexty) => {
				let display = spr.components.display.object;
				display.rotation = Math.atan2(nexty - display.y, nextx - display.x);
			});
			enemy.active = true;
		}
	}
	
}
