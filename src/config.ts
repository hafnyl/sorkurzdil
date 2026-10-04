import { tileModel } from './roms.ts'
import { clone, formatTime, formatTimeSmall, modular, Randomiser, vector2, weightedRoundoff } from './basics.ts'
import { board, tile, tileType } from './board.ts';
import rs, { kickSystems, kickType, simplifyKickType } from './rotationsystems.ts';
import { game } from './sorkurzdil.ts';
import { ExplodeGrenades, gimmick, MarkBombClears } from './gimmicks.ts';
import { tileModels } from './roms.ts';
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
            if(_game.b2b > 0)
                score += 200
        }

        return score
    }
})

export type attackingSystem = (_game:game,piecejustplaced:piece,lines:number,spin:boolean,mini:boolean,immobile:boolean,pc:boolean)=>number;

export const attackingSystems = Object.freeze({
    "guideline":function(_game:game,_:piece,lines:number,spin:boolean,mini:boolean,__:boolean,pc:boolean){
        var attack = 0

        if(lines > 0){
            if(lines < 4)
                attack += lines - 1;
            if(lines >= 4)
            attack += lines;
        }

        if(lines > 0 && spin)
            attack += 2 * lines;

        if(pc)
            attack += 10

        if(_game.combo > 1){
            if(_game.combo > 10)
                attack += 5;
            else
                attack += Math.floor(_game.combo / 2);
        }

        if(_game.b2b > 0){
            if(lines >= 4)
                attack += lines - 2;
            if(mini)
                attack += 1;
            else if(spin)
                attack += lines;
        }

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
    constructor(lines:number){
        this.lines = lines;
        this.maxlines = lines;
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
        return _game.lines / 4 < _game.pc + 1;
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

export enum b2btype{
    none,
    lenient,
    b2b,
    tspin,
    tech,
}

export enum spinDetection{
    tspin,
    threecorner,
    allmini,
    allminiandimmobile,
    immobilespin,
    sorkurzdil,
}

export type roundingType = (x:number)=>number;
export const roundingTypes:{[key:string]:(x:number)=>number} = Object.freeze({
    rounddown:Math.floor,
    roundup:Math.ceil,
    roundoff:Math.round,
    weighted:weightedRoundoff,
})

export class gameConfig{
    width=10;
    height=20;

    kickSystem=kickSystems.techmino;
    pieceChoice=new BasePieceGenerator(bagprefabs.tetrominos);
    queuesize = 5;
    holdsize = 1;
    holds = 1;
    infinitehold = false;
    discardsize = 0;

    aligntoptile=false;
    spawnOffset:vector2=vector2.zero;

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

    b2btype:b2btype = b2btype.b2b;

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
    
    verticallineclears = false;
    activepiecephasethroughblocks = false;

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

    boardscalar = vector2.one;

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

            if(e == "pieceChoice"){
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
    ShiftLeft,
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
    focusActive,
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