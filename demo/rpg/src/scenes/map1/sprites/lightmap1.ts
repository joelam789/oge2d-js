
export class SpriteLightMap1 {

    static filter: any;

    static readonly shaderFrag4Mouse = `
        precision highp float;

        varying vec2 vTextureCoord;

        uniform vec2 mouse;
        uniform vec4 inputSize;
        uniform vec4 outputFrame;
        uniform sampler2D uSampler;

        void main() {
            vec4 color = texture2D(uSampler, vTextureCoord);
            vec2 screenPos = vTextureCoord * inputSize.xy + outputFrame.xy;
            float dist = distance(mouse, screenPos);
            float rv = 64.0;
            if (dist <= rv) {
                float av = color.a - (rv - dist) / rv;
                if (av > 1.0) av = 1.0;
                if (av < 0.0) av = 0.0;
                gl_FragColor = vec4(color.r, color.g, color.b, av);
            } else {
                gl_FragColor = color;
            }
        }
    `;

    static readonly shaderFrag4Sprite = `
        precision highp float;

        varying vec2 vTextureCoord;

        uniform vec2 stagePos;
        uniform vec2 spritePos;
        uniform vec4 inputSize;
        uniform vec4 outputFrame;
        uniform sampler2D uSampler;

        void main() {
            vec4 color = texture2D(uSampler, vTextureCoord);
            vec2 pointPos = vTextureCoord * inputSize.xy + outputFrame.xy + stagePos;
            float dist = distance(pointPos, spritePos);
            float rv = 64.0;
            if (dist <= rv) {
                float av = color.a - (rv - dist) / rv;
                if (av > 1.0) av = 1.0;
                if (av < 0.0) av = 0.0;
                gl_FragColor = vec4(color.r, color.g, color.b, av);
            } else {
                gl_FragColor = color;
            }
        }
    `;

    onSceneActivate(sprite) {
        //sprite.script.base.onSceneActivate(sprite);
        //console.log("onSceneActivate", sprite, sprite.get("display").object, sprite.scene.get("stage").x);
        let filters = sprite.get("display").object.filters;
        if (!filters || filters.length <= 0) {
            //SpriteLightMap1.filter = new PIXI.Filter(null, SpriteLightMap1.shaderFrag4Mouse, {
            //    mouse: new PIXI.Point(),
            //});
            SpriteLightMap1.filter = new PIXI.Filter(null, SpriteLightMap1.shaderFrag4Sprite, {
                stagePos: new PIXI.Point(), spritePos: new PIXI.Point(),
            });
            sprite.get("display").object.filters = [SpriteLightMap1.filter];
        }
    }

    onUpdate(sprite) {
        //let interaction = sprite.scene.sys("mouse")?.getInteraction();
        //if (interaction) SpriteLightMap1.filter.uniforms.mouse.copyFrom(interaction.mouse.global);
        let rpg = sprite.scene.get("rpg");
        let spr = rpg ? sprite.scene.spr(rpg.player) : null;
        if (spr) {
            let pos1 = new PIXI.Point(sprite.scene.get("stage").x, sprite.scene.get("stage").y);
            let pos2 = new PIXI.Point(spr.get("stage").x, spr.get("stage").y);
            SpriteLightMap1.filter.uniforms.stagePos.copyFrom(pos1);
            SpriteLightMap1.filter.uniforms.spritePos.copyFrom(pos2);
        }
    }

}
