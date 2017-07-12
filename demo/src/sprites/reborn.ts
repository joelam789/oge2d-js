export class SpriteReborn {

    * onUpdate(sprite) {

        console.log("plot started - " + sprite.name);
        
        let scene = sprite.scene;
        let tween = scene.systems["tween"];
        let motion = scene.systems["motion"];
        let profile = scene.game.components.shooting;
        let player = scene.sprites["player1"];

        if (profile.lives <= 0) {

			profile.progress = -1000;
			//plot.enable(scene.spr("gameover"));
            console.log("jump to gameover...");
            scene.spr("game-over1").active = true;

		} else {
			
			profile.lives = profile.lives - 1;
			profile.bombs = 2;
			profile.level = 1;
			profile.hp = 100;
			profile.controllable = false;
			
            player.components.display.object.x = 320;
            player.components.display.object.y = 480 + 150;
            player.components.display.object.alpha = 1.0;
            player.components.display.object.tint = 0xffffff;
            player.components.collision.enabled = false;
            player.active = true;

            tween.blink(player.components.display.object, 3000, 
                        () => player.components.collision.enabled = true);

            motion.moveTo(player, 320, 350, 10, () => profile.controllable = true);
			
		}

        sprite.active = false;
    }

}
