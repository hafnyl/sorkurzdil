import { palette } from './roms.ts'
import { colour3, modular, vector2 } from './basics.ts'
import { game, gameManager } from './sorkurzdil.ts';
import gameFlags from './flags.ts';
import { board, matrix, tile } from './board.ts';
import { simpleKickType, simplifyKickType } from './rotationsystems.ts';
import { cameraMode } from './config.ts';
import { CORoffsets, piece } from './pieces.ts'
import { tileModel } from './tilemodels.ts';
import { movementReport } from './movementmanager.ts';

const dither2 = tileModel.dither2()

function FDecay(x:number){
    return 1 - Math.exp(-x/32);
}

function lerp(a:number,b:number,t:number){
    return a + (b - a) * t
}

function flipy(x:vector2){
    return new vector2(x.x,-x.y);
}

export default class MatrixRendering {

    latePiece = undefined as piece|undefined;

    boardtilesize:vector2;
    tilesize:vector2;

    get gridwidth(){
        return this.tilesize.div(6);
    };
    framewidth:vector2=new vector2(8,8);

    /**function to scale vector by tile lengths*/
    FSTL(x:vector2,tilesize=this.boardtilesize){
        return x.hadamard(tilesize);
    }

    FSTL2(x:vector2,tilesize=this.boardtilesize){
        return x.hadamard(tilesize.add(this.gridwidth));
    }

    //configuration
    offsetfactor = 0.6;
    rotatefactor = 0.02;
    shakefactor = 7;

    gameManager:gameManager;
    game:game;
    flags:gameFlags;
    board:board;

    canvas:HTMLCanvasElement;
    ctx:CanvasRenderingContext2D;
    origin:vector2 = vector2.zero;

    drawnMatrix(){
        const drawnMatrixWidth = this.board.matrix.width
        const drawnMatrixHeight = this.board.matrix.height
        const cumulativeGridWidth = (this.board.matrix.width - 1)
        const cumulativeGridHeight = (this.board.matrix.height - 1)
        return this.FSTL(new vector2(drawnMatrixWidth,drawnMatrixHeight))
        .add(this.framewidth.mul(2))
        .add(new vector2(cumulativeGridWidth,cumulativeGridHeight).hadamard(this.gridwidth));
    }

    matrixTopCoords(){
        let drawnMatrixHeight = this.board.matrix.height
        let extraheight = 0;
        if(this)
        return ((drawnMatrixHeight - 1) / 2 + extraheight) * this.boardtilesize.y;
    }

    cullline = 0;

    FillRect(start:vector2,size:vector2,zoom=this.matrixzoom,bypassboardoffset=true,garbageculling=false){
        if(!bypassboardoffset){
            start = new vector2(start.x,start.y - this.boardtilesize.y * this.board.yoffset)
            var uselowercull = this.cullline
            if(!garbageculling){
                uselowercull = this.CoordsToScreenPos(vector2.up.mul(this.board.matrix.lowvanishingpoint +0.5)).y
            }
            if(start.y > uselowercull)
                return
            if(start.y + size.y > uselowercull)
                size = new vector2(size.x,uselowercull - start.y)
        }

        if(zoom==1||zoom<=0){
            this.ctx.fillRect(
                Math.round(start.x),
                Math.round(start.y),
                Math.round(size.x),
                Math.round(size.y),
            )
            return
        }
        const transformedStart = start.mul(zoom);
        const transformedSize = size.mul(zoom);
        const transformedStartRoundoff = new vector2(Math.round(transformedStart.x),Math.round(transformedStart.y));
        const roundoffOffset = transformedStartRoundoff.sub(transformedStart);
        const transformedSizeRoundoff = new vector2(transformedSize.x - roundoffOffset.x,transformedSize.y - roundoffOffset.y);


        this.ctx.fillRect(
            Math.round(transformedStartRoundoff.x),
            Math.round(transformedStartRoundoff.y),
            Math.round(transformedSizeRoundoff.x),
            Math.round(transformedSizeRoundoff.y),
        )
    }

    DrawSquare(_tileModel:tileModel,screenpos:vector2,zoom=this.matrixzoom,bypassboardoffset=true,garbageculling=false,tilesize=this.boardtilesize){
        if (_tileModel.isNull)
            return;


        for(const rect of _tileModel.rectangles){
            const colour = rect.evaluateColour();
            this.ctx.fillStyle = colour.toHex();
            this.ctx.globalAlpha = colour.a;
            
            const start = screenpos.sub(tilesize.div(2)).add(this.FSTL(rect.position,tilesize));
            const size = this.FSTL(rect.size,tilesize);
            this.FillRect(start,size,zoom,bypassboardoffset,garbageculling);
        }
        /**for(const imageRect of _tileModel.images){
            const imageName = imageRect.image;
            let image = imagesCache[imageName]
            if(!image && !loading[imageName]){
                image = new Image();
                image.src = imageName;
                loading[imageName] = true;
                image.addEventListener("load", () => {
                    imagesCache[imageName] = image;
                });
            }
            if(!image)
                continue;
            this.ctx.globalAlpha = imageRect.alpha;

            const start = screenpos.sub(this.tilesize.div(2)).add(this.FSTL(imageRect.position))
            const size = this.FSTL(imageRect.size);
            this.ctx.drawImage(
                image,
                Math.floor(start.x),
                Math.floor(start.y),
                Math.floor(size.x),
                Math.floor(size.y),
            );
        }*/ //deprecating this because i dont need images right now and i want to revamp drawing
    }

    DrawTile(_tile:tile,screenpos:vector2,bypassboardoffset=false){
        var _tileModel = _tile.tileModel;

        if(this.game.gameOver){
            this.DrawSquare(_tileModel.coloured(palette.one).intersection(dither2),screenpos,this.matrixzoom,bypassboardoffset);
            return
        }

        if(!_tile.birth)
            throw new Error("null tile")

        var age = (Date.now() - _tile.birth)/1000 - 0.5;

        if(this.game.userConfig.boardGreying && _tileModel.grey)
            _tileModel = _tileModel.lerpq(palette.one,FDecay(age))

        if (_tile.wound){
            const woundedness = _tile.wound / this.game.gameConfig.woundsclearby;
            _tileModel = new tileModel(palette.wound).lerp(palette.one,1 - woundedness);
        }
        
        if (age <= 0)
            _tileModel = _tileModel.lerpq(palette.shine,-age*2);

        if (_tile.death){
            const deadFor = Date.now() - _tile.death;
            _tileModel = _tileModel.withOpacity(1 - Math.min(1,deadFor / (this.game.gameConfig.lineclearare + this.game.gameConfig.linecleartime - (this.gameManager.lineclearare ? this.gameManager.initialare : 0))));
        }

        this.DrawSquare(_tileModel,screenpos,this.matrixzoom,bypassboardoffset,_tile.isGarbage);
    }

    Danger():[number,string]{
        const activebounds = this.board.activepiece?.bounds || new vector2(0,2)
        const nextbounds = this.gameManager.queue[0]?.bounds || new vector2(0,2)
        const holdbounds = this.gameManager.hold[0]?.bounds || new vector2(0,0)
        var danger = this.board.matrix.Extents().north + 1 - this.board.matrix.height + Math.max(activebounds.x,activebounds.y) + Math.floor(Math.max(nextbounds.y,holdbounds.y)/2-0.5) + 1
        var dangercolour = palette.two.toHex()

        if(this.board.activepiece
            && !this.gameManager.movementManager.OverVoid()
            && this.gameManager.PlacementCouldKill(this.board.DropHeight(this.board.activepiece,this.board.activeposition))
        ){
            dangercolour = palette.tri.toHex()
            danger *= 3
        }

        return [danger,dangercolour]
    }

    DrawMatrixBackground(){
        const _drawnMatrix = this.drawnMatrix();

        this.ctx.globalAlpha = 1
        this.ctx.fillStyle = palette.one.toHex();

        if(!this.game.gameOver){
            var [danger,dangercolour] = this.Danger();

            if(danger > 0){
                this.ctx.fillStyle = Math.sin(Date.now() / 1000 * (24 + danger)) > 0 ? dangercolour : palette.zro.toHex()
            }
        }

        this.FillRect(_drawnMatrix.flip().div(2),_drawnMatrix)
        this.ctx.fillStyle = palette.zro.toHex();
        this.FillRect(_drawnMatrix.flip().div(2).add(this.framewidth),_drawnMatrix.sub(this.framewidth.mul(2)))
    }

    /*input screenpos is the center of the matrix*/
    CoordsToScreenPos(coords:vector2){
        const _drawnMatrix = this.drawnMatrix();
        
        const originX = - (_drawnMatrix.x - this.boardtilesize.x) / 2, originY = + (_drawnMatrix.y - this.boardtilesize.y) / 2
        const origin = _drawnMatrix.sub(this.boardtilesize).flip().div(2)
        
        return flipy(origin.add(this.FSTL(coords)).add(this.framewidth).add(coords.hadamard(this.gridwidth)))
    }

    DrawMatrix(){
        const nonempties = this.board.matrix.GetAllRenderablePositions()

        for(let i=0; i<nonempties.length; i++){
            const coords = nonempties[i];
            const tile = this.board.matrix.GetTile(coords)
            if(!tile) continue;
            this.DrawTile(tile,this.CoordsToScreenPos(coords),false)
        }
    }

    DrawPiece(piece:piece,screenpos:vector2,_tileModel:tileModel,showCOR=false,zoom=this.matrixzoom,bypassboardoffset=true,tilesize=this.boardtilesize){
        _tileModel = _tileModel || piece.tileModel;
        for (let i=0; i<piece.tileoffsets.length; i++){
            const offset = piece.tileoffsets[i];
            this.DrawSquare(_tileModel,screenpos.add(flipy(this.FSTL2(offset,tilesize))),zoom,bypassboardoffset,false,tilesize)
        }

        if(!showCOR||!this.game.gameConfig.allowRotation)return;

        const useoffset = CORoffsets[simplifyKickType(piece.kickType)]
        const offset = flipy(this.FSTL2(useoffset.rotate(piece.orientiation),tilesize));
        let CORpos = screenpos.add(offset)
        this.ctx.globalAlpha *= this.game.userConfig.COROpacity
        this.ctx.fillStyle = (_tileModel.whitebased && useoffset.sqMag() <= 0.01) ? palette.zro.toHex() : palette.one.toHex();
        
        this.FillRect(CORpos.sub(this.CORsize.div(2)),this.CORsize,zoom,bypassboardoffset)
    }

    /*DrawPieceCompensate(piece:piece,screenpos:vector2,_tileModel:tileModel,showCOR=false,zoom=true){
        const compensation = roms.compensations[simplifyKickType(piece.kickType)].flip();

        this.DrawPiece(piece,screenpos.add(flipy(this.FSTL(compensation))),_tileModel,showCOR,zoom);
    }*/ // renderer has a copy of this already as well is there a difference idk

    ActivePieceDrawnPosition(){
        let usepos =this.board.activeposition;
        if(!this.gameManager.movementManager.Grounded() && this.game.gameConfig.gravity>0)
            if(this.game.userConfig.smoothGravity)
                usepos = usepos.add(new vector2(0,-this.gameManager.movementManager.gravityelapsed / this.game.gameConfig.gravity));
            else if(this.gameManager.movementManager.gravityelapsed / this.game.gameConfig.gravity >= 0.5)
                usepos = usepos.add(new vector2(0,-0.5));

        return usepos;
    }

    /*DrawQueue(){
        const _drawnMatrix = this.drawnMatrix();
        const toprightX = (_drawnMatrix.x - this.tilesize.x) / 2, toprightY = -(_drawnMatrix.y - this.tilesize.y) / 2
        const topright = new vector2(toprightX,toprightY);

        for(let i=0; i<this.gameManager.queue.length; i++){
            const queuePiece = this.gameManager.queue[i];
            var useModel = queuePiece.tileModel;
            if(this.game.gameOver)
            useModel = new tileModel(palette.garbage);

            this.DrawPieceCompensate(queuePiece,
            topright.add(this.FSTL(new vector2(3 + i * 4.5,1))),
            useModel
            );
        }
    }

    DrawHold(){
        const _drawnMatrix = this.drawnMatrix();
        const topleftX = - (_drawnMatrix.x - this.tilesize.x) / 2, topleftY = - (_drawnMatrix.y - this.tilesize.y) / 2
        const topleft = new vector2(topleftX,topleftY);

        for(let i=0; i<this.gameManager.hold.length; i++){
            const queuePiece = this.gameManager.hold[i];
            var useModel = queuePiece.tileModel;
            if(this.gameManager.holdsused >= this.game.gameConfig.holds || this.game.gameOver)
            useModel = new tileModel(palette.garbage);
            
            this.DrawPieceCompensate(queuePiece,
            topleft.add(this.FSTL(new vector2(-3 - i * 4.5,1))),
            useModel
            );
        }
    }*/ //i dunno why i still have these these would draw on the same layer as the board and rotate and stuff

    DrawGhost(){
        if(!this.board.activepiece) return;
        if(this.gameManager.movementManager.OverVoid()) return
        let landpos =this.board.activeposition.add(this.board.DropHeight(this.board.activepiece,this.board.activeposition));
        let ghostModel = this.board.activepiece.tileModel.withOpacity(this.game.userConfig.ghostOpacity);
        this.DrawPiece(this.board.activepiece,
            this.CoordsToScreenPos(landpos),
            ghostModel,
            true,this.matrixzoom,false
        );
    }

    CORsize = new vector2(8,8);

    DrawActivePiece(){
        if(!this.board.activepiece) return;

        const usepos = this.ActivePieceDrawnPosition();

        let pieceModel = this.board.activepiece.tileModel;
        if(!this.game.gameOver){
            pieceModel = pieceModel.colourOperation(colour3.saturate,0.4);

            let lockTime = this.game.gameConfig.gravity
            if(this.game.gameConfig.useLockTime)
                lockTime = this.game.gameConfig.lockTime
            pieceModel = pieceModel.lerp(palette.zro,this.gameManager.movementManager.lockelapsed/lockTime * 0.8);
        }
        else{
            pieceModel = pieceModel.coloured(palette.one)
        }

        let screenpos = this.CoordsToScreenPos(usepos)
        this.DrawPiece(this.board.activepiece,
            screenpos,
            pieceModel,
            true,this.matrixzoom,false
        );
    }
    
    nextholdslR:movementReport|undefined
    nextpieceslR:movementReport|undefined

    UpdateHazards(){
        const nextpiece = this.gameManager.queue[0];
        if(nextpiece)
            this.nextpieceslR = this.gameManager.movementManager.SpawnLocation(nextpiece,false);
        const nexthold = this.gameManager.hold[0];
        if(nexthold)
            this.nextholdslR = this.gameManager.movementManager.SpawnLocation(nexthold,true);
    }

    DrawHazards(){
        if(this.nextholdslR)
            this.DrawPiece(this.nextholdslR.piece,
                this.CoordsToScreenPos(this.nextholdslR.position),
                tileModel.dither3alt(palette.two),
                false,this.matrixzoom,false
            );
        if(this.nextpieceslR)
            this.DrawPiece(this.nextpieceslR.piece,
                this.CoordsToScreenPos(this.nextpieceslR.position),
                tileModel.dither2(palette.tri),
                false,this.matrixzoom,false
            );
        
    }

    visualHealth = 0;

    b3bmargin = 4;

    meterswidths = 16;

    DrawHealth(){
        const _drawnMatrix = this.drawnMatrix();
        
        if(this.game.meter >16)
            this.ctx.fillStyle = palette.b2b2b.toHex();
        else
            this.ctx.fillStyle = palette.b2b.toHex();
        if(this.game.meter >20)
            this.ctx.fillStyle = palette.b2b2b2b.toHex();

        const healthbar  = this.visualHealth;

        const useMatrixY = _drawnMatrix.y / this.matrixzoom;

        const section1 = Math.min(1,healthbar / 16);
        const section2 = Math.max(0,Math.min(1,(healthbar - 16) / 4))
        const section3 = Math.max(0,healthbar - 20)

        this.FillRect(
            new vector2(
                -_drawnMatrix.x / 2 - this.meterswidths,
                -useMatrixY / 2 + (useMatrixY * 16/20 - this.b3bmargin) * (1-section1) + useMatrixY * 4/20 + this.b3bmargin - this.cameraYtarget*this.boardtilesize.y/this.matrixzoom
            ),
            new vector2(this.meterswidths,(useMatrixY * 16/20 -this.b3bmargin) * section1)
        )

        this.FillRect(
            new vector2(
                -_drawnMatrix.x / 2 - this.meterswidths,
                -useMatrixY / 2 + (useMatrixY * 4/20 - this.b3bmargin) * (1-section2) + this.b3bmargin - this.cameraYtarget*this.boardtilesize.y/this.matrixzoom
            ),
            new vector2(this.meterswidths,(useMatrixY * 4/20 - this.b3bmargin) * section2)
        )

        this.FillRect(
            new vector2(
                -_drawnMatrix.x / 2 - this.meterswidths,
                -useMatrixY / 2 - (useMatrixY / 20) * section3 - this.cameraYtarget*this.boardtilesize.y/this.matrixzoom
            ),
            new vector2(this.meterswidths,(useMatrixY / 20) * section3)
        )
    }

    garbagemargin = 4;

    DrawGarbageQueue(){
        const _drawnMatrix = this.drawnMatrix();

        const useMatrixY = _drawnMatrix.y / this.matrixzoom

        const deletion:number[] = []

        let lowerY = 0
        for(const packet of this.gameManager.garbageQueue){
            const enterT = this.game.gameConfig.garbageentry > 0 ? (packet.entrance / this.game.gameConfig.garbageentry) : 1;
            if(enterT < 1)
                this.ctx.globalAlpha = 0.1 + enterT * 0.5
            else
                this.ctx.globalAlpha = 1
            const ripenT = this.game.gameConfig.garbageripen > 0 ? (packet.ripen / this.game.gameConfig.garbageripen) : 1;
            
            this.ctx.fillStyle = palette.attackunentered.toHex();
            if (enterT >= 1 && ripenT >= 1)
                this.ctx.fillStyle = palette.attack1.flash(palette.attack2,33/1000).toHex();

            var boxheight = this.FSTL2(new vector2(0,packet.maxlines)).y / this.matrixzoom - this.garbagemargin
            if(packet.used){
                const lingerT = this.game.gameConfig.garbageare > 0 ? (packet.ripen / this.game.gameConfig.garbageare / packet.maxlines) : 1

                if(lingerT >= 1)
                {
                    deletion.unshift(this.gameManager.garbageQueue.indexOf(packet))
                    continue
                }

                boxheight *= 1 - lingerT
                this.ctx.fillStyle = palette.attackused.toHex();
            }

            this.FillRect(
                new vector2(
                    _drawnMatrix.x / 2,
                    useMatrixY / 2 - boxheight - lowerY - this.cameraYtarget*this.boardtilesize.y/this.matrixzoom
                ),
                new vector2(this.meterswidths,boxheight)
            )

            if(!packet.used && enterT >= 1 && ripenT < 1){
                this.ctx.fillStyle = palette.attackunripe.toHex();
                this.FillRect(
                new vector2(
                    _drawnMatrix.x / 2,
                    useMatrixY / 2 - boxheight * ripenT - lowerY - this.cameraYtarget*this.boardtilesize.y/this.matrixzoom
                ),
                new vector2(this.meterswidths,boxheight * ripenT)
            )
            }

            lowerY += boxheight + this.garbagemargin
        }
        
        for (const i of deletion) {
            this.gameManager.garbageQueue.splice(i,1)
        }
    }

    DrawBoard(){
        this.DrawMatrixBackground();
        this.DrawMatrix();

        this.DrawHealth();
        this.DrawGarbageQueue();
        
        if(!this.game.gameOver && this.game.gameConfig.drawGhost)
            this.DrawGhost();

        this.DrawActivePiece();

        if(!this.game.gameOver && this.Danger()[0] > 0)
            this.DrawHazards();
    }

    cameraYoffset = 0;
    cameraYtarget = 0;

    matrixtarget = vector2.zero;
    matrixoffset = vector2.zero;
    targetangle = 0;
    matrixangle = 0;
    
    matrixscroll = 0;
    targetzoom = 1;
    matrixzoom = 1;

    shakeamount = 0;
    targetshake = 0;

    dosomestuffandthenTranslation(deltaTime:number){
       
        //sets the targets
        if(!this.game.gameOver){
            //keep piece on screen
            switch((this.game.gameConfig.pieceSpawnMargin > -1 ? this.game.userConfig.cameraMode : cameraMode.fixed)){
                case cameraMode.focusActive:{
                    if(!this.board.activepiece) break
                    let trackpos = this.ActivePieceDrawnPosition();
                    let top = Math.max(trackpos.y - this.board.spawnlocation.y / 2,0);
                    let bottom = trackpos.y - this.board.spawnlocation.y - 1;
                    if(this.cameraYtarget > top)
                        this.cameraYtarget = top;
                    if(this.cameraYtarget < bottom)
                        this.cameraYtarget = bottom;
                    this.targetzoom = 1;
                    break
                }
                case cameraMode.focusGhost:{
                    if(!this.board.activepiece) break
                    let trackpos = this.board.activeposition.add(this.board.DropHeight(this.board.activepiece,this.board.activeposition));
                    let top = trackpos.y;
                    let bottom = Math.max(trackpos.y - this.board.spawnlocation.y / 2,0);
                    if(this.cameraYtarget > top)
                        this.cameraYtarget = top;
                    if(this.cameraYtarget < bottom)
                        this.cameraYtarget = bottom;
                    this.targetzoom = 1;
                    break
                }
                case cameraMode.focusWholeBoard:
                    if(this.board.matrix.height > 0)
                        this.targetzoom = Math.min(1,this.board.matrix.height/this.board.matrix.Extents().north + 1)
                    else
                        throw new Error("amazing edge case you get an achievement for finding this")
                    this.cameraYtarget = Math.max(0,(this.board.matrix.Extents().north + 1 - this.board.matrix.height) / 2 * this.targetzoom)
                    break
                case cameraMode.fixed:
                    this.cameraYtarget = 0;
                    this.targetzoom = 1;
            }
            
            //move the board around
            if(isNaN(this.flags.nongravitydisplacementthisframe.x) || isNaN(this.flags.nongravitydisplacementthisframe.y))
                throw new Error("nan displacement")
            this.matrixoffset = this.matrixoffset.add(flipy(this.flags.nongravitydisplacementthisframe.mul(this.offsetfactor)));
            this.flags.nongravitydisplacementthisframe = vector2.zero;
            

            //rotate the board around
            //this.targetangle += deltaTime/1000; //dont use this
            if(this.board.activepiece){
                if(this.latePiece && !this.flags.piecechange){
                    let rotation = modular.displacement(this.board.activepiece.orientiation as number,this.latePiece.orientiation,4)
                    rotation *= Math.PI / 2
                    if(!this.flags.justspinned)
                        rotation *= 0.2
                    this.matrixangle +=  rotation * this.rotatefactor;
                }
                this.latePiece = this.board.activepiece
            }

            //receive
            this.shakeamount += this.flags.shakeincrease;
            this.flags.shakeincrease = 0;
        }

        //tweening
        const t = 1 - Math.exp(-deltaTime/100);

        const dist = Math.abs(this.cameraYoffset - this.cameraYtarget);
        const yfactor = 1 - Math.exp(-deltaTime/1000*Math.max(dist/2,1));
        this.cameraYoffset = lerp(this.cameraYoffset,this.cameraYtarget,yfactor);
        this.matrixscroll = this.cameraYoffset * this.boardtilesize.y;

        this.matrixzoom = lerp(this.matrixzoom,this.targetzoom,t);
        
        const offset = this.matrixtarget.sub(this.matrixoffset);
        const magnitude = offset.magnitude();
        if(magnitude > 0.0001){
            const direction = offset.normalise();
            this.matrixoffset = this.matrixoffset.add(direction.mul(Math.min(magnitude * t,deltaTime*4)))
        }
        
        this.matrixangle = lerp(this.matrixangle,this.targetangle,t);

        this.visualHealth = lerp(this.visualHealth,this.game.meter,t);
        
        if(this.shakeamount > 0.0001){
            const shakeangle = Math.random() * Math.PI * 2
            this.shakeamount = lerp(this.shakeamount,this.targetshake,t);
            this.matrixoffset = this.matrixoffset.add(vector2.fromAngle(shakeangle).mul(this.shakeamount * this.shakefactor));
        }
    }

    RenderStep(deltaTime:number){
        const centerX = this.canvas.width/2, centerY = this.canvas.height/2;
        this.origin = new vector2(centerX,centerY);

        if(this.flags.piecechange)
            this.UpdateHazards()
        
        
        this.ctx.reset();

        this.game = this.gameManager.game
        this.boardtilesize = this.game.userConfig.tilescalar.hadamard(this.game.gameConfig.boardscalar)
        
        this.dosomestuffandthenTranslation(deltaTime);
        this.ctx.translate(centerX,centerY+Math.floor(this.matrixscroll))
        this.canvas.style.transform = "translate(-50%, -50%) rotate(" + this.matrixangle + "rad) translate(" +this.matrixoffset.x + "px, " + this.matrixoffset.y + "px)"

        this.cullline = this.drawnMatrix().y / 2

        this.DrawBoard()

        this.flags.piecechange = false;
        this.flags.justspinned = false;
    }

    constructor(_gameManager:gameManager,canvas:HTMLCanvasElement){
        const ctx = canvas.getContext('2d');
        if(!ctx)
            throw new Error("no canvas")
        this.canvas = canvas;
        this.ctx = ctx;

        this.gameManager = _gameManager;
        this.game = _gameManager.game;
        this.flags = this.game.flags;
        this.board = _gameManager.board;

        this.tilesize = this.game.userConfig.tilescalar
        this.boardtilesize = this.game.userConfig.tilescalar.hadamard(this.game.gameConfig.boardscalar)
    }
}