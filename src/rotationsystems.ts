import { modular, vector2 } from "./basics.ts";


export enum kickType {
  none,
  T,
  I,
  O,
  
  S,
  Z,
  L,
  J,
}


export enum simpleKickType {
  none,
  T,
  I,
  O,
}

export enum symmetry {
  none=4,
  rot180=2,
  rot90=1,
}

export function simplifyKickType(_kicktType:kickType){
  switch(_kicktType){
    case kickType.none:
        return simpleKickType.none;
    case kickType.I:
        return simpleKickType.I;
    case kickType.O:
        return simpleKickType.O;
    case kickType.T:
    case kickType.S:
    case kickType.Z:
    case kickType.L:
    case kickType.J:
        return simpleKickType.T;
  }
  return simpleKickType.T;
}


export enum SpinType {
  none,
  T,
  S,
  I,
  immobilespin,
}

export type coordinateSet = [
    vector2[],
    vector2[],
    vector2[],
    vector2[],
]

export type specificKickTable = [
    coordinateSet,
    coordinateSet,
    coordinateSet,
    coordinateSet,
]

function RotationalSymmetry180(_specificKickTable:specificKickTable){
    _specificKickTable[2][0] = _specificKickTable[0][2];
    _specificKickTable[2][1] = _specificKickTable[0][3];
    _specificKickTable[2][3] = _specificKickTable[0][1];
    _specificKickTable[3][0] = _specificKickTable[1][2];
    _specificKickTable[3][1] = _specificKickTable[1][3];
    _specificKickTable[3][2] = _specificKickTable[1][0];
}

function flipKicks(O:vector2[]){
    const newSet:vector2[] = []
    for(const coordinates of O)
            newSet.push(new vector2(-coordinates.x,coordinates.y))
    return newSet;
}

function flipRotation(x:number){
    return (4 - x) % 4
}

function reflected(O:specificKickTable){
    const newSet:specificKickTable = [[[],[],[],[]],[[],[],[],[]],[[],[],[],[]],[[],[],[],[]]];
    for(const a of [0,1,2,3])
        for(const b of [0,1,2,3]){
        newSet[a][b] = flipKicks(O[flipRotation(a)][flipRotation(b)])
    }
    return newSet
}

const offsetTables = Object.freeze({
  "none":{
    [simpleKickType.none]:[
      [vector2.zero],
      [vector2.zero],
      [vector2.zero],
      [vector2.zero],
    ],
    [simpleKickType.O]:[
      [new vector2( 0, 0)],
      [new vector2( 0,-1)],
      [new vector2(-1,-1)],
      [new vector2(-1, 0)],
    ],
    [simpleKickType.T]:[
      [new vector2( 0, 0)],
      [new vector2( 0, 0)],
      [new vector2( 0, 0)],
      [new vector2( 0, 0)],
    ],
    [simpleKickType.I]:[
      [new vector2( 0, 0)],
      [new vector2(-1, 0)],
      [new vector2(-1,+1)],
      [new vector2( 0,+1)],
    ],
  },
  "SRS":{
    [simpleKickType.none]:[
      [vector2.zero],
      [vector2.zero],
      [vector2.zero],
      [vector2.zero],
    ],
    [simpleKickType.O]:[
      [new vector2( 0, 0)],
      [new vector2( 0,-1)],
      [new vector2(-1,-1)],
      [new vector2(-1, 0)],
    ],
    [simpleKickType.T]:[
      [new vector2( 0, 0),new vector2( 0, 0),new vector2( 0, 0),new vector2( 0, 0),new vector2( 0, 0),],
      [new vector2( 0, 0),new vector2(+1, 0),new vector2(+1,-1),new vector2( 0,+2),new vector2(+1,+2),],
      [new vector2( 0, 0),new vector2( 0, 0),new vector2( 0, 0),new vector2( 0, 0),new vector2( 0, 0),],
      [new vector2( 0, 0),new vector2(-1, 0),new vector2(-1,-1),new vector2( 0,+2),new vector2(-1,+2),],
    ],
    [simpleKickType.I]:[
      [new vector2( 0, 0),new vector2(-1, 0),new vector2(+2, 0),new vector2(-1, 0),new vector2(+2, 0)],
      [new vector2(-1, 0),new vector2( 0, 0),new vector2( 0, 0),new vector2( 0,+1),new vector2( 0,-2)],
      [new vector2(-1,+1),new vector2(+1,+1),new vector2(-2,+1),new vector2(+1, 0),new vector2(-2, 0)],
      [new vector2( 0,+1),new vector2( 0,+1),new vector2( 0,+1),new vector2( 0,-1),new vector2( 0,+2)],
    ],
  },
  "rightHanded":{
    [simpleKickType.none]:[
      [vector2.zero],
      [vector2.zero],
      [vector2.zero],
      [vector2.zero],
    ],
    [simpleKickType.O]:[
      [new vector2( 0, 0)],
      [new vector2( 0,-1)],
      [new vector2(-1,-1)],
      [new vector2(-1, 0)],
    ],
    [simpleKickType.T]:[
      [new vector2( 0, 0)],
      [new vector2( 0, 0)],
      [new vector2( 0, 0)],
      [new vector2( 0, 0)],
    ],
    [simpleKickType.I]:[
      [new vector2( 0, 0)],
      [new vector2(-1,-1)],
      [new vector2( 0, 0)],
      [new vector2(-1,-1)],
    ],
  },
  "tetrio":{
    [simpleKickType.none]:[
      [vector2.zero],
      [vector2.zero],
      [vector2.zero],
      [vector2.zero],
    ],
    [simpleKickType.O]:[
      [new vector2( 0, 0)],
      [new vector2( 0,-1)],
      [new vector2(-1,-1)],
      [new vector2(-1, 0)],
    ],
    [simpleKickType.T]:[
      [new vector2( 0, 0),new vector2( 0, 0),new vector2( 0, 0),new vector2( 0, 0),new vector2( 0, 0),],
      [new vector2( 0, 0),new vector2(+1, 0),new vector2(+1,-1),new vector2( 0,+2),new vector2(+1,+2),],
      [new vector2( 0, 0),new vector2( 0, 0),new vector2( 0, 0),new vector2( 0, 0),new vector2( 0, 0),],
      [new vector2( 0, 0),new vector2(-1, 0),new vector2(-1,-1),new vector2( 0,+2),new vector2(-1,+2),],
    ],
    [simpleKickType.I]:[]
  },
})

const trsZ:specificKickTable = [
        [
            [],
            [new vector2(+0,+0),new vector2(-1,+0),new vector2(-1,+1),new vector2(+0,-2),new vector2(-1,+2),new vector2(+0,+1),],
            [new vector2(+0,+0),new vector2(+1,+0),new vector2(-1,+0),new vector2(+0,-1),new vector2(+0,+1),],
            [new vector2(+0,+0),new vector2(+1,+0),new vector2(+1,+1),new vector2(+0,-2),new vector2(+1,-1),new vector2(+1,-2),],
        ],
        [
            [new vector2(+0,+0),new vector2(+1,+0),new vector2(+1,-1),new vector2(+0,+2),new vector2(+1,-2),new vector2(+0,-1),],
            [],
            [new vector2(+0,+0),new vector2(+1,+0),new vector2(+1,-1),new vector2(+0,+2),new vector2(+1,+2),new vector2(+1,+1),],
            [new vector2(+0,+0),new vector2(+0,-1),new vector2(+0,+1),new vector2(+0,-2),],
        ],
        [
            [new vector2(+0,+0),new vector2(-1,+0),new vector2(+1,+0),new vector2(+0,+1),new vector2(+0,-1),],
            [new vector2(+0,+0),new vector2(-1,+0),new vector2(-1,+1),new vector2(+0,-2),new vector2(-1,-2),new vector2(-1,-1),],
            [],
            [new vector2(+0,+0),new vector2(+1,+0),new vector2(+1,+1),new vector2(+0,-2),new vector2(+1,-2),new vector2(+0,+1),],
        ],
        [
            [new vector2(+0,+0),new vector2(-1,+0),new vector2(-1,-1),new vector2(+0,+2),new vector2(-1,+2),new vector2(+0,-1),],
            [new vector2(+0,+0),new vector2(+0,+1),new vector2(+0,-1),new vector2(+0,+2),],
            [new vector2(+0,+0),new vector2(-1,+0),new vector2(-1,-1),new vector2(+0,+2),new vector2(-1,+2),new vector2(+0,-1),],
            [],
        ],
    ]
const trsJ:specificKickTable = [
    [
        [],
        [new vector2(+0,+0),new vector2(-1,+0),new vector2(-1,+1),new vector2(+0,-2),new vector2(+1,+1),new vector2(+0,+1),new vector2(+0,-1),],
        [new vector2(+0,+0),new vector2(-1,+0),new vector2(+1,+0),new vector2(+0,-1),new vector2(+0,+1),],
        [new vector2(+0,+0),new vector2(+1,+0),new vector2(+1,+1),new vector2(+0,-2),new vector2(+1,-2),new vector2(+1,-1),new vector2(+0,+1),],
    ],
    [
        [new vector2(+0,+0),new vector2(+1,+0),new vector2(+1,-1),new vector2(+0,+2),new vector2(-1,-1),new vector2(+0,-1),new vector2(+0,+1),],
        [],
        [new vector2(+0,+0),new vector2(+1,+0),new vector2(+1,-1),new vector2(+1,+1),new vector2(-1,+0),new vector2(+0,-1),new vector2(+0,+2),new vector2(+1,+2),],
        [new vector2(+0,+0),new vector2(+0,-1),new vector2(+0,+1),new vector2(+1,+0),],
    ],
    [
        [new vector2(+0,+0),new vector2(+1,+0),new vector2(-1,+0),new vector2(+0,+1),new vector2(+0,-1),],
        [new vector2(+0,+0),new vector2(-1,+0),new vector2(-1,+1),new vector2(-1,-1),new vector2(+1,+0),new vector2(+0,+1),new vector2(+0,-2),new vector2(-1,-2),],
        [],
        [new vector2(+0,+0),new vector2(+1,+0),new vector2(+1,-1),new vector2(-1,+0),new vector2(+1,+1),new vector2(+0,-2),new vector2(+1,-2),],
    ],
    [
        [new vector2(+0,+0),new vector2(-1,+0),new vector2(-1,-1),new vector2(+0,+2),new vector2(-1,+2),new vector2(+0,-1),new vector2(-1,+1),],
        [new vector2(+0,+0),new vector2(+0,+1),new vector2(+0,-1),new vector2(-1,+0),],
        [new vector2(+0,+0),new vector2(-1,+0),new vector2(-1,-1),new vector2(+1,+0),new vector2(+0,+2),new vector2(-1,+2),new vector2(-1,+1),],
        [],
    ],
]

const kickTables = Object.freeze({ //aware tetrio and akira have even piece wobble but techmino doesnt
  "tetrio":{
    [simpleKickType.none]:[
      [
        [],
        [],
        [new vector2( 0, 0),new vector2( 0, 1),new vector2( 1, 1),new vector2(-1, 1),new vector2( 1, 0),new vector2(-1, 0)],
        [],
      ],
      [
        [],
        [],
        [],
        [new vector2( 0, 0),new vector2( 1, 0),new vector2( 1, 2),new vector2( 1, 1),new vector2( 0, 2),new vector2( 0, 1)],
      ],
      [
        [new vector2( 0, 0),new vector2( 0,-1),new vector2(-1,-1),new vector2( 1,-1),new vector2(-1, 0),new vector2( 1, 0)],
        [],
        [],
        [],
      ],
      [
        [],
        [new vector2( 0, 0),new vector2(-1, 0),new vector2(-1, 2),new vector2(-1, 1),new vector2( 0, 2),new vector2( 0, 1)],
        [],
        [],
      ],
    ],
    [simpleKickType.I]:[
      [
        [],
        [new vector2( 1, 0),new vector2( 2, 0),new vector2(-1, 0),new vector2(-1,-1),new vector2( 2, 2),],
        [],
        [new vector2( 0,-1),new vector2(-1,-1),new vector2( 2,-1),new vector2( 2,-2),new vector2(-1, 1),],
      ],
      [
        [new vector2(-1, 0),new vector2(-2, 0),new vector2( 1, 0),new vector2(-2,-2),new vector2( 1, 1),],
        [],
        [new vector2( 0,-1),new vector2(-1,-1),new vector2( 2,-1),new vector2(-1, 1),new vector2( 2,-2),],
        [],
      ],
      [
        [],
        [new vector2( 0, 1),new vector2(-2, 1),new vector2( 1, 1),new vector2(-2, 2),new vector2( 1,-2),],
        [],
        [new vector2(-1, 0),new vector2( 1, 0),new vector2(-2, 0),new vector2( 1, 1),new vector2(-2,-2),],
      ],
      [
        [new vector2( 0, 1),new vector2( 1, 1),new vector2(-2, 1),new vector2( 1,-1),new vector2(-2, 2),],
        [],
        [new vector2( 1, 0),new vector2( 2, 0),new vector2(-1, 0),new vector2( 2, 2),new vector2(-1, -1),],
        [],
      ],
    ],
  },
  "akira":{
    [simpleKickType.I]:[
      [
        [],
        [new vector2(+1, 0), new vector2(-1, 0), new vector2(+2, 0), new vector2(+2,+2), new vector2(-1,-1)],
        [],
        [new vector2( 0,-1), new vector2(+2,-1), new vector2(-1,-1), new vector2(-1,+1), new vector2(+2,-2)],
      ],
      [
        [new vector2(-1, 0), new vector2(+2, 0), new vector2(-1, 0), new vector2(+2,+1), new vector2(-1,-2)],
        [],
        [new vector2( 0,-1), new vector2(-1,-1), new vector2(+2,-1), new vector2(-1,+1), new vector2(+2,-2)],
        [],
      ],
      [
        [],
        [new vector2( 0,+1), new vector2(-2,+1), new vector2(+1,+1), new vector2(-2,+2), new vector2(+1, 0)],
        [],
        [new vector2(-1, 0), new vector2(+1, 0), new vector2(-2, 0), new vector2(+1,+1), new vector2(-2,-1)],
      ],
      [
        [new vector2( 0,+1), new vector2(-2,+1), new vector2(+1,+1), new vector2(-2,+2), new vector2(+1,-1)],
        [],
        [new vector2(+1, 0), new vector2(+2, 0), new vector2(-1, 0), new vector2(+2,+2), new vector2(-1,-1)],
        [],
      ],
    ],
  },
  "techmino":{
    [kickType.I]:[
        [
            [],
            [new vector2(+0,+0),new vector2(+0,+1),new vector2(+1,+0),new vector2(-2,+0),new vector2(-2,-1),new vector2(+1,+2),],
            [new vector2(+0,+0),new vector2(-1,+0),new vector2(+1,+0),new vector2(+0,-1),new vector2(+0,+1),],
            [new vector2(+0,+0),new vector2(+0,+1),new vector2(-1,+0),new vector2(+2,+0),new vector2(+2,-1),new vector2(-1,+2),],
        ],
        [
            [new vector2(+0,+0),new vector2(+2,+0),new vector2(-1,+0),new vector2(-1,-2),new vector2(+2,+1),new vector2(+0,+1),],
            [],
            [new vector2(+0,+0),new vector2(-1,+0),new vector2(+2,+0),new vector2(+2,-1),new vector2(+0,-1),new vector2(-1,+2),],
            [new vector2(+0,+0),new vector2(+0,-1),new vector2(-1,+0),new vector2(+1,+0),new vector2(+0,+1),],
        ],
        [
            [new vector2(+0,+0),new vector2(+1,+0),new vector2(-1,+0),new vector2(+0,+1),new vector2(+0,-1),],
            [new vector2(+0,+0),new vector2(-2,+0),new vector2(+1,+0),new vector2(+1,-2),new vector2(-2,+1),new vector2(+0,+1),],
            [],
            [new vector2(+0,+0),new vector2(+2,+0),new vector2(-1,+0),new vector2(-1,-2),new vector2(+2,+1),new vector2(+0,+1),],
        ],
        [
            [new vector2(+0,+0),new vector2(-2,+0),new vector2(+1,+0),new vector2(+1,-2),new vector2(-2,+1),new vector2(+0,+1),],
            [new vector2(+0,+0),new vector2(+0,-1),new vector2(+1,+0),new vector2(-1,+0),new vector2(+0,+1),],
            [new vector2(+0,+0),new vector2(+1,+0),new vector2(-2,+0),new vector2(-2,-1),new vector2(+0,-1),new vector2(+1,+2),],
            [],
        ],
    ],
    [kickType.O]:[
        [
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
        ],
        [
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
        ],
        [
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
        ],
        [
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
        ],
    ],
    [kickType.T]:[
        [
            [],
            [new vector2(+0,+0),new vector2(-1,+0),new vector2(-1,+1),new vector2(+0,-2),new vector2(-1,-2),new vector2(+0,+1),],
            [new vector2(+0,+0),new vector2(-1,+0),new vector2(+1,+0),new vector2(+0,+1),],
            [new vector2(+0,+0),new vector2(+1,+0),new vector2(+1,+1),new vector2(+0,-2),new vector2(+1,-2),new vector2(+0,+1),],
        ],
        [
            [new vector2(+0,+0),new vector2(+1,+0),new vector2(+1,-1),new vector2(+0,+2),new vector2(+1,+2),new vector2(+0,+1),new vector2(+0,-1),],
            [],
            [new vector2(+0,+0),new vector2(+1,+0),new vector2(+1,-1),new vector2(+0,-1),new vector2(-1,-1),new vector2(+0,+2),new vector2(+1,+2),new vector2(+1,+1),],
            [new vector2(+0,+0),new vector2(+0,-1),new vector2(+0,+1),new vector2(+1,+0),new vector2(+0,-2),new vector2(+0,+2),],
        ],
        [
            [new vector2(+0,+0),new vector2(+1,+0),new vector2(-1,+0),new vector2(+0,-1),],
            [new vector2(+0,+0),new vector2(-1,+0),new vector2(+0,-2),new vector2(-1,-2),new vector2(-1,-1),new vector2(+0,-1),new vector2(+1,+1),],
            [],
            [new vector2(+0,+0),new vector2(+1,+0),new vector2(+0,-2),new vector2(+1,-2),new vector2(+1,-1),new vector2(+0,-1),new vector2(-1,+1),],
        ],
        [
            [new vector2(+0,+0),new vector2(-1,+0),new vector2(-1,-1),new vector2(+0,+2),new vector2(-1,+2),new vector2(+0,+1),new vector2(+0,-1),],
            [new vector2(+0,+0),new vector2(+0,-1),new vector2(+0,+1),new vector2(-1,+0),new vector2(+0,-2),new vector2(+0,+2),],
            [new vector2(+0,+0),new vector2(-1,+0),new vector2(-1,-1),new vector2(+0,-1),new vector2(+1,-1),new vector2(+0,+2),new vector2(-1,+2),new vector2(-1,+1),],
            [],
        ],
    ],
    [kickType.Z]:trsZ,
    [kickType.S]:reflected(trsZ),
    [kickType.J]:trsJ,
    [kickType.L]:reflected(trsJ),
    [kickType.none]:[
        [
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
        ],
        [
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
        ],
        [
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
        ],
        [
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
            [vector2.zero],
        ],
    ],
  }
});

const kickChecks = Object.freeze({
  "cultris":[
      new vector2(0,0),new vector2(-1,0),new vector2(1,0),new vector2(0,-1),new vector2(-1,-1),new vector2(1,-1),new vector2(-2,0),new vector2(2,0),
  ],
  "lazysrs":[
      new vector2(0,0),new vector2(-1,0),new vector2(1,0),new vector2(0,-1),new vector2(-1,-1),new vector2(1,-1),new vector2(0,-2),new vector2(-1,-2),new vector2(1,-2),new vector2(0,2),new vector2(-1,2),new vector2(1,2),new vector2(-2,0),new vector2(2,0),new vector2(0,1),new vector2(-1,1),new vector2(1,1),
  ]
})

function* offsetTable(specificOffsetTable:vector2[][],fromRot:number,toRot:number){
    console.log(toRot)
    if(!specificOffsetTable[fromRot]||!specificOffsetTable[toRot])
        while(true)
            yield vector2.zero;
    
    for(let i=0; i<specificOffsetTable[fromRot].length && i<specificOffsetTable[toRot].length; i++)
        yield specificOffsetTable[fromRot][i].sub(specificOffsetTable[toRot][i]);
}

function* kickTable(specificKickTable:vector2[][][],fromRot:number,toRot:number){
    for(const shift of specificKickTable[fromRot][toRot])
        yield shift;
}

function* basicOffsetKickTables(_kickType:kickType,specificKickTable:vector2[][][],fromRot:number,toRot:number){
    const basicOffsets = rs.offsetTables.none[simplifyKickType(_kickType)]
    const basicOffset = basicOffsets[fromRot][0].sub(basicOffsets[toRot][0]);

    for(const shift of specificKickTable[fromRot][toRot])
        yield shift.add(basicOffset);
}

export const kickSystems = Object.freeze({
    "trueNone":function*(_kickType:kickType,fromRot:number,toRot:number){
        yield new vector2(0,0);
    },
    "none":function*(_kickType:kickType,fromRot:number,toRot:number){
        let skickType = simplifyKickType(_kickType)
        for(const shift of offsetTable(rs.offsetTables.none[skickType],fromRot,toRot))
            yield shift;
    },
    "righthanded":function*(_kickType:kickType,fromRot:number,toRot:number){
        let skickType = simplifyKickType(_kickType)
        for(const shift of offsetTable(rs.offsetTables.rightHanded[skickType],fromRot,toRot))
            yield shift;
    },
    "SRS":function*(_kickType:kickType,fromRot:number,toRot:number){
        let skickType = simplifyKickType(_kickType)
        for(const shift of offsetTable(rs.offsetTables.SRS[skickType],fromRot,toRot))
            yield shift;
    },
    "worldwidecombos":function*(_kickType:kickType,fromRot:number,toRot:number){
        let skickType = simplifyKickType(_kickType)
        if(Math.abs(fromRot-toRot)===2){
          fromRot++;
          fromRot%=4;
        }
        for(const shift of offsetTable(rs.offsetTables.SRS[skickType],fromRot,toRot))
            yield shift;
    },
    "akira":function*(_kickType:kickType,fromRot:number,toRot:number){
        let skickType = simplifyKickType(_kickType)
        if(_kickType===kickType.I&&Math.abs(fromRot-toRot)!==2&&fromRot!==toRot)
            for(const shift of kickTable(rs.kickTables.akira[kickType.I],fromRot,toRot))
                yield shift;
        else
            for(const shift of offsetTable(rs.offsetTables.SRS[skickType],fromRot,toRot))
                yield shift;
    },
    "tetrio":function*(_kickType:kickType,fromRot:number,toRot:number){
        let skickType = simplifyKickType(_kickType)
        if(Math.abs(fromRot-toRot)===2){
            for(const shift of kickTable(rs.kickTables.tetrio[kickType.none],fromRot,toRot))
                yield shift;
        }else{
            if(_kickType === kickType.I)
                for(const shift of kickTable(rs.kickTables.tetrio[kickType.I],fromRot,toRot))
                    yield shift;
            else
                for(const shift of offsetTable(rs.offsetTables.tetrio[skickType],fromRot,toRot))
                    yield shift;
        }
    },
    "techmino":function*(_kickType:kickType,fromRot:number,toRot:number){
        for(const shift of basicOffsetKickTables(_kickType,rs.kickTables.techmino[_kickType],fromRot,toRot))
            yield shift;
    },
    "cultris":function*(_kickType:kickType,fromRot:number,toRot:number){
      const basicOffsets = rs.offsetTables.none[simplifyKickType(_kickType)]
      const basicOffset = basicOffsets[fromRot][0].sub(basicOffsets[toRot][0]);

      for(const shift of rs.kickChecks.cultris)
          yield shift.add(basicOffset);
    },
    "lazysrs":function*(_kickType:kickType,fromRot:number,toRot:number){
      const basicOffsets = rs.offsetTables.none[simplifyKickType(_kickType)]
      const basicOffset = basicOffsets[fromRot][0].sub(basicOffsets[toRot][0]);

      const rot = modular.displacement(fromRot,toRot,4)

        for(const shift of rs.kickChecks.lazysrs){
          if(rot != -1)
            yield shift.hadamard(new vector2(-1,1)).add(basicOffset);
          else
            yield shift.add(basicOffset)
        }
    },
});

const rs ={
    offsetTables:offsetTables,
    kickTables:kickTables,
    kickChecks:kickChecks,
}

export default rs;