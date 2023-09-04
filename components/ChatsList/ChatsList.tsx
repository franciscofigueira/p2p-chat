"use client"

import {useEffect, useState, useContext} from "react"
import { ChatsContext } from "@/contexts/ChatsContext"
import ChatsListElement from "./ChatsListElement/ChatsListElement"
import styles from "./chatsList.module.css"

export default function ChatsList(){
    const {setSelectedChat, chats, peer_id, selected_chat} = useContext(ChatsContext)

    return (
        <div>
            <div className={styles.container}>
                        {Array.from(chats).sort((a, b) => (Number(b[1].latest_message_timestamp) - Number(a[1].latest_message_timestamp))).map(([key, val]) => (
                              <div className={styles.messageContainer} key={val.latest_message_timestamp}>
                                    <button
                                          className={styles.button}
                                          onClick={() => {
                                                console.log(val)
                                                setSelectedChat(key)
                                          }}
                                    >
                                          <ChatsListElement lastMessage={val.messages[val.messages.length - 1]}
                                                       participant_pub_key={val.participant_public_key} isSelectedChat={selected_chat? val.participant_public_key === selected_chat : false} />
                                    </button>
                              </div>
                        ))}
                  </div>
        </div>
    )
}