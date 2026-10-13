import { Randomiser, vector2 } from "./basics.ts";
import { board, tile, tileType } from "./board.ts";
import { BaseLineGenerator, dualGarbageType } from "./garbagelinetypes.ts";
import { BasePieceGenerator } from "./piecechoice.ts";
import { piece } from "./pieces.ts";
import { tileModels } from "./tilemodels.ts";

export class BaseGarbageGenerator{
    altskin:boolean=false;

    Seed(seed:number){

    }

    Reset(altskin:boolean){
        this.altskin = altskin
    }

    SetGarbageTile(_board:board,_garbageType:dualGarbageType,coords:vector2){
        const _tile = _garbageType(this.altskin)
        _tile.birth = Date.now();
        _tile.isGarbage = true;
        _board.matrix.SetTile(coords,_tile)
    }

    Write(_board:board,_garbageType:dualGarbageType,numberlines:number,iscut:boolean){
        
    }
}

export class LinesGenerator extends BaseGarbageGenerator{
    currentGenerator:BaseLineGenerator;

    constructor(generator:BaseLineGenerator){
        super()
        this.currentGenerator = generator
    }

    Seed(seed:number) {
        this.currentGenerator.Seed(seed)
    }

    Reset(altskin:boolean) {
        this.currentGenerator.Reset(altskin)
    }

    Write(_board:board,_garbageType:dualGarbageType,numberlines:number){
        for (let i = 0; i < numberlines; i++) {
            var newline = this.currentGenerator.Next(_garbageType,_board.matrix.width);
            for(const _tile of newline){
                _tile.birth = Date.now();
                _tile.isGarbage = true;
            }
            _board.matrix.AddGarbageLine(newline);
            _board.yoffset--;
        }
    }
}

export class SpecklesGarbage extends BaseGarbageGenerator{
    randomiser:Randomiser;
    height:number;

    constructor(height:number){
        super()
        this.randomiser = new Randomiser(Date.now())
        this.height = height
    }

    Seed(seed:number) {
        this.randomiser = new Randomiser(seed)
    }

    LineEligible(_board:board,y:number):boolean{
        return _board.matrix.CountEmpties(y) > 1
    }

    AddSpeckle(_board:board,_garbageType:dualGarbageType,y:number){
        const insertat = Math.floor(this.randomiser.next() * _board.matrix.CountEmpties(y))
        var empty = 0
        for(let x=0; x<_board.matrix.width; x++){
            let i = new vector2(x,y);
            let thile = _board.matrix.GetTile(i);
            if(thile) continue
            if(empty!=insertat){
                empty += 1
                continue
            }
            this.SetGarbageTile(_board,_garbageType,i)
            break
        }
    }

    Write(_board:board,_garbageType:dualGarbageType,numberlines:number){
        for (let i = 0; i < numberlines; i++) {
            var y = -1;
            var heightleft = this.height;
            while(true){
                y++
                if(y>20000) throw new Error("how is this even possible to trigger")

                if(!this.LineEligible(_board,y)) continue
                if(this.randomiser.next() > 1 / heightleft){
                    heightleft--;
                    continue
                }

                this.AddSpeckle(_board,_garbageType,y)
                break
            }
        }
    }
}

export class WidthGarbage extends BaseGarbageGenerator{
    x:number|undefined=undefined;
    y=0;

    Reset(altskin: boolean): void {
        this.altskin = altskin
        this.x = undefined
        this.y = 0
    }

    Write(_board:board,_garbageType:dualGarbageType,numberlines:number){
        if(this.x === undefined)
            this.x = (Math.random() < 0.5 ? _board.matrix.effectiveLeft - 2 : _board.matrix.effectiveRight + 1)

        for (let i = 0; i < numberlines; i++) {
            this.SetGarbageTile(_board,_garbageType,new vector2(this.x,this.y))
            this.y++
        }
    }
}

export class DebrisGarbage extends BaseGarbageGenerator{
    pieceChoice:BasePieceGenerator;
    lowbias:number;

    constructor(pieceChoice:BasePieceGenerator,lowbias=2){
        super()
        this.pieceChoice = pieceChoice
        this.lowbias = lowbias
    }

    Seed(seed:number) {
        this.pieceChoice.Seed(seed)
    }

    LineEligible(_board:board,y:number):boolean{
        return _board.matrix.CountEmpties(y) > 1
    }

    SetGarbagePiece(_board:board,_garbageType:dualGarbageType,_piece:piece,position:vector2){
        for(const i of _piece.tileoffsets)
            this.SetGarbageTile(_board,_garbageType,position.add(i))
    }

    SetPiece(_board:board,_garbageType:dualGarbageType){
        var _piece = this.pieceChoice.Next()

        var exhaust = 0
        while(true){
            exhaust++
            if(exhaust > 3000)
                throw new Error("this has to be intentional")
            
            var position = new vector2(_board.spawnlocation.x,_board.matrix.effectiveUp)

            _piece.RotateTo(Math.floor(Math.random() * 4))

            position = new vector2(position.x,position.y + _piece.extents.south)

            const workablearea = _board.matrix.width - _piece.extents.west - _piece.extents.east
            if(workablearea <= 0)
                continue
            
            const xoffsets:number[] = []
            var totalchance:number = 0

            for(let xoff = 0; xoff < workablearea; xoff++){
                const thisheight = _board.matrix.ColumnHighest(_piece.extents.west + xoff);
                const chance = Math.pow(this.lowbias,-thisheight);
                xoffsets.push(chance);
                totalchance += chance;
            }

            if(totalchance <= 0)
                throw new Error("how")
            
            for(let xoff = 0; xoff < workablearea; xoff++){
                if(Math.random() >= (xoffsets[xoff] / totalchance)){
                    totalchance -= xoffsets[xoff];
                    continue
                }
                position = new vector2(_piece.extents.west + xoff,position.y)
                break
            }

            position = position.add(_board.DropHeight(_piece,position))

            if(_board.matrix.PieceLineClears(_piece,position) > 0)
                continue
            
            this.SetGarbagePiece(_board,_garbageType,_piece,position)
            break
        }
    }

    Write(_board:board,_garbageType:dualGarbageType,numberlines:number){
        for (let i = 0; i < numberlines; i++) {
            this.SetPiece(_board,_garbageType)
        }
    }
}

export class Decheese extends BaseGarbageGenerator{
    cheese:BaseGarbageGenerator;
    normal:BaseGarbageGenerator;
    cheesethreshold:number;

    constructor(cheese:BaseGarbageGenerator,normal:BaseGarbageGenerator,cheesethreshold:number = 1){
        super()
        this.cheese = cheese
        this.normal = normal
        this.cheesethreshold = cheesethreshold
    }

    Reset(altskin: boolean): void {
        this.cumulativegarbage = 0
        this.cheese.Reset(altskin)
        this.normal.Reset(altskin)
    }

    cumulativegarbage=0;
    Write(_board: board, _garbageType: dualGarbageType, numberlines: number, iscut: boolean): void {
        this.cumulativegarbage++;
        if(this.cumulativegarbage == this.cheesethreshold + 1)
            this.normal.Write(_board,_garbageType,this.cumulativegarbage,iscut)
        if(this.cumulativegarbage > this.cheesethreshold + 1)
            this.normal.Write(_board,_garbageType,1,iscut)
        if(this.cumulativegarbage <= this.cheesethreshold && !iscut)
            this.cheese.Write(_board,_garbageType,this.cumulativegarbage,iscut)
        if(!iscut)
            this.cumulativegarbage = 0
    }
}