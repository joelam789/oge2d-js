export class SpriteEnemy {
	getFreeEnemy(scene: OGE2D.Scene, enemyName: string): OGE2D.Sprite {
		let enemy = scene.getFreeSprite(enemyName);
		if (enemy) {
			if (enemy.components.shooting && enemy.components.shooting.maxhp)
				enemy.components.shooting.hp = enemy.components.shooting.maxhp;
		}
		return enemy;
	}
}
