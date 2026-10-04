import { clone, colour3, vector2 } from "./basics";
import { tileType } from "./board";
import { images } from "./imagemanager";
import { palette, tileModel, tileModels } from "./roms";
import { kickType, simpleKickType, SpinType, symmetry } from "./rotationsystems";

export enum orientiation {
  north,
  east,
  south,
  west,
}

export const compensations = {
  [simpleKickType.none]:new vector2(0,0),
  [simpleKickType.T]:new vector2(0,0),
  [simpleKickType.I]:new vector2(0.5,0),
  [simpleKickType.O]:new vector2(0.5,0),
}

export const CORoffsets = {
  [simpleKickType.none]:new vector2(0,0),
  [simpleKickType.T]:new vector2(0,0),
  [simpleKickType.I]:new vector2(0.5,-0.5),
  [simpleKickType.O]:new vector2(0.5,0.5),
}

export class piece{
  name:string;

  tiles:vector2[];
  tileModel:tileModel;
  kickType:kickType;
  spinType:SpinType;
  orientiation=orientiation.north;
  chirality=vector2.one;
  symmetry=symmetry.none;

  tileType=tileType.none;

  constructor(tiles:vector2[],tileModel:tileModel,kickType:kickType,name?:string,spinType?:SpinType){
    this.tiles = tiles;
    this.tileModel = tileModel;
    this.kickType = kickType;
    this.name = name || this.tiles.toString();
    this.spinType = spinType || SpinType.immobilespin;
  }

  //misc
  booleanoperation(other:piece,OT=false,nOT=false,OnT=false){
    const robot = clone(this)
    robot.tiles = []
    
    for(const i of this.tiles){
      let otherincludes = false;
      for(const j of other.tiles)
        if(i.eqeqeq(j)){
          otherincludes = true
          break
        }

      if((OT && otherincludes) || (nOT && !otherincludes))
        robot.tiles.push(clone(i))
    }

    if(OnT)
      for(const i of other.tiles){
        let thisincludes = false;
        for(const j of this.tiles)
          if(i.eqeqeq(j)){
            thisincludes = true
            break
          }

        if(!thisincludes)
          robot.tiles.push(clone(i))
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
    for(let i=0; i<this.tiles.length; i++){
      this.tiles[i] = this.tiles[i].rotate(rotation)
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
    for(let i=0; i<this.tiles.length; i++){
      this.tiles[i] = this.tiles[i].rotate(rotation)
    }
    this.orientiation = endorientation
  }

  Shift(offset:vector2){
    for(let i=0; i<this.tiles.length; i++){
      this.tiles[i] = this.tiles[i].add(offset);
    }
  }

  shifted(offset:vector2){
    let robot = clone(this);
    robot.Shift(offset);
    return robot;
  }

  Hadamard(other:vector2){
    for(let i=0; i<this.tiles.length; i++){
      this.tiles[i] = this.tiles[i].hadamard(other)
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
    robot.kickType = _kickType;
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
  I5:
  null,
  V:
  null,
  T5:
  null,
  U:
  null,
  W:
  null,
  X:
  null,
  J5:
  null,
  L5:
  null,
  H:
  null,
  N:
  null,
  Y:
  null,
  R:
  null,
  P:
  null,
  Q:
  null,
  F:
  null,
  K:
  null,
  Z5:
  null,
  S5:
  null,
  
  //123 minos
  "<":
  new piece([
    new vector2(0,0),
    new vector2(1,0),
    new vector2(0,1),
  ],
  tileModel.tripleRing(palette.one,palette.zro),
  kickType.T,
  "<",
  SpinType.immobilespin),
  "_":
  new piece([
    new vector2(-1,0),
    new vector2(0,0),
    new vector2(1,0),
  ],
  tileModel.tripleRing(palette.two,palette.zro),
  kickType.T,
  "_",
  SpinType.immobilespin),
  "-":
  new piece([
    new vector2(0,0),
    new vector2(1,0),
  ],
  tileModel.tripleRing(palette.tri,palette.zro),
  kickType.T,
  "-",
  SpinType.immobilespin),
  ".":
  new piece([
    new vector2(0,0),
  ],
  tileModel.tripleRing(palette.zro,palette.one),
  kickType.T,
  ".",
  SpinType.immobilespin),
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
    pieces['.'].withName("grenade").withModel(tileModels.grenade).withGimmick(tileType.grenade),
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
  m123: [
    pieces['<'],
    pieces['_'],
    pieces['-'],
    pieces['.'],
  ],
  fixedM123: [
    pieces['<'].rotated(0).withModel(tileModel.tripleRing(colour3.fromHSV( 0/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['<'].rotated(1).withModel(tileModel.tripleRing(colour3.fromHSV( 1/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['<'].rotated(2).withModel(tileModel.tripleRing(colour3.fromHSV( 2/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['<'].rotated(3).withModel(tileModel.tripleRing(colour3.fromHSV( 3/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['_'].rotated(0).withModel(tileModel.tripleRing(colour3.fromHSV( 4/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['_'].rotated(1).withModel(tileModel.tripleRing(colour3.fromHSV( 5/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['-'].rotated(0).withModel(tileModel.tripleRing(colour3.fromHSV( 6/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['-'].rotated(1).withModel(tileModel.tripleRing(colour3.fromHSV( 7/9,0.6901,0.9490),palette.one)).withRotationCleared(),
    pieces['.'].rotated(0).withModel(tileModel.tripleRing(colour3.fromHSV( 8/9,0.6901,0.9490),palette.one)).withRotationCleared(),
  ],
});