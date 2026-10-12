import { clone, colour3, vector2 } from "./basics.ts"
import { board, boundstype, tile, tileType } from "./board.ts";
import { alignYType, Command, gameConfig, simpleScoringSystems, spinDetection, userConfig } from "./config.ts";
import { gimmickReport } from "./gimmicks.ts";
import InputManager from "./inputmanager.ts";
import { piece } from "./pieces.ts";
import { levelsGravities, levelsLockTimes } from "./roms.ts";
import { SpinType, symmetry } from "./rotationsystems.ts";
import { game } from "./sorkurzdil.ts";
import gameFlags from "./flags.ts";

export type lockReport={
    spin:boolean,
    mini:boolean,
    immobile:boolean,
    lodge:boolean,
    morph:boolean,
    gimmickReport:gimmickReport,
}

export type movementReport={
    piece:piece,
    position:vector2,
    successful:boolean,
    rotates?:boolean,
    dies?:boolean,
    clutches?:boolean,
}

export default class MovementManager{
    game:game;

    board:board;

    spineligible=false;
    minieligible=false;

    gravityelapsed = 0;
    lockelapsed = 0;
    lockcancelsused = 0;

    lockharddropdebounce = 0;

    onLock:((lockReport:lockReport)=>void)[]=[];
    onLockLike:((pieceless:true)=>void)[]=[];

    constructor(_game:game,board:board){
        this.game = _game;
        this.board = board;
        
        if(!this.game.gameConfig.usegravity)
            this.game.gameConfig.gravity = this.game.userConfig.sdarr;

        this.game.inputManager.onKeyDown.push((command:Command)=>{
            if(this.game.gameOver || !this.game.gameOn) return;

            switch(command){
                case Command.ShiftLeft:
                    this.Move(vector2.left);
                    break;
                case Command.ShiftRight:
                    this.Move(vector2.right);
                    break;
                case Command.ShiftDown:
                    this.Move(vector2.down);
                    break;
                case Command.ShiftUp:
                    if(!this.game.gameConfig.allowShiftUp)break;
                    this.Move(vector2.up);
                    break;
                case Command.SonicDrop:
                    if(this.OverVoid()){
                        this.LockLike()
                        break
                    }
                    var drop = this.SonicDrop();
                    if(this.game.gameConfig.simplescoring === simpleScoringSystems.guideline)
                        this.game.score += Math.floor(drop * 1.5);
                    break;
                case Command.AirLock:
                    if(!this.game.gameConfig.allowAirLock) break
                    if(this.gravityelapsed > this.game.gameConfig.gravity / 2)
                        this.AttemptShift(vector2.down);
                    this.Lock();
                    break;
                case Command.HardDrop:
                    if(!this.game.gameConfig.allowHardDrop) break
                    if(this.lockharddropdebounce < this.game.userConfig.lockharddropdebounce) break
                    if(this.OverVoid()){
                        this.LockLike()
                        break
                    }
                    var drop = this.SonicDrop(true);
                    if(this.game.gameConfig.simplescoring === simpleScoringSystems.guideline)
                        this.game.score += drop * 2;
                    this.Lock();
                    break;
                case Command.RotNull:
                    if(!this.game.gameConfig.allowRotation)break;
                    this.Rotate(0);
                    break;
                case Command.RotCW:
                    if(!this.game.gameConfig.allowRotation)break;
                    this.Rotate(1);
                    break;
                case Command.Rot180:
                    if(!this.game.gameConfig.allow180 || !this.game.gameConfig.allowRotation) break
                    this.Rotate(2);
                    break;
                case Command.RotWS:
                    if(!this.game.gameConfig.allowRotation)break;
                    this.Rotate(3);
                    break;
                case Command.HoriFlip:
                    if(!this.game.gameConfig.allowFlips)break;
                    this.Hadamard(new vector2(-1,1));
                    break;
                case Command.VertFlip:
                    if(!this.game.gameConfig.allowFlips)break;
                    this.Hadamard(new vector2(1,-1));
                    break;
            }
        })
    }

    Grounded(){
        if(!this.board.activepiece)
            return false
        return !this.board.ValidShift(vector2.down,this.board.activepiece,this.board.activeposition);
    }

    OverVoid():boolean{
        if(!this.board.activepiece)
            return false

        return !isFinite(this.board.DropHeight(this.board.activepiece,this.board.activeposition).y)
    }

    //piece movement

    Leeway(fallHeight:number,_piece:piece,position:vector2){
        for(let i=1; i<=fallHeight; i++)
            if(!this.board.ValidShift(new vector2(0,-i),_piece,position))
                return false;
        return true;
    }

    AttemptShift(shift:vector2,_boundstype=this.board.boundstype){
        if(!this.board.activepiece)
            return false
        if(!this.board.ValidShift(shift,this.board.activepiece,this.board.activeposition,_boundstype))
            return false
        this.board.activeposition = this.board.activeposition.add(shift);
        return true
    }

    Move(shift:vector2){
        const success = this.AttemptShift(shift);
        if (success){
            this.LockCancel();

            this.spineligible = false;
            this.minieligible = false;
            this.justlodged = false;

            this.game.flags.nongravitydisplacementthisframe = this.game.flags.nongravitydisplacementthisframe.add(shift);

            this.EarlyLock();
        }
        return success
    }

    /*SonicDrop(){
        if(!this.board.activepiece)
            return 0

        const dropHeight = this.DropHeight()
        this.AttemptShift(dropHeight);
        
        this.game.flags.nongravitydisplacementthisframe = this.game.flags.nongravitydisplacementthisframe.add(dropHeight);
        return dropHeight.y
    }*/ //waa goodbye elegant sonic drop i need to add gimmicks

    SonicDrop(lockintent=false){
        if(!this.board.activepiece)
            return 0

        if(this.OverVoid())
            return Number.POSITIVE_INFINITY

        var usebounds = this.board.boundstype
        if((this.board.boundstype !== boundstype.normal) && this.game.gameConfig.boundlessdropsusefloorbounded && this.board.PieceInBounds(vector2.zero,this.board.activepiece,this.board.activeposition,boundstype.normal))
            usebounds = boundstype.normal;

        var dropHeight = 0
        while(true){
            const success = this.AttemptShift(vector2.down,usebounds)
            const earlylock = this.EvaluateEarlyLockGimmicks()
            if(!success) break
            if(earlylock){
                this.Lock(this.board.ValidShift(vector2.down,this.board.activepiece,this.board.activeposition) || !lockintent);
                break
            }

            if(dropHeight > (this.board.matrix.width * this.board.matrix.height)**2){
                this.LockLike()
                return dropHeight
            }
            if(dropHeight + this.board.activeposition.y + this.board.activepiece.boundingrectangle.north <= this.board.matrix.lowvanishingpoint){
                this.LockLike()
                return dropHeight
            }

            dropHeight += 1
        }
        
        this.game.flags.nongravitydisplacementthisframe = this.game.flags.nongravitydisplacementthisframe.add(vector2.down.mul(dropHeight));
        return dropHeight
    }

    justlodged = false
    morphed = false

    Lodge(flipdirection=false){
        if(!this.board.activepiece)
            return

        const lodgeattempt = this.AttemptLodge(this.board.activepiece,this.board.activeposition,flipdirection)

        if(lodgeattempt.successful){
            this.board.activepiece = lodgeattempt.piece
            this.board.activeposition = lodgeattempt.position

            this.justlodged = true
        }
    }

    AttemptLodge(_piece:piece,position:vector2,flipdirection=false):movementReport{
        for(const ir of this.game.gameConfig.lodges){
            const i = flipdirection ? ir.hadamard(new vector2(-1,1)) : ir;
            if(!this.board.ValidShift(i,_piece,position)) continue

            const [spin,mini,immobile] = this.SpinDetection(this.board.activeposition.add(i))
            if(spin || mini || immobile){
                return {
                    piece:_piece,
                    position:position.add(i),
                    successful:true,
                }
            }
        }

        return {
            piece:_piece,
            position:position,
            successful:false,
        }
    }

    //still 90 degree clockwise turns
    Rotate(turns:number){
        if(!this.board.activepiece)
            return

        let rotateattempt = this.AttemptRotate(turns,this.board.activepiece,this.board.activeposition);

        if(rotateattempt.successful){
            this.board.activepiece = rotateattempt.piece
            this.board.activeposition = rotateattempt.position

            this.LockCancel();
            this.spineligible = this.Grounded();

            const [spin,mini,immobile] = this.SpinDetection();
            this.game.flags.justspinned = spin || mini || immobile;
            //this.justlodged = false // if its lodgable it should be without any kicks but i dunno

            this.EarlyLock();
        }

        if(this.board.activepiece.lodgeability)
            this.Lodge(turns==3)
    }

    //still 90 degree clockwise turns
    AttemptRotate(turns:number,_piece:piece,position:vector2):movementReport{
        position = clone(position)

        turns = ((_piece.orientiation + turns) % _piece.symmetry) - _piece.orientiation
        turns = (turns + 4) % 4

        var usebounds = this.board.boundstype
        if((this.board.boundstype !== boundstype.normal) && this.game.gameConfig.boundlessretainboundedkicksbounded && this.board.PieceInBounds(vector2.zero,_piece,position,boundstype.normal))
            usebounds = boundstype.normal;

        let rotatedPiece = _piece.rotated(turns)

        const fromRot = _piece.orientiation;
        const toRot = rotatedPiece.orientiation;

        var i = 0;
        var firstreport:movementReport|undefined;
        for(const shift of this.game.gameConfig.kickSystem(rotatedPiece,fromRot,toRot)){
            if(i == 0)
                firstreport = {
                    piece:rotatedPiece,
                    position:position,
                    successful:false
                }

            if(this.board.ValidShift(shift,rotatedPiece,position,usebounds)){
                position = position.add(shift);
                
                if(i == 1)
                    this.minieligible = true;
                if(i > 0)
                    this.justlodged = false; // (even though a lodgeable piece shouldnt have any kicks) just in case
                return {
                    piece:rotatedPiece,
                    position:position,
                    successful:true,
                }
            }
            i++;
        }
        
        return firstreport || {
            piece:rotatedPiece,
            position:position,
            successful:false
        }
    }

    Hadamard(other:vector2){
        if(!this.board.activepiece)
            return

        let success = this.AttemptHadamard(other,this.board.activepiece,this.board.activeposition);

        if(success){
            this.LockCancel();
            this.spineligible = this.Grounded();

            const [spin,mini,immobile] = this.SpinDetection();
            this.game.flags.justspinned = spin || mini || immobile;
            
            this.EarlyLock();
        }

        if(this.board.activepiece.lodgeability)
            this.Lodge()
    }

    AttemptHadamard(other:vector2,_piece:piece,position:vector2):movementReport{
        let rotatedPiece = clone(_piece);
        rotatedPiece.Hadamard(other);

        const fromRot = _piece.orientiation;
        const toRot = (rotatedPiece.orientiation + 2) % 4;

        var i = 0;
        var firstreport:movementReport|undefined;
        for(const shift of this.game.gameConfig.kickSystem(rotatedPiece,fromRot,toRot)){
            if(i == 0)
                firstreport = {
                    piece:rotatedPiece,
                    position:position,
                    successful:false
                }

            if(this.board.ValidShift(shift,rotatedPiece,position)){
                return {
                    piece:rotatedPiece,
                    position:position.add(shift),
                    successful:false
                }
            }
            i++
        }
        
        
        return firstreport || {
            piece:rotatedPiece,
            position:position,
            successful:false
        }
    }

    /**function to calculate delayed auto shift */
    FDAS(x:number,das:number,arr:number){
        return Math.ceil(Math.max(0,(x - das)/arr));
    }

    EvaluateDAS(command:Command,deltaTime:number){
        if(!this.board.activepiece)
            return

        let direction = vector2.right;
        if(command==Command.ShiftLeft)
            direction = vector2.left;
        
        var inbounds = this.board.PieceInBounds(vector2.zero,this.board.activepiece,this.board.activeposition,boundstype.floorless);

        var usearr = this.game.userConfig.arr
        if(!inbounds){
            if(!this.game.gameConfig.dasallowedpastbounds)
                return
            if(this.game.gameConfig.dasforcedpastbounds)
                usearr = this.game.gameConfig.arr
        }

        const zero = this.game.inputManager.Held(command);
        const t = Date.now() - zero;
        const fdasref = this.FDAS(t,this.game.userConfig.das,usearr)
        var deltaSteps = fdasref - this.FDAS(t-deltaTime,this.game.userConfig.das,usearr);

        if(!isFinite(fdasref))
            deltaSteps = this.board.matrix.width

        if(inbounds && this.game.gameConfig.dasstopatbounds){
            if(command==Command.ShiftLeft)
                deltaSteps = Math.max(0,Math.min(deltaSteps,this.board.activeposition.x + this.board.activepiece.boundingrectangle.west))
            else
                deltaSteps = Math.max(0,Math.min(deltaSteps,this.board.matrix.width - this.board.activeposition.x - this.board.activepiece.boundingrectangle.east - 1))
        } else
            deltaSteps = Math.min(deltaSteps,this.board.matrix.width)

        if(this.Grounded()) // compensate for soft drop if it didnt do that this frame (because it was grounded)
            if(this.game.inputManager.Held(Command.SoftDrop))
                this.gravityelapsed += deltaTime * this.game.userConfig.sdf;
            else
                this.gravityelapsed += deltaTime;
        
        if(!isFinite(this.gravityelapsed) || isNaN(this.gravityelapsed))
            this.gravityelapsed = this.game.gameConfig.gravity * 20

        for(let i=0; i<deltaSteps; i++){
            const success = this.Move(direction);
            if(!success)
                break
            
            if(this.game.userConfig.sdfBeforeDas)
                this.Gravity();
        }
    }

    clutcheligible = false;

    SpawnLocation(_piece:piece,doclutch:boolean):movementReport{
        var spawnlocation = this.board.spawnlocation
        var spawnpiece = clone(_piece)
        var rotates = false
        var dies = false
        var clutches = false
        var bounds = _piece.bounds
        var bounding = spawnpiece.boundingrectangle
        

        if(bounds.x > this.board.matrix.width){
            if(bounds.y > this.board.matrix.width)
                throw new Error("unculled bad piece")
            rotates = true
            const rotationreport = this.AttemptRotate(1,_piece,spawnlocation)
            spawnpiece = rotationreport.piece
            spawnlocation = rotationreport.position
            bounds = spawnpiece.bounds;
            bounding = spawnpiece.boundingrectangle
        }

        var northeast = new vector2(bounding.east,bounding.north), southwest = new vector2(bounding.west,bounding.south)

        switch(this.game.gameConfig.spawnAlignY){
            case alignYType.top:
                spawnlocation = spawnlocation.add(vector2.down.mul(northeast.y))
                break
            case alignYType.bottom:
                spawnlocation = spawnlocation.add(vector2.up.mul(-southwest.y))
        }

        if(spawnlocation.x + southwest.x < 0)
            spawnlocation = new vector2(-southwest.x,spawnlocation.y)
        if(spawnlocation.x + northeast.x >= this.board.matrix.width)
            spawnlocation = new vector2(this.board.matrix.width - northeast.x - 1,spawnlocation.y)
        

        var usemargin = this.game.gameConfig.pieceSpawnMargin
        if(this.game.gameConfig.clutching && this.clutcheligible && doclutch){
            usemargin = 0
            clutches = true
        }

        if(!this.board.ValidShift(vector2.zero,spawnpiece,spawnlocation)){
            if(usemargin < 0)
                dies = true
        }else
            clutches = false

        if(usemargin >= 0){
            if(this.game.gameConfig.spawnMarginUseLeeway)
                while(!this.Leeway(usemargin,spawnpiece,spawnlocation))
                    spawnlocation = spawnlocation.add(vector2.up);
            else{
                const aboveboard = this.board.matrix.Extents().north + 1 + usemargin
                spawnlocation = new vector2(
                    spawnlocation.x,
                    Math.max(spawnlocation.y,aboveboard)
                )
            }
        }

        return {
            piece:spawnpiece,
            position:spawnlocation,
            rotates:rotates,
            dies:dies,
            clutches:clutches,
            successful:!dies,
        }
    }

    /**doesnt actually choose the piece to be spawned */
    SpawnPiece(){
        if(!this.board.activepiece)
            throw new Error("spawn no piece")

        const slR = this.SpawnLocation(this.board.activepiece,true)
        this.board.activepiece = slR.piece
        this.board.activeposition = slR.position
        if(slR.dies){
            this.game.gameOver = true;
            this.board.matrix.Die();
        }
        if(slR.clutches){
            this.game.flags.otheralerts.push({
                time:0,
                code:"generic",
                info:{
                    text:"clutch",
                    colour:colour3.fromHex("#ff00ff")
                },
            })
        }

        this.gravityelapsed = 0;
        this.lockelapsed = 0;
        this.lockcancelsused = 0;
        this.spineligible = false;
        this.minieligible = false;
        this.justlodged = false

        this.game.flags.piecechange = true;
    }
    
    SpinDetection(position:vector2=this.board.activeposition,_piece:piece|undefined=this.board.activepiece){
        if (!_piece)
            throw new Error("spin no piece");

        var immobile = true;

        for(const offset of [vector2.up,vector2.down,vector2.left,vector2.right])
            if (this.board.ValidShift(offset,_piece,position)){
                immobile = false
                break
            }

        var spin = false;
        var mini = false;
        
        const relativeright = vector2.right.rotate(4-_piece.orientiation);
        const relativeup = vector2.up.rotate(4-_piece.orientiation);
        //im just making stuff up at this point (tspins work the same way as before but i have to extend it to work for other stuff as well)
        var greatchecks = 0;
        for(const offset of [vector2.up,vector2.left,vector2.right,new vector2(1,1),new vector2(-1,1)]){
            if(!this.board.matrix.IsValid(position.add(offset.orient(relativeright,relativeup)))) 
                greatchecks++;
        }
        
        var minichecks = 0;
        for(const offset of [vector2.down,new vector2(1,-1),new vector2(-1,-1)])
            if(!this.board.matrix.IsValid(position.add(offset.orient(relativeright,relativeup)))) 
                minichecks++;
        
        var lodgechecks = 0; //only for i
        for(const offset of [vector2.up,vector2.down,new vector2(1,1),new vector2(1,-1)])
            if(!this.board.matrix.IsValid(position.add(offset.orient(relativeright,relativeup)))) 
                lodgechecks++;

        
        switch(this.game.gameConfig.spinDetection){
            case spinDetection.tspin:
                if(_piece.spinType!==SpinType.T) break
            case spinDetection.threecorner:
                if(greatchecks >=2 && minichecks >= 1)
                    spin = true
                else if(greatchecks >=1 && minichecks >= 2)
                    mini = true
        
                if (!this.minieligible && mini){
                    spin = true;
                    mini = false;
                }
                break
            case spinDetection.allmini:
            case spinDetection.allminiandimmobile:
                if(greatchecks >=2 && minichecks >= 1)
                    spin = true
                else if(greatchecks >=1 && minichecks >= 2)
                    mini = true
        
                if (!this.minieligible && mini){
                    spin = true;
                    mini = false;
                }
                if(_piece.spinType!==SpinType.T) {
                    mini = spin
                    spin = false
                }
                if(this.game.gameConfig.spinDetection===spinDetection.allminiandimmobile){
                    mini = mini || immobile;
                }
                break
            case spinDetection.sorkurzdil: //my own spin checks yippee (they kind of suck)
                if(_piece.spinType === SpinType.T){
                    if(greatchecks >=2 && minichecks >= 1)
                        spin = true
                    else if(greatchecks >=1 && minichecks >= 2)
                        mini = true
                }
                if(_piece.spinType === SpinType.S){
                    if(greatchecks >=2)
                        spin = true
                    else if(greatchecks >=1 && minichecks >= 2 && immobile)
                        spin = true
                    else if(greatchecks >=1 && immobile)
                        mini = true
                }
                if(_piece.spinType === SpinType.I){
                    if(lodgechecks >= 1 && immobile)
                        spin = true
                    else if(immobile)
                        mini = true
                }
                if (_piece.spinType === SpinType.immobilespin){
                    spin = immobile;
                }
        
                if (!this.minieligible && mini){
                    spin = true;
                    mini = false;
                }
                break
            case spinDetection.immobilespin:
                spin = immobile;
                break
        }

        return [spin, mini, immobile];
    }

    //locking

    LockCancel(){
        if (this.lockelapsed <= 0)
            return;
        if (this.lockcancelsused >= this.game.gameConfig.lockcancels)
            return;
        this.lockelapsed = 0;
        this.lockcancelsused++;
    }

    PlaceActivePiece(){
        if(!this.board.activepiece)
            return

        for (const offset of this.board.activepiece.tileoffsets){
            const coords = this.board.activeposition.add(offset);
            const _tile = new tile(this.board.activepiece?.tileModel,Date.now() - this.game.gameConfig.are)
            _tile.tileType = this.board.activepiece.tileType;
            this.board.matrix.SetTile(coords,_tile);
        }
    }

    /**this function just makes the piece disappear 
     * 
     * currently only used when the piece falls into the void
    */
    LockLike(){
        if(this.game.gameConfig.voiddeath){
            this.game.gameOver = true;
            this.board.matrix.Die();
        }

        for(const call of this.onLockLike){
            call(true)
        }
    }

    Lock(earlylock=false){
        if(!this.board.activepiece)
            return
        if(!this.board.PieceNoncolliding(vector2.zero,this.board.activepiece,this.board.activeposition) || !this.board.PieceInBounds(vector2.zero,this.board.activepiece,this.board.activeposition))
            return
        if(this.game.gameConfig.verticallineclears && !this.board.PieceStrictlyInBounds(vector2.zero,this.board.activepiece,this.board.activeposition))
            return

        this.clutcheligible = false

        var [spin, mini, immobile] = this.SpinDetection()
        if (!this.spineligible)
            [spin, mini, immobile] = [false,false,false]

        var runninggimmick = new gimmickReport();
        for(const i of this.game.gameConfig.prelock){
            const result = i(this.board,this.game)
            runninggimmick = runninggimmick.add(result)
        }
        this.PlaceActivePiece()
        for(const i of this.game.gameConfig.postlock){
            const result = i(this.board,this.game)
            runninggimmick = runninggimmick.add(result)
        }

        runninggimmick.lock ||= earlylock;
        
        for(const call of this.onLock){
            call({
                spin:spin,
                mini:mini,
                immobile:immobile,
                lodge:this.justlodged,
                morph:this.morphed,
                gimmickReport:runninggimmick
            })
        }
    }

    EvaluateEarlyLockGimmicks(){
        for(const i of this.game.gameConfig.earlylock){
            const result = i(this.board,this.game)
            if(result.lock)
                return true
        }
        return false
    }

    EarlyLock(earlylock=true){
        if(this.EvaluateEarlyLockGimmicks())
            this.Lock(earlylock)
    }

    //every frame kind of thing

    Gravity(){
        let exhaust = 0;

        if(this.game.gameConfig.levelgravity)
            this.game.gameConfig.gravity = levelsGravities[Math.min(levelsGravities.length-1,this.game.levels)]
        
        if(this.game.gameConfig.levelLocktimes)
            this.game.gameConfig.lockTime = levelsLockTimes[Math.min(levelsLockTimes.length-1,this.game.levels)]
        
        while (this.gravityelapsed > this.game.gameConfig.gravity){
            this.gravityelapsed -= this.game.gameConfig.gravity;
            const success = this.AttemptShift(vector2.down);
            if(!success)
                break;
            if(this.EvaluateEarlyLockGimmicks()){
                this.Lock(true)
                break
            }

            if(this.game.gameConfig.simplescoring === simpleScoringSystems.guideline && this.game.inputManager.Held(Command.SoftDrop))
                this.game.score++;
            
            exhaust++;
            if(exhaust > 3000){
                throw new Error("your took too long");
            }
        }
    }

    WhileGrounded(deltaTime:number){
        this.gravityelapsed = 0;

        if(this.game.gameConfig.usegravity || (this.game.inputManager.Held(Command.SoftDrop) && !this.game.gameConfig.subzerogravity))
            this.lockelapsed += deltaTime;

        let lockTime = this.game.gameConfig.gravity
        if(this.game.gameConfig.useLockTime)
            lockTime = this.game.gameConfig.lockTime

        if(this.lockelapsed > lockTime){
            this.Lock();
            this.lockharddropdebounce = 0;
        }
    }

    StepSoftDrop(deltaTime:number){
        if(!this.board.activepiece)
            return

        var displacement = (this.game.userConfig.sdf - 1);
        if(this.game.userConfig.usesdarr || !this.game.gameConfig.usegravity)
            displacement = 1 / this.game.userConfig.sdarr * this.game.gameConfig.gravity;

        console.log(displacement)

        if(!isFinite(displacement) || isNaN(displacement)){
            if(this.OverVoid()){
                this.LockLike()
                delete this.game.inputManager.heldKeys[Command.SoftDrop]
                return
            }
            displacement = -this.board.DropHeight(this.board.activepiece,this.board.activeposition).y * this.game.gameConfig.gravity;
        }
            
        this.gravityelapsed += displacement * deltaTime;

        if(this.game.gameConfig.gravity !== 0)
            this.game.flags.nongravitydisplacementthisframe = this.game.flags.nongravitydisplacementthisframe.add(vector2.down.mul(displacement / this.game.gameConfig.gravity));
        else
            this.game.flags.nongravitydisplacementthisframe = this.game.flags.nongravitydisplacementthisframe.add(this.board.DropHeight(this.board.activepiece,this.board.activeposition));
    }

    WhileInAir(deltaTime:number){
        this.LockCancel();

        if(this.game.gameConfig.usegravity)
            this.gravityelapsed += deltaTime;
        
        if(this.game.inputManager.Held(Command.SoftDrop))
            this.StepSoftDrop(deltaTime)

        this.Gravity();
    }

    Update(deltaTime:number){
        this.lockharddropdebounce += deltaTime;

        if(this.game.inputManager.Held(Command.ShiftLeft) && !this.game.inputManager.Held(Command.ShiftRight)){
            this.EvaluateDAS(Command.ShiftLeft,deltaTime);
        }
        if(!this.game.inputManager.Held(Command.ShiftLeft) && this.game.inputManager.Held(Command.ShiftRight)){
            this.EvaluateDAS(Command.ShiftRight,deltaTime);
        }

        if(this.Grounded()){
            this.WhileGrounded(deltaTime);
        }else{
            this.WhileInAir(deltaTime);
        }

        if(this.board.activepiece && this.board.activeposition.y + this.board.activepiece.boundingrectangle.north <= this.board.matrix.lowvanishingpoint)
            this.LockLike()
    }
}