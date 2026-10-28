import { forwardRef, useImperativeHandle, useState } from "react"

export default function TextDisplay({ref}){
    useImperativeHandle(ref, ()=>{
        return{
            Update:(text:string)=>{
                setText(text)
            }
        }
    })

    const [text, setText] = useState("")

    return (<div className="topleft">{text}</div>)
}
