
export class Plot2 {

    * onUpdate(sprite) {

        let scene = sprite.scene;
        let stage = scene.sys("stage");
        let tween = scene.sys("tween");
        let motion = scene.sys("motion");
        let profile = scene.game.get("rpg");

        console.log("plot started - " + sprite.name);

        //yield sprite.plot.wait(500);

        let dialog1 = scene.spr("dialog-box1").code;
        dialog1.open(sprite, "God", [
            "Welcome! My dear boy!",
            "You will be the next new hero soon.",
            "So please go and make yourself stronger.",
        ]);

        yield sprite.plot.wait();

        
        dialog1.open(sprite, "神之声", [
            "孩子，你是被命运选中的英雄 ——"
        ], 50, true);
        yield sprite.plot.wait();
        dialog1.open(sprite, "神之声", [
            " 天选之子！ "
        ], 2, true, "#FF0000", "bold");
        yield sprite.plot.wait();
        dialog1.open(sprite, "神之声", [
            "",
            "没什么好害怕，神的意志和光辉将会与你同在。",
            "只要无时无刻谨记神的教诲，神的力量会一直保护你。"
        ]);
        
        yield sprite.plot.wait();
        
        dialog1.open(sprite, "評価項目", [
            "舞台となる惑星は、地球ではありません。",
            "古風な雰囲気のある分かりやすい操作の見下ろし型アクション。",
            "世界観が作りこまれているのに、肝心のメインストーリーがお粗末です。",
        ]);

        yield sprite.plot.wait();

        dialog1.close();

        console.log("plot ended - " + sprite.name);

        sprite.active = false;
    }

}
