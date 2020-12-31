
export class PlotFight {

    * onUpdate(sprite) {

        let scene = sprite.scene;
        let tween = scene.sys("tween");
        let motion = scene.sys("motion");
        let profile = scene.game.get("rpg");

        console.log("plot started - " + sprite.name);

        //yield sprite.plot.wait(2000);

        let fighter = scene.spr("fighter1");
        let fighterDisplay = fighter.get("display").object;
        let fighterAnimation = fighter.get("display").animation;

        let enemy = scene.spr("enemy1");
        let enemyDisplay = enemy.get("display").object;
        //let enemyAnimation = enemy.get("display").animation;
        let enemyInfo = enemy.get("rpg");

        let effect = scene.spr("effect1");
        let effectDisplay = effect.get("display").object;
        let effectAnimation = effect.get("display").animation;

        let hurt = scene.spr("num1");
        let hurtDisplay = hurt.get("display").object;

        motion.moveTo(fighter, fighterDisplay.x - 50, fighterDisplay.y, 10, 
                        () => sprite.plot.signal());

        yield sprite.plot.wait();

        fighterAnimation.reset("fight", true);
        fighterAnimation.onComplete = () => sprite.plot.signal("end1");
        fighterAnimation.play(false);

        effect.active = true;
        effectDisplay.x = enemyDisplay.x;
        effectDisplay.y = enemyDisplay.y;
        effectDisplay.loop = false;
        effectDisplay.animationSpeed = 0.2;

        effectAnimation.reset("style2", true);
        effectAnimation.onComplete = () => {
            sprite.plot.signal("end2");
            effectAnimation.reset();
            effectAnimation.onComplete = null;
            effect.active = false;
        };
        effectAnimation.play(false);

        enemyDisplay.tint = 0xff7777;

        yield sprite.plot.wait(["end1", "end2"]);

        let damage = Math.floor(Math.random() * 150) + 100;
        enemyInfo.hp -= damage;

        hurt.active = true;
        hurtDisplay.x = enemyDisplay.x;
        hurtDisplay.y = enemyDisplay.y - 80;
        hurtDisplay.alpha = 0.8;
        hurtDisplay.text = "-" + damage.toString();
        hurtDisplay.style.fontSize = 28;
        hurtDisplay.style.fill = "#ff0000";

        tween.get(hurtDisplay)
                .to({y: enemyDisplay.y - 90, alpha: 1.0}, 500)
                .to({y: enemyDisplay.y - 100, alpha: 0.0}, 500)
                .call(() => {
                    hurtDisplay.active = false;
		});

        //enemyDisplay.tint = 0xff7777;
        motion.moveTo(enemy, enemyDisplay.x - 20, enemyDisplay.y, 5, () => {
            motion.moveTo(enemy, enemyDisplay.x + 20, enemyDisplay.y, 5, 
                () => {
                    enemyDisplay.tint = 0xffffff;
                    sprite.plot.signal("end1")
                });
        });

        fighterAnimation.reset("stand", true);
        fighterAnimation.onComplete = null;
        fighterAnimation.play(true);

        yield sprite.plot.wait("end1");

        if (enemyInfo.hp <= 0) {
            tween.blink(enemyDisplay, 1000, 10, () => {
                enemy.active = false;
                sprite.plot.signal("end1");
            });
        }

        motion.moveTo(fighter, fighterDisplay.x + 50, fighterDisplay.y, 10, 
            () => sprite.plot.signal("end2"));
        
        if (enemyInfo.hp <= 0) {
            yield sprite.plot.wait(["end1", "end2"]);
            //yield sprite.plot.wait(1000);
        } else {
            yield sprite.plot.wait("end2");
            yield sprite.plot.wait(1000);
        }

        console.log("plot ended - " + sprite.name);

        sprite.active = false;

        if (enemyInfo.hp <= 0) scene.spr("plot-win").active = true;
        else scene.spr("plot-enemy-fight").active = true;
        
    }

}
