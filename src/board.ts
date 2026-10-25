import { colour3, vector2 } from './basics.ts'
import { tileModels, tileModel } from './tilemodels.ts';
import { piece, uncenteredRectangle } from './pieces.ts';
import { gameConfig } from './config.ts';

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

export type lineToclear = {
    row:number,
    death:number,
    isvertical?:boolean,
}

export class matrix{
    hashtable:{[key:string]:tile}={};
    toclear:lineToclear[]=[];
    width:number;
    height:number;
    effectiveUp:number;
    effectiveLeft:number;
    effectiveRight:number;
    effectiveDown:number;

    onUpdate:(()=>void)[]=[];

    gameConfig:gameConfig;
    
    get useUp():number{
        if(this.gameConfig.extendheight < 0)
            return this.effectiveUp
        else
            return Math.min(this.effectiveUp,this.height + this.gameConfig.extendheight)
    }

    get useLeft():number{
        if(this.gameConfig.extendclearxrequirement)
            return Math.min(0,this.effectiveLeft)
        else
            return 0
    }

    get useRight():number{
        if(this.gameConfig.extendclearxrequirement)
            return Math.max(this.width,this.effectiveRight)
        else
            return this.width
    }

    get lowvanishingpoint():number{
        if(this.gameConfig.dynamicvanishingpoint)
            return this.effectiveDown - this.gameConfig.lowvanishingpoint
        else
            return -this.gameConfig.lowvanishingpoint
    }

    constructor(_gameConfig:gameConfig)
    {
        this.width = _gameConfig.width;
        this.height = _gameConfig.height;
        this.effectiveUp = 0;
        this.effectiveDown = 0;
        this.effectiveLeft = 0;
        this.effectiveRight = _gameConfig.width;
        this.gameConfig = _gameConfig
    }

    //basic function

    Hash(_vector2:vector2):string{
        return _vector2.x + " " + _vector2.y
    }

    Unhash(hashed:string):vector2{
        const zzz = hashed.split(" ")
        return new vector2(Number(zzz[0]),Number(zzz[1]))
    }

    rows:{[key:string]:[number]}={};
    columns:{[key:string]:[number]}={};

    Extents():uncenteredRectangle{
        const extents:uncenteredRectangle = {
            north:-1,
            south:0,
            east:this.width-1,
            west:0
        }
        for(const [k,_] of Object.entries(this.hashtable)){
            const i = this.Unhash(k)
            extents.north = Math.max(extents.north,i.y)
            extents.south = Math.min(extents.south,i.y)
            extents.east = Math.max(extents.east,i.x)
            extents.west = Math.min(extents.west,i.x)
        }
        return extents;
    }

    UpdateEffectiveExtents(){
        const extents = this.Extents()
        this.effectiveUp = extents.north + 1
        this.effectiveRight = extents.east + 1
        this.effectiveDown = extents.south
        this.effectiveLeft = extents.west
    }

    /**call this everytime the board updates (optimisation could be to not call this so much) */
    OnBoardUpdate(recalculateextents=true){
        if(recalculateextents)
            this.UpdateEffectiveExtents()

        for(const call of this.onUpdate)
            call()
    }

    GetTile(coords:vector2|string):tile|undefined {
        if(coords instanceof vector2)
            coords = this.Hash(coords)
        return this.hashtable[coords]
    }

    /**say updatesuppressed if youre going to set many tiles and then call onboardupdate after*/
    SetTile(coords:vector2|string,_tile:tile,updatesuppressed=false) {
        if(_tile.isEmpty && !_tile.wound)
            return
        var key = coords
        if(key instanceof vector2)
            key = this.Hash(key)
        if(typeof coords === "string")
            coords = this.Unhash(coords)
        if(coords.y <= this.lowvanishingpoint)
            return

        this.hashtable[key] = _tile

        this.effectiveUp = Math.max(this.effectiveUp,coords.y + 1);
        this.effectiveRight = Math.max(this.effectiveRight,coords.x + 1);
        this.effectiveDown = Math.min(this.effectiveDown,coords.y);
        this.effectiveLeft = Math.min(this.effectiveLeft,coords.x);

        if(!updatesuppressed)
            this.OnBoardUpdate(false)
    }

    /**say updatesuppressed if youre going to delete many tiles and then call onboardupdate after*/
    DeleteTile(coords:vector2|string,updatesuppressed=false) {
        if(coords instanceof vector2)
            coords = this.Hash(coords)
        delete this.hashtable[coords];
        
        if(!updatesuppressed)
            this.OnBoardUpdate()
    }

    /**doesnt destroy hardy tiles */
    WeakDestroyTile(coords:vector2,updatesuppressed=false) {
        const _tile = this.GetTile(coords)
        if(!_tile) return
        if(_tile.hardy) return
        delete this.hashtable[this.Hash(coords)];
        
        if(!updatesuppressed)
            this.OnBoardUpdate()
    }

    //doesnt modify the board

    /*cannot be rendered*/
    IsUnrenderable(coords:vector2) {
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

    /*can be moved into (doesnt check bounds)*/
    IsValid(coords:vector2) { // is this literally exactly the same as isunrenderable
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
    GetAllRenderablePositions(){
        var nonempties:vector2[] = []
        for(const [k,i] of Object.entries(this.hashtable))
            if(!i.isEmpty || i.wound)
                nonempties.push(this.Unhash(k))

        return nonempties;
    }
    /**get all the tiles that exist */
    GetAllDefinedPositions(){
        var nonempties:tile[] = []
        for(const [_,i] of Object.entries(this.hashtable))
            nonempties.push(i)
        
        return nonempties;
    }

    VirtualPC(){
        for (let y=this.effectiveUp - 1; y>=0; y--)
            for (let x=0; x<this.width; x++)
                {
                    const tile = this.GetTile(new vector2(x,y));
                    if(!tile)
                        continue
                    if(tile.isEmpty)
                        continue
                    if(tile.wound)
                        continue
                    if(!tile.death)
                        return false
                }
        return true;
    }

    PerfectClear(){
        for(const [k,i] of Object.entries(this.hashtable)){
            if(i.isEmpty)
                continue
            if(i.wound)
                continue
            if(!i.death)
                return false
        }
        return true
    }

    GarbageLineCount(){
        let garbagelines = 0;
        for(let y=0; y<this.effectiveUp; y++){
            let isgarbage = false
            for(let x=0; x<this.width; x++){
                let i = new vector2(x,y);
                let thile = this.GetTile(i);
                if(this.IsUnrenderable(i) || !thile) continue
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
            if(thile&&!this.IsUnrenderable(i)) continue
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

    PieceLineClears(_piece:piece,position:vector2){
        const uniqueylevels:number[] = []
        const pieceoccupies:string[] = []
        for(const off of _piece.tileoffsets){
            const i = off.add(position)
            if(!uniqueylevels.includes(i.y))
                uniqueylevels.push(i.y)
            pieceoccupies.push(i.toString())
        }

        var lineclears = 0

        for(const y of uniqueylevels){
            let lineclear = true
            for (let x = this.useLeft; x < this.useRight; x++) {
                if(this.ClearEligible(new vector2(x,y)) || pieceoccupies.includes(new vector2(x,y).toString())) continue
                lineclear = false
                break
            }

            if(lineclear)
                lineclears++
        }

        return lineclears
    }

    ColumnHighest(x:number){
        for (let y = this.effectiveUp - 1; y >= this.effectiveDown; y--) {
            if(!this.IsValid(new vector2(x,y)))
                return y
        }
        return this.effectiveDown - 1
    }

    //modifies the board

    ClearPerfect(){
        for(const [k,i] of Object.entries(this.hashtable)){
            if(i.isEmpty)
                continue
            if(i.wound)
                continue
            if(!i.death)
                this.DeleteTile(k,true)
        }

        this.OnBoardUpdate()
    }

    ClearLine(clearY:number,noshiftdown=false){
        const aux:{[key:string]:tile} = {}
        for(const [k,i] of Object.entries(this.hashtable)){
            if(this.Unhash(k).y == clearY)
                this.DeleteTile(this.Unhash(k),true);
            if(noshiftdown || this.Unhash(k).y <= clearY)
                continue
            this.DeleteTile(this.Unhash(k),true);
            aux[k] = i
        }
        for(const [k,i] of Object.entries(aux))
            this.SetTile(this.Unhash(k).add(vector2.down),i,true)
        if(!noshiftdown)
            for(const i of this.toclear)
                if(i.row > clearY)
                    i.row--

        this.OnBoardUpdate()
    }

    UpShift(fromY:number){
        const aux:{[key:string]:tile} = {}
        for(const [k,i] of Object.entries(this.hashtable)){
            if(this.Unhash(k).y < fromY)
                continue
            this.DeleteTile(this.Unhash(k),true);
            aux[k] = i
        }
        for(const [k,i] of Object.entries(aux))
            this.SetTile(this.Unhash(k).add(vector2.up),i,true)
        for(const i of this.toclear)
            if(i.row >= fromY)
                i.row++
                
        this.effectiveUp ++;

        this.OnBoardUpdate(false)
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
        const lineclears:number[] = [];
        const deletion:number[]=[];
        for(const i of this.toclear){
            if(i.isvertical)
                continue
            const deadFor = new Date().getTime() - i.death;
            if(deadFor < minDeadFor)
                continue;
            lineclears.push(i.row);
            this.ClearLine(i.row,noshiftdown);
            deletion.unshift(this.toclear.indexOf(i))
        }
        for(const i of deletion)
            this.toclear.splice(i,1)
        return lineclears;
    }

    ClearLinesIncludeVert(minDeadFor=0){
        for(let eks=0; eks<this.width; eks++){
            for(let why=0; why<this.effectiveUp; why++){
                let i = new vector2(eks,why);
                const _tile = this.GetTile(i);
                if(!_tile)continue;
                if(!_tile.death)continue;
                if(_tile.death < minDeadFor)continue;
                this.DeleteTile(i,true);
            }
        }

        this.OnBoardUpdate()
    }

    MarkClears(){
        let lineclears = 0;
        let diglineclears = 0;
        for(let y=this.effectiveDown; y<this.effectiveUp; y++){
            const _tile = this.GetTile(new vector2(0,y));
            if(!_tile) continue; //this only works because if one tile isnt here we dont have to check that the rest is complete!!!
            if(!_tile.countstoclear) continue;
            let completerow = true;
            const death = _tile.death;
            if(death !== undefined) continue;

            let isdig = false;

            for(let x=this.useLeft; x<this.useRight; x++){
                let i = new vector2(x,y);
                let thile = this.GetTile(i);
                if(this.IsUnrenderable(i) || !thile || !thile.countstoclear){
                    completerow =false;
                    break;
                }
                if(thile.isGarbage)
                    isdig = true
            }

            if (!completerow) continue;
            lineclears++;
            for(const [k,i] of Object.entries(this.hashtable))
                if(this.Unhash(k).y == y)
                    i.death = new Date().getTime();
            this.toclear.push({
                row:y,
                death:Date.now(),
            })

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
                if(this.IsUnrenderable(i) || !this.GetTile(i)?.countstoclear){
                    completerow =false;
                    break;
                }
            }

            if (!completerow) continue;
            lineclears++;
            for(const [k,i] of Object.entries(this.hashtable))
                if(this.Unhash(k).x == eks)
                    i.death = new Date().getTime();
            this.toclear.push({
                row:eks,
                death:Date.now(),
                isvertical:true,
            })
        }
        return lineclears;
    }

    GreyAll(){
        const nonempties = this.GetAllRenderablePositions()
        for(const i of nonempties){
            const tile = this.GetTile(i)
            if(!tile) continue
            tile.tileModel = tileModels.garbage
        }
    }

    Die(){
        const nonempties = this.GetAllRenderablePositions()
        for(const i of nonempties){
            const tile = this.GetTile(i)
            if(!tile) continue
            if(Math.random() > 1/3) continue
            this.DeleteTile(i)
        }
    }
}

export enum boundstype{
    boundless,
    strict,
    dynamic,
    wallless,
    floorless,
    tower,
    platform,
}

export class board{
    matrix:matrix;
    activepiece:piece|undefined;
    activeposition:vector2;
    spawnlocation:vector2;
    yoffset=0;

    activeup=vector2.up;
    activeright=vector2.right;

    boundstype=boundstype.dynamic

    constructor(_matrix:matrix,piecespawnlocation:vector2){
        this.matrix = _matrix;
        this.spawnlocation = piecespawnlocation
        this.activeposition = piecespawnlocation;
    }

    InBounds(coords:vector2,_boundstype:boundstype=this.boundstype):boolean{
        if(this.matrix.gameConfig.extendheight >= 0)
            if(coords.y >= this.matrix.height + this.matrix.gameConfig.extendheight)
                return false
        switch(_boundstype){
            case boundstype.boundless:
                return true
            case boundstype.wallless:
                if(coords.y < 0)
                    return false
                return true
            case boundstype.tower:
                if(coords.y < 0 && coords.x >= 0 && coords.x < this.matrix.width)
                    return false
                return true
            case boundstype.floorless:
                if(coords.x < 0 || coords.x >= this.matrix.width)
                    return false
                return true
            case boundstype.platform:
                if(coords.y == -1 && coords.x >= 0 && coords.x < this.matrix.width)
                    return false
                return true
            case boundstype.strict:
                if(coords.x < 0) return false;
                if(coords.y < 0) return false;
                if(coords.x >= this.matrix.width) return false;
                return true
            case boundstype.dynamic:
                if(coords.x < this.matrix.useLeft) return false;
                if(coords.y < 0) return false;
                if(coords.x >= this.matrix.useRight) return false;
                return true
        }
    }

    /**matrix is valid and in board bounds */
    IsValid(coords:vector2):boolean{
        return this.InBounds(coords) && this.matrix.IsValid(coords)
    }

    InMatrix(coords:vector2):boolean{
        if(coords.x < 0) return false;
        if(coords.y < 0) return false;
        if(coords.x >= this.matrix.width) return false;
        if(coords.y >= this.matrix.height) return false;
        return true
    }

    PointsToVoid(position:vector2,direction:vector2){
        return this.InBounds(position.add(direction.normalise().mul(this.matrix.width * this.matrix.height)))
    }

    PieceNoncolliding(shift:vector2,_piece:piece,position:vector2,_boundstype:boundstype=this.boundstype){
        if(!this.PieceInBounds(shift,_piece,position,_boundstype)) return false
        for (let i=0; i<_piece.tileoffsets.length; i++){
            const offset = _piece.tileoffsets[i];
            if(!this.matrix.IsValid(position.add(offset).add(shift))){
                return false;
            }
        }
        return true;
    }

    PieceStrictlyInBounds(shift:vector2,_piece:piece,position:vector2,_boundstype:boundstype=this.boundstype){
        for (let i=0; i<_piece.tileoffsets.length; i++){
            const offset = _piece.tileoffsets[i];
            if(!this.InMatrix(position.add(offset).add(shift)))
                return false;
        }
        return true;
    }

    PieceInBounds(shift:vector2,_piece:piece,position:vector2,_boundstype:boundstype=this.boundstype){
        for (let i=0; i<_piece.tileoffsets.length; i++){
            const offset = _piece.tileoffsets[i];
            if(!this.InBounds(position.add(offset).add(shift),_boundstype))
                return false;
        }
        return true;
    }

    /**switches between valid placement and in bounds based on active piece phasing*/
    ValidShift(shift:vector2,_piece:piece,position:vector2,_boundstype:boundstype=this.boundstype){
        if(this.matrix.gameConfig.activepiecephasethroughblocks)
            return this.PieceInBounds(shift,_piece,position,_boundstype);
        else
            return this.PieceNoncolliding(shift,_piece,position,_boundstype);
    }

    /**how much can you shift downwards before you hit something (aka ghost piece calculation)
     * 
     * also its actualy a vector2 for the offset that you make for the drop
     * 
     * you can also use this for autoshifting
     * 
     * this uses placement checking so you can use it with harddrop
    */
    DropHeight(_piece:piece,position:vector2,dropdirection=vector2.down,_boundstype:boundstype=this.boundstype):vector2{
        let dropHeight = vector2.zero;
        let exhaust = 0

        var usebounds = this.boundstype
        if((this.boundstype !== boundstype.strict) && this.matrix.gameConfig.boundlessdropsusefloorbounded && this.PieceInBounds(vector2.zero,_piece,position,boundstype.strict))
            usebounds = boundstype.strict;

        while(this.PieceNoncolliding(dropHeight.add(dropdirection),_piece,position,usebounds) && this.PieceInBounds(dropHeight.add(dropdirection),_piece,position,usebounds)){
            dropHeight = dropHeight.add(dropdirection);
            
            if(dropHeight.sqMag() > (this.matrix.width * this.matrix.height)**2)
                return new vector2(0,Number.NEGATIVE_INFINITY)
            if(dropHeight.add(position).y + _piece.boundingrectangle.north <= this.matrix.lowvanishingpoint)
                return new vector2(0,Number.NEGATIVE_INFINITY)

            exhaust++
            if(exhaust > 3000000)
                throw new Error("your taken too long")
        }
        return dropHeight;
    }
}