
import { vector2 } from './basics.ts';
import krux from './krexkd.png'

export const images = Object.freeze({
    krux:krux
})

export default class ImageRenderer{
    imagesCache:{[key:string]:HTMLImageElement} = {};
    loading:{[key:string]:boolean} = {};

    LoadImage(){

    }

    DrawImage(ctx:CanvasRenderingContext2D,image:string,start:vector2,size:vector2){
        if(!this.imagesCache[image]){
            
        }
    }
}