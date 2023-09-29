"use client"

import {useEffect, useState, useContext} from "react"
import { ChatsContext } from "@/contexts/ChatsContext"
import styles from "./createchat.module.css"

interface Props {
    show: boolean
    close: () => void
}

export default function CreateChat({show, close}: Props){

    const {connect, public_key, createChat} = useContext(ChatsContext);
      const [input, setInput] = useState("")
      const [pubKey, setpubKey] = useState("")

      const handleChange = (event: any) => {
            setInput(event.target.value)
      }
      const handlePubKeyChange = (event: any) => {
            setpubKey(event.target.value)
      }

      const handleKeyDown = (event: any) => {
            if (event.key === "Enter") {
                  console.log(input)
                  connect(input)
                  setInput("")
                  close()
            }
      }

      const handleKeyDownPubKey = (event: any) => {
            if (event.key === "Enter") {
                  console.log(pubKey)
                  createChat(pubKey)
                  setpubKey("")
                  close()
            }
      }

      return(
        <div>
                <div className={`${styles.container}  ${show ? styles.show : ""}`}>

                        
                        <input type="text" className={styles.input} onChange={handleChange} value={input}
                               onKeyDown={handleKeyDown} placeholder="Input Peer Address..">
                        </input>
                        <input type="text" className={styles.input} onChange={handlePubKeyChange} value={pubKey}
                               onKeyDown={handleKeyDownPubKey} placeholder="Input public Key..">
                        </input>
                        <button onClick={() => close()} className={styles.button} >Return</button>
                </div>
        </div>
      )

}