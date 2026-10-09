import { clone, colour3, modular, vector2 } from "./basics";
import { tile, tileType } from "./board";
import { images } from "./imagemanager";
import { palette } from "./roms";
import { kickType, simpleKickType, SpinType, symmetry } from "./rotationsystems";
import { tileModel, tileModels } from "./tilemodels";

export enum orientiation {
  north,
  east,
  south,
  west,
}

export const CORoffsets = {
  [simpleKickType.none]:new vector2(0,0),
  [simpleKickType.T]:new vector2(0,0),
  [simpleKickType.I]:new vector2(0.5,-0.5),
  [simpleKickType.O]:new vector2(0.5,0.5),
}

export type uncenteredRectangle = {
  north:number,
  east:number,
  south:number,
  west:number,
}

export class piece{
  name:string;
  id:string;

  tileoffsets:vector2[];
  tileModel:tileModel;
  ikickType?:kickType;
  spinType:SpinType;
  orientiation=orientiation.north;
  chirality=vector2.one;
  symmetry=symmetry.none;
  lodgeability=false;

  get kickType(){
    if(this.ikickType && this.ikickType != kickType.auto)
      return this.ikickType

    const bounds = this.bounds.rotate(4 - this.orientiation)
    if(bounds.y%2 == 0)
      if(bounds.x%2 == 0)
        return kickType.O
      else
        return kickType.T
    else
      if(bounds.x%2 == 0)
        return kickType.I
      else
        return kickType.T
  }

  tileType=tileType.none;

  constructor(id:string,tileoffsets:vector2[],tileModel:tileModel,kickType:kickType,name:string=id,spinType:SpinType=SpinType.immobilespin){
    this.id = id;
    this.tileoffsets = tileoffsets;
    this.tileModel = tileModel;
    this.ikickType = kickType;
    this.name = name;
    this.spinType = spinType;
  }

  //misc
  booleanoperation(other:piece,OT=false,nOT=false,OnT=false){
    const robot = clone(this)
    robot.tileoffsets = []
    
    for(const i of this.tileoffsets){
      let otherincludes = false;
      for(const j of other.tileoffsets)
        if(i.eqeqeq(j)){
          otherincludes = true
          break
        }

      if((OT && otherincludes) || (nOT && !otherincludes))
        robot.tileoffsets.push(clone(i))
    }

    if(OnT)
      for(const i of other.tileoffsets){
        let thisincludes = false;
        for(const j of this.tileoffsets)
          if(i.eqeqeq(j)){
            thisincludes = true
            break
          }

        if(!thisincludes)
          robot.tileoffsets.push(clone(i))
      }

    return robot
  }
  intersection(other:piece){
    return this.booleanoperation(other,true,false,false)
  }

  subtract(other:piece){
    return this.booleanoperation(other,false,true,false)
  }

  union(other:piece){
    return this.booleanoperation(other,true,true,true)
  }

  //movements stuff
  Rotate(rotation:number){
    for(let i=0; i<this.tileoffsets.length; i++){
      this.tileoffsets[i] = this.tileoffsets[i].rotate(rotation)
    }
    this.orientiation = (this.orientiation + rotation) % 4
  }

  rotated(rotation:number){
    let robot = clone(this);
    robot.Rotate(rotation);
    return robot;
  }

  RotateTo(endorientation:orientiation){
    var rotation = (endorientation - this.orientiation + 4) % 4
    for(let i=0; i<this.tileoffsets.length; i++){
      this.tileoffsets[i] = this.tileoffsets[i].rotate(rotation)
    }
    this.orientiation = endorientation
  }

  Shift(offset:vector2){
    for(let i=0; i<this.tileoffsets.length; i++){
      this.tileoffsets[i] = this.tileoffsets[i].add(offset);
    }
  }

  shifted(offset:vector2){
    let robot = clone(this);
    robot.Shift(offset);
    return robot;
  }

  Hadamard(other:vector2){
    for(let i=0; i<this.tileoffsets.length; i++){
      this.tileoffsets[i] = this.tileoffsets[i].hadamard(other)
    }
    this.chirality = this.chirality.hadamard(other);

    if(this.chirality.y < 0){
      this.chirality = this.chirality.hadamard(new vector2(-1,-1));
      this.orientiation = (this.orientiation + 2) % 4
    }
  }

  HadamardTo(other:vector2){
    this.Hadamard(this.chirality);
    this.Hadamard(other);
  }

  //things to use when hardcoding pieces
  /**current size of the bounding rectangle of the piece */
  get bounds(){
    var bounding = this.boundingrectangle
    return new vector2(bounding.east - bounding.west + 1,bounding.north - bounding.south + 1)
  }

  /**northeast and southwest points of the bounding rectangle of the piece relative to the center of rotation*/
  get boundingrectangle():uncenteredRectangle{
    var northeast = this.tileoffsets[0]
    var southwest = this.tileoffsets[0]

    for(const i of this.tileoffsets){
      northeast = new vector2(Math.max(northeast.x,i.x),Math.max(northeast.y,i.y))
      southwest = new vector2(Math.min(southwest.x,i.x),Math.min(southwest.y,i.y))
    }
    return {
      north:northeast.y,
      east:northeast.x,
      south:southwest.y,
      west:southwest.x,
    }
  }

  static fromString(id:string,tilepicture:string,tileModel:tileModel,name:string=id,_kickType=kickType.auto){
    const robot = new piece(id,[],tileModel,_kickType,name,SpinType.immobilespin)

    const rows = tilepicture.split("\n")
    for (let y = 0; y < rows.length; y++) {
      const row = rows[rows.length - y - 1];
      for (let x = 0; x < row.length; x++) {
        const element = row[x];
        if(element === " ")continue
        robot.tileoffsets.push(new vector2(x,y))
      }
    }

    const bounding = robot.boundingrectangle

    const origin = new vector2(Math.floor((bounding.east + bounding.west)/2),Math.floor((bounding.north + bounding.south)/2))
    for (let i = 0; i < robot.tileoffsets.length; i++) {
      robot.tileoffsets[i] = robot.tileoffsets[i].sub(origin)
    }
    
    return robot
  }

  withModel(_tileModel:tileModel){
    let robot = clone(this);
    robot.tileModel = _tileModel;
    return robot;
  }

  withRotationCleared(){
    let robot = clone(this);
    robot.orientiation = orientiation.north;
    robot.chirality = vector2.one;
    return robot;
  }

  withGimmick(gimmick:tileType){
    let robot = clone(this);
    robot.tileType = gimmick;
    return robot;
  }

  withName(name:string){
    let robot = clone(this);
    robot.name = name;
    return robot;
  }

  withSymmetry(_symmetry:symmetry){
    let robot = clone(this);
    robot.symmetry = _symmetry;
    return robot;
  }

  withKickType(_kickType:kickType){
    let robot = clone(this);
    robot.ikickType = _kickType;
    return robot;
  }

  lodgeable(){
    let robot = clone(this);
    robot.lodgeability = true;
    return robot;
  }
}

export const pieces = Object.freeze({
  // main tetrominos
  I:
  new piece("i4",[
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
    new vector2(2,0),
  ],
  tileModels.I,
  kickType.I,
  "",
  SpinType.I),

  L:
  new piece("l4",[
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
    new vector2(1,1),
  ],
  tileModels.L,
  kickType.L,
  "",
  SpinType.T),

  O:
  new piece("o4",[
    new vector2(0,0),
    new vector2(0,1),
    new vector2(1,0),
    new vector2(1,1),
  ],
  tileModels.O,
  kickType.O,
  "",
  SpinType.none).lodgeable(),

  Z:
  new piece("z4",[
    new vector2(-1,1),
    new vector2(0,0),
    new vector2(1,0),
    new vector2(0,1),
  ],
  tileModels.Z,
  kickType.Z,
  "",
  SpinType.S),

  T:
  new piece("t4",[
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
    new vector2(0,1),
  ],
  tileModels.T,
  kickType.T,
  "",
  SpinType.T),

  J:
  new piece("j4",[
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
    new vector2(-1,1),
  ],
  tileModels.J,
  kickType.J,
  "",
  SpinType.T),

  S:
  new piece("s4",[
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,1),
    new vector2(0,1),
  ],
  tileModels.S,
  kickType.S,
  "",
  SpinType.S),
  
  //modified tetrominoes
  sz:
  new piece("s4f",[
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,1),
    new vector2(0,1),
  ],
  tileModel.fromString(`
  &
    
    122133
    222333
    222333
    133122
    333222
    333222
    `),
  kickType.T,
  "s",
  SpinType.S),
  jl:
  new piece("l4f",[
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
    new vector2(1,1),
  ],
  tileModel.fromString(`
  &
    
    122133
    202303
    222333
    133122
    303202
    333222
    `),
  kickType.T,
  "l",
  SpinType.T),

  //main pentominoes
  I5:piece.fromString("i5",`
    #####
    `,tileModels.I,"",kickType.I5),
  V:piece.fromString("v5",`
      #
      #
    ###
    `,tileModels.V,"",kickType.V).shifted(vector2.up),
  T5:piece.fromString("t5",`
     #
     #
    ###
    `,tileModels.O,"",kickType.T5),
  U:piece.fromString("u5",`
    # #
    ###
    `,tileModels.U,"",kickType.U),
  W:piece.fromString("w5",`
    #
    ##
     ##
    `,tileModels.W,"",kickType.W),
  X:piece.fromString("x5",`
     #
    ###
     #
    `,tileModels.T,"",kickType.X).lodgeable(),
  J5:piece.fromString("j5",`
    #
    ####
    `,tileModels.J,"",kickType.J5),
  L5:piece.fromString("l5",`
       #
    ####
    `,tileModels.L,"",kickType.L5),
  H:piece.fromString("h5",`
      ##
    ###
    `,tileModels.H,"",kickType.H),
  N:piece.fromString("n5",`
    ##
     ###
    `,tileModels.N,"",kickType.N),
  Y:piece.fromString("y5",`
      #
    ####
    `,tileModels.Y,"",kickType.Y),
  R:piece.fromString("r5",`
     #
    ####
    `,tileModels.R,"",kickType.R),
  P:piece.fromString("p5",`
    33
    333
    `,tileModels.P,"",kickType.P),
  Q:piece.fromString("q5",`
     33
    333
    `,tileModels.Q,"",kickType.Q),
  F:piece.fromString("f5",`
    3
    333
     3
    `,tileModels.F,"",kickType.F),
  K:piece.fromString("k5",`
      3
    333
     3
    `,tileModels.K,"",kickType.K),
  Z5:piece.fromString("z5",`
    33
     3
     33
    `,tileModels.Z,"",kickType.Z5),
  S5:piece.fromString("s5",`
     33
     3
    33
    `,tileModels.S,"",kickType.S5),
  
  //123 minos
  C:
  new piece("c3",[
    new vector2(0,0),
    new vector2(1,0),
    new vector2(0,1),
  ],
  tileModel.fromString(`
  &
    
    111111
    102220
    122222
    102220
    122222
    102220
    `),
  kickType.special,
  "",
  SpinType.immobilespin),
  "I3":
  new piece("i3",[
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
  ],
  tileModel.fromString(`
  &
    
    111111
    103330
    133333
    133033
    133333
    103330
    `),
  kickType.special,
  "",
  SpinType.immobilespin),
  I2:
  new piece("i2",[
    new vector2(0,0),
    new vector2(1,0),
  ],
  tileModel.fromString(`
  &
    
    111111
    100002
    100000
    100200
    100000
    120000
    `),
  kickType.special,
  "",
  SpinType.immobilespin),
  O1:
  new piece("o1",[
    new vector2(0,0),
  ],
  tileModel.fromString(`
  &
    
    111111
    100000
    100000
    100300
    100000
    100000
    `),
  kickType.none,
  "",
  SpinType.immobilespin).lodgeable(),

  //polyplets

  dia2:piece.fromString("dia2",`
     #
    #
    `,tileModel.fromString(`
  &
    
    122222
    230003
    200000
    200000
    200000
    230003
    `)),

  dia3:piece.fromString("dia3",`
      #
     #
    #
    `,tileModel.fromString(`
  &
    
    133333
    300002
    300000
    300000
    300000
    320000
    `)),

  bend2_1:piece.fromString("bend2_1",`
      #
    ##
    `,tileModel.fromString(`
  &
    
    122222
    230003
    200000
    230303
    200000
    230003
    `)),

  bend2_1p:piece.fromString("bend2_1p",`
    # 
     ##
    `,tileModel.fromString(`
  &
    
    133333
    320202
    300000
    320002
    300000
    320202
    `)),

  caret:piece.fromString("caret",`
     #
    # #
    `,tileModel.fromString(`
  &
    
    122222
    230303
    200000
    230303
    200000
    230303
    `)),

  //-----novelties
  //jump square and jump square derivatives
  O9:piece.fromString("o9",`
    ###
    ###
    ###
    `,tileModels.O,"bob"),
  O16:piece.fromString("o16",`
    ####
    ####
    ####
    ####
    `,tileModels.O,"robert"),
  O25:piece.fromString("o25",`
    #####
    #####
    #####
    #####
    #####
    `,tileModels.O,"o25"),
  O36:piece.fromString("o36",`
    ######
    ######
    ######
    ######
    ######
    ######
    `,tileModels.O,"o36"),
  O49:piece.fromString("o49",`
    #######
    #######
    #######
    #######
    #######
    #######
    #######
    `,tileModels.O,"o49"),
  O64:piece.fromString("o64",`
    ########
    ########
    ########
    ########
    ########
    ########
    ########
    ########
    `,tileModels.O,"o64"),
  O81:piece.fromString("o81",`
    #########
    #########
    #########
    #########
    #########
    #########
    #########
    #########
    #########
    `,tileModels.O,"o81"),
  O100:piece.fromString("o100",`
    ##########
    ##########
    ##########
    ##########
    ##########
    ##########
    ##########
    ##########
    ##########
    ##########
    `,tileModels.O,"o100"),

  //furries
  rane:piece.fromString("rane",`
    #     #

    # # # #

     # # #
      # #
    `,tileModels.T,"rane"),
  ":3":piece.fromString("colonthree",`
    # ###
       #
    #   #
      ###
    `,tileModels.I,":3"),
  krux:piece.fromString("krux",`
       #######
      #####  #
      #####  #
    ##### #  #
    ##### # #
    # # ###  #
     # ### ##
    `,tileModels.J,"kruxxdd"),
});

export const bagprefabs = Object.freeze({
  tetrominos: [
    pieces.I,
    pieces.L,
    pieces.O,
    pieces.Z,
    pieces.T,
    pieces.J,
    pieces.S,
  ],
  arcade: [
    pieces.I.withKickType(kickType.I).withSymmetry(symmetry.rot180),
    pieces.L.rotated(2).withRotationCleared(),
    pieces.O.withSymmetry(symmetry.rot90),
    pieces.Z.withKickType(kickType.O).withSymmetry(symmetry.rot180),
    pieces.T.rotated(2).withRotationCleared(),
    pieces.J.rotated(2).withRotationCleared(),
    pieces.S.withKickType(kickType.O).withSymmetry(symmetry.rot180),
  ],
  tetrominosPlusGrenade: [
    pieces.I,
    pieces.L,
    pieces.O,
    pieces.Z,
    pieces.T,
    pieces.J,
    pieces.S,
    pieces['O1'].withName("grenade").withModel(tileModels.grenade).withGimmick(tileType.grenade),
  ],
  cursedTennis: [
    pieces.I.withModel(new tileModel(()=>{
      return colour3.fromHSV((Date.now() / 2000) % 1,1,1);
    })),
    pieces.L.withModel(new tileModel(()=>{
      return colour3.fromHex("#f2834b",(Math.sin(Date.now() / 5000)/2 + 0.5)**8);
    })),
    pieces.O.withModel(tileModel.sprite(images.krux)),
    pieces.Z.withModel(new tileModel(()=>{
      return colour3.fromHSV(Math.sin(Math.floor(Date.now()/200)),1,1);
    })),
    pieces.T.withModel(new tileModel(()=>{
      return new colour3(1,1,1,Math.sin(Date.now() / 1000)/4 + 0.75);
    })),
    pieces.J.withModel(tileModel.gradient(colour3.fromHex("#4b4bf2"),colour3.fromHex("#191953"),5)),
    pieces.S.withModel(tileModel.tripleRingTransparency(
      colour3.fromHex("#712b11",1),
      colour3.fromHex("#24cfcf",0.2),
      colour3.fromHex("#24cfcf",0.2)
    )),
  ],
  freeTetrominos: [
    pieces.I,
    pieces.jl,
    pieces.O,
    pieces.T,
    pieces.sz,
  ],
  fixedTetrominos: [
    pieces.I.rotated(0).withModel(new tileModel(colour3.fromHSV( 0/19,0.6901,0.9490))).withRotationCleared(),
    pieces.I.rotated(1).withModel(new tileModel(colour3.fromHSV( 1/19,0.6901,0.9490))).withRotationCleared(),
    pieces.L.rotated(0).withModel(new tileModel(colour3.fromHSV( 2/19,0.6901,0.9490))).withRotationCleared(),
    pieces.L.rotated(1).withModel(new tileModel(colour3.fromHSV( 3/19,0.6901,0.9490))).withRotationCleared(),
    pieces.L.rotated(2).withModel(new tileModel(colour3.fromHSV( 4/19,0.6901,0.9490))).withRotationCleared(),
    pieces.L.rotated(3).withModel(new tileModel(colour3.fromHSV( 5/19,0.6901,0.9490))).withRotationCleared(),
    pieces.O.rotated(0).withModel(new tileModel(colour3.fromHSV( 6/19,0.6901,0.9490))).withRotationCleared(),
    pieces.Z.rotated(0).withModel(new tileModel(colour3.fromHSV( 7/19,0.6901,0.9490))).withRotationCleared(),
    pieces.Z.rotated(1).withModel(new tileModel(colour3.fromHSV( 8/19,0.6901,0.9490))).withRotationCleared(),
    pieces.T.rotated(0).withModel(new tileModel(colour3.fromHSV( 9/19,0.6901,0.9490))).withRotationCleared(),
    pieces.T.rotated(1).withModel(new tileModel(colour3.fromHSV(10/19,0.6901,0.9490))).withRotationCleared(),
    pieces.T.rotated(2).withModel(new tileModel(colour3.fromHSV(11/19,0.6901,0.9490))).withRotationCleared(),
    pieces.T.rotated(3).withModel(new tileModel(colour3.fromHSV(12/19,0.6901,0.9490))).withRotationCleared(),
    pieces.J.rotated(0).withModel(new tileModel(colour3.fromHSV(13/19,0.6901,0.9490))).withRotationCleared(),
    pieces.J.rotated(1).withModel(new tileModel(colour3.fromHSV(14/19,0.6901,0.9490))).withRotationCleared(),
    pieces.J.rotated(2).withModel(new tileModel(colour3.fromHSV(15/19,0.6901,0.9490))).withRotationCleared(),
    pieces.J.rotated(3).withModel(new tileModel(colour3.fromHSV(16/19,0.6901,0.9490))).withRotationCleared(),
    pieces.S.rotated(0).withModel(new tileModel(colour3.fromHSV(17/19,0.6901,0.9490))).withRotationCleared(),
    pieces.S.rotated(1).withModel(new tileModel(colour3.fromHSV(18/19,0.6901,0.9490))).withRotationCleared(),
  ],
  pentominos: [
    pieces.Z5,
    pieces.S5,
    pieces.P,
    pieces.Q,
    pieces.F,
    pieces.K,
    pieces.T5,
    pieces.U,
    pieces.V,
    pieces.W,
    pieces.X,
    pieces.J5,
    pieces.L5,
    pieces.R,
    pieces.Y,
    pieces.N,
    pieces.H,
    pieces.I5,
  ],
  m123: [
    pieces['C'],
    pieces['I3'],
    pieces['I2'],
    pieces['O1'],
  ],
  fixedM123: [
    pieces['C'].rotated(0).withModel(new tileModel(colour3.fromHSV( 0/9,0.6901,0.9490))).withRotationCleared(),
    pieces['C'].rotated(1).withModel(new tileModel(colour3.fromHSV( 1/9,0.6901,0.9490))).withRotationCleared(),
    pieces['C'].rotated(2).withModel(new tileModel(colour3.fromHSV( 2/9,0.6901,0.9490))).withRotationCleared(),
    pieces['C'].rotated(3).withModel(new tileModel(colour3.fromHSV( 3/9,0.6901,0.9490))).withRotationCleared(),
    pieces['I3'].rotated(0).withModel(new tileModel(colour3.fromHSV( 4/9,0.6901,0.9490))).withRotationCleared(),
    pieces['I3'].rotated(1).withModel(new tileModel(colour3.fromHSV( 5/9,0.6901,0.9490))).withRotationCleared(),
    pieces['I2'].rotated(0).withModel(new tileModel(colour3.fromHSV( 6/9,0.6901,0.9490))).withRotationCleared(),
    pieces['I2'].rotated(1).withModel(new tileModel(colour3.fromHSV( 7/9,0.6901,0.9490))).withRotationCleared(),
    pieces['O1'].rotated(0).withModel(new tileModel(colour3.fromHSV( 8/9,0.6901,0.9490))).withRotationCleared(),
  ],
  sulfir: [
    piece.fromString("sulfirS",`
       ##
      ##
        #
      ##
      `,tileModels.S,"S"),
    piece.fromString("sulfiru",`
      # #
      # #
       ##
      `,tileModels.J,"u"),
    piece.fromString("sulfirl",`
      ##
       #
       #
        #
      `,tileModels.L,"l"),
    piece.fromString("sulfirpipe",`
       #
       #
       #
       #
      `,tileModels.I,"|"),
    piece.fromString("sulfirf",`
       ##
      #
      ##
      #
      `,tileModels.T,"f"),
    piece.fromString("sulfiri",`
       #
      
      ##
       ##
      `,tileModels.Z,"i"),
    piece.fromString("sulfirr",`
      ###
      #
      #
      `,tileModels.O,"r"),
  ],
  fool9: [
    piece.fromString("fool9z",`
      # ##
         ## #
      `,tileModels.Z,"Z - 9"),
    piece.fromString("fool9l",`
          # #
      # ###
      `,tileModels.L,"L - 9"),
    piece.fromString("fool9o",`
      #

      ##
      ##

       #
      `,tileModels.O,"O - 9"),
    piece.fromString("fool9s",`
         ## #
      # ##
      `,tileModels.S,"S - 9"),
    piece.fromString("fool9i",`
      #
       
        #
          
          #

            #
      `,tileModels.I,"I - 9"),
    piece.fromString("fool9j",`
      # #
        ### #
      `,tileModels.J,"J - 9"),
    piece.fromString("fool9t",`
       #

       #
      ###

       #
      `,tileModels.T,"T - 9"),
  ],
  fool10: [
    piece.fromString("fool10z",`
       ##
      # ##
        #
       #
      ## #
       ##
      `,tileModels.Z,"Z - 10"),
    piece.fromString("fool10l",`
          #
      #    #
      ######
      `,tileModels.L,"L - 10"),
    piece.fromString("fool10o",`
        ##
       ####
      ##  ##
      ##  ##
       ####
        ##
      `,tileModels.O,"O - 10"),
    piece.fromString("fool10s",`
       ##
      ## #
       #
        #
      # ##
       ##
      `,tileModels.S,"S - 10"),
    piece.fromString("fool10i",`
       #### #
      # ####
      `,tileModels.I,"I - 10"),
    piece.fromString("fool10j",`
       #   
      #    #
      ######
      `,tileModels.J,"J - 10"),
    piece.fromString("fool10t",`
      #####
      # # #
        #
        #
       ###
      `,tileModels.T,"T - 10"),
  ],
  boiledpasta: [
    piece.fromString("boiledpastaz",`
         ####
      #######
      #######
         ###
        ###
        ######
       #######
       ###
      `,tileModels.Z,"Z - 10"),
    piece.fromString("boiledpastal",`
      ##
      ###
       ##
       ##
       ###
        ##
        ##
        ##
        ####
         ###
      `,tileModels.L,"L - 10"),
    piece.fromString("boiledpastao",`
       ###
      #####
      ## ##
      ##  ##
      ##  ##
       ## ##
       #####
        ###
      `,tileModels.O,"O - 10"),
    piece.fromString("boiledpastas",`
       #####
      #######
      ###  ##
       ####
        ####
      ## ####
      #######
       #####
      `,tileModels.S,"S - 10"),
    piece.fromString("boiledpastai",`
        ##
        ##

       ##
      ####
      ####
        ##
        ###
        ####
         ###
      `,tileModels.I,"I - 10"),
    piece.fromString("boiledpastaj",`
         ##
         ##

       ####
      #####
      ## ###
          ##
          ##
          ##
      ##  ##
      ######
       ####
      `,tileModels.J,"J - 10"),
    piece.fromString("boiledpastat",`
       ##
       ##
       ####
      #####
      33
      33
      33
      333
       33333
        3333
      `,tileModels.T,"T - 10"),
  ],
  tetraplets: [
    //two reflection symmetries
    piece.fromString("dia4",`
         #
        #
       #
      #
      `,tileModel.fromString(`
    &
      
      133333
      321112
      312121
      321112
      312121
      321112
      `)),

    piece.fromString("degrees",`
       #
      # #
       #
      `,tileModel.fromString(`
    &
      
      122222
      231113
      213131
      231313
      213131
      231113
      `)).lodgeable(),

    piece.fromString("I",`
      ####
      `,tileModel.fromString(`
    &
      
      122222
      231113
      213131
      231113
      213131
      231113
      `)),

    piece.fromString("O",`
      ##
      ##
      `,tileModel.fromString(`
    &
      
      133333
      321112
      312121
      321312
      312121
      321112
      `)).lodgeable(),
    //one reflection symmetry

    piece.fromString("resh",`
        #
        #
      ##
      `,tileModel.fromString(`
    &
      
      133333
      321212
      312121
      321112
      312121
      321212
      `)),

    piece.fromString("heartmark",`
       #
      ##
        #
      `,tileModel.fromString(`
    &
      
      122222
      233133
      233133
      211311
      233133
      233133
      `)),

    piece.fromString("parenthesis",`
      #  #
       ##
      `,tileModel.fromString(`
    &
      
      122222
      233133
      233333
      211111
      233333
      233133
      `)),

    piece.fromString("ren",`
      # #
       #
       #
      `,tileModel.fromString(`
    &
      
      122222
      233333
      233133
      211311
      233133
      233333
      `)),

    piece.fromString("ayin",`
      # #
       #
      #
      `,tileModel.fromString(`
    &
      
      122222
      233333
      233133
      231113
      233133
      233333
    `)),

    piece.fromString("T",`
       #
      ###
      `,tileModel.fromString(`
    &
      
      133333
      322222
      322122
      321112
      322122
      322222
    `)),

    // 180 rotational symmetry

    piece.fromString("slash",`
      # 
       ##
         #
      `,tileModel.fromString(`
    &
      
      122222
      222202
      222022
      220222
      202222
      222222
      `)),

    piece.fromString("backslash",`
         #
       ##
      #  
      `,tileModel.fromString(`
    &
      
      133333
      333303
      333033
      330333
      303333
      333333
      `)),

    piece.fromString("sigmoid",`
        ##
      ##
      `,tileModel.fromString(`
    &
      
      122222
      202222
      220222
      222022
      222202
      222222
      `)),

    piece.fromString("tangent",`
      ##
        ## 
      `,tileModel.fromString(`
    &
      
      133333
      303333
      330333
      333033
      333303
      333333
      `)),

    piece.fromString("tilde",`
       # #
      # #
      `,tileModel.fromString(`
    &
      
      122222
      202202
      222022
      220222
      202202
      222222
      `)),

    piece.fromString("aibu",`
      # #
       # # 
      `,tileModel.fromString(`
    &
      
      133333
      303303
      333033
      330333
      303303
      333333
      `)),

    piece.fromString("Z",`
      ##
       ##
      `,tileModel.fromString(`
    &
      
      122222
      202202
      220222
      222022
      202202
      222222
      `)),

    piece.fromString("S",`
       ##
      ## 
      `,tileModel.fromString(`
    &
      
      133333
      303303
      330333
      333033
      303303
      333333
      `)),

    //no symmetry
    piece.fromString("glottal",`
       #
      # ##
      `,tileModel.fromString(`
    &
      
      122222
      200002
      202222
      202222
      202222
      222222
      `)),

    piece.fromString("pharyngeal",`
        #
      ## #
      `,tileModel.fromString(`
    &
      
      133333
      300003
      303333
      303333
      303333
      333333
      `)),

    piece.fromString("bend2_2",`
         #
        #
      ## 
      `,tileModel.fromString(`
    &
      
      122222
      202222
      202222
      202222
      200002
      222222
      `)),

    piece.fromString("bend2_2p",`
      #
       #
        ##
      `,tileModel.fromString(`
    &
      
      133333
      303333
      303333
      303333
      300003
      333333
      `)),

    piece.fromString("waw",`
         #
      ### 
      `,tileModel.fromString(`
    &
      
      122222
      222202
      222202
      222202
      200002
      222222
      `)),

    piece.fromString("nun",`
      #
       ###
      `,tileModel.fromString(`
    &
      
      133333
      333303
      333303
      333303
      300003
      333333
      `)),

    piece.fromString("question",`
      #
       #
       ## 
      `,tileModel.fromString(`
    &
      
      122222
      200002
      222222
      222222
      200002
      222222
      `)),

    piece.fromString("istifham",`
        #
       #
      ##
      `,tileModel.fromString(`
    &
      
      133333
      300003
      333333
      333333
      300003
      333333
      `)),

    piece.fromString("fishhook",`
       #
      #
       ##
      `,tileModel.fromString(`
    &
      
      122222
      202202
      202202
      202202
      202202
      222222
      `)),

    piece.fromString("shi",`
       # 
        #
      ##
      `,tileModel.fromString(`
    &
      
      133333
      303303
      303303
      303303
      303303
      333333
      `)),

    piece.fromString("nu",`
      # #
      ##
      `,tileModel.fromString(`
    &
      
      122222
      200002
      202202
      202202
      202202
      222222
      `)),

    piece.fromString("и",`
      # #
       ##
      `,tileModel.fromString(`
    &
      
      133333
      300003
      303303
      303303
      303303
      333333
      `)),

    piece.fromString("check",`
         #
      # #
       #
      `,tileModel.fromString(`
    &
      
      122222
      202202
      202202
      202202
      200002
      222222
      `)),

    piece.fromString("he",`
      #
       # #
        #
      `,tileModel.fromString(`
    &
      
      133333
      303303
      303303
      303303
      300003
      333333
      `)),
      
    piece.fromString("J",`
      #
      ###
      `,tileModel.fromString(`
    &
      
      122222
      200002
      202202
      202202
      202202
      222222
      `)),

    piece.fromString("L",`
        #
      ###
      `,tileModel.fromString(`
    &
      
      133333
      300003
      303303
      303303
      303303
      333333
      `)),
  ]
});