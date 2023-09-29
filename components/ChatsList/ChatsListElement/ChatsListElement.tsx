"use client"

import {useEffect, useState, useContext} from "react"
import { MessageType, ChatsContext } from "@/contexts/ChatsContext"
import styles from "./chatsListElement.module.css"

interface Props {
    lastMessage: MessageType
    participant_pub_key: string
    isSelectedChat: boolean
}

export default function ChatsListElement({lastMessage, participant_pub_key, isSelectedChat}: Props) {

    const date = new Date(Number(lastMessage.received_timestamp) * 1000)
    let hours = date.getHours()
    let minutes
    if (date.getMinutes() < 10) {
        minutes = "0" + date.getMinutes()
    } else {
        minutes = date.getMinutes()
    }
    let formattedTime = hours + ":" + minutes
   
    if (isSelectedChat) {
        
    }

    return (
        <div className={isSelectedChat? styles.containerHighlight: styles.container}>
            <div className={styles.topRow}>
               <p> {`${participant_pub_key.slice(0, 10)}...${participant_pub_key.slice(-10, -1)}`}</p>
               <p>{formattedTime}</p>
            </div >
            <div className={styles.bottomRow}>
                <p>{lastMessage.content.text}</p>
                <p></p>
            </div>
        </div>
    )
}   