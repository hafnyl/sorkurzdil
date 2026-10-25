
import { vector2 } from './basics.ts';
import krux from './krexkd.png'
import icons from './iconsheet.png'
import sulfir from './sulfir.png'

export const images = Object.freeze({
    krux:krux,
    icons:icons,
    sulfir:sulfir,
})

export default class ImageRenderer{
    static imagesCache:{[key:string]:HTMLImageElement} = {};
    static loading:{[key:string]:boolean} = {};

    static LoadImage(image:string):HTMLImageElement|null{
        var imgobj = this.imagesCache[image]
        if(!imgobj && !this.loading[image]){
            imgobj = new Image();
            imgobj.src = image;
            this.loading[image] = true;
            imgobj.addEventListener("load", () => {
                this.imagesCache[image] = imgobj;
            });
        }
        return imgobj
    }

    static DrawImage(ctx:CanvasRenderingContext2D,image:string,start:vector2,size:vector2,srcstart?:vector2,srcsize?:vector2){
        const imgobj = this.LoadImage(image)
        if(!imgobj){
            ctx.fillStyle = "#0000ff"
            ctx.fillRect(start.x,start.y,size.x,size.y)
            return
        }
        ctx.imageSmoothingEnabled = false
        if(srcsize&&srcstart){
            ctx.drawImage(imgobj,srcstart.x,srcstart.y,srcsize.x,srcsize.y,start.x,start.y,size.x,size.y)
        }else{
            ctx.drawImage(imgobj,start.x,start.y,size.x,size.y)
        }
    }

    static DrawFromSheet(ctx:CanvasRenderingContext2D,image:string,start:vector2,size:vector2,spritesize:vector2,spriteid:number){
        const imgobj = this.LoadImage(image)
        if(!imgobj){
            ctx.fillStyle = "#0000ff"
            ctx.fillRect(start.x,start.y,size.x,size.y)
            return
        }

        const n = Math.floor(imgobj.naturalWidth / spritesize.x)
        if(n <= 0)
            throw new Error("sheet too small for sprite (width)")
        const m = Math.floor(imgobj.naturalHeight / spritesize.y)
        if(m <= 0)
            throw new Error("sheet too small for sprite (height)")
        if(spriteid >= n * m)
            throw new Error(`sprite id out of range (${spriteid}, ${n * m})`)

        const srcstart = new vector2(spriteid % n,Math.floor(spriteid / n))
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(imgobj,srcstart.x,srcstart.y,spritesize.x,spritesize.y,start.x,start.y,size.x,size.y)
    }
}