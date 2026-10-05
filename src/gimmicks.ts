import { vector2 } from "./basics.ts";
import { board, tile, tileType } from "./board.ts";
import { game } from "./sorkurzdil.ts";

export class gimmickReport{
    score:number;
    lines:number;
    attack:number;
    lock=false;
    constructor(score?:number,lines?:number,attack?:number){
        this.score = (score===undefined)?0:score
        this.lines = (lines===undefined)?0:lines
        this.attack = (attack===undefined)?0:attack
    }

    add(other:gimmickReport){
        const robot = new gimmickReport(this.score + other.score,this.lines + other.lines,this.attack + other.attack)
        robot.lock = this.lock || other.lock
        return robot;
    }
}

export type gimmick=(_board:board,_game:game)=>gimmickReport;

function ClearLine(_board:board,y:number){
    for(let x=0; x<_board.matrix.width; x++){
        let i = new vector2(x,y);
        if(!_board.matrix.array[i.x][i.y]) continue
        _board.matrix.array[i.x][i.y].death = Date.now();
    };
}

function ExplodeTile(_gimmickReport:gimmickReport,_board:board,_game:game,coords:vector2){
    const _tile = _board.matrix.GetTile(coords)
    if(!_tile)return
    if(_tile.tileType === tileType.bomb){
        ClearLine(_board,coords.y)
        _gimmickReport.lines++;
        _game.flags.shakeincrease += 0.2;
        DetonateBombs(_gimmickReport,_board,_game,[coords])
    }
    else{
        _board.matrix.WeakDestroyTile(coords)
        _game.flags.shakeincrease += 0.1;
    }
}

function DetonateBombs(_gimmickReport:gimmickReport,_board:board,_game:game,ignition:vector2[]){
    while(ignition.length > 0){
        const ig = ignition.pop()
        if(!ig)break;
        const i = ig.add(vector2.down)
        const _eligibletile = _board.matrix.GetTile(i)
        if(!_eligibletile)continue;
        if(_eligibletile.tileType !== tileType.bomb)continue;
        const _tile = tile.hardy()
        _tile.born()
        _board.matrix.SetTile(i,_tile)
        ignition.unshift(i)
        _game.flags.shakeincrease += 0.2;
    }
}

export function MarkBombClears(_board:board,_game:game):gimmickReport{
    if(!_board.activepiece) return new gimmickReport();
    const _gimmickReport:gimmickReport = new gimmickReport()
    
    const igniters = _board.activepiece.tileoffsets.toSpliced(0,0).map(offset=>_board.activeposition.add(offset))
    DetonateBombs(_gimmickReport,_board,_game,igniters)
    return _gimmickReport
}

export function ExplodeGrenades(_board:board,_game:game):gimmickReport{
    const _gimmickReport = new gimmickReport();
    const destruction:vector2[]=[];
    for(const i of _board.matrix.GetNonNullPositions()){
        const _tile = _board.matrix.GetTile(i)
        if(!_tile) continue;
        if(_tile.tileType == tileType.grenade){
            for(const offset of vector2.king)
                destruction.push(offset.add(i))
            destruction.push(i)
        }
    }
    for(const i of destruction){
        ExplodeTile(_gimmickReport,_board,_game,i)
    }
    return _gimmickReport
}

export function AdhereToGlue(_board:board,_game:game):gimmickReport{
    if(!_board.activepiece) return new gimmickReport();

    const locked = new gimmickReport();
    locked.lock = true

    for(const offset of _board.activepiece.tileoffsets){
        const i = offset.add(_board.activeposition)
        for(const j of vector2.orthogonal){
            const _tile = _board.matrix.GetTile(j.add(i))
            if(!_tile)continue
            if(_tile.tileType == tileType.glue) return locked
        }
    }
    return new gimmickReport()
}