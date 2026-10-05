import { clone, colour3, modular, vector2 } from "./basics";
import { tile, tileType } from "./board";
import { images } from "./imagemanager";
import { palette, tileModel, tileModels } from "./roms";
import { kickType, simpleKickType, SpinType, symmetry } from "./rotationsystems";

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

export class piece{
  name:string;

  tileoffsets:vector2[];
  tileModel:tileModel;
  ikickType?:kickType;
  spinType:SpinType;
  orientiation=orientiation.north;
  chirality=vector2.one;
  symmetry=symmetry.none;

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

  constructor(tileoffsets:vector2[],tileModel:tileModel,kickType:kickType,name:string,spinType:SpinType=SpinType.immobilespin){
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
  get bounds(){
    var [northeast,southwest] = this.extends

    const _bounds = northeast.sub(southwest).add(vector2.one)
    
    return _bounds
  }

  get extends(){
    var northeast = this.tileoffsets[0]
    var southwest = this.tileoffsets[0]

    for(const i of this.tileoffsets){
      northeast = new vector2(Math.max(northeast.x,i.x),Math.max(northeast.y,i.y))
      southwest = new vector2(Math.min(southwest.x,i.x),Math.min(southwest.y,i.y))
    }
    return [northeast,southwest]
  }

  static fromString(tilepicture:string,tileModel:tileModel,name:string,_kickType=kickType.auto){
    const robot = new piece([],tileModel,_kickType,name,SpinType.immobilespin)

    const rows = tilepicture.split("\n")
    for (let y = 0; y < rows.length; y++) {
      const row = rows[rows.length - y - 1];
      for (let x = 0; x < row.length; x++) {
        const element = row[x];
        if(element === " ")continue
        robot.tileoffsets.push(new vector2(x,y))
      }
    }

    const [northeast, southwest] = robot.extends

    const origin = new vector2(Math.floor((northeast.x + southwest.x)/2),Math.floor((northeast.y + southwest.y)/2))
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
}

export const pieces = Object.freeze({
  // main tetrominos
  I:
  new piece([
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
  new piece([
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
  new piece([
    new vector2(0,0),
    new vector2(0,1),
    new vector2(1,0),
    new vector2(1,1),
  ],
  tileModels.O,
  kickType.O,
  "",
  SpinType.none),

  Z:
  new piece([
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
  new piece([
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
  new piece([
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
  new piece([
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
  new piece([
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,1),
    new vector2(0,1),
  ],
  tileModel.tripleRing(palette.one,undefined,palette.two),
  kickType.T,
  "s",
  SpinType.S),
  jl:
  new piece([
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
    new vector2(1,1),
  ],
  tileModel.tripleRing(palette.two,undefined,palette.one),
  kickType.T,
  "l",
  SpinType.T),

  //main pentominoes
  I5:piece.fromString(`
    #####
    `,tileModels.I,"",kickType.I5),
  V:piece.fromString(`
      #
      #
    ###
    `,tileModels.V,"",kickType.V).shifted(vector2.up),
  T5:piece.fromString(`
     #
     #
    ###
    `,tileModels.O,"",kickType.T5),
  U:piece.fromString(`
    # #
    ###
    `,tileModels.U,"",kickType.U),
  W:piece.fromString(`
    #
    ##
     ##
    `,tileModels.W,"",kickType.W),
  X:piece.fromString(`
     #
    ###
     #
    `,tileModels.T,"",kickType.X),
  J5:piece.fromString(`
    #
    ####
    `,tileModels.J,"",kickType.J5),
  L5:piece.fromString(`
       #
    ####
    `,tileModels.L,"",kickType.L5),
  H:piece.fromString(`
      ##
    ###
    `,tileModels.H,"",kickType.H),
  N:piece.fromString(`
    ##
     ###
    `,tileModels.N,"",kickType.N),
  Y:piece.fromString(`
      #
    ####
    `,tileModels.Y,"",kickType.Y),
  R:piece.fromString(`
     #
    ####
    `,tileModels.R,"",kickType.R),
  P:piece.fromString(`
    33
    333
    `,tileModels.P,"",kickType.P),
  Q:piece.fromString(`
     33
    333
    `,tileModels.Q,"",kickType.Q),
  F:piece.fromString(`
    3
    333
     3
    `,tileModels.F,"",kickType.F),
  K:piece.fromString(`
      3
    333
     3
    `,tileModels.K,"",kickType.K),
  Z5:piece.fromString(`
    33
     3
     33
    `,tileModels.Z,"",kickType.Z5),
  S5:piece.fromString(`
     33
     3
    33
    `,tileModels.S,"",kickType.S5),
  
  //123 minos
  "l3":
  new piece([
    new vector2(0,0),
    new vector2(1,0),
    new vector2(0,1),
  ],
  tileModel.tripleRing(palette.one,palette.zro),
  kickType.T,
  "",
  SpinType.immobilespin),
  "i3":
  new piece([
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
  ],
  tileModel.tripleRing(palette.two,palette.zro),
  kickType.T,
  "",
  SpinType.immobilespin),
  "i2":
  new piece([
    new vector2(0,0),
    new vector2(1,0),
  ],
  tileModel.tripleRing(palette.tri,palette.zro),
  kickType.T,
  "",
  SpinType.immobilespin),
  "o1":
  new piece([
    new vector2(0,0),
  ],
  tileModel.tripleRing(palette.zro,palette.one),
  kickType.T,
  "",
  SpinType.immobilespin),

  //-----novelties
  //jump square and jump square derivatives
  "o9":piece.fromString(`
    ###
    ###
    ###
    `,tileModels.O,"bob"),
  "o16":piece.fromString(`
    ####
    ####
    ####
    ####
    `,tileModels.O,"robert"),
  "o25":piece.fromString(`
    #####
    #####
    #####
    #####
    #####
    `,tileModels.O,"o25"),
  "o36":piece.fromString(`
    ######
    ######
    ######
    ######
    ######
    ######
    `,tileModels.O,"o36"),
  "o49":piece.fromString(`
    #######
    #######
    #######
    #######
    #######
    #######
    #######
    `,tileModels.O,"o49"),
  "o64":piece.fromString(`
    ########
    ########
    ########
    ########
    ########
    ########
    ########
    ########
    `,tileModels.O,"o64"),
  "o81":piece.fromString(`
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
  "o100":piece.fromString(`
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
  "rane":piece.fromString(`
    #     #

    # # # #

     # # #
      # #
    `,tileModels.T,"rane"),
  ":3":piece.fromString(`
    # ###
       #
    #   #
      ###
    `,tileModels.I,":3"),
  "krux":piece.fromString(`
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
    pieces['o1'].withName("grenade").withModel(tileModels.grenade).withGimmick(tileType.grenade),
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
    pieces['l3'],
    pieces['i3'],
    pieces['i2'],
    pieces['o1'],
  ],
  fixedM123: [
    pieces['l3'].rotated(0).withModel(tileModel.tripleRing(colour3.fromHSV( 0/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['l3'].rotated(1).withModel(tileModel.tripleRing(colour3.fromHSV( 1/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['l3'].rotated(2).withModel(tileModel.tripleRing(colour3.fromHSV( 2/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['l3'].rotated(3).withModel(tileModel.tripleRing(colour3.fromHSV( 3/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['i3'].rotated(0).withModel(tileModel.tripleRing(colour3.fromHSV( 4/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['i3'].rotated(1).withModel(tileModel.tripleRing(colour3.fromHSV( 5/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['i2'].rotated(0).withModel(tileModel.tripleRing(colour3.fromHSV( 6/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['i2'].rotated(1).withModel(tileModel.tripleRing(colour3.fromHSV( 7/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['o1'].rotated(0).withModel(tileModel.tripleRing(colour3.fromHSV( 8/9,0.6901,0.9490),palette.one)).withRotationCleared(),
  ],
  sulfir: [
    piece.fromString(`
       ##
      ##
        #
      ##
      `,tileModels.S,"S"),
    piece.fromString(`
      # #
      # #
       ##
      `,tileModels.J,"u"),
    piece.fromString(`
      ##
       #
       #
        #
      `,tileModels.L,"l"),
    piece.fromString(`
       #
       #
       #
       #
      `,tileModels.I,"|"),
    piece.fromString(`
       ##
      #
      ##
      #
      `,tileModels.T,"f"),
    piece.fromString(`
       #
      
      ##
       ##
      `,tileModels.Z,"i"),
    piece.fromString(`
      ###
      #
      #
      `,tileModels.O,"r"),
  ],
  fool9: [
    piece.fromString(`
      # ##
         ## #
      `,tileModels.Z,"Z - 9"),
    piece.fromString(`
          # #
      # ###
      `,tileModels.L,"L - 9"),
    piece.fromString(`
      #

      ##
      ##

       #
      `,tileModels.O,"O - 9"),
    piece.fromString(`
         ## #
      # ##
      `,tileModels.S,"S - 9"),
    piece.fromString(`
      #
       
        #
          
          #

            #
      `,tileModels.I,"I - 9"),
    piece.fromString(`
      # #
        ### #
      `,tileModels.J,"J - 9"),
    piece.fromString(`
       #

       #
      ###

       #
      `,tileModels.T,"T - 9"),
  ],
  fool10: [
    piece.fromString(`
       ##
      # ##
        #
       #
      ## #
       ##
      `,tileModels.Z,"Z - 10"),
    piece.fromString(`
          #
      #    #
      ######
      `,tileModels.L,"L - 10"),
    piece.fromString(`
        ##
       ####
      ##  ##
      ##  ##
       ####
        ##
      `,tileModels.O,"O - 10"),
    piece.fromString(`
       ##
      ## #
       #
        #
      # ##
       ##
      `,tileModels.S,"S - 10"),
    piece.fromString(`
       #### #
      # ####
      `,tileModels.I,"I - 10"),
    piece.fromString(`
       #   
      #    #
      ######
      `,tileModels.J,"J - 10"),
    piece.fromString(`
      #####
      # # #
        #
        #
       ###
      `,tileModels.T,"T - 10"),
  ],
});