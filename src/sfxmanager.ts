import { clone } from "./basics";

export enum sfx{
    die,
    gunshot0,
    gunshot1,
    tone,
    none,
    kick0,
    kick1,
    kick2,
    ting,
    noise0,
    noise1,
    noise2,
}

export class playback {
    src:string

    starttime=0
    playduration:number|undefined

    speed=1
    volume=0.5

    constructor(src:string,starttime=0,playduration?:number,volume=0.5,playbackrate=1){
        this.src = src;
        this.starttime = starttime;
        this.playduration = playduration;
        this.volume = volume
        this.speed = playbackrate;
    }

    withspeed(speed:number){
        const robot = clone(this);
        robot.speed = speed;
        return robot;
    }

    withvolume(volume:number){
        const robot = clone(this);
        robot.volume = volume;
        return robot;
    }
}

export class audiovoices{
    voices:HTMLAudioElement[];
    timeoutreferences:number[]=[];
    activevoice:number=0;
    loadedvoices:number=0;
    src:string;

    constructor(src:string,voicecount:number){
        this.voices = []
        for (let i = 0; i < voicecount; i++) {
            const a = new Audio(src)
            a.load()
            this.voices.push(a)
            a.onload = ()=>{
                this.loadedvoices+=1
            }
        }
        this.src = src
    }

    play(pb:playback){
        if(pb.src != this.src)
            console.warn("wrong sourc");
            
        if(this.timeoutreferences[this.activevoice] !== undefined)
            clearTimeout(this.timeoutreferences[this.activevoice])
        const activevoice = this.voices[this.activevoice]
        activevoice.currentTime = pb.starttime
        activevoice.playbackRate = pb.speed
        activevoice.volume = pb.volume
        activevoice.play().catch((e)=>{
            console.error(e)
            activevoice.load()
        })
        if(pb.playduration)
            this.timeoutreferences[this.activevoice] = setTimeout(()=>{
                activevoice.pause()
            }, pb.playduration / pb.speed * 1000)
        
        this.activevoice = (this.activevoice + 1) % this.voices.length
        return activevoice
    }
}

export default class sfxManager{
    static audiocache:{[key:string]:audiovoices}={};

    static PlayFile(src:string){
        if(!this.audiocache[src]){
            this.audiocache[src] = new audiovoices(src,2)
            var audio = new Audio(src)
            audio.play().catch((e)=>{
                console.error(e)
            })
            return audio
        }
        return this.audiocache[src].play(new playback(src))
    }
    
    static PlayPBobject(pb:playback){
        
        if(!this.audiocache[pb.src]){
            this.audiocache[pb.src] = new audiovoices(pb.src,4)
            var audio = new Audio(pb.src)
            audio.currentTime = pb.starttime
            audio.playbackRate = pb.speed
            audio.volume = pb.volume
            
            audio.play().catch((e)=>{
                console.error(e)
            })
            if(pb.playduration)
                setTimeout(()=>{
                    audio.pause()
                    audio.remove()
                }, pb.playduration / pb.speed * 1000)
            return audio
        }
        return this.audiocache[pb.src].play(pb)
    }

    private static GetPitchAny(inst:number,pitch:number){
        return new playback("sounds.wav",2.60870748299 * (inst * 4 + pitch),2.608)
    }
    
    static GetPitch(inst:0|1|2|3|4|5,pitch:0|1|2|3){
        return this.GetPitchAny(inst,pitch)
    }
    
    static PlayPitch(inst:0|1|2|3|4|5,pitch:0|1|2|3){
        return this.PlayPBobject(this.GetPitchAny(inst,pitch))
    }

    static GetSFX(_sfx:sfx){
        return this.GetPitchAny(6,_sfx)
    }
    
    static PlaySfx(_sfx:sfx){
        return this.PlayPBobject(this.GetSFX(_sfx))
    }

    static Preloadsrc(src:string,voicecount:number){
        this.audiocache[src] = new audiovoices(src,voicecount)
    }
}

sfxManager.Preloadsrc("sounds.wav",16)