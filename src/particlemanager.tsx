import { colour3, lerp, vector2 } from "./basics.ts";
import { colourpossibility, SafeColour } from "./tilemodels.ts";

export class curve<T>{
    start:T;
    end:T;
    curve:(x:number)=>number;

    constructor(start:T,end?:T,curve?:(x:number)=>number){
        this.start = start;
        this.end = end!==undefined?end:start;
        this.curve = curve||((x:number)=>x);
    }
}

export class baseParticle{
    position=vector2.zero;
    velocity=vector2.zero;
    acceleration=vector2.zero;
    rotation=0;
    angularvelocity=0;

    scale=new curve(vector2.one);

    opacity=new curve(1);

    lifespan=0;
    birth:number;

    constructor(){
        this.birth = new Date().getTime();
    }
}

export class imageParticle extends baseParticle{
    image:string;

    constructor(image:string){
        super()
        this.image = image
    }
}

export class textParticle extends baseParticle{
    text:string;
    style:colourpossibility|colour3;
    letterSpacing=new curve(0);

    constructor(text:string,style:colourpossibility|colour3){
        super()
        this.text = text
        this.style = style
    }
}

export class rectParticle extends baseParticle{
    start:vector2;
    size:vector2;
    style:colourpossibility|colour3;

    constructor(start:vector2,size:vector2,style:colourpossibility|colour3){
        super()
        this.start = start
        this.size = size
        this.style = style
    }
}

function evaluateCurve(_curve:curve<number>,t:number){
    return lerp(_curve.start,_curve.end,_curve.curve(t))
}

export default class particleManager{
    particles:baseParticle[]=[];

    Update(deltaTime:number){
        const time = new Date().getTime();
        const deletion:number[] = []

        for(const i of this.particles){
            if(time - i.birth > i.lifespan){
                deletion.push(this.particles.indexOf(i))
                continue;
            }

            i.position = i.position.add(i.velocity.mul(deltaTime))
            i.velocity = i.velocity.add(i.acceleration.mul(deltaTime))
            i.rotation += i.angularvelocity
        }

        while(deletion.length > 0)
            this.particles.splice(deletion.pop() as number,1)
    }

    DrawParticle(ctx:CanvasRenderingContext2D,_particle:baseParticle){
        const original = ctx.getTransform()

        const t = (new Date().getTime() - _particle.birth) / _particle.lifespan

        ctx.translate(_particle.position.x,_particle.position.y)
        ctx.rotate(_particle.rotation)
        ctx.globalAlpha = evaluateCurve(_particle.opacity,t)

        const scale = _particle.scale.start.lerp(_particle.scale.end,_particle.scale.curve(t))

        ctx.transform(scale.x,0,0,scale.y,0,0)

        if(_particle instanceof rectParticle){
            const compensate = _particle.size.div(2).flip();
            ctx.translate(compensate.x,compensate.y)
            var stylecolour = SafeColour(_particle.style)
            ctx.fillStyle = stylecolour.toHex();
            ctx.fillRect(
                _particle.start.x,
                _particle.start.y,
                _particle.size.x,
                _particle.size.y,
            )
        }
        if(_particle instanceof textParticle){
            ctx.font = "1px Bytesized";
            ctx.textAlign = "center"
            var stylecolour = SafeColour(_particle.style)
            ctx.fillStyle = stylecolour.toHex();
            ctx.letterSpacing = evaluateCurve(_particle.letterSpacing,t) + "px";
            ctx.fillText(
                _particle.text,
                0,0
            )
        }

        ctx.setTransform(original)
    }

    SpawnParticle(_particle:baseParticle){
        for (let i = 0; i < this.particles.length; i++)
            this.particles[i] = _particle
        
        this.particles.push(_particle);
    }

    DrawParticles(ctx:CanvasRenderingContext2D){
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const _particle = this.particles[i];
            this.DrawParticle(ctx,_particle);
        }
    }
}