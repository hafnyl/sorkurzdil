import './App.css';
import { bagprefabs, piece, pieces } from './pieces.ts';
import { palette } from './roms.ts';
import { game, gameManager } from './sorkurzdil.ts'
import GameRenderer, {rendering} from './rendering.tsx';
import React, { useRef, useEffect, RefObject, KeyboardEvent, useState, Component, ReactElement } from 'react';
import { gameConfig, userConfig, Command, difficultlinecleartype, garbagePacket, wavetype, missions, keybinds, scorers } from './config.ts';
import { colour3, vector2 } from './basics.ts';
import InputManager from './inputmanager.ts';
import configs from './configprefabs.ts'
import { kickSystems } from './rotationsystems.ts';
import TextDisplay from './debugu.tsx'
import { boundstype, tile } from './board.ts';
import { BaseGarbageGenerator, DebrisGarbage, Decheese, LinesGenerator as LinesGarbage, SpecklesGarbage, WidthGarbage } from './garbagegeneration.ts';
import { AdhereToGlue } from './gimmicks.ts';
import { BaseLineGenerator, Damnation, MessyLines, NwideHolesLines, OneBlockLine, StraightsLines } from './garbagelinetypes.ts';
import { BasePieceGenerator, Fool } from './piecechoice.ts';
import { tileModels } from './tilemodels.ts';

const FPS = 120;

let _gameConfig = new gameConfig()
let _userConfig = new userConfig()

_gameConfig.debug = true;

//_gameConfig.pieceSpawnMargin = 8

//_gameConfig.garbageType = tile.glue
//_gameConfig.earlylock = [AdhereToGlue]

//_gameConfig.Splice(configs.bombs)

//_gameConfig.Splice(configs.sprint40)
//_gameConfig.mission = missions.attack(100)
//_gameConfig.mission = missions.lines(10)
//_gameConfig.scorer = scorers.speed;
//_gameConfig.kickSystem = kickSystems.lazyrs
//_gameConfig.pieceChoice = new Fool(bagprefabs.tetrominos,bagprefabs.fool10.concat(bagprefabs.fool9))
//_gameConfig.pieceChoice = new BasePieceGenerator(bagprefabs.pentominos.concat(bagprefabs.m123).concat(bagprefabs.freeTetrominos))
//_gameConfig.pieceChoice = new BasePieceGenerator(bagprefabs.pentominos)
//_gameConfig.pieceChoice = new BasePieceGenerator(bagprefabs.m123)
//_gameConfig.pieceChoice = new BasePieceGenerator(bagprefabs.tetraplets)

//_gameConfig.boundstype = boundstype.wallless
//_gameConfig.allowAirLock = true
//_gameConfig.vpcclearsall = false

//_gameConfig.initialisegarbage = [
//  new garbagePacket(4,new LinesGarbage(new MessyLines())),
//  new garbagePacket(4,new LinesGarbage(new NwideHolesLines(3))),
//  new garbagePacket(4),
//]

//_gameConfig.garbageChoice = new Decheese(new WidthGarbage(),new LinesGarbage(new StraightsLines()), 1)
_gameConfig.garbageChoice = new DebrisGarbage(new BasePieceGenerator(bagprefabs.tetrominos))

_gameConfig.garbageare = 100
_gameConfig.piecewaitsforgarbage = true

_gameConfig.backfire = 2
_gameConfig.garbageripen = 8000

_gameConfig.name = "debris garbage (backfire)"

//_gameConfig.Splice(configs.m123)

//_gameConfig.width = 3
//_gameConfig.height = 6

_userConfig.boardGreying = false

_userConfig.sdf = 1/0
//_userConfig.usesdarr = true;
_userConfig.das = 42
//_userConfig.das = 84
_userConfig.arr = 0

//_userConfig.blockKeyRetriggers = false;

const A = {
  "KeyK":Command.ShiftLeft,
  "Semicolon":Command.ShiftRight,
  "KeyO":Command.RotCW,
  "KeyL":Command.SoftDrop,
  "Period":Command.ShiftDown,
  "Space":Command.HardDrop,
  "KeyW":Command.Hold,
  "KeyA":Command.RotWS,
  "KeyS":Command.Rot180,
  "Digit1":Command.SonicDrop,
  "Digit2":Command.AirLock,
  "Digit3":Command.RotNull,
  "KeyE":Command.HoriFlip,
  "KeyQ":Command.VertFlip,
  "KeyD":Command.Discard,
  "KeyP":Command.ShiftUp,
  "Digit4":Command.SpawnGarbage,
  "Digit5":Command.SpawnGarbage4,
  "Digit6":Command.SpawnWound,
  "F1":Command.ToggleCamera,
}

const B = {
  "KeyJ":Command.ShiftLeft,
  "KeyL":Command.ShiftRight,
  "KeyF":Command.RotCW,
  "Semicolon":Command.SoftDrop,
  "KeyK":Command.HardDrop,
  "KeyA":Command.Hold,
  "KeyS":Command.RotWS,
  "KeyD":Command.Rot180,
  "Digit1":Command.SonicDrop,
  "Digit2":Command.AirLock,
  "Digit3":Command.RotNull,
  "KeyE":Command.HoriFlip,
  "KeyQ":Command.VertFlip,
  "KeyZ":Command.Discard,
  "Digit4":Command.SpawnGarbage,
  "Digit5":Command.SpawnGarbage4,
}

const C = {
  "KeyA":Command.HardDrop,
  "KeyS":Command.HardDrop,
  "KeyD":Command.HardDrop,
  "KeyF":Command.HardDrop,
  "KeyJ":Command.HardDrop,
  "KeyK":Command.HardDrop,
  "KeyL":Command.HardDrop,
  "Semicolon":Command.HardDrop,
  "F1":Command.ToggleCamera,
}

_userConfig.keybinds = new keybinds(A);

_userConfig.strideMode = true;

var singleplayergame:gameManager|null;
var inputManager = new InputManager(_userConfig);


var starttime:number;
var latetime = Date.now()
function Update(canvas:HTMLCanvasElement,timestamp:number,deltaTime:number){

  const ctx = canvas.getContext('2d')
  if(!ctx)
    return;
  ctx.reset()

  ctx.fillStyle = palette.one.toHex();
  ctx.textAlign = "start"; 
  ctx.font = "bold 128px Bytesized";
  ctx.letterSpacing = Math.sin((timestamp - starttime)/3000)**4 * 128 + "px"
  ctx.fillText("Sul|fir ",canvas.width/2-1600,canvas.height/2-600);
}

var currgameconfig = new gameConfig();

function App() {
  const debugu = useRef<any|null>(null);

  const menuCanvasRef = useRef<HTMLCanvasElement|null>(null);

  const gameRef = useRef<any|null>(null);

  const [scene,setScene] = useState("mainmenu")

  function StartGame(debugus,gamemode?:gameConfig){
    currgameconfig = gamemode||(singleplayergame?.game.gameConfig)||new gameConfig()

    setScene("ingame")
    inputManager = new InputManager(_userConfig);
    singleplayergame = new gameManager(debugus,currgameconfig ,_userConfig,inputManager);
    singleplayergame.game.gameOver = false
    if(gameRef.current)
      gameRef.current.Reset()
  }

  useEffect(()=>{
    //every frame
    var updateHandle = setTimeout(everyFrame,1000/FPS)

    function everyFrame(){
      var timestamp = Date.now()
      if(!starttime)
        starttime = timestamp;
      const deltaTime = timestamp - latetime;
      latetime = timestamp;

      const menuCanvas = menuCanvasRef.current;
      if(menuCanvas)
        Update(menuCanvas,timestamp,deltaTime);
      
      if(gameRef.current){
        if(!gameRef.current.isInitialised()){
          gameRef.current.Init(singleplayergame)
        }
        gameRef.current.Update(deltaTime)
      }

      if(singleplayergame){
        singleplayergame.Update(deltaTime)
      }

      setTimeout(everyFrame,1000/FPS)
    }

    //input management stuff and also R and Esc
    let keydown = (e)=>{
      if(e.code === "KeyR" && scene == "ingame"){
        StartGame(debugu,currgameconfig);
        return;
      }
      if(e.code === "Escape"){
        setScene("0")
        return;
      }

      if(inputManager)
        inputManager.OnKeyDown(e);
    }
    let keyup = (e)=>{
      if(inputManager)
        inputManager.OnKeyUp(e);
    }

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      clearTimeout(updateHandle)
    };
  },[debugu,menuCanvasRef,gameRef,scene]);

  if(scene == "ingame"){
    return (
      <div className="App">
        <TextDisplay ref={debugu}/>
        <GameRenderer ref={gameRef}/>
      </div>
    );
  }
  else{
    if(singleplayergame)
      singleplayergame = null
  }

  if(scene == "2"){
    return (
      <div className="App">
        <TextDisplay ref={debugu}/>
        <button style={{transform: "translate(-30vw, -50%) translate(0,-10vh)"}} onClick={()=>{
          StartGame(debugu,configs.master);
        }}>play normal</button>
        <button style={{transform: "translate(-30vw, -50%)"}} onClick={()=>{
          StartGame(debugu,configs.sprint40);
        }}>play 40l</button>
        <button style={{transform: "translate(-30vw, -50%) translate(0,10vh)"}} onClick={()=>{
          StartGame(debugu,configs.warlock);
        }}>play warlock</button>
        <button style={{transform: "translate(-30vw, -50%) translate(0,20vh)"}} onClick={()=>{
          StartGame(debugu,configs.big);
        }}>play big</button>
        <button style={{transform: "translate(-30vw, -50%) translate(0,30vh)"}} onClick={()=>{
          setScene("menu")
        }}>back</button>
      </div>
    );
  }

  //this is the menu
  return (
    <div className="App">
      <TextDisplay ref={debugu}/>
      <canvas ref={menuCanvasRef} width="4550px" height="2560px"/>
      <button style={{transform: "translate(-30vw, -50%) translate(0,-10vh)"}} onClick={()=>{
        setScene("2")
      }}>level select</button>
      <button style={{transform: "translate(-30vw, -50%)"}} onClick={()=>{
        StartGame(debugu,currgameconfig);
      }}>play last: {currgameconfig.name}</button>
      <button style={{transform: "translate(-30vw, -50%) translate(0,10vh)"}} onClick={()=>{
        StartGame(debugu,_gameConfig);
      }}>play special: {_gameConfig.name}</button>
    </div>
  );
}

export default App;
