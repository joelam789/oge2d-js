
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
            "Old Man:",
            "",
            "I am looking for my grandson.",
            "He is clever, but also a naughty kid.",
            "If you see him please tell him to go home."
        ]);

        yield sprite.plot.wait();
    
        dialog1.close();

        console.log("plot ended - " + sprite.name);

        sprite.active = false;
    }

}
