
export class PlotEnemyFight {

    * onUpdate(sprite) {

        let scene = sprite.scene;
        let tween = scene.sys("tween");
        let motion = scene.sys("motion");
        let profile = scene.game.get("rpg");

        console.log("plot started - " + sprite.name);

        //yield sprite.plot.wait(100);

        let menu1 = scene.spr("list-box1").code;

        menu1.show(sprite, [
            "DragonA",
            "DragonB",
        ]);

        yield sprite.plot.wait();

        console.log("Selected - " + menu1.selected);

        console.log("plot ended - " + sprite.name);

        sprite.active = false;
    }

}
