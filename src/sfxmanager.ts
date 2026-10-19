import { clone } from "./basics";

export enum sfx{
    die,
    gunshot0,
    gunshot1,
    tone,
    kick0,
    kick1,
    kick2,
    bap,
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
}

export default class sfxManager{
    static PlayFile(src:string){
        var audio = new Audio(src)
        audio.play()
        return audio
    }
    
    static PlayPBobject(pb:playback){
        var audio = new Audio(pb.src)
        audio.currentTime = pb.starttime
        audio.playbackRate = pb.speed
        audio.volume = pb.volume
        
        audio.play()
        if(pb.playduration)
            setTimeout(()=>{audio.pause()}, pb.playduration / pb.speed * 1000)
        return audio
    }

    private static GetPitchAny(inst:number,pitch:number){
        return new playback("sounds.wav",2.60870748299 * (inst * 4 + pitch),2.608)
    }
    
    static GetPitch(inst:0|1|2|3,pitch:0|1|2|3){
        return this.GetPitchAny(inst,pitch)
    }

    static GetSFX(_sfx:sfx){
        return this.GetPitchAny(5,_sfx)
    }
}