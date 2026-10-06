import { clone, colour3, vector2 } from './basics.ts'
import { kickType, simpleKickType, SpinType, symmetry } from './rotationsystems.ts';
import { tileType } from './board.ts';
import { images } from './imagemanager.ts';

const lightmode = Object.freeze({
  garbage: colour3.fromHex("#adafb8"),

  I: colour3.fromHex("#f24b4b"),
  L: colour3.fromHex("#f2834b"),
  O: colour3.fromHex("#f2f24b"),
  Z: colour3.fromHex("#4bf24b"),
  T: colour3.fromHex("#4bf2f2"),
  J: colour3.fromHex("#4b4bf2"),
  S: colour3.fromHex("#f24bf2"),
  chartreuse: colour3.fromHex("#83f24b"),
  greenish: colour3.fromHex("#4bf283"),
  blue: colour3.fromHex("#4b83f2"),
  violent: colour3.fromHex("#834bf2"),
  pink: colour3.fromHex("#f24b83"),

  wound: colour3.fromHex("#834bf2"),

  attackunentered: colour3.fromHex("#adafb8"),
  attackunripe: colour3.fromHex("#ff4b4b"),
  attackdormant: colour3.fromHex("#4b0000"),
  attackused: colour3.fromHex("#4b4b4b"),
  attack1: colour3.fromHex("#ff0000"),
  attack2: colour3.fromHex("#ffffff"),
  
  b2b: colour3.fromHex("#4bf2f2"),
  b2b2b: colour3.fromHex("#4b4bf2"),

  board: colour3.fromHex("#0b0013"),
  black: colour3.fromHex("#0b0013"),
  background: colour3.fromHex("#f2f2f2"),
  shine: colour3.fromHex("#ffffff"),
  
  great1: colour3.fromHex("#ffff00"),
  great2: colour3.fromHex("#00ffff"),

  get great(){
    if(Date.now() % 128 < 64)
      return "#ffff00";
    else
      return "#00ffff";
  },

  light: colour3.fromHex("#7f7983"),
  dark: colour3.fromHex("#593c63"),
  grey: colour3.fromHex("#4b4b4b"),

  none: new colour3(0,0,0,0),
})

const twobit = Object.freeze({
  zro: colour3.fromHex("#000000"),
  one: colour3.fromHex("#ffffff"),
  two: colour3.fromHex("#ff0000"),
  tri: colour3.fromHex("#ff00ff"),
  
  wound: colour3.fromHex("#ff00ff"),

  attackunentered: colour3.fromHex("#ff0000"),
  attackunripe: colour3.fromHex("#ffffff"),
  attackdormant: colour3.fromHex("#ff00ff"),
  attackused: colour3.fromHex("#ffffff"),
  attack1: colour3.fromHex("#ffffff"),
  attack2: colour3.fromHex("#ff00ff"),
  
  b2b: colour3.fromHex("#ffffff"),
  b2b2b: colour3.fromHex("#ff0000"),
  b2b2b2b: colour3.fromHex("#ff00ff"),

  //board: colour3.fromHex("#0b0013"),
  //black: colour3.fromHex("#0b0013"),
  //background: colour3.fromHex("#f2f2f2"),
  shine: colour3.fromHex("#ffffff"),
  
  great1: colour3.fromHex("#ffffff"),
  great2: colour3.fromHex("#ff0000"),
})

const darkmode = Object.freeze({
  garbage: colour3.fromHex("#593c63"),

  I: colour3.fromHex("#f24b4b"),
  L: colour3.fromHex("#f2834b"),
  O: colour3.fromHex("#f2f24b"),
  Z: colour3.fromHex("#4bf24b"),
  T: colour3.fromHex("#4bf2f2"),
  J: colour3.fromHex("#4b4bf2"),
  S: colour3.fromHex("#f24bf2"),
  chartreuse: colour3.fromHex("#83f24b"),
  greenish: colour3.fromHex("#4bf283"),
  blue: colour3.fromHex("#4b83f2"),
  violent: colour3.fromHex("#834bf2"),
  pink: colour3.fromHex("#f24b83"),

  wound: colour3.fromHex("#834bf2"),

  attackunentered: colour3.fromHex("#adafb8"),
  attackunripe: colour3.fromHex("#ff4b4b"),
  attackdormant: colour3.fromHex("#4b0000"),
  attackused: colour3.fromHex("#4b4b4b"),
  attack1: colour3.fromHex("#ff0000"),
  attack2: colour3.fromHex("#ffffff"),
  
  b2b: colour3.fromHex("#4bf2f2"),
  b2b2b: colour3.fromHex("#4b4bf2"),

  board: colour3.fromHex("#0b0013"),
  black: colour3.fromHex("#7f7983"),
  background: colour3.fromHex("#000000"),
  shine: colour3.fromHex("#f2f2f2"),
  
  great1: colour3.fromHex("#ffff00"),
  great2: colour3.fromHex("#00ffff"),

  light: colour3.fromHex("#f2f2f2"),
  dark: colour3.fromHex("#adafb8"),
  grey: colour3.fromHex("#4b4b4b"),

  none: new colour3(0,0,0,0),
})

export const palette = twobit;

export type colourpossibility = ()=>colour3

export class filledRectangle{
  position:vector2;
  size:vector2;
  colour:colour3|undefined;
  colourpossibility:colourpossibility|undefined;
  constructor(position:vector2,size:vector2,colour:colour3|colourpossibility){
    this.position = position;
    this.size = size;
    if (typeof colour == "function"){
      this.colourpossibility = colour
    }
    else{
      this.colour = colour;
    }
  }

  frozen(){
    let robot = clone(this);
    robot.colour = this.evaluateColour();
    robot.colourpossibility = undefined;
    return robot;
  }

  evaluateColour(){
    if(this.colourpossibility!==undefined)
      return this.colourpossibility();
    if(this.colour)
      return this.colour;
    throw new Error("null colour");
  }
}

export class imageRectangle{
  position:vector2;
  size:vector2;
  image:string;
  alpha=1;
  constructor(position:vector2,size:vector2,image:string){
    this.position = position;
    this.size = size;
    this.image = image;
  }
}

export function SafeColour(c:colour3|colourpossibility){
  if(typeof(c) == "function"){
    return c()
  }
  return c
}

export class tileModel{
  rectangles:filledRectangle[]=[];
  images:imageRectangle[]=[];
  isNull:boolean;
  grey:boolean=true;
  firstcolour:colour3=new colour3(0,0,0);
  whitebased:boolean=false;
  constructor(solidcolour?:colour3|colourpossibility){
    if(!solidcolour){
      this.isNull = true;
      return
    }
    this.isNull = false
    this.rectangles.push(new filledRectangle(vector2.zero,vector2.one,solidcolour));
    this.firstcolour = SafeColour(solidcolour);
  }

  //ways to create tile models

  /*static tripleRing(outer:colour3,middle?:colour3,inner?:colour3){
    let robot = new tileModel();

    const oRect = new filledRectangle(vector2.zero,vector2.one,outer)
    robot.rectangles.push(oRect);
    if(middle){
      const mRect = new filledRectangle(vector2.one.div(5),vector2.one.mul(3/5),middle)
      robot.rectangles.push(mRect);
    }
    if(inner){
      const iRect = new filledRectangle(vector2.one.mul(2/5),vector2.one.div(5),inner)
      robot.rectangles.push(iRect);
    }
    robot.isNull = false
    robot.firstcolour = outer;
    return robot
  }

  static doubleringtransparency(outer?:colour3,inner?:colour3,ringwidth=0.25){
    let robot = new tileModel();

    if(outer){
      robot.rectangles.push(new filledRectangle(new vector2(0,0),new vector2(1,ringwidth),outer));
      robot.rectangles.push(new filledRectangle(new vector2(0,1-ringwidth),new vector2(1,ringwidth),outer));
      robot.rectangles.push(new filledRectangle(new vector2(0,ringwidth),new vector2(ringwidth,1-2*ringwidth),outer));
      robot.rectangles.push(new filledRectangle(new vector2(1-ringwidth,ringwidth),new vector2(ringwidth,1-2*ringwidth),outer));
    }
    if(inner){
      const iRect = new filledRectangle(vector2.one.mul(ringwidth),vector2.one.mul(1-2*ringwidth),inner)
      robot.rectangles.push(iRect);
    }
    robot.isNull = false
    robot.firstcolour = outer || inner || new colour3(0,0,0,0);
    return robot
  }*/ // not used anymore

  static tripleRingTransparency(outer?:colour3,middle?:colour3,inner?:colour3){
    let robot = new tileModel();

    if(outer){
      robot.rectangles.push(new filledRectangle(new vector2(0,0),new vector2(1,1/6),outer));
      robot.rectangles.push(new filledRectangle(new vector2(0,5/6),new vector2(1,1/6),outer));
      robot.rectangles.push(new filledRectangle(new vector2(0,1/6),new vector2(1/6,4/6),outer));
      robot.rectangles.push(new filledRectangle(new vector2(5/6,1/6),new vector2(1/6,4/6),outer));
    }
    if(middle){
      robot.rectangles.push(new filledRectangle(new vector2(1/6,1/6),new vector2(4/6,1/6),middle));
      robot.rectangles.push(new filledRectangle(new vector2(1/6,4/6),new vector2(4/6,1/6),middle));
      robot.rectangles.push(new filledRectangle(new vector2(1/6,2/6),new vector2(1/6,2/6),middle));
      robot.rectangles.push(new filledRectangle(new vector2(4/6,2/6),new vector2(1/6,2/6),middle));
    }
    if(inner){
      const iRect = new filledRectangle(new vector2(2/6,2/6),new vector2(2/6,2/6),inner)
      robot.rectangles.push(iRect);
    }
    robot.isNull = false
    robot.firstcolour = outer || middle || inner || new colour3(0,0,0,0);
    return robot
  }

  static blocks(outer?:colour3,inner?:colour3,shine?:colour3,shine2?:colour3,shine3?:colour3,ringwidth=1/6){
    let robot = new tileModel();

    if(outer){
      robot.rectangles.push(new filledRectangle(new vector2(ringwidth,0),new vector2(1-ringwidth,ringwidth),outer));
      robot.rectangles.push(new filledRectangle(new vector2(0,1-ringwidth),new vector2(1,ringwidth),outer));
      robot.rectangles.push(new filledRectangle(new vector2(0,ringwidth),new vector2(ringwidth,1-2*ringwidth),outer));
      robot.rectangles.push(new filledRectangle(new vector2(1-ringwidth,ringwidth),new vector2(ringwidth,1-2*ringwidth),outer));
    }
    if(inner){
      robot.rectangles.push(new filledRectangle(new vector2(ringwidth*3,ringwidth),new vector2(1-4*ringwidth,ringwidth),inner));
      robot.rectangles.push(new filledRectangle(new vector2(ringwidth*2,ringwidth*2),new vector2(1-3*ringwidth,ringwidth),inner));
      robot.rectangles.push(new filledRectangle(new vector2(ringwidth,ringwidth*3),new vector2(1-2*ringwidth,1-4*ringwidth),inner));
    }
    if(shine){
      robot.rectangles.push(new filledRectangle(new vector2(0,0),new vector2(ringwidth,ringwidth),shine));
    }
    if(shine2){
      robot.rectangles.push(new filledRectangle(new vector2(ringwidth,ringwidth),new vector2(ringwidth,ringwidth),shine2));
    }
    if(shine3){
      robot.rectangles.push(new filledRectangle(new vector2(ringwidth*2,ringwidth),new vector2(ringwidth,ringwidth),shine3));
      robot.rectangles.push(new filledRectangle(new vector2(ringwidth,ringwidth*2),new vector2(ringwidth,ringwidth),shine3));
    }
    robot.isNull = false
    robot.firstcolour = outer || inner || new colour3(0,0,0,0);
    return robot
  }

  static cross(_colour:colour3){
    let robot = new tileModel();

    robot.drawpixel(_colour,new vector2(0,0))
    robot.drawpixel(_colour,new vector2(1,1))
    robot.drawpixel(_colour,new vector2(2,2))
    robot.drawpixel(_colour,new vector2(3,3))
    robot.drawpixel(_colour,new vector2(4,4))
    robot.drawpixel(_colour,new vector2(5,5))
    robot.drawpixel(_colour,new vector2(5,5))
    robot.drawpixel(_colour,new vector2(5,0))
    robot.drawpixel(_colour,new vector2(4,1))
    robot.drawpixel(_colour,new vector2(0,5))
    robot.drawpixel(_colour,new vector2(1,4))

    robot.isNull = false
    robot.firstcolour = _colour;
    return robot
  }

  static dither3alt(_colour=new colour3(1,1,1)){
    let robot = new tileModel();

    for (let x = 0; x < 6; x++) 
      for (let y = 0; y < 6; y++) {
        if((x%2==0)&&(y%2!=0))
          robot.drawpixel(_colour,new vector2(x,y))
      }

    robot.isNull = false
    robot.firstcolour = _colour;
    return robot
  }

  static dither2(_colour=new colour3(1,1,1)){
    let robot = new tileModel();

    for (let x = 0; x < 6; x++) 
      for (let y = 0; y < 6; y++) {
        if((x+y)%2==0)
          robot.drawpixel(_colour,new vector2(x,y))
      }

    robot.isNull = false
    robot.firstcolour = _colour;
    return robot
  }

  static gradient(top:colour3,bottom:colour3,layers:number){
    let robot = new tileModel();

    for(let i=0; i<layers; i++){
      const x = i/layers;
      robot.rectangles.push(new filledRectangle(new vector2(0,x),new vector2(1,1/layers ),top.lerpq(bottom,x)));
    }
    
    robot.isNull = false
    robot.firstcolour = top;
    return robot
  }

  static sprite(image:string){
    let robot = new tileModel();

    robot.images.push(new imageRectangle(vector2.zero,vector2.one,image));
    robot.isNull = false
    return robot
  }

  static fromString(picture:string){
    let robot = new tileModel();

    const rectsmap:number[][] = []

    const rows = picture.split("\n")
    var calibrate:vector2|undefined;
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const element = row[x];
        if(element === "&"){
          calibrate = new vector2(x,y)
          continue
        }
        if(!calibrate) continue
        let _colourcode:number|undefined;
        switch(element){
          case "0":
            _colourcode = 0
            break
          case "1":
            _colourcode = 1
            break
          case "2":
            _colourcode = 2
            break
          case "3":
            _colourcode = 3
            break
        }
        if(_colourcode === undefined) continue
        const i = new vector2(x,y).sub(calibrate).sub(new vector2(2,2))
        if(!rectsmap[i.y])
          rectsmap[i.y] = [];
        rectsmap[i.y][i.x] = _colourcode
      }
    }

    console.log(rectsmap)

    const colourbycode = [palette.zro,palette.one,palette.two,palette.tri]

    for (let y = 0; y < rectsmap.length; y++) {
      const row = rectsmap[y];
      if(!row) continue
      let running:number|undefined = row[0];
      let runstart = 0;
      for (let x = 1; x < row.length+1; x++) {
        const i = row[x] as number|undefined;
        if(i === running)
          continue
        if(running !== undefined){
          robot.drawpixel(colourbycode[running],new vector2(runstart,y),1/6,new vector2(x - runstart,1))
          robot.firstcolour = colourbycode[running]
        }
        running = i
        runstart = x
      }
    }

    console.log(robot)

    robot.isNull = false
    return robot
  }

  drawpixel(_colour:colour3,pixelcoords:vector2,pixelswidth=1/6,pixelsize=vector2.one){
    this.rectangles.push(new filledRectangle(pixelcoords.mul(pixelswidth),pixelsize.mul(pixelswidth),_colour))
  }

  colourOperation(op:(zis:colour3,...a:any[]) => colour3,...opargs:any[]){
    let robot = clone(this);
    for(const rect of robot.rectangles){
      rect.colour = op(rect.evaluateColour(),...opargs);
      rect.colourpossibility = undefined;
    }
    return robot;
  }

  lerp(other:colour3,t:number){
    return this.colourOperation(colour3.lerp,other,t)
  }

  lerpq(other:colour3,t:number){
    return this.colourOperation(colour3.lerpq,other,t)
  }

  withOpacity(opacity:number){
    const robot = clone(this)
    for(const rect of robot.rectangles){
      let col = rect.evaluateColour();
      col.a *= opacity;
      rect.colour = col;
      rect.colourpossibility = undefined;
    }
    for(const rect of robot.images){
      rect.alpha *= opacity;
    }
    return robot;
  }

  coloured(_colour:colour3){
    const robot = clone(this)
    for(const rect of robot.rectangles){
      rect.colour = _colour;
      rect.colourpossibility = undefined;
    }
    return robot;
  }

  doNotGrey(){
    const robot = clone(this)
    robot.grey = false
    return robot;
  }

  whiteBased(){
    const robot = clone(this)
    robot.whitebased = true
    return robot;
  }
}

export const tileModels = Object.freeze({
  "none":new tileModel(),
  "garbage":tileModel.tripleRingTransparency(palette.one,palette.one),
  "garbage1":new tileModel(palette.one),
  "garbage2":tileModel.tripleRingTransparency(palette.one,undefined,palette.one),
  "I":tileModel.blocks(palette.two,palette.one,palette.one,palette.one,palette.one),
  "L":tileModel.blocks(palette.two,undefined,palette.one,undefined,undefined),
  "O":tileModel.blocks(palette.one,palette.one,palette.one,palette.one,undefined).whiteBased(),
  "Z":tileModel.blocks(palette.two,palette.two,palette.two,palette.two,palette.one),
  "T":tileModel.blocks(palette.tri,palette.one,palette.one,palette.one,palette.one),
  "J":tileModel.blocks(palette.tri,undefined,palette.one,undefined,undefined),
  "S":tileModel.blocks(palette.tri,palette.tri,palette.tri,palette.tri,palette.one),
  "V":tileModel.fromString(`
  &
    
    111111
    111110
    111111
    110111
    111101
    101111
    `).whiteBased(),
  "U":tileModel.fromString(`
  &
    
    111111
    1111 1
    111111
    111111
    1 1111
    111111
    `).whiteBased(),
  "W":tileModel.fromString(`
  &
    
    111111
    1    1
    1 11 1
    1 11 1
    1    1
    111111
    `).whiteBased(),
  "F":tileModel.fromString(`
  &
    
    333333
    311133
    313333
    313333
    333333
    333333
    `),
  "K":tileModel.fromString(`
  &
    
    222222
    211122
    212222
    212222
    222222
    222222
    `),
  "H":tileModel.fromString(`
  &
    
    122222
    2 22 2
    222222
    222222
    2 22 2
    222222
    `),
  "N":tileModel.fromString(`
  &
    
    133333
    3 33 3
    333333
    333333
    3 33 3
    333333
    `),
  "Y":tileModel.fromString(`
  &
    
    112222
    122222
    22  22
    22  12
    222112
    222222
    `),
  "R":tileModel.fromString(`
  &
    
    113333
    133333
    33  33
    33  13
    333113
    333333
    `),
  "P":tileModel.fromString(`
  &
    
    133133
    333333
    333333
    133133
    333333
    333333
    `),
  "Q":tileModel.fromString(`
  &
    
    122122
    222222
    222222
    122122
    222222
    222222
    `),
  "grenade":tileModel.fromString(`
  &
    
    122222
    210012
    210012
    211112
    210012
    222222
    `).doNotGrey(),
  "bomb":tileModel.fromString(`
  &
    
    122222
    201012
    210012
    200002
    211002
    222222
    `).doNotGrey(),
  "permanent":tileModel.fromString(`
  &
    
    111111
    110101
    100000
    110101
    100000
    110101
    `).doNotGrey(),
  "impermanent":tileModel.fromString(`
  &
    
    111111
    100000
    111111
    100000
    111111
    100000
    `).doNotGrey(),
});

export const levelsGravities = Object.freeze([
  48/60.0988*1000,
  43/60.0988*1000,
  38/60.0988*1000,
  33/60.0988*1000,
  28/60.0988*1000,
  23/60.0988*1000,
  18/60.0988*1000,
  13/60.0988*1000,
  8/60.0988*1000,
  6/60.0988*1000,
  5/60.0988*1000,
  5/60.0988*1000,
  5/60.0988*1000,
  4/60.0988*1000,
  4/60.0988*1000,
  4/60.0988*1000,
  3/60.0988*1000,
  3/60.0988*1000,
  3/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  2/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  1/60.0988*1000,
  8, //im just making stuff up at this point
  8,
  8,
  8,
  8,
  8,
  8,
  8,
  8,
  8,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
]);

export const levelsLockTimes = Object.freeze([
  400,
  367,
  333,
  300,
  267,
  250,
  233,
  217,
  200,
  183,
]);

export const clearNames = Object.freeze([
  "Null",
  "Single",
  "Double",
  "Triple",
  "Techrash",
  "Pentachrash",
  "Hexachrash",
  "Heptachrash",
  "Octachrash",
  "Enneachrash",
  "Decachrash",
  "Endelchrash",
  "Dozen",
  "Zhawa",
  "Reya",
  "Vaya",
  "Ch'hawa",
  "Z'heya",
  "B'haya",
  "S'hawa",
  "Kagaris",
  "Rei",
  "Macoro",
  "TSUKIOLOKLIRON",
  "krussus",
])

export const stridenames = Object.freeze([
  "open",
  "set",
  "get",
  "ready",
  "mark",
  "your",
  "on",
  "yet",
  "not"
])