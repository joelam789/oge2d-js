export class SceneStage1SpritePlot1 {

	* onUpdate(sprite) {

		let game = sprite.game;
		let plot = sprite.plot;
		let scene = sprite.scene;
		let battle = scene.code;

		let tween = scene.systems["tween"];

		let battlebgm = game.libraries["audio"].musics["battle"];
		battlebgm.volume = 1.0;
		battlebgm.play();

		scene.sprites["reborn1"].active = true;

		yield plot.wait(3000);
		console.log("plot - start to send enemies ... ");

		let enemy1 = scene.spr("enemy-a1").code;

		enemy1.go(scene, 300, 0, 4);
		yield plot.wait(300);
		enemy1.go(scene, 230, 0, 4);
		yield plot.wait(300);
		enemy1.go(scene, 160, 0, 4);

		yield plot.wait(2000);

		enemy1.go(scene, 120, 0, -4);
		yield plot.wait(300);
		enemy1.go(scene, 50, 0, -4);
		yield plot.wait(300);
		enemy1.go(scene, -20, 0, -4);

		yield plot.wait(2500);

		let enemy2 = scene.spr("enemy-b1").code;

		enemy2.go(scene, 0, -32, 4);
		yield plot.wait(300);
		enemy2.go(scene, 0, -32, 4);
		yield plot.wait(300);
		enemy2.go(scene, 0, -32, 4);
		yield plot.wait(300);
		enemy2.go(scene, 0, -32, 4);
		yield plot.wait(300);
		enemy2.go(scene, 0, -32, 4);

		yield plot.wait(3000);

		let enemy3 = scene.spr("enemy-c1").code;

		enemy3.go(scene, 600, -20, 2);
		yield plot.wait(300);
		enemy3.go(scene, 500, -20, 2);
		yield plot.wait(300);
		enemy3.go(scene, 400, -20, 2);
		yield plot.wait(300);
		enemy3.go(scene, 300, 500, 2);
		yield plot.wait(300);
		enemy3.go(scene, 200, 500, 2);
		yield plot.wait(300);
		enemy3.go(scene, 100, 500, 2);

		yield plot.wait(3000);

		enemy3.go(scene, 100, -20, 2);
		yield plot.wait(300);
		enemy3.go(scene, 200, -20, 2);
		yield plot.wait(300);
		enemy3.go(scene, 300, -20, 2);
		yield plot.wait(300);
		enemy3.go(scene, 400, 500, 2);
		yield plot.wait(300);
		enemy3.go(scene, 500, 500, 2);
		yield plot.wait(300);
		enemy3.go(scene, 600, 500, 2);

		yield plot.wait(3000);

		enemy2.go(scene, 0, 64, -4);
		yield plot.wait(300);
		enemy2.go(scene, 0, 64, -4);
		yield plot.wait(300);
		enemy2.go(scene, 0, 64, -4);
		yield plot.wait(300);
		enemy2.go(scene, 0, 64, -4);
		yield plot.wait(300);
		enemy2.go(scene, 0, 64, -4);

		yield plot.wait(2500);

		enemy1.go(scene, 120, 0, -4);
		yield plot.wait(300);
		enemy1.go(scene, 50, 0, -4);
		yield plot.wait(300);
		enemy1.go(scene, -20, 0, -4);

		yield plot.wait(2000);

		enemy1.go(scene, 300, 0, 4);
		yield plot.wait(300);
		enemy1.go(scene, 230, 0, 4);
		yield plot.wait(300);
		enemy1.go(scene, 160, 0, 4);

		yield plot.wait(2000);

		let enemy4 = scene.spr("enemy-d1").code;

		enemy4.go(scene, 200, -100, "right");
		enemy4.go(scene, 400, -200, "left");
		enemy4.go(scene, 200, -300, "right");
		enemy4.go(scene, 400, -400, "left");
		enemy4.go(scene, 100, -500, "down");
		enemy4.go(scene, 500, -500, "down");

		yield plot.wait(2000);

		let enemy5 = scene.spr("enemy-e1").code;

		enemy5.go(scene, 0, 0, 1);
		yield plot.wait(12000);
		enemy5.go(scene, 0, 0, -1);

		yield plot.wait(12000);

		let enemy6 = scene.spr("enemy-f1").code;

		enemy6.go(scene);
		yield plot.wait(2000);
		enemy6.go(scene);
		yield plot.wait(2000);
		enemy6.go(scene);
		yield plot.wait(2000);
		enemy6.go(scene);
		yield plot.wait(2000);
		enemy6.go(scene);
		yield plot.wait(2000);
		enemy6.go(scene);

		yield plot.wait(500);

		enemy2.go(scene, 0, 64, 4);
		yield plot.wait(300);
		enemy2.go(scene, 0, 64, 4);
		yield plot.wait(300);
		enemy2.go(scene, 0, 64, 4);
		yield plot.wait(300);
		enemy2.go(scene, 0, 64, 4);
		yield plot.wait(300);
		enemy2.go(scene, 0, 64, 4);

		yield plot.wait(500);

		enemy6.go(scene);
		yield plot.wait(2000);
		enemy6.go(scene);
		yield plot.wait(2000);
		enemy6.go(scene);
		yield plot.wait(2000);
		enemy6.go(scene);

		yield plot.wait(500);

		enemy2.go(scene, 0, -32, -4);
		yield plot.wait(300);
		enemy2.go(scene, 0, -32, -4);
		yield plot.wait(300);
		enemy2.go(scene, 0, -32, -4);
		yield plot.wait(300);
		enemy2.go(scene, 0, -32, -4);
		yield plot.wait(300);
		enemy2.go(scene, 0, -32, -4);

		yield plot.wait(500);

		enemy6.go(scene);
		yield plot.wait(2000);
		enemy6.go(scene);
		yield plot.wait(2000);
		enemy6.go(scene);
		yield plot.wait(2000);
		enemy6.go(scene);
		yield plot.wait(2000);
		enemy6.go(scene);

		yield plot.wait(2000);

		tween.get(battlebgm).to({volume: 0}, 2000).call(() => {
			battlebgm.stop();
			plot.signal("bgm-fadeout");
		});

		yield plot.wait("bgm-fadeout");

		let expectedY = 1024 + 309;
		let currentY = scene.get("stage").y;
		while (currentY < expectedY) expectedY -= 32;
		scene.sys("stage").wait(0, expectedY, () => plot.signal("fast-scrolling"));
		yield plot.wait("fast-scrolling");

		scene.sys("stage").loop(0, 5653, 0, expectedY);
		scene.sys("stage").scroll(0, -4); // speed up

		game.libraries["audio"].musics["boss"].volume = 1;
		game.libraries["audio"].musics["boss"].play();

		yield plot.wait(500);

		let boss1 = scene.spr("boss-a1").code;

		boss1.go(scene, 320, -128, 1);
		boss1.go(scene, -128, 192, 1);
		boss1.go(scene, 640+128, 192, 1);

		sprite.active = false;

	}

}
