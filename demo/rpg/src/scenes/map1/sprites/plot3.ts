
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

            dialog1.open(sprite, "Man", [
                "I am a farmer living in the forest.",
                "Do you know what is Forest Farming?",
                "That is what I am doing here to make a living."
            ]);

            yield sprite.plot.wait();

            dialog1.close();

            state.times += 1;

        } else {

            dialog1.open(sprite, "Man", [
                "Do you like farmers?"
            ], 50 , true);
            yield sprite.plot.wait();
            dialog1.list(sprite, [
                "Yes.",
                "No.",
                "I won't tell you."
            ]);
            yield sprite.plot.wait();

            dialog1.clearHistory();

            let responseWords = [
                "I am glad to hear that.",
                "You should get to know more about them.",
                "Okay..."
            ];
            dialog1.open(sprite, "Man", [
                responseWords[dialog1.getChoice() - 1]
            ]);
            yield sprite.plot.wait();

            if (dialog1.getChoice() != 2) {
                dialog1.close();
            } else {
                dialog1.close(false);
                let transition: any = sprite.scene.systems["rpg-transition"];
                if (!transition.isWorking()) {
                    let bgm = scene.game.lib("audio").musics[scene.get("rpg").bgm];
                    let nextbgm = scene.game.lib("audio").musics["rpg-battle"];
                    bgm.stop();
                    nextbgm.play();
                    scene.game.get("rpg").lastmap = scene.name;
                    transition.callScene("battle1", (nextScene) => {
                        //dialog1.close(false);
                        nextScene.reset();
                    }, 500, 1000);
                } else {
                    dialog1.close();
                }
                
            }
    
        }

        console.log("plot ended - " + sprite.name);

        sprite.active = false;
    }

}
