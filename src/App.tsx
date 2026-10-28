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
import { BaseGarbageGenerator, DebrisGarbage, Decheese, LinesGenerator, SpecklesGarbage, WidthGarbage } from './garbagegeneration.ts';
import { AdhereToGlue } from './gimmicks.ts';
import { BaseLineGenerator, Damnation, MessyLines, NwideHolesLines, OneBlockLine, StraightsLines } from './garbagelinetypes.ts';
import { BasePieceGenerator, Fool } from './piecechoice.ts';
import { tileModels } from './tilemodels.ts';
import sfxs, { sfx, playback } from './sfxmanager.ts'
import ImageRenderer, { images } from './imagemanager.ts';

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

//_gameConfig.pieceChoice = new BasePieceGenerator(bagprefabs.tetrominosminusI)
//_gameConfig.name = "你I没了"

//_gameConfig.Splice(configs.allpc28)

//_gameConfig.Splice(configs.m123)

_gameConfig.stridefulfirstpiece = true
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
  "KeyD":Command.RotCW,
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
  "KeyF":Command.Discard,
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
function UpdateMenu(canvas:HTMLCanvasElement,timestamp:number,deltaTime:number){

  const ctx = canvas.getContext('2d')
  if(!ctx)
    return;
  ctx.reset()

  ctx.fillStyle = palette.one.toHex();
  ctx.textAlign = "start"; 
  ctx.font = "bold 128px Bytesized";
  ctx.letterSpacing = Math.sin((timestamp - starttime)/3000)**4 * 128 + "px"
  ctx.fillText("Sul|fir",400,canvas.height/2-600);

  ImageRenderer.DrawImage(ctx,images.sulfir,new vector2(canvas.width/2+400,canvas.height/2-500),new vector2(1000,1000))
}

function OnStart(){
  starttime = Date.now();
  sfxs.PlayPBobject(sfxs.GetPitch(2,0).withspeed(0.2))
  //sfxs.PlayPBobject(sfxs.GetSFX(sfx.noise0).withspeed(1))
}

var currgameconfig = new gameConfig();

enum scenes{
  start,
  menu,
  levelselect,
  ingame,
}

function App() {
  const debugu = useRef<any|null>(null);

  const menuCanvasRef = useRef<HTMLCanvasElement|null>(null);

  const gameRef = useRef<any|null>(null);

  const [scene,setScene] = useState(scenes.start)
  const [lastScene,setLastScene] = useState(scenes.menu)

  function StartGame(debugus,gamemode?:gameConfig){
    setLastScene(scene)

    currgameconfig = gamemode||(singleplayergame?.game.gameConfig)||new gameConfig()

    setScene(scenes.ingame)
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
        UpdateMenu(menuCanvas,timestamp,deltaTime);
      
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
      if(e.code === "KeyR" && scene == scenes.ingame){
        StartGame(debugu,currgameconfig);
        return;
      }
      if(e.code === "Escape" && scene != scenes.start && scene != scenes.menu){
        if(lastScene == scenes.menu)
          sfxs.PlayPBobject(sfxs.GetPitch(0,0).withspeed(0.2));
        else
          sfxs.PlayPBobject(sfxs.GetPitch(0,1).withspeed(0.2));
        setScene(lastScene)
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

  if(scene == scenes.ingame){
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

  if(scene == scenes.levelselect){
    if(lastScene != scenes.menu)
      setLastScene(scenes.menu)

    return (
      <div className="App">
        <TextDisplay ref={debugu}/>
        <div className='canvaslike'>
          <button className='middleleft' style={{top:"30%",left:"10%",transform: "translate(0, -50%)"}} onClick={()=>{
            StartGame(debugu,configs.master);
          }}>play normal</button>
          <button className='middleleft' style={{top:"40%",left:"10%",transform: "translate(0, -50%)"}} onClick={()=>{
            StartGame(debugu,configs.sprint40);
          }}>play 40l</button>
          <button className='middleleft' style={{top:"50%",left:"10%",transform: "translate(0, -50%)"}} onClick={()=>{
            StartGame(debugu,configs.warlock);
          }}>play warlock</button>
          <button className='middleleft' style={{top:"60%",left:"10%",transform: "translate(0, -50%)"}} onClick={()=>{
            StartGame(debugu,configs.big);
          }}>play big</button>
          <button className='middleleft' style={{top:"70%",left:"10%",transform: "translate(0, -50%)"}} onClick={()=>{
            StartGame(debugu,configs.allpc28);
          }}>play 7 pc</button>
          <button className='middleleft' style={{top:"80%",left:"10%",transform: "translate(0, -50%)"}} onClick={()=>{
            setScene(scenes.menu)
            sfxs.PlayPBobject(sfxs.GetPitch(0,0).withspeed(0.2));
          }}>back</button>
        </div>
      </div>
    );
  }

  if(scene == scenes.menu){
    return (
      <div className="App">
        <TextDisplay ref={debugu}/>
        <canvas ref={menuCanvasRef} width="4550px" height="2560px"/>
        <div className='canvaslike'>
          <button className='middleleft' style={{top:"60%",left:"10%",transform: "translate(0, -50%)"}} onClick={()=>{
            setScene(scenes.levelselect)
            sfxs.PlayPBobject(sfxs.GetPitch(2,1).withspeed(0.2));
          }}>level select</button>
          <button className='middleleft' style={{top:"50%",left:"10%",transform: "translate(0, -50%)"}} onClick={()=>{
            StartGame(debugu,currgameconfig);
          }}>play last: {currgameconfig.name}</button>
          <button className='middleleft' style={{top:"40%",left:"10%",transform: "translate(0, -50%)"}} onClick={()=>{
            StartGame(debugu,_gameConfig);
          }}>play special: {_gameConfig.name}</button>
        </div>
      </div>
    );
  }

  //starting page
  return (
    <div className="App">
      <TextDisplay ref={debugu}/>
      <p>Sul|fir</p>
      <button onClick={()=>{
        setScene(scenes.menu)
        OnStart()
      }}>start</button>
    </div>
  );
}

export default App;
