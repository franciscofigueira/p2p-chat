"use client"

import {useEffect, useState, useContext} from "react"
import { ChatsContext } from "@/contexts/ChatsContext"
import styles from "./user.module.css"

export default function User(){
    const {peer_id, public_key, setSelfPeerId} = useContext(ChatsContext)

    const copy = async function copyTextToClipboard(text: string) {
        if ('clipboard' in navigator) {
              return await navigator.clipboard.writeText(text);
        } else {
              return document.execCommand('copy', true, text);
        }
  }

    return(
    
        <div className={styles.container}>
            Profile:
            <div className={styles.infoContainer}>
                <p>Public Key: {`${public_key.slice(0, 10)}...${public_key.slice(-10, -1)}`}</p> 
                <button onClick={() => copy(public_key)}>{copyIcon}</button>
            </div>
            <div className={styles.infoContainer}>
                <p>Address: {`${peer_id.slice(0, 10)}...${peer_id.slice(-10, -1)}`}</p> 
                <button onClick={() => copy(peer_id)}>{copyIcon}</button>
            </div>
        </div>

    )
}

const copyIcon = (<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>)