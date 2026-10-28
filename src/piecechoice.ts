import { clone, Randomiser } from "./basics.ts";
import { tileType } from "./board.ts";
import { piece } from "./pieces.ts";
import { tileModels } from "./tilemodels.ts";

function HashBag(bagprefab:piece[]){
    var o = "";
    for(const _piece of bagprefab){
        o += "."
        for(const tile of _piece.tileoffsets){
            o += tile.toString();
        }
    }

    return o;
}

export class BasePieceGenerator{
    workingbag:piece[]=[];
    bagprefab:piece[];
    randomiser:Randomiser;
    baghash:string;
    startstride=false;

    constructor(bagprefab:piece[]){
        this.bagprefab = bagprefab
        this.randomiser = new Randomiser(Date.now())
        this.baghash = HashBag(bagprefab)
    }

    Seed(seed:number){
        this.randomiser = new Randomiser(seed);
    }

    Cull(maxbounds:number){
        const rawbag = this.bagprefab
        this.bagprefab = []
        for(const i of rawbag){
            const bounds = i.bounds
            if(bounds.x <= maxbounds || bounds.y <= maxbounds)
                this.bagprefab.push(i)
        }
    }

    Reset(){
        this.workingbag = []
        for(const _piece of this.bagprefab)
            this.workingbag.push(clone(_piece));
    }

    Choice():piece{
        var i = Math.floor(this.randomiser.next() * this.workingbag.length);
        if(this.startstride){
            var exhaust = 0
            while(!this.workingbag[i].strideful){
                i = Math.floor(this.randomiser.next() * this.workingbag.length);
                console.log(this.workingbag)
                exhaust++
                if(exhaust>3000)
                    throw new Error("your took too long")
            }
        }
        return this.workingbag.splice(i,1)[0]
    }

    Next(){
        if(this.workingbag.length <= 0)
            this.Reset()
        const _piece = this.Choice()
        if(this.startstride)
            this.startstride = false
        return _piece
    }
}

export class SequencePieceGenerator extends BasePieceGenerator{
    Choice(): piece {
        return this.workingbag.shift() as piece
    }
}

export class Bags1Bomb extends BasePieceGenerator{
    Reset(){
        this.workingbag = []
        for(const _piece of this.bagprefab)
            this.workingbag.push(clone(_piece));
        let bomb = Math.floor(this.randomiser.next() * this.workingbag.length);
        this.workingbag[bomb] = this.workingbag[bomb].withGimmick(tileType.grenade).withModel(tileModels.grenade)
    }
}

export class Fool extends BasePieceGenerator{
    altbag:piece[];
    piecesnormal:number;
    piecesalt:number;

    normalgen:BasePieceGenerator;
    altgen:BasePieceGenerator;

    repeattrack:number=0;
    altstrack:number=0;

    constructor(bagprefab:piece[],altbag:piece[],piecesnormal=14,piecesalt=3,normalgen=BasePieceGenerator,altgen=BasePieceGenerator){
        super(bagprefab)
        this.altbag = altbag
        this.piecesnormal = piecesnormal
        this.piecesalt = piecesalt
        this.normalgen = new (normalgen)(bagprefab)
        this.altgen = new (altgen)(altbag)
    }

    Seed(seed:number){
        this.normalgen.Seed(seed)
        this.altgen.Seed(seed + 1)
    }

    Reset(): void {
        this.normalgen.Reset()
        this.altgen.Reset()
        this.repeattrack = this.piecesnormal + this.piecesalt
        this.altstrack = this.piecesalt
    }

    Next(): piece {
        if(this.repeattrack <= 0)
            this.Reset()

        var _piece:piece
        if(Math.random() <= this.altstrack/this.repeattrack){
            this.altstrack--;
            this.repeattrack--;

            _piece = this.altgen.Next()
        }else{
            this.repeattrack--;

            _piece = this.normalgen.Next()
        }
        
        if(this.startstride){
            this.startstride = false
            this.altgen.startstride = false
            this.normalgen.startstride = false
        }

        return _piece
    }
}

export class RandomPieceGenerator extends BasePieceGenerator{
    Choice(): piece {
        var i = Math.floor(this.randomiser.next() * this.bagprefab.length);
        while(!this.workingbag[i].strideful)
            i = Math.floor(this.randomiser.next() * this.workingbag.length);
        return clone(this.bagprefab[i])
    }
}