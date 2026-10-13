import { vector2 } from "./basics.ts";
import { tile } from "./board.ts";
import { alignYType, difficultlinecleartype, gameConfig, garbagePacket, wavetype } from "./config.ts"
import { bagprefabs } from "./pieces.ts";
import { kickSystems } from "./rotationsystems.ts";
import { constraints, missions, scorers } from "./config.ts";
import { LinesGenerator } from "./garbagegeneration.ts";
import { Bombs, Damnation, NwideHolesLines } from "./garbagelinetypes.ts";
import { BasePieceGenerator, RandomPieceGenerator } from "./piecechoice.ts";
import { MarkBombClears } from "./gimmicks.ts";

export default class configprefabs{
    static get master(){
        let _gameConfig = new gameConfig()
        _gameConfig.forcehandling = true;
        _gameConfig.sdarr = 1000/30;
        _gameConfig.usesdarr = true;
        _gameConfig.levelgravity = true;
        _gameConfig.startlevel = 19;
        _gameConfig.lockTime = 2*1000/60;
        _gameConfig.allowHardDrop = false;
        _gameConfig.allow180 = false;
        _gameConfig.are = 10*1000/60;
        _gameConfig.areincrease = 0.5*1000/60;
        _gameConfig.areincreaseresolution = 2*1000/60;
        _gameConfig.lineclearare = 20*1000/60

        _gameConfig.pieceChoice = new RandomPieceGenerator(bagprefabs.tetrominos);
        _gameConfig.kickSystem = kickSystems.righthanded;
        _gameConfig.queuesize = 1;
        _gameConfig.holdsize = 0;
        _gameConfig.drawGhost = false;
        _gameConfig.spawnAlignY = alignYType.top;
        _gameConfig.spawnOffset = new vector2(0,-1);
        _gameConfig.droughteligible = true;

        _gameConfig.name = "master"

        return _gameConfig
    }

    static get sprint40(){
        let _gameConfig = new gameConfig()
        _gameConfig.mission = missions.lines(40);
        _gameConfig.scorer = scorers.speed;

        _gameConfig.name = "40l sprint"

        return _gameConfig
    }

    static get dig40(){
        let _gameConfig = new gameConfig()
        _gameConfig.mission = missions.dig(40)
        _gameConfig.cheeselayer = 10
        _gameConfig.cheeselimit = 40
        _gameConfig.scorer = scorers.speed;

        _gameConfig.name = "40l dig"

        return _gameConfig
    }

    static get big(){
        let _gameConfig = new gameConfig()
        _gameConfig.width = 5
        _gameConfig.height = 10
        _gameConfig.boardscalar = new vector2(2,2)

        _gameConfig.name = "big"

        return _gameConfig
    }

    static get freetennis(){
        let _gameConfig = new gameConfig()
        _gameConfig.allowFlips = true;
        _gameConfig.pieceChoice = new BasePieceGenerator(bagprefabs.freeTetrominos);

        _gameConfig.name = "free tetrominos"

        return _gameConfig
    }

    static get fixedtennis(){
        let _gameConfig = new gameConfig()
        _gameConfig.allowRotation = false;
        _gameConfig.pieceChoice = new BasePieceGenerator(bagprefabs.fixedTetrominos);

        _gameConfig.name = "fixed tetrominos"

        return _gameConfig
    }

    static get blockblast(){
        let _gameConfig = new gameConfig()
        _gameConfig.lineclearshiftdown = false;
        _gameConfig.verticallineclears = true;
        _gameConfig.activepiecephasethroughblocks = true;
        _gameConfig.allowAirLock = true;
        _gameConfig.allowShiftUp = true;

        _gameConfig.usegravity = false;
        _gameConfig.drawGhost = false;

        _gameConfig.width = 8
        _gameConfig.height = 8

        _gameConfig.name = "blast"

        return _gameConfig
    }

    static get warlock(){
        let _gameConfig = new gameConfig()

        _gameConfig.warlockwounds = 20
        _gameConfig.keeplastlineclear = true;
        _gameConfig.woundsChoice = new LinesGenerator(new Damnation())

        _gameConfig.initialisegarbage = [
        new garbagePacket(1),
        new garbagePacket(1),
        new garbagePacket(1),
        new garbagePacket(1),
        new garbagePacket(1),
        new garbagePacket(1),
        new garbagePacket(1),
        new garbagePacket(1),
        new garbagePacket(1),
        new garbagePacket(1),
        ]

        _gameConfig.name = "the warlock"

        return _gameConfig
    }

    static get magician(){
        let _gameConfig = new gameConfig()

        _gameConfig.magicianwounds = 1
        _gameConfig.keeplastlineclear = true;

        _gameConfig.name = "the magician"

        return _gameConfig
    }

    static get tech(){
        let _gameConfig = new gameConfig()

        _gameConfig.constraints.push(constraints.b2bhealth)

        _gameConfig.name = "tech"

        return _gameConfig
    }

    static get techplus(){
        let _gameConfig = new gameConfig()

        _gameConfig.techpluswounds = 20
        _gameConfig.difficultlinecleartype = difficultlinecleartype.tech

        _gameConfig.name = "tech+"

        return _gameConfig
    }

    static get freefall(){
        let _gameConfig = new gameConfig()

        _gameConfig.gravity = 0;
        _gameConfig.levelLocktimes = true;

        _gameConfig.name = "freefall"

        return _gameConfig
    }

    static get allpc28(){
        let _gameConfig = new gameConfig()
        
        _gameConfig.mission = missions.lines(4*7);
        _gameConfig.scorer = scorers.pc;
        _gameConfig.constraints.push(constraints['4hpc'])

        _gameConfig.name = "7 pc"

        return _gameConfig
    }

    static get allpc40(){
        let _gameConfig = new gameConfig()
        
        _gameConfig.mission = missions.lines(40);
        _gameConfig.scorer = scorers.pc;
        _gameConfig.constraints.push(constraints['4hpc'])

        _gameConfig.name = "10 pc"

        return _gameConfig
    }

    static get survival(){
        let _gameConfig = new gameConfig()

        _gameConfig.wave = [
            new garbagePacket(2),
        ]

        _gameConfig.wavetype = wavetype.ontimer;

        _gameConfig.scorer = scorers.survival

        _gameConfig.garbageare = 500
        _gameConfig.garbageripen = 500

        _gameConfig.name = "survival"

        return _gameConfig
    }

    static get survivalalt(){
        let _gameConfig = new gameConfig()

        _gameConfig.garbageChoice = new LinesGenerator(new NwideHolesLines(2))
        _gameConfig.wave = [
        new garbagePacket(1),
        new garbagePacket(1),
        new garbagePacket(2),
        new garbagePacket(4),
        ]
        _gameConfig.waveinterval = 4000
        _gameConfig.garbageripen = 8000
        _gameConfig.wavetype = wavetype.ontimer

        _gameConfig.scorer = scorers.survival

        _gameConfig.name = "survival alt"

        return _gameConfig
    }

    static get twoplayer(){
        let _gameConfig = new gameConfig()

        _gameConfig.twoplayer = true
        _gameConfig.mission = missions.attack(20)

        _gameConfig.name = "swap"

        return _gameConfig
    }

    static get attacker(){
        let _gameConfig = new gameConfig()

        _gameConfig.wave = [
            new garbagePacket(8),
            new garbagePacket(8),
            new garbagePacket(4)
        ]
        _gameConfig.waveinterval = 2000
        _gameConfig.wavetype = wavetype.onexhaust
        _gameConfig.garbageripen = 16000

        _gameConfig.name = "survival alt alt"

        return _gameConfig
    }

    static get bombs(){
        let _gameConfig = new gameConfig()

        _gameConfig.garbageChoice = new LinesGenerator(new Bombs());
        _gameConfig.prelock.push(MarkBombClears)
        //_gameConfig.garbageType = tile.hardy

        _gameConfig.name = "bombs"
        
        return _gameConfig
    }

    static get damnation(){
        let _gameConfig = new gameConfig()
        
        _gameConfig.backfire = 0.5
        _gameConfig.garbageChoice = new LinesGenerator(new Damnation())
        _gameConfig.cheeseChoice = new LinesGenerator(new Damnation())
        _gameConfig.cheeselayer = 4
        _gameConfig.garbageare = 100
        _gameConfig.garbagecap = 0
        _gameConfig.piecewaitsforgarbage = true

        _gameConfig.name = "damnation"
        
        return _gameConfig
    }
}