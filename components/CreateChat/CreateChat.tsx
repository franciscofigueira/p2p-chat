"use client"

import {useEffect, useState, useContext} from "react"
import { ChatsContext } from "@/contexts/ChatsContext"
import styles from "./createchat.module.css"

interface Props {
    show: boolean
    close: () => void
}

export default function CreateChat({show, close}: Props){

    const {connect, public_key} = useContext(ChatsContext);
      const [input, setInput] = useState("")


      const handleChange = (event: any) => {
            setInput(event.target.value)
      }

      const handleKeyDown = (event: any) => {
            if (event.key === "Enter") {
                  console.log(input)
                  connect(input)
                  setInput("")
                  close()
            }
      }

      return(
        <div>
                <div className={`${styles.container}  ${show ? styles.show : ""}`}>

                        <button onClick={() => close()}>Close</button>
                        <input type="text" className={styles.input} onChange={handleChange} value={input}
                               onKeyDown={handleKeyDown} placeholder="Input peer port..">
                        </input>
                </div>
        </div>
      )

}