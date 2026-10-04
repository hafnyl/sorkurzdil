import { tileModel } from './roms.ts'
import { colour3, vector2 } from './basics.ts'
import { tileModels } from './roms.ts';
import { piece } from './pieces.ts';

export enum tileType{
    none,
    bomb,
    grenade,
    unprimedgrenade,
    solid,
    glue,//unimplemented
    glass,//unimplemented
}

export class tile{
  tileModel:tileModel;
  isEmpty:boolean;
  birth?:number;
  death?:number;
  countstoclear=true;
  wound?:number;
  isGarbage=false;
  tileType=tileType.none;
  hardy=false;

  constructor(_tileModel=tileModels.none,birth?:number){
    this.tileModel = _tileModel;
    this.isEmpty = _tileModel === tileModels.none;
    this.birth = birth;
  }

  born(){
    this.birth = Date.now()
  }

  static garbage(){
    const robot = new tile(tileModels.garbage)
    return robot
  }

  static dualGarbage(alt:boolean){
    const robot = new tile(alt ? tileModels.garbage1 : tileModels.garbage)
    return robot
  }

  static hardy(){
    const robot = new tile(tileModels.impermanent)
    robot.hardy = true
    return robot
  }

  static glue(){
    const robot = new tile(new tileModel(colour3.fromHex("#ebecbc")).doNotGrey())
    robot.tileType = tileType.glue
    return robot
  }
}

export class matrix{
    array:(tile)[][] = [];
    width:number;
    height:number;
    effectiveHeight:number;

    constructor(width:number,height:number)
    {
        this.width = width;
        this.height = height;
        this.effectiveHeight = 0;
    }

    InBounds(coords:vector2) {
        if(coords.x < 0) return false;
        if(coords.y < 0) return false;
        if(coords.x >= this.width) return false;
        return true
    }

    StrictlyInBounds(coords:vector2) {
        if(coords.x < 0) return false;
        if(coords.y < 0) return false;
        if(coords.x >= this.width) return false;
        if(coords.y >= this.height) return false;
        return true
    }

    GetTile(coords:vector2) {
        if(this.InBounds(coords))
            if (this.array[coords.x])
                return this.array[coords.x][coords.y];
            else
                return undefined;
    }

    SetTile(coords:vector2,_tile:tile) {
        if(!this.InBounds(coords))
            return
        if(_tile.isEmpty && !_tile.wound)
            return

        if(this.array[coords.x] === undefined)
            this.array[coords.x] = []
        this.array[coords.x][coords.y] = _tile;

        this.effectiveHeight = Math.max(this.effectiveHeight,coords.y + 1);
    }

    DeleteTile(coords:vector2) {
        if(this.InBounds(coords))
            delete this.array[coords.x][coords.y];
    }

    /**doesnt destroy hardy tiles */
    WeakDestroyTile(coords:vector2) {
        const _tile = this.GetTile(coords)
        if(!_tile) return
        if(_tile.hardy) return
        if(this.InBounds(coords))
            delete this.array[coords.x][coords.y];
    }

    /*can be rendered*/
    IsNull(coords:vector2) {
        let a = this.GetTile(coords);
        if(a)
            return a.isEmpty && !a.wound;
        else
            return true
    }

    IsUndefined(coords:vector2) {
        let a = this.GetTile(coords);
        return a === undefined;
    }

    /*can be moved into*/
    IsValid(coords:vector2) {
        if(!this.InBounds(coords))
            return false;
        let a = this.GetTile(coords);
        if(a)
        {
            if(a.wound)
                return false;
            return a.isEmpty;
        }
        else
            return true;
    }

    /**get all the positions of the tiles that can be rendered*/
    GetNonNullPositions(){
        var nonempties:vector2[] = []
        for (let x=0; x<this.width; x++){
            for (let y=0; y<this.effectiveHeight; y++){
                let i = new vector2(x,y)
                if(this.IsNull(i)) continue;
                nonempties.push(i)
            }
        }
        return nonempties;
    }
    /**get all the tiles that exist */
    GetNonNulls(){
        var nonempties:tile[] = []
        for (let x=0; x<this.width; x++){
            for (let y=0; y<this.effectiveHeight; y++){
                const i = new vector2(x,y)
                const _tile = this.GetTile(i)
                if(!_tile) continue;
                nonempties.push(_tile)
            }
        }
        return nonempties;
    }

    GetEffectiveHeight(){
        for (let y=this.effectiveHeight - 1; y>=0; y--)
            for (let x=0; x<this.width; x++)
                if(!this.IsNull(new vector2(x,y)))
                    return y + 1
        return 0;
    }

    PerfectClear(){
        for (let y=this.effectiveHeight - 1; y>=0; y--)
            for (let x=0; x<this.width; x++)
                {
                    const tile = this.GetTile(new vector2(x,y));
                    if(!tile)
                        continue
                    if(tile.isEmpty)
                        continue
                    if(!tile.death)
                        return false
                }
        return true;
    }

    ClearLine(clearY:number,noshiftdown=false){
        if(noshiftdown){
            for(let x=0; x<this.width; x++){
                let i = new vector2(x,clearY);
                this.DeleteTile(i);
            }
        }else{
            for(let y=clearY+1; y<this.effectiveHeight+1; y++){
                for(let x=0; x<this.width; x++){
                    let i = new vector2(x,y);
                    const _tile = this.GetTile(i);
                    if(!_tile)
                        this.DeleteTile(i.add(vector2.down));
                    else
                        this.SetTile(i.add(vector2.down),_tile);
                }
            }
        }

        this.effectiveHeight = this.GetEffectiveHeight();
    }

    UpShift(fromY:number){
        for(let y=this.effectiveHeight-1; y>=fromY; y--){
            for(let x=0; x<this.width; x++){
                const i = new vector2(x,y);
                const _tile = this.GetTile(i);
                if(!_tile) continue;
                this.SetTile(i.add(vector2.up),_tile);
                this.DeleteTile(i);
            }
        }
        this.effectiveHeight ++;
    }

    AddGarbageLine(garbageline:tile[]){
        if(garbageline.length !== this.width)
            throw new Error("wrong garbage width");
        
        this.UpShift(0);
        for(let x=0; x<this.width; x++){
            this.SetTile(new vector2(x,0),garbageline[x])
        }
    }

    ClearLines(minDeadFor=0,noshiftdown=false){
        let lineclears:number[] = [];
        for(let y=0; y<this.effectiveHeight; y++){
            let exhaust = 0;
            while(true){
                exhaust++;
                if(exhaust > 3000){
                    throw new Error("your took too long");
                }

                const _tile = this.GetTile(new vector2(0,y));
                if(!_tile) break; //this only works because if one tile isnt here it cant be a complete row!!!
                const death = _tile.death;
                if (!death) break;

                const deadFor = new Date().getTime() - death;
                if(deadFor < minDeadFor)
                    break;

                lineclears.push(y);
                this.ClearLine(y,noshiftdown);
            }
        }
        return lineclears;
    }

    ClearLinesIncludeVert(minDeadFor=0){
        for(let eks=0; eks<this.width; eks++){
            for(let why=0; why<this.effectiveHeight; why++){
                let i = new vector2(eks,why);
                const _tile = this.GetTile(i);
                if(!_tile)continue;
                if(!_tile.death)continue;
                if(_tile.death < minDeadFor)continue;
                this.DeleteTile(i);
            }
        }
    }

    MarkClears(){
        let lineclears = 0;
        let diglineclears = 0;
        for(let y=0; y<this.effectiveHeight; y++){
            const _tile = this.GetTile(new vector2(0,y));
            if(!_tile) continue; //this only works because if one tile isnt here we dont have to check that the rest is complete!!!
            if(!_tile.countstoclear) continue;
            let completerow = true;
            const death = _tile.death;
            if(death !== undefined) continue;

            let isdig = false;

            for(let x=0; x<this.width; x++){
                let i = new vector2(x,y);
                let thile = this.GetTile(i);
                if(this.IsNull(i) || !thile || !thile.countstoclear){
                    completerow =false;
                    break;
                }
                if(thile.isGarbage)
                    isdig = true
            }

            if (!completerow) continue;
            lineclears++;
            for(let x=0; x<this.width; x++){
                let i = new vector2(x,y);
                if(!this.array[i.x][i.y]) continue
                this.array[i.x][i.y].death = new Date().getTime();
            };
            if(isdig)
                diglineclears++
        }
        return [lineclears, diglineclears];
    }

    MarkClearsVert(){
        let lineclears = 0;
        for(let eks=0; eks<this.width; eks++){
            const _tile = this.GetTile(new vector2(eks,0));
            if(!_tile) continue; //this only works because if one tile isnt here we dont have to check that the rest is complete!!!
            if(!_tile.countstoclear) continue;
            let completerow = true;
            const death = _tile.death;
            if(death !== undefined) continue;

            for(let why=0; why<this.height; why++){
                let i = new vector2(eks,why);
                if(this.IsNull(i) || !this.GetTile(i)?.countstoclear){
                    completerow =false;
                    break;
                }
            }

            if (!completerow) continue;
            lineclears++;
            for(let why=0; why<this.height; why++){
                let i = new vector2(eks,why);
                this.array[i.x][i.y].death = new Date().getTime();
            };
        }
        return lineclears;
    }

    GarbageLineCount(){
        let garbagelines = 0;
        for(let y=0; y<this.effectiveHeight; y++){
            let isgarbage = false
            for(let x=0; x<this.width; x++){
                let i = new vector2(x,y);
                let thile = this.GetTile(i);
                if(this.IsNull(i) || !thile) continue
                if(thile.isGarbage){
                    isgarbage = true
                    break
                }
            }
            if(!isgarbage) continue
            garbagelines++;
        }
        return garbagelines;
    }

    CountEmpties(y:number){
        var empties = 0
        for(let x=0; x<this.width; x++){
            let i = new vector2(x,y);
            let thile = this.GetTile(i);
            if(thile&&!this.IsNull(i)) continue
            empties += 1
        }
        return empties
    }

    ClearEligible(i:vector2){ // too lazy to fit this into the currect clear mechanism right now but it would look cleaner i think
        let _tile = this.GetTile(i);
        if(!_tile) return false; //this only works because if one tile isnt here we dont have to check that the rest is complete!!!
        if(!_tile.countstoclear) return false;
        const death = _tile.death;
        if(death !== undefined) return false;
        return true
    }

    GreyAll(){
        const nonempties = this.GetNonNullPositions()
        for(const i of nonempties){
            const tile = this.GetTile(i)
            if(!tile) continue
            tile.tileModel = tileModels.garbage
        }
    }
}

export class board{
    matrix:matrix;
    activepiece:piece|undefined;
    activeposition:vector2;
    piecespawnlocation:vector2;
    yoffset:number=0;

    constructor(_matrix:matrix,piecespawnlocation:vector2){
        this.matrix = _matrix;
        this.piecespawnlocation = piecespawnlocation
        this.activeposition = piecespawnlocation;
    }
}