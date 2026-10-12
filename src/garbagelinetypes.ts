import { Randomiser } from "./basics.ts";
import { tile, tileType } from "./board.ts";
import { tileModels } from "./tilemodels.ts";

export type dualGarbageType = (alt:boolean)=>tile;

export class BaseLineGenerator{
    randomiser:Randomiser;
    altskin:boolean=false;
    constructor(){
        this.randomiser = new Randomiser(Date.now())
    }

    Seed(seed:number){
        this.randomiser = new Randomiser(seed||Date.now())
    }

    Reset(altskin:boolean){
        this.altskin = altskin
    }

    GarbageType(_garbageType:dualGarbageType):tile{
        return _garbageType(this.altskin);
    }

    Next(_garbageType:dualGarbageType=tile.garbage,width:number):tile[]{
        this.PreNext(_garbageType,width)
        var line:tile[] = []
        for(let i=0; i<width; i++)
            line[i] = this.GarbageType(_garbageType)
        return line
    }

    PreNext(_garbageType:dualGarbageType=tile.garbage,width:number){
        
    }
}

export class SwitchLines extends BaseLineGenerator{
    IsHole(i:number):boolean{
        return this.randomiser.next() <= 0.5
    }

    HoleType(_garbageType:dualGarbageType):tile{
        return new tile();
    }

    Next(_garbageType:dualGarbageType=tile.garbage,width:number):tile[]{
        this.PreNext(_garbageType,width)
        var line:tile[] = []
        for(let i=0; i<width; i++)
            if(this.IsHole(i))
                line[i] = this.HoleType(_garbageType);
            else
                line[i] = this.GarbageType(_garbageType);
        return line
    }
}

export class HolesLines extends SwitchLines{
    holes:number[]=[];

    HoleChoice(width:number):number[]{
        return [Math.floor(this.randomiser.next()*width)]
    }

    PreNext(_garbageType: dualGarbageType | undefined, width: number): void {
        this.holes = this.HoleChoice(width)
    }

    IsHole(i: number): boolean {
        return this.holes.includes(i)
    }
}

export class MessyLines extends HolesLines{
    repeat:number|undefined;

    Reset(altskin:boolean): void {
        this.altskin = altskin
        this.repeat = undefined
    }

    HoleChoice(width: number): number[] {
        var hole = Math.floor(this.randomiser.next()*width)
        if(this.repeat!==undefined){
            hole = Math.floor(this.randomiser.next()*(width - 1))
            if(hole >= this.repeat)
                hole ++
        }
        return [hole]
    }
}

export class StraightsLines extends HolesLines{
    hole:number|undefined

    Reset(altskin:boolean): void {
        this.altskin = altskin
        this.hole = undefined
        console.log("reset")
    }

    HoleChoice(width: number): number[] {
        if(this.hole === undefined)
            this.hole = Math.floor(this.randomiser.next()*width)
        return [this.hole]
    }
}

export class NwideHolesLines extends StraightsLines{
    holecount:number;

    constructor(holecount=2){
        super()
        this.holecount = holecount
    }

    HoleChoice(width: number): number[] {
        if(this.hole === undefined)
            this.hole = Math.floor(this.randomiser.next()*(width-(this.holecount-1)))
        const holeschosen:number[] = []
        for(let i=0;i<this.holecount;i++)
            holeschosen.push(i+this.hole)
        return holeschosen
    }
}

export class CheckersLines extends SwitchLines{
    parity:number=0

    Reset(altskin:boolean): void {
        this.altskin = altskin
        this.parity = 0
    }

    PreNext(_garbageType: dualGarbageType | undefined, width: number): void {
        this.parity++
    }

    IsHole(i: number): boolean {
        return (i%2)==(this.parity%2)
    }
}

export class Damnation extends BaseLineGenerator{
    Next(_garbageType:dualGarbageType=tile.garbage,width:number):tile[]{
        var line:tile[] = []
        var choose = this.randomiser.next() < 0.5 ? 6 : 7;
        var left = width;
        for(let i=0; i<width; i++)
            if(this.randomiser.next() < choose / left){
                choose--;
                left--;
                line[i] = new tile();
            }
            else{
                left--;
                line[i] = _garbageType(this.altskin);
            }
        return line
    }
}

export class MultiholeLines extends BaseLineGenerator{
    constructor(holes:number){
        super()
        this.holes = holes;
    }

    holes:number;

    Next(_garbageType:dualGarbageType=tile.garbage,width:number):tile[]{
        var line:tile[] = []
        var choose = this.holes;
        var left = width;
        for(let i=0; i<width; i++)
            if(this.randomiser.next() < choose / left){
                choose--;
                left--;
                line[i] = new tile();
            }
            else{
                left--;
                line[i] = _garbageType(this.altskin);
            }
        return line
    }
}

export class OneBlockLine extends HolesLines{
    GarbageType(_garbageType: dualGarbageType): tile {
        return new tile()
    }

    HoleType(_garbageType: dualGarbageType): tile {
        return _garbageType(this.altskin);
    }
}

export class SecretGradeLines extends SwitchLines{
    parity=-1;
    pong=-1;

    Reset(altskin:boolean){
        this.altskin = altskin
        this.parity = -1;
    }

    PreNext(_garbageType: dualGarbageType | undefined, width: number): void {
        this.parity++;
        const diagonish = this.parity % (width - 1)
        this.pong = (Math.floor(this.parity / (width-1)) % 2 === 0 ? diagonish : (width - 1 - diagonish))
    }

    IsHole(i: number): boolean {
        return i==this.pong
    }
}

export class LinesDiagonal extends SecretGradeLines{
    GarbageType(_garbageType: dualGarbageType): tile {
        return new tile()
    }

    HoleType(_garbageType: dualGarbageType): tile {
        return _garbageType(this.altskin);
    }
}

export class Bombs extends StraightsLines{
    HoleType(_garbageType: dualGarbageType): tile {
        const _tile = new tile(tileModels.bomb);
        _tile.countstoclear = false;
        _tile.tileType = tileType.bomb;
        return _tile
    }
    
    GarbageType(_garbageType: dualGarbageType): tile {
        return tile.hardy()
    }
}

export class NwideBombs extends NwideHolesLines{
    HoleType(_garbageType: dualGarbageType): tile {
        const _tile = new tile(tileModels.bomb);
        _tile.countstoclear = false;
        _tile.tileType = tileType.bomb;
        return _tile
    }
    
    GarbageType(_garbageType: dualGarbageType): tile {
        return tile.hardy()
    }
}

export class Solid extends BaseLineGenerator{
    GarbageType(_garbageType: dualGarbageType): tile {
        const _tile = _garbageType(this.altskin)
        _tile.countstoclear = false
        _tile.tileType = tileType.solid
        return _tile
    }
}