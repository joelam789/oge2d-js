
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
        let answer1 = scene.spr("answer-box1").code;

        if (state.times == 0) {

            dialog1.show(sprite, [
                "Man:",
                "",
                "I am a farmer living in the forest.",
                "Do you know what is Forest Farming?",
                "That is what I am doing here to make a living."
            ]);

            yield sprite.plot.wait();

            dialog1.close();

            state.times += 1;

        } else {

            dialog1.show(sprite, [
                "Man:",
                "",
                "Do you like farmers?"
            ], 50 , true);
            yield sprite.plot.wait();
            answer1.show(sprite, [
                "Yes.",
                "No.",
                "I won't tell you."
            ]);
            yield sprite.plot.wait();

            let responseWords = [
                "I am glad to hear that.",
                "You should get to know more about them.",
                "Okay..."
            ];
            dialog1.show(sprite, [
                "Man:",
                "",
                responseWords[answer1.getChoice() - 1]
            ]);
            yield sprite.plot.wait();
    
            dialog1.close();

        }

        console.log("plot ended - " + sprite.name);

        sprite.active = false;
    }

}
