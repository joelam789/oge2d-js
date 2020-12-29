
export class PlotFight {

    * onUpdate(sprite) {

        let scene = sprite.scene;
        let tween = scene.sys("tween");
        let motion = scene.sys("motion");
        let profile = scene.game.get("rpg");

        console.log("plot started - " + sprite.name);

        yield sprite.plot.wait(2000);
        

        console.log("plot ended - " + sprite.name);

        sprite.active = false;
    }

}
