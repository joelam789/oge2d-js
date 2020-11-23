
export class Plot3 {

    * onUpdate(sprite) {

        let scene = sprite.scene;
        let stage = scene.sys("stage");
        let tween = scene.sys("tween");
        let motion = scene.sys("motion");
        let profile = scene.game.get("rpg");

        console.log("plot started - " + sprite.name);

        let dialog1 = scene.spr("dialog-box1").code;

        dialog1.show(sprite, [
            "Kid:",
            "",
            "Here is my secret garden.",
            "I feel peaceful and calm everytime when I get here.",
        ]);

        yield sprite.plot.wait();

        dialog1.show(sprite, [
            "Kid:",
            "",
            "You look not a bad guy.",
            "Could you please come and play with me?",
        ]);

        yield sprite.plot.wait();
    
        dialog1.close();

        console.log("plot ended - " + sprite.name);

        sprite.active = false;
    }

}
