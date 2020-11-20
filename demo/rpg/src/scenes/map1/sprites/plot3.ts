
export class Plot3 {

    * onUpdate(sprite) {

        let scene = sprite.scene;
        let stage = scene.sys("stage");
        let tween = scene.sys("tween");
        let motion = scene.sys("motion");
        let profile = scene.game.get("rpg");

        console.log("plot started - " + sprite.name);

        let state = sprite.get("rpg");

        let dialog1 = scene.spr("dialog-box1").code;

        if (state.times == 0) {

            dialog1.show(sprite, [
                "Old Man:",
                "",
                "I am a farmer living in the forest.",
                "Do you know what is Forest Farming?",
                "That is what I am doing here to make a living."
            ]);

            yield sprite.plot.wait();

            dialog1.close(sprite);

            state.times += 1;

        } else {

            dialog1.show(sprite, [
                "Old Man:",
                "",
                "Do you like farmers?"
            ]);
    
            yield sprite.plot.wait();
    
            dialog1.close(sprite);

        }

        console.log("plot ended - " + sprite.name);

        sprite.active = false;
    }

}
