export class SceneStage1SpritePlot1 {

    * onUpdate(sprite) {

        let game = sprite.game;
        let plot = sprite.plot;
        let scene = sprite.scene;
        let battle = scene.script;

        let tween = scene.systems["tween"];

        let battlebgm = game.libraries["audio"].musics["battle"];
        battlebgm.volume = 1.0;
        battlebgm.play();

        scene.sprites["reborn1"].active = true;

        yield plot.wait(3000);
        console.log("plot - start to send enemies ... ");

        battle.sendEnemy1(scene, 300, 0, 4);
        yield plot.wait(300);
        battle.sendEnemy1(scene, 230, 0, 4);
        yield plot.wait(300);
        battle.sendEnemy1(scene, 160, 0, 4);
        
        yield plot.wait(2000);

        battle.sendEnemy1(scene, 120, 0, -4);
        yield plot.wait(300);
        battle.sendEnemy1(scene, 50, 0, -4);
        yield plot.wait(300);
        battle.sendEnemy1(scene, -20, 0, -4);

        yield plot.wait(2500);

        battle.sendEnemy2(scene, 0, -32, 4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, -32, 4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, -32, 4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, -32, 4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, -32, 4);
        
        yield plot.wait(3000);
        
        battle.sendEnemy3(scene, 600, -20, 2);
        yield plot.wait(300);
        battle.sendEnemy3(scene, 500, -20, 2);
        yield plot.wait(300);
        battle.sendEnemy3(scene, 400, -20, 2);
        yield plot.wait(300);
        battle.sendEnemy3(scene, 300, 500, 2);
        yield plot.wait(300);
        battle.sendEnemy3(scene, 200, 500, 2);
        yield plot.wait(300);
        battle.sendEnemy3(scene, 100, 500, 2);
        
        yield plot.wait(3000);
	
        battle.sendEnemy3(scene, 100, -20, 2);
        yield plot.wait(300);
        battle.sendEnemy3(scene, 200, -20, 2);
        yield plot.wait(300);
        battle.sendEnemy3(scene, 300, -20, 2);
        yield plot.wait(300);
        battle.sendEnemy3(scene, 400, 500, 2);
        yield plot.wait(300);
        battle.sendEnemy3(scene, 500, 500, 2);
        yield plot.wait(300);
        battle.sendEnemy3(scene, 600, 500, 2);
        
        yield plot.wait(3000);
        
        battle.sendEnemy2(scene, 0, 64, -4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, 64, -4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, 64, -4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, 64, -4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, 64, -4);
        
        yield plot.wait(2500);

        battle.sendEnemy1(scene, 120, 0, -4);
        yield plot.wait(300);
        battle.sendEnemy1(scene, 50, 0, -4);
        yield plot.wait(300);
        battle.sendEnemy1(scene, -20, 0, -4);
        
        yield plot.wait(2000);
        
        battle.sendEnemy1(scene, 300, 0, 4);
        yield plot.wait(300);
        battle.sendEnemy1(scene, 230, 0, 4);
        yield plot.wait(300);
        battle.sendEnemy1(scene, 160, 0, 4);
        
        yield plot.wait(2000);

        battle.sendEnemy4(scene, 200, -100, "right");
        battle.sendEnemy4(scene, 400, -200, "left");
        battle.sendEnemy4(scene, 200, -300, "right");
        battle.sendEnemy4(scene, 400, -400, "left");
        battle.sendEnemy4(scene, 100, -500, "down");
        battle.sendEnemy4(scene, 500, -500, "down");
        
        yield plot.wait(2000);

        battle.sendEnemy5(scene, 0, 0, 1);
        yield plot.wait(12000);
        battle.sendEnemy5(scene, 0, 0, -1);
        
        yield plot.wait(12000);

        battle.sendEnemy6(scene);
        yield plot.wait(2000);
        battle.sendEnemy6(scene);
        yield plot.wait(2000);
        battle.sendEnemy6(scene);
        yield plot.wait(2000);
        battle.sendEnemy6(scene);
        yield plot.wait(2000);
        battle.sendEnemy6(scene);
        yield plot.wait(2000);
        battle.sendEnemy6(scene);

        yield plot.wait(500);
        
        battle.sendEnemy2(scene, 0, 64, 4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, 64, 4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, 64, 4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, 64, 4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, 64, 4);
        
        yield plot.wait(500);
        
        battle.sendEnemy6(scene);
        yield plot.wait(2000);
        battle.sendEnemy6(scene);
        yield plot.wait(2000);
        battle.sendEnemy6(scene);
        yield plot.wait(2000);
        battle.sendEnemy6(scene);
        
        yield plot.wait(500);
        
        battle.sendEnemy2(scene, 0, -32, -4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, -32, -4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, -32, -4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, -32, -4);
        yield plot.wait(300);
        battle.sendEnemy2(scene, 0, -32, -4);
        
        yield plot.wait(500);
        
        battle.sendEnemy6(scene);
        yield plot.wait(2000);
        battle.sendEnemy6(scene);
        yield plot.wait(2000);
        battle.sendEnemy6(scene);
        yield plot.wait(2000);
        battle.sendEnemy6(scene);
        yield plot.wait(2000);
        battle.sendEnemy6(scene);
        
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

        battle.sendBoss1(scene, 320, -128, 1);
        battle.sendBoss1(scene, -128, 192, 1);
        battle.sendBoss1(scene, 640+128, 192, 1);

        sprite.active = false;

    }

}
