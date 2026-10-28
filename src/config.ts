import { clone, formatTime, formatTimeSmall, modular, Randomiser, vector2, weightedRoundoff } from './basics.ts'
import { board, boundstype, tile, tileType } from './board.ts';
import rs, { kickSystems, kickType, simplifyKickType } from './rotationsystems.ts';
import { game } from './sorkurzdil.ts';
import { ExplodeGrenades, gimmick, MarkBombClears } from './gimmicks.ts';
import { tileModels, tileModel } from './tilemodels.ts';
import { BaseGarbageGenerator, LinesGenerator } from './garbagegeneration.ts';
import { dualGarbageType } from './garbagelinetypes.ts';
import { BasePieceGenerator } from './piecechoice.ts';
import { bagprefabs, piece } from './pieces.ts';

export type simplescoring = (_game:game,piecejustplaced:piece,lines:number,spin:boolean,mini:boolean,immobile:boolean,pc:boolean)=>number;

export const simpleScoringSystems = Object.freeze({
    "guideline":function(_game:game,_:piece,lines:number,spin:boolean,mini:boolean,__:boolean,pc:boolean){
        var score = 0

        if(lines > 0 && !spin && !mini){
            if(lines < 4)
                score += 200 * lines - 100;
            if(lines >= 4)
            score += 200 * lines;
        }

        if(lines > 0 && !spin && mini)
            score += 100 + 100 * lines;

        if(lines > 0 && spin)
            score += 400 + 400 * lines;

        if(_game.combo > 0){
            score += 50 * _game.combo
        }

        if(pc){
            if(lines < 3){
                score += 400 + 400 * lines
            }else{
                score += 1200 + 200 * lines
            }
            if(_game.backto > 0)
                score += 200 * _game.backto
        }

        return score
    }
})

export type attackingSystem = (_game:game,piecejustplaced:piece,lines:number,spin:boolean,mini:boolean,immobile:boolean)=>number;

export const attackingSystems = Object.freeze({
    "guideline":function(_game:game,_piece:piece,lines:number,spin:boolean,mini:boolean,_immobile:boolean){
        var attack = 0

        if(lines > 0 && !spin){
            if(lines < 4)
                attack += lines - 1;
            if(lines >= 4)
            attack += lines;
        }

        if(lines > 0 && spin)
            attack += 2 * lines;

        if(_game.flags.pc || _game.flags.opc || _game.flags.tpc)
            attack += 10

        if(_game.combo > 1){
            if(_game.combo > 10)
                attack += 5;
            else
                attack += Math.floor(_game.combo / 2);
        }

        if(_game.backto > 0){
            if(lines >= 4)
                attack += lines - 2 + _game.backto - 1;
            if(mini)
                attack += _game.backto;
            else if(spin)
                attack += lines + _game.backto - 1;
        }

        return attack
    },
    "qp2":function(_game:game,_piece:piece,lines:number,spin:boolean,_mini:boolean,_immobile:boolean){
        var attack = 0

        if(lines > 0){
            if(lines < 4)
                attack += lines - 1;
            if(lines == 1)
                attack += 1
            if(lines >= 4)
            attack += lines;
        }

        if(lines > 0 && spin)
            attack += 2 * lines;

        if(_game.flags.pc || _game.flags.opc || _game.flags.tpc)
            attack += 3

        if(_game.combo > 1){
            if(_game.combo > 10)
                attack += 5;
            else
                attack += Math.floor(_game.combo / 2);
        }

        attack += _game.backto

        return attack
    }
})

export class garbagePacket{
    lines=1;
    maxlines=1;
    entrance=0;
    ripen=0;
    used=false;
    cut=false;
    generator?:BaseGarbageGenerator;
    constructor(lines:number,generator?:BaseGarbageGenerator){
        this.lines = lines;
        this.maxlines = lines;
        this.generator = generator
    }
}

export type scoreDisplay = {
    name:string,
    text:string,
    progress:number,
}
export type scoreDisplayType = (_game:game)=>scoreDisplay;

export const scoreDisplays = Object.freeze({
    "masterlevelling":function(_game:game){
        const firstlevelup = _game.gameConfig.startlevel + 1;
        const levelupprogress = (_game.levels < firstlevelup) ? (_game.lines / firstlevelup / 10) : ((_game.lines / 10) % 1);
        return {
            name:"level",
            text:_game.levels.toString(),
            progress:levelupprogress,
        }
    },
    "waves":function(_game:game){
        return {
            name:"wave",
            text:_game.waves.toString(),
            progress:_game.flags.waveprogress,
        }
    },
    "attack":function(_game:game){
        return {
            name:"attack",
            text:_game.attack.toString(),
            progress:0,
        }
    },
    "mission":function(_game:game){
        const _mission = _game.gameConfig.mission;
        if(_mission){
            const _missionReport = _mission(_game)
            return {
                name:_missionReport.name,
                text:_missionReport.text,
                progress:Math.max(0,Math.min(1,_missionReport.progress)),
            }
        }else return{
            name:"no mission",
            text:"",
            progress:0,
        }
    },
    "score":function(_game:game){
        const scorer = _game.gameConfig.scorer;
        if(scorer){
            const _score = scorer(_game)
            return {
                name:_score.name,
                text:_score.text,
                progress:0,
            }
        }else return{
            name:"no scoring system",
            text:"",
            progress:0,
        }
    },
    "default":function(_game:game){
        if(_game.gameConfig.mission)
            return scoreDisplays.mission(_game)
        if(_game.gameConfig.scorer)
            return scoreDisplays.score(_game)
        return scoreDisplays.masterlevelling(_game)
    },
})

export type mission = {
    name:string,
    text:string,
    progress:number,
    win:boolean,
}
export type missionType = (_game:game)=>mission;

export const missions = Object.freeze({
    "attack":function(goal:number){
        return function(_game:game){
            return {
                name:"attack",
                text:Math.max(0,goal - _game.attack).toString(),
                progress:_game.attack / goal,
                win:_game.attack >= goal,
            }
        }
    },
    "lines":function(goal:number){
        return function(_game:game){
            _game.flags.sprintbar = goal - _game.lines;
            return {
                name:"lines",
                text:Math.max(0,goal - _game.lines).toString(),
                progress:_game.lines / goal,
                win:_game.lines >= goal,
            }
        }
    },
    "dig":function(goal:number){
        return function(_game:game){
            return {
                name:"dig",
                text:Math.max(0,goal - _game.dig).toString(),
                progress:_game.dig / goal,
                win:_game.dig >= goal,
            }
        }
    },
})

export type score = {
    name:string,
    score:number,
    text:string,
    lowerbetter:boolean,
}
export type scorer = (_game:game)=>score;

export const scorers = Object.freeze({
    "speed":function(_game:game){
        return{
            name:"time",
            score:_game.time,
            text:formatTimeSmall(_game.time),
            lowerbetter:true,
        }
    },
    "survival":function(_game:game){
        return{
            name:"survival",
            score:_game.time,
            text:formatTimeSmall(_game.time),
            lowerbetter:true,
        }
    },
    "attack":function(_game:game){
        return{
            name:"attack",
            score:_game.attack,
            text:_game.attack.toString(),
            lowerbetter:false,
        }
    },
    "pc":function(_game:game){
        return{
            name:"pc",
            score:_game.pc,
            text:_game.pc.toString(),
            lowerbetter:false,
        }
    },
    "waves":function(_game:game){
        return{
            name:"wave",
            score:_game.waves,
            text:_game.waves.toString(),
            lowerbetter:false,
        }
    },
    "simplescore":function(_game:game){
        return{
            name:"score",
            score:_game.score,
            text:_game.score.toString(),
            lowerbetter:false,
        }
    },
})

export type constraint = (_game:game)=>boolean; // if it returns false you lose

export const constraints = Object.freeze({
    "b2bhealth":function(_game:game){
        return !_game.flags.negativeb2bmeter;
    },
    "4hpc":function(_game:game){
            _game.flags.limbobar = Math.min(_game.flags.limbobar,4 - (_game.lines - _game.pc * 4));
        return _game.board.matrix.effectiveUp - 1 < _game.flags.limbobar
    },
    "limbo":function(limboheight:number):constraint{
        return function (_game:game){
            _game.flags.limbobar = Math.min(_game.flags.limbobar,limboheight);
            return _game.board.matrix.effectiveUp - 1 < _game.flags.limbobar
        }
    },
    "techrashonly":function(_game:game){
        return (_game.lines % 4) == 0;
    },
})

export enum wavetype{
    none, //none
    ontimer, //garbage Only spawns on timer
    skippable, //garbage spawns on timer or when theres no more garbage left in the queue, whichever is faster
    onexhaust, //garbage only spawn when theres no garbage left in the queue
    onclear, //garbage only spawns when theres little garbage on the board and in the queue combined
}

export enum levelling{
    none,
    nes,
    zenithtower,
    theemperor,
}

export enum difficultlinecleartype{
    none,
    lenientallspin,
    allspin,
    tspin,
    tech,
}

export enum b2btype{
    none,
    b2b,
    chaining,
    meter,
}

export enum spinDetection{
    tspin = 1,
    threecorner,
    allmini,
    allminiandimmobile,
    immobilespin,
    sorkurzdil,
}

export enum alignYType{
    top = 1,
    COR,
    bottom,
}

export type roundingType = (x:number)=>number;
export const roundingTypes:{[key:string]:(x:number)=>number} = Object.freeze({
    rounddown:Math.floor,
    roundup:Math.ceil,
    roundoff:Math.round,
    weighted:weightedRoundoff,
})

export class matrixConfig{
    width=10;
    height=20;

    extendheight = -1; // how high above the height youre allowed to place pieces / youre allowed to move pieces into (-1 is infinite)
    lowvanishingpoint = 2; // how low below 0 youre allowed to place pieces before they get visually cut off or its counted as falling into the void
    dynamicvanishingpoint = false; // start measuring low vanishing point from the lowest tile
    extendclearxrequirement = true; // if boundstype lets you go past the walls you dont rely on going wall to wall for clearing lines, instead you just check the furthest tiles to the left and to the right

    verticallineclears = false;
}

export class boardConfig{
    activepiecephasethroughblocks = false;
    
    boundstype=boundstype.dynamic;
    boundlessretainboundedkicksbounded=true; // if the boundstype lets you go past the left and right, but the piece is still within bounds, on rotation you can kick off of the walls
    boundlessdropsusefloorbounded=true; // if boundstype lets you fall into the void within the walls of the matrix, sonic dropping and harddropping would keep you in bounds (but not softdropping)
    dasstopatbounds=true; // if its true it makes finesse possible again
    dasallowedpastbounds=true;
    dasforcedpastbounds=true; // changes your das to gameconfig.arr because i dont really want to add another arr value
    voiddeath = true; // you lose if you drop your piece into the void
    voidare = 750; // are increase after dropping a piece into the void
    vpcclearsall = true; // performing a pc within the bounds when there are still items outside of bounds will clear the items that are out of bounds (i added this because some tiles are unclearable when youre allowed to place pieces level with the floor or below) (works well with boundtype tower and platform but doesnt go well with wallless, doesnt go well with floorless or actual boundless if airlock is allowed)

    spawnAlignY=alignYType.bottom;
    spawnOffset:vector2=vector2.zero;
}

export class gameConfig{
    name="default";

    matrixConfig=new matrixConfig();
    boardConfig =new boardConfig();

    kickSystem=kickSystems.sorkurzdil;
    pieceChoice=new BasePieceGenerator(bagprefabs.tetrominos);
    queuesize = 5;
    holdsize = 1;
    holds = 1;
    infinitehold = false;
    discardsize = 0;

    forcehandling = false;
    arr=33;
    das=167;
    sdf=6;
    sdarr=167;
    usesdarr=false;

    twoplayer = false;
    swapplayerare = 750;

    simplescoring:simplescoring = simpleScoringSystems.guideline;
    levelscore = true;
    attacking:attackingSystem = attackingSystems.guideline;
    spinDetection:spinDetection = spinDetection.sorkurzdil;
    roundingtype:roundingType=roundingTypes.rounddown;

    scoreDisplayType:scoreDisplayType = scoreDisplays.default;
    mission:missionType|undefined;
    scorer:scorer|undefined;
    constraints:constraint[] = [];

    gravity = 833;
    usegravity = true; // this will force use sdarr instead of sdf 
    lockTime = 500;
    useLockTime = true;
    subzerogravity = false; // no locking when softdrop is held down but only when usegravity is also false
    lockcancels = 15;

    levelling:levelling = levelling.nes;
    levelgravity = false;
    levelLocktimes = false;
    startlevel = 0;

    difficultlinecleartype:difficultlinecleartype = difficultlinecleartype.allspin;
    b2btype:b2btype = b2btype.meter;
    b2bsurge=false;
    b2bsurgestart=4;
    b2bsurgestartattack=4;

    magicianwounds = 0;
    warlockwounds = 0;
    techpluswounds = 0;
    woundsclearby = 6;
    
    keeplastlineclear=false;
    droughteligible = false;

    pieceSpawnMargin = -1; // if its 0 or more then you cant die and you get infinite board
    spawnMarginUseLeeway = false; //margin counts the number of blocks directly under the piece instead of blocks elsewhere, this makes it possible for pieces to spawn underneath something
    topout = false; //whether you die when you place a piece above the spawn location //unimplemented
    topoutusedefactospawnlocation = true; //if this is false you just die if you try to use infinite height mode //unimplemented

    are = 0;
    areincrease = 0; //milliseconds of increase of are per row above the bottom row you place the piece
    areincreaseresolution = 2*1000/60; //round off are increase to the nearest x milliseconds
    lineclearare = 0;
    linecleartime = 0;

    lineclearshiftdown = true;

    backfire = 0; //unimplemented
    waveinterval = 2000;
    wave:garbagePacket[] = [new garbagePacket(2)];
    wavetype:wavetype = wavetype.none;
    clearthres = 0; //maxmimum amount of garbage on board and in queue for wave to spawn, if wavetype is onclear
    
    cheeselayer = 0;
    cheeselimit:number|undefined; //maxmimum layers of cheese to give 

    garbageChoice:BaseGarbageGenerator|undefined;
    woundsChoice:LinesGenerator|undefined;
    cheeseChoice:LinesGenerator|undefined;
    garbageType:dualGarbageType=tile.dualGarbage;
    woundsType:dualGarbageType=tile.dualGarbage;
    cheeseType:dualGarbageType=tile.dualGarbage;

    initialisegarbage:garbagePacket[] = [];

    garbagecap = 8;
    garbageentry = 333;
    garbageripen = 0;
    
    garbageare = 0;
    garbagehesitation = 0;
    garbagepacketare = 0;
    garbageout = true; // whether you die when garbage causes your thing to be blocked //does this even make sense as a thing that can be turned off, whil also being distinct from the infinite height thing //unimplemented
    clutching = true; // clearing a line makes you unable to die when the next piece spawns

    comboBlocking = true;
    attackCancelling = true;
    piecewaitsforgarbage = false;
    piecewaitgarbagefinalare = 1000;

    //functions to pass the board through before and after locks
    prelock:gimmick[] = [];
    postlock:gimmick[] = [];
    postclear:gimmick[] = []; //only fires when theres a clear //unimplemented
    //would preclear make sense i guess it only fires when theer sa clear as wel

    postframe:gimmick[] = [];
    earlylock:gimmick[] = []; //executes every time a piece moves and also you can only use this to lock otherwise it doesnt really make sense i think
    earlylockare = 750;

    allowHardDrop = true;
    allow180 = true;
    allowRotation = true;
    allowAirLock = false;
    allowShiftUp = false;
    allowFlips = false;
    drawGhost = true;

    stridefulfirstpiece=false

    boardscalar = vector2.one;

    lodges = [new vector2(1,-1),new vector2(0,-2),new vector2(2,0),new vector2(1,1),new vector2(-2,0),new vector2(0,2)];

    debug = false;

    strongproperties:string[] = [];

    /**compares properties, editing this config
     * 
     * nondefault overrides default unless the default property is marked as strong
     * 
     * other nondefault overrides this nondefault unless this nondefault is marked as strong
     */
    Splice(rawother:gameConfig){
        const other = clone(rawother)
        const judge = new gameConfig();
        Object.keys(other).forEach(e =>{
            if(e=="strongproperties")return;
            
            if(other.strongproperties.includes(e)){
                this[e] = other[e]
                return
            }

            if(e == "name"){
                if(this.name == judge.name)
                    this.name = other.name
                else
                    this.name = this.name + " + " + other.name;
            }
            else if(e == "pieceChoice"){
                if(other[e].constructor != judge[e].constructor || other[e].baghash != judge[e].baghash)
                    this[e] = other[e];
            }
            else if(other[e]){
                if(!judge[e] || other[e].toString() != judge[e].toString())
                    this[e] = other[e];
            }
            else
                if(other[e] != judge[e])
                    this[e] = other[e];
        });
    }

    /**compares properties, editing this config
     * 
     * nondefault overrides default unless the default property is marked as strong
     * 
     * this nondefault overrides other nondefault unless other nondefault is marked as strong
     */
    WeakSplice(other:gameConfig){
         //unimplemented
    }

    Strengthen(prop:string){
        if (!this.hasOwnProperty(prop))
            throw new Error("dont strengthen a nonproperty")
        this.strongproperties.push(prop);
    }
}

export enum Command{
    ShiftLeft = 1,
    ShiftRight,
    ShiftDown,
    ShiftUp,
    ASLeft,
    ASRight,
    RotCW,
    RotWS,
    Rot180,
    RotNull,
    Hold,
    Discard,
    SoftDrop,
    SonicDrop,
    HardDrop,
    AirLock,
    HoriFlip,
    VertFlip,
    OriNorth,
    OriSouth,
    OriEast,
    OriWest,
    SpawnGarbage,
    SpawnGarbage4,
    SpawnWound,
    ToggleCamera,
}

export enum cameraMode{
    focusActive = 1,
    focusGhost,
    focusWholeBoard,
    fixed,
}

export class keybinds{
    codemappings:{[key:string]:Command}={
        "ArrowLeft":Command.ShiftLeft,
        "ArrowRight":Command.ShiftRight,
        "ArrowUp":Command.RotCW,
        "ArrowDown":Command.SoftDrop,
        "Space":Command.HardDrop,
        "KeyC":Command.Hold,
        "ShiftLeft":Command.Hold,
        "KeyZ":Command.RotWS,
        "ControlLeft":Command.RotWS,
        "KeyA":Command.Rot180,
        "Digit1":Command.SonicDrop,
        "Digit2":Command.AirLock,
        "Digit3":Command.RotNull,
        "ControlRight":Command.ShiftDown,
        "KeyW":Command.HoriFlip,
        "KeyD":Command.VertFlip,
        "KeyS":Command.Discard,
        "F1":Command.ToggleCamera,
    };

    constructor(codemappings?:{[key:string]:Command}){
        if(!codemappings) return;
        for(const [k,v] of Object.entries(codemappings)){
            this.codemappings[k] = v;
        }
    }

    static noFallback(codemappings:{[key:string]:Command}){
        const robot = new keybinds();
        robot.codemappings = codemappings;
        return robot;
    }
}

export class userConfig{
    arr=33;
    das=167;
    sdf=6;
    sdarr=167;
    usesdarr=false;

    lockharddropdebounce=250;
    alwayskeeplastlineclear=false;

    smoothGravity=true;
    blockKeyRetriggers=true; //normally when you press and hold a key on a keyboard it retriggers really quickly
    boardGreying=true;

    ghostOpacity=0.5;
    COROpacity=0.5;
    gameStartDelay=3000;
    strideMode=false;

    tilescalar=new vector2(60,60);

    cameraMode=cameraMode.focusActive;

    keybinds = new keybinds();

    sdfBeforeDas = true;
}