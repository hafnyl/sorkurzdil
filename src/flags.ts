import { vector2 } from "./basics.ts";
import { piece } from "./pieces.ts";


export type lineclearalert={
    time:number,
    piecejustplaced:piece,
    lines:number,
    spin:boolean,
    mini:boolean,
    immobile:boolean,
    lodge:boolean,
    morph:boolean,
    combo:number,
}

export type otheralert={
    time:number,
    code:string,
    info?:any,
}

export default class gameFlags{
    lineclearalerts:lineclearalert[] = [];
    otheralerts:otheralert[] = [];
    nongravitydisplacementthisframe:vector2 = vector2.zero;
    piecechange = false;
    justspinned = false;
    shakeincrease = 0;

    tpc = false;
    opc = false;
    pc = false;
    hpc = false;
    cc = false;
    vpc = false;

    waveprogress = 0;

    limbobar = 0;
    sprintbar = 0;

    negativeb2bmeter=false;
    b2bbreak:number|undefined;
    combobreak:number|undefined;
}