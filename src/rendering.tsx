import { palette, clearNames } from './roms.ts'
import { colour3, formatTime, modular, vector2 } from './basics.ts'
import MatrixRendering from './matrixrendering.tsx';
import gameFlags, { lineclearalert } from './flags.ts';
import { game, gameManager } from './sorkurzdil.ts';
import { simplifyKickType } from './rotationsystems.ts';
import { scoreDisplay, scoreDisplays, scoreDisplayType } from './config.ts';
import particleManager, { curve, rectParticle, textParticle } from './particlemanager.tsx';
import React, { createElement, ReactElement, RefObject, useImperativeHandle, useRef, useState } from 'react';
import { piece } from './pieces.ts';
import { colourpossibility, SafeColour, tileModel } from './tilemodels.ts';

function FDecay(x:number){
    return 1 - Math.exp(-x/32);
}

function lerp(a:number,b:number,t:number){
    return a + (b - a) * t
}

function flipy(x:vector2){
    return new vector2(x.x,-x.y);
}

const dither2 = tileModel.dither2()

export class rendering {
    cameraYoffset = 0;
    cameraYtarget = 0;

    matrixtarget = vector2.zero;
    matrixoffset = vector2.zero;
    targetangle = 0;
    matrixangle = 0;

    shakeamount = 0;
    targetshake = 0;

    latePiece = undefined as piece|undefined;

    //configuration
    offsetfactor = 0.6;
    rotatefactor = 0.02;
    shakefactor = 7;

    gameManager:gameManager;
    game:game;
    flags:gameFlags;

    uiCanvas:HTMLCanvasElement;
    matrixCanvas:HTMLCanvasElement;
    ctx:CanvasRenderingContext2D;
    matrixctx:CanvasRenderingContext2D;
    origin:vector2 = vector2.zero;
    matrixorigin:vector2 = vector2.zero;
    matrixscroll:vector2 = vector2.zero;

    matrixRenderer:MatrixRendering;
    particleManager:particleManager;

    tilesize:vector2;
    boardtilesize:vector2;

    /**function to scale vector by tile lengths*/
    FSTL(x:vector2){
        return new vector2(x.x * this.tilesize.x,x.y * this.tilesize.y);
    }

    FSTL2(x:vector2,tilesize=this.tilesize){
        return x.hadamard(tilesize.add(this.matrixRenderer.gridwidth));
    }

    bFSTL(x:vector2){
        return new vector2(x.x * this.boardtilesize.x,x.y * this.boardtilesize.y);
    }

    /*input screenpos is the center of the matrix*/
    CoordsToScreenPos(coords:vector2){
        const _drawnMatrix = this.matrixRenderer.drawnMatrix();
        
        const originX = - (_drawnMatrix.x - this.boardtilesize.x) / 2,originY = + (_drawnMatrix.y - this.boardtilesize.y) / 2
        
        return new vector2(
            originX + this.bFSTL(coords).x,
            originY - this.bFSTL(coords).y
        )
    }

    DrawPieceCompensate(piece:piece,screenpos:vector2,_tileModel:tileModel,tilesize=this.tilesize){
        this.matrixRenderer.ctx = this.ctx;
        
        const bounds = piece.bounds
        const length = Math.max(bounds.x,bounds.y)
        var compensatezoom = 1
        if(length>4){
            console.log(length)
            compensatezoom = 4 / length
        }

        var compensateoffset = new vector2(0,Math.floor(Math.min(piece.boundingrectangle.south,2)-0.5)+1);
        if(bounds.x%2==0)
            compensateoffset = compensateoffset.add(new vector2(-0.5,0))

        this.matrixRenderer.DrawPiece(piece,screenpos.add(flipy(this.FSTL2(compensateoffset))).div(compensatezoom),_tileModel,false,compensatezoom,true,tilesize);
    }

    DrawQueue(){
        const _drawnMatrix = this.matrixRenderer.drawnMatrix();
        const toprightX = (_drawnMatrix.x - this.boardtilesize.x) / 2,toprightY = -(_drawnMatrix.y - this.boardtilesize.y) / 2
        const topright = new vector2(toprightX,toprightY);

        for(let i=0; i<this.gameManager.queue.length; i++){
            const queuePiece = this.gameManager.queue[i];
            var useModel = queuePiece.tileModel;
            if(this.game.gameOver)
                useModel = useModel.coloured(palette.one).intersection(dither2);

            this.DrawPieceCompensate(queuePiece,
                topright.add(this.FSTL2(new vector2(3 + i * 4.5,1))),
                useModel
            );
        }
    }

    DrawHold(){
        const _drawnMatrix = this.matrixRenderer.drawnMatrix();
        const topleftX = - (_drawnMatrix.x - this.tilesize.x) / 2,topleftY = - (_drawnMatrix.y - this.tilesize.y) / 2
        const topleft = new vector2(topleftX,topleftY);

        for(let i=0; i<this.gameManager.hold.length; i++){
            const queuePiece = this.gameManager.hold[i];
            var useModel = queuePiece.tileModel;
            if((this.gameManager.holdsused >= this.game.gameConfig.holds && !this.game.gameConfig.infinitehold) || this.game.gameOver)
                useModel = useModel.coloured(palette.one).intersection(dither2);
            
            this.DrawPieceCompensate(queuePiece,
            topleft.add(this.FSTL2(new vector2(-3 - i * 4.5,1))),
            useModel
            );
        }
    }

    NameLineClear(piecejustplaced:piece,lines:number,spin:boolean,mini:boolean,immobile:boolean,lodge:boolean,morph:boolean){
        const clearname = clearNames[Math.min(lines,clearNames.length)];
        const somspin = spin || immobile || mini;

        var colouroverride:string|null = null;
        if(lines == 12)
            colouroverride = "#ff00ff"
        if(lines > 12 && lines < 20){
            if(Date.now() % 128 < 64)
                colouroverride = "#ffffff";
            else
                colouroverride = "#ff00ff";
        }
        if(lines == 20){
            const tee = Date.now() / 1000
            const x = (Math.sin(tee * Math.E)**2 + Math.sin(tee * Math.PI)**2 + Math.sin(tee)**2);
            colouroverride = (x%1)>0.5?"#ffffff":"#000000";
        }
        if(lines > 20 && lines < 24){
            const tee = Date.now() / 1000
            const x = (Math.sin(tee * Math.E)**2 + Math.sin(tee * Math.PI)**2 + Math.sin(tee)**2);
            colouroverride = (x%1)>0.5?"#ff0000":"#000000";
        }
        if(lines >= 24){
            const tee = Date.now() / 1000
            const x = (Math.sin(tee * Math.E)**2 + Math.sin(tee * Math.PI)**2 + Math.sin(tee)**2);
            colouroverride = (x%1)>0.5?"#ff00ff":"#000000";
        }

        if(!somspin){
            if(this.game.gameConfig.warlockwounds > 0)
                return ["void",palette.one.toHex()]

            if(lines === 4){
                return [clearname,palette.two.toHex()];
            }
            if(lines === 5){
                return [clearname,palette.tri.toHex()];
            }
            if(lines > 5 && lines <= 11){
                return [clearname,colour3.fromHSV(Date.now()/ 1000,1,1).toHex()];
            }
            return [clearname,colouroverride||palette.one.toHex()];
        }

        var special = ""
        if(immobile)
            special = " immobile"
        if(morph)
            special = " morph"
        if(lodge)
            special = " lodge"

        const fullclearname = (((mini && !spin) ? "mini " : "")
                + piecejustplaced.name
                + ((spin || mini) ? " spin " : " ")
                + clearNames[Math.min(lines,clearNames.length)]
                + special)

        if(colouroverride)
            return [fullclearname,colouroverride]

        if(lines > 1)
            return [fullclearname,piecejustplaced.tileModel.firstcolour.toHex()];

        if(lines > 0)
            return [fullclearname, palette.two.toHex()];

        return [fullclearname, palette.one.toHex()];
    }

    lineclearalertexpiretime = 3000
    pcalertexpiretime = 1000
    breakalertexpiretime = 2000

    DrawLineClearAlert(_alert:lineclearalert){
        const _drawnMatrix = this.matrixRenderer.drawnMatrix();

            const age = Date.now() - _alert.time;

        if(!_alert.spin && !_alert.immobile && !_alert.mini && _alert.lines === 0) return false

        const [lineclearname, lineclearcolour] = this.NameLineClear(_alert.piecejustplaced,_alert.lines,_alert.spin,_alert.mini,_alert.immobile,_alert.lodge,_alert.morph)
        
        if(_alert.lines < 23){
            var t = age/this.lineclearalertexpiretime
            var t2 = Math.max(Math.min(age/this.lineclearalertexpiretime,1),0)
            if(this.game.userConfig.alwayskeeplastlineclear||this.game.gameConfig.keeplastlineclear)
                t = 0;
            this.ctx.globalAlpha = (1 - t)**2
            this.ctx.fillStyle = lineclearcolour;
            this.ctx.font = "64px Bytesized";
            this.ctx.letterSpacing = ((1 - (t - 1)**2) * 32) + "px"
            this.ctx.textAlign = "end"; 
            this.ctx.fillText(
                lineclearname,
                -_drawnMatrix.x/2
                -this.boardtextmargin,
                -_drawnMatrix.y/2
                + this.lineclearmargin
                + this.tilesize.y*this.holdqueueheight
            );
        }
        else{
            if(_alert.lines < 24)
                this.AlertText(lineclearname,colour3.fromHex(lineclearcolour),5,", 2s infinite linear tsuki",true)
            else
                this.AlertText(lineclearname,colour3.fromHex(lineclearcolour),6,", 2s infinite linear kruxxdd",true)
            return false
        }
        
        if(_alert.combo >0){
            const bignumber = (_alert.combo >= 10) ? 4 : 0
            const megacomb = (_alert.combo >= 20) ? 8 : 0

            this.ctx.globalAlpha = (1 - t2)**4
            this.ctx.font = (32 + _alert.combo * 4 + bignumber + megacomb) + "px Bytesized";
            this.ctx.letterSpacing = ((1 - (t2 - 1)**2) * 8) + "px"
            this.ctx.textAlign = "end"; 
            this.ctx.fillText(
                _alert.combo + " combo",
                -_drawnMatrix.x/2
                -this.boardtextmargin,
                -_drawnMatrix.y/2
                +this.lineclearmargin
                +this.combomargin
                +this.tilesize.y*this.holdqueueheight
                + (_alert.combo * 4 + bignumber + megacomb) / 2
            );
        }

        if (_alert.combo >= 20){
            this.ctx.globalAlpha = (1 - t2)**2 
            this.ctx.letterSpacing = ((1 - (t2 - 1)**2) * 8) + "px"
            this.ctx.textAlign = "center"; 
            if(Date.now() % 128 < 64)
                this.ctx.fillStyle = palette.great1.toHex();
            else
                this.ctx.fillStyle = palette.great2.toHex();
            this.ctx.font = "bold 128px Bytesized";
            this.ctx.fillText("MEGACMB",0,0);
        }

        return true
    }

    magicnumber = 0; //this is used for calculating some visuals
    magiccolour = new colour3(0,0,0);

    lineclearmargin = 128;
    combomargin = 64;
    b2bmargin = 64;

    holdqueueheight = 2;

    boardtextmargin = 16;
    boardsmalltextmargin = 64;

    dynamicText:ReactElement[];
    setDynamicText;

    AlertText(text:string,colour:colour3|colourpossibility,lifespan:number,animation="",bold?:boolean){
        /*const particle = new textParticle(text,colour)
        //particle.velocity = new vector2((Math.random() - 0.5) * 60/100,(Math.random() - 0.5) * 60/100)
        particle.scale = new curve(vector2.one.mul(60),vector2.one.mul(200))
        //particle.angularvelocity = (Math.random() - 0.5) * Math.PI * 2 / 100
        particle.opacity = new curve(1,0,(x:number)=>(1-(1-x)**16))
        particle.lifespan = 3000
        this.particleManager.particles.push(particle)*/
        let ee = createElement("div",
            {style:{
                color:SafeColour(colour).toHex(),
                opacity:0,
                animation: lifespan.toString() + "s ease-out myAnimation" + animation,
                fontWeight: bold ? "bold" : "normal",
            },className:"dynamic",onAnimationEnd:()=>{
                this.setDynamicText(this.dynamicText.map(e=>{
                    if(e === ee) return null; return e
                }))
                this.dynamicText = this.dynamicText.map(e=>{
                    if(e === ee) return null; return e
                }) as ReactElement[]
            }
        },text);
        this.setDynamicText(this.dynamicText.concat(ee))
    }

    Setb2b(){
        if(this.game.ib2b >= 65536){
            const tee = Date.now()
            if(Math.random() < 1/60){
                this.magicnumber = Date.now();
                this.magiccolour = colour3.fromHSV(Math.random(),1,1)
            }
            const t = tee - this.magicnumber;

            this.ctx.fillStyle = this.magiccolour.lerp(colour3.fromHSV(1,0,1),FDecay(t/40)).toHex();
            this.ctx.globalAlpha = Math.sin(tee/3000)**2 / 2 + 0.5;
            
            this.ctx.font = (101 + Math.log(this.game.ib2b)) + "px Bytesized";
        }
        else if(this.game.ib2b >= 2545){
            const tee = Date.now() / 1000
            const x = (Math.sin(tee * Math.E)**2 + Math.sin(tee * Math.PI)**2 + Math.sin(tee)**2);
            this.ctx.fillStyle = colour3.fromHSV(1,0,x % 1).toHex();
            this.ctx.font = (85 + 2 * Math.log(this.game.ib2b)) + "px Bytesized";
        }
        else if(this.game.ib2b >= 256){
            if(Date.now() % 128 < 64)
                this.ctx.fillStyle = palette.great1.toHex();
            else
                this.ctx.fillStyle = palette.great2.toHex();
            this.ctx.font = (70 + (this.game.ib2b**0.5)/2) + "px Bytesized";
        }
        else if(this.game.ib2b >= 50){
            this.ctx.fillStyle = colour3.fromHSV(Date.now()/ 1000,1,1).toHex();
            this.ctx.font = (58 + this.game.ib2b**0.5) + "px Bytesized";
        }
        else if(this.game.ib2b >= 16){
            const tee = Date.now() / 1000
            const x = Math.sin(tee)*2;
            this.ctx.fillStyle = new colour3(1,0,1).lerp(new colour3(0,0,1),x).toHex();
            this.ctx.font = (48 + this.game.ib2b/4) + "px Bytesized";
        }
        else if(this.game.ib2b >= 4){
            this.ctx.fillStyle = palette.two.toHex();
            this.ctx.font = (32 + this.game.ib2b) + "px Bytesized";
        }else{
            this.ctx.fillStyle = palette.one.toHex();
            this.ctx.font = "32px Bytesized";
        }
    }

    DrawAlerts(){ //these have to be rewritten more beautifully why is it so copypaste d.r.y
        const _drawnMatrix = this.matrixRenderer.drawnMatrix();

        if(this.game.userConfig.alwayskeeplastlineclear||this.game.gameConfig.keeplastlineclear){
            var lastlineclear;
            var lastlinecleartime = 0;

            for(let i=0; i<this.flags.lineclearalerts.length; i++){
                const _alert = this.flags.lineclearalerts[i]
                if(!_alert)
                    continue
                
                if(!_alert.spin && !_alert.immobile && !_alert.mini && _alert.lines === 0) continue

                if(_alert.time > lastlinecleartime){
                    lastlineclear = _alert
                    lastlinecleartime = _alert.time
                }
            }

            for(let i=0; i<this.flags.lineclearalerts.length; i++){
                const _alert = this.flags.lineclearalerts[i]
                if(!_alert)
                    continue
                
                let dokeep = false;
                if(_alert !== lastlineclear)
                    dokeep = false;
                else
                    dokeep = this.DrawLineClearAlert(_alert)
                
                if(!dokeep)
                    delete this.flags.lineclearalerts[i];
            }
        }
        else{
            for(let i=0; i<this.flags.lineclearalerts.length; i++){
                const _alert = this.flags.lineclearalerts[i]
                if(!_alert)
                    continue
                
                const age = Date.now() - _alert.time;
                if(age > this.lineclearalertexpiretime){
                    delete this.flags.lineclearalerts[i]
                    continue
                }

                const dokeep = this.DrawLineClearAlert(_alert);
                if(!dokeep)
                    delete this.flags.lineclearalerts[i];
            }
        }
            
        if(this.game.ib2b >0){ //4 16 50 256 2545 65536
            this.ctx.globalAlpha = 1;

            this.Setb2b();
            
            this.ctx.letterSpacing = "0px";
            this.ctx.textAlign = "end"; 
            this.ctx.fillText(
                this.game.ib2b + " b2b",
                -_drawnMatrix.x/2 // start from the left side of the board
                - this.boardsmalltextmargin, // margin in between the board and the text
                -_drawnMatrix.y/2 // start from the top of the board
                + this.tilesize.y*2 // make space for hold queue
                + this.lineclearmargin // vertical margin between hold queue and center of text
                + this.combomargin // extra margin between line clear text and this text
                + this.b2bmargin // extra margin between combo text and this text
            );
        }

        const deletion:number[] = [];
        for(const _alert of this.flags.otheralerts){
            const age = Date.now() - _alert.time;

            if(_alert.code === "pc"){
                let text = "PERFECT CLEAR"
                let colour:colour3|colourpossibility = new colour3(1,1,0)

                let great = true

                if(this.game.lines < 4){
                    text = "trivial pc"
                    colour = palette.one
                    great = false
                }else if(this.game.lines <= 8){
                    text = "opener pc"
                    colour = palette.two
                    great = false
                }

                if(great)
                    this.AlertText(text,colour,5,", 0.128s infinite linear great",true)
                else
                    this.AlertText(text,colour,3)
               
                deletion.push(this.flags.otheralerts.indexOf(_alert))
                continue
            }
            if(_alert.code === "combobreak"){
                if(age > this.breakalertexpiretime){
                    deletion.push(this.flags.otheralerts.indexOf(_alert))
                    continue
                }   

                const bignumber = (_alert.info >= 10) ? 4 : 0
                const megacomb = (_alert.info >= 20) ? 8 : 0


                const t = age/this.breakalertexpiretime
                this.ctx.globalAlpha = (1 - t)**2
                this.ctx.fillStyle = palette.one.toHex();
                let fontsize = (32 + _alert.info * 4 + bignumber + megacomb)
                this.ctx.font = fontsize + "px Bytesized";
                this.ctx.letterSpacing = ((1 - (t - 1)**2) * 256) + "px"
                this.ctx.textAlign = "center"; 
                
                this.ctx.fillText(
                    _alert.info.toString(),
                    -_drawnMatrix.x/2 // start from the left side of the board
                    - this.boardtextmargin // margin in between the board and the text
                    - 128 * (fontsize/32), // extra offset for alignment of number to make it look similar to the combo text
                    -_drawnMatrix.y/2 // start from the top of the board
                    + this.tilesize.y*2 // make space for hold queue
                    + this.lineclearmargin // vertical margin between hold queue and center of text
                    + this.combomargin // extra margin between line clear text and this text
                    + (_alert.info * 4 + bignumber + megacomb) / 2
                );
            }
            if(_alert.code === "b2bbreak"){
                if(age > this.breakalertexpiretime * ((_alert.info + 1) ** 0.5) / 4){
                    deletion.push(this.flags.otheralerts.indexOf(_alert))
                    continue
                }   

                this.ctx.globalAlpha = 1;

                const teez = age / (this.breakalertexpiretime * ((_alert.info + 1) ** 0.5) / 4)

                let fontsize = 32;

                if(_alert.info >= 65536)
                    fontsize = 101 + Math.log(_alert.info);
                else if(_alert.info >= 2545)
                    fontsize = 85 + 2 * Math.log(_alert.info);
                else if(_alert.info >= 256)
                    fontsize = 70 + (this.game.ib2b**0.5);
                else if(_alert.info >= 50)
                    fontsize = 58 + _alert.info**0.5;
                else if(_alert.info >= 16)
                    fontsize = 48 + _alert.info/4;
                else if(_alert.info >= 4)
                    fontsize = 32 + _alert.info;
                

                this.ctx.font = (10 * age / 1000 + fontsize) + "px Bytesized";
                
                this.ctx.globalAlpha *= (1 - teez) **2;

                this.ctx.letterSpacing = (age * 32 / 1000) + "px";
                this.ctx.textAlign = "center"; 
                this.ctx.fillText(
                    _alert.info,
                    -_drawnMatrix.x/2 // start from the left side of the board
                    - this.boardtextmargin // margin in between the board and the text
                    - 70 * (fontsize/32), // extra margin to fit the word b2b
                    -_drawnMatrix.y/2 // start from the top of the board
                    + this.tilesize.y*2 // make space for hold queue
                    + this.lineclearmargin // vertical margin between hold queue and center of text
                    + this.combomargin // extra margin between line clear text and this text
                    + this.b2bmargin // extra margin between combo text and this text
                );
            }
            if(_alert.code === "generic"){
                this.AlertText(_alert.info.text,_alert.info.colour,2)
               
                deletion.push(this.flags.otheralerts.indexOf(_alert))
                continue
            }
        }
        while(deletion.length > 0)
            this.game.flags.otheralerts.splice(deletion.pop() as number,1)
    }

    DrawScoreDisplay(_scoreDisplay:scoreDisplayType,screenpos:vector2){
        this.ctx.globalAlpha = 1

        const scoring = _scoreDisplay(this.game)

        this.ctx.fillStyle = palette.one.toHex();
        this.ctx.font = "100px Bytesized";
        this.ctx.textAlign = "center"; 
        this.ctx.fillText(scoring.text,screenpos.x - 150,screenpos.y);

        this.ctx.font = "32px Bytesized";
        this.ctx.fillText(scoring.name,screenpos.x - 150,screenpos.y-120);

        this.ctx.fillRect(
            screenpos.x- 150 - 64,
            screenpos.y + 40,
            128 * scoring.progress,
            8
        );
    }

    DrawDisplay(text:string,screenpos:vector2){
        this.ctx.globalAlpha = 1

        this.ctx.font = "50px Bytesized";
        this.ctx.textAlign = "end"; 
        this.ctx.fillText(text,screenpos.x - 32,screenpos.y);
    }

    DrawInfo(){
        const _drawnMatrix = this.matrixRenderer.drawnMatrix();
        const leftX = -_drawnMatrix.x / 2, bottomY = _drawnMatrix.y / 2
        
        this.ctx.fillStyle = palette.one.toHex();

        this.DrawScoreDisplay(this.game.gameConfig.scoreDisplayType,new vector2(leftX,0));
        this.DrawDisplay(formatTime(this.game.time),new vector2(leftX,bottomY-8))
        this.DrawDisplay(this.game.score.toString(),new vector2(leftX,bottomY-8-52))

        if(this.game.gameConfig.scoreDisplayType === scoreDisplays.default
            &&this.game.gameConfig.mission
            &&this.game.gameConfig.scorer
        )this.DrawScoreDisplay(scoreDisplays.score,new vector2(leftX,256))

        this.DrawAlerts();
    }

    DrawUI(){
        this.DrawQueue();
        this.DrawHold();

        this.DrawInfo();
    }

    /*stupidparticlething(){
        if(Math.random() < 1){
            const particle = new rectParticle(vector2.zero,vector2.one,colour3.fromHSV(Math.random(),1,1))
            particle.rotation = Math.random() * Math.PI * 2
            particle.position = new vector2(-this.drawnMatrix().x/2 + Math.random() * this.drawnMatrix().x,-this.drawnMatrix().y/2 + Math.random() * this.drawnMatrix().y)
            particle.velocity = new vector2((Math.random() - 0.5) * 60/100,(Math.random() - 0.5) * 60/100)
            particle.scale = new curve(vector2.one.mul(60 + Math.random() * 60),vector2.zero)
            //particle.acceleration = new vector2(0,1/1000)
            particle.angularvelocity = (Math.random() - 0.5) * Math.PI * 2 / 100
            particle.opacity = new curve(1,0,(x:number)=>(1-(1-x)**2))
            particle.lifespan = 1000 + Math.random() * 1500
            this.particleManager.particles.push(particle)
        }
    }*/

    particletimer = 0;

    /*stupidparticlething2(){
        const particle = new textParticle("blah",colour3.fromHSV(Math.random(),1,1))
        //particle.rotation = Math.random() * Math.PI * 2
        particle.position = new vector2(-this.drawnMatrix().x/2 + Math.random() * this.drawnMatrix().x,-this.drawnMatrix().y/2 + Math.random() * this.drawnMatrix().y)
        particle.velocity = new vector2((Math.random() - 0.5) * 60/100,(Math.random() - 0.5) * 60/100)
        particle.scale = new curve(vector2.one.mul(60 + Math.random() * 60),vector2.zero)
        //particle.acceleration = new vector2(0,1/1000)
        //particle.angularvelocity = (Math.random() - 0.5) * Math.PI * 2 / 100
        particle.opacity = new curve(1,0,(x:number)=>(1-(1-x)**2))
        particle.lifespan = 1000 + Math.random() * 1500
        this.particleManager.particles.push(particle)
    }*/

    RenderStep(deltaTime:number,dynamicText:ReactElement[]){
        const centerX = this.uiCanvas.width/2,centerY = this.uiCanvas.height/2;
        this.origin = new vector2(centerX,centerY);

        this.game = this.gameManager.game
        this.tilesize = this.game.userConfig.tilescalar;
        this.boardtilesize = this.game.userConfig.tilescalar.hadamard(this.game.gameConfig.boardscalar)
        this.dynamicText = dynamicText;
        
        this.ctx.reset();

        //actually draw a bunch of stuff

        this.matrixRenderer.ctx = this.matrixctx;
        this.matrixRenderer.RenderStep(deltaTime);

        this.ctx.resetTransform()
        this.ctx.translate(centerX,centerY);
        this.DrawUI()

        /*this.particletimer += deltaTime
        while(this.particletimer > 1000/120){
            this.particletimer -= 1000/120
            //this.stupidparticlething2()
        }*/

        this.particleManager.Update(deltaTime);
        this.particleManager.DrawParticles(this.ctx);
    }

    constructor(_gameManager:gameManager,uiCanvas:HTMLCanvasElement,matrixCanvas:HTMLCanvasElement,aouoaeoa:[ReactElement[],React.Dispatch<ReactElement[]>]){
        this.uiCanvas = uiCanvas;
        const ctx = uiCanvas.getContext('2d')
        if(!ctx)
            throw new Error('no canvas')
        this.ctx = ctx;

        this.gameManager = _gameManager;
        this.game = _gameManager.game;
        this.flags = this.game.flags;
        
        this.matrixRenderer = new MatrixRendering(_gameManager,matrixCanvas);
        this.matrixctx = this.matrixRenderer.ctx

        this.matrixCanvas = matrixCanvas;

        this.particleManager = new particleManager();

        [this.dynamicText,this.setDynamicText] = aouoaeoa;

        this.tilesize = this.game.userConfig.tilescalar;
        this.boardtilesize = this.game.userConfig.tilescalar.hadamard(this.game.gameConfig.boardscalar)
    }
}

export default function GameRenderer({ref}){
    const matrixCanvasRef = useRef<HTMLCanvasElement|null>(null);
    const uiCanvasRef = useRef<HTMLCanvasElement|null>(null);
    
    var renderer = useRef<rendering|null>(null);
    var [initialised,setInitialised]=useState(false);
    var [dynamicText,setDynamicText]=useState([] as ReactElement[]);
    
    useImperativeHandle(ref, ()=>{
        return{
            Init:(_game:gameManager)=>{
                setInitialised(true)
                if(!uiCanvasRef.current)
                    throw new Error("blah")
                if(!matrixCanvasRef.current)
                    throw new Error("blah")
                renderer.current = new rendering(_game,uiCanvasRef.current,matrixCanvasRef.current,[dynamicText,setDynamicText])
            },
            Update(deltaTime:number){
                if(!renderer.current)return
                renderer.current.RenderStep(deltaTime,dynamicText)
            },
            isInitialised(){
                return initialised;
            },
            Reset(){
                setInitialised(false)
                renderer.current = null;
            }
        }
    },[initialised,dynamicText,setDynamicText])

    return (<>
      <canvas ref={matrixCanvasRef} width="4550" height="2560px"/>
      <canvas ref={uiCanvasRef} width="4550" height="2560px"/>
      {dynamicText}
    </>)
}