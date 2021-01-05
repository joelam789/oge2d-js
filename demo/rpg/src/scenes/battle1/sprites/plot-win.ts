
export class PlotWin {

    * onUpdate(sprite) {

        let scene = sprite.scene;
        let tween = scene.sys("tween");
        let motion = scene.sys("motion");
        let profile = scene.game.get("rpg");

        console.log("plot started - " + sprite.name);

        let fighter = scene.spr("fighter1");
        let fighterDisplay = fighter.get("display").object;
        let fighterAnimation = fighter.get("display").animation;

        fighterAnimation.reset("win", true);
        fighterAnimation.onComplete = null;
        fighterAnimation.play(true);

        let bgm = scene.game.lib("audio").musics["rpg-battle"];
        bgm.stop();

        scene.game.lib("audio").sounds["rpg-win2"].play();

        yield sprite.plot.wait(4500);

        console.log("plot ended - " + sprite.name);

        sprite.active = false;

        let transition: any = sprite.scene.systems["transition"];
        if (transition.isWorking()) return;
        transition.callScene("map1");

    }

}
