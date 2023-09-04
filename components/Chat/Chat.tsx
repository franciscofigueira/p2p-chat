"use client"
import {useEffect, useState, useContext} from "react"
import { ChatsContext } from "@/contexts/ChatsContext"
import Message from "../Message/Message"
import styles from "./chat.module.css"

export default function Chat() {
    const {peer_id, chats, selected_chat, sendMessage} = useContext(ChatsContext)
    const [input, setInput] = useState("")
    const handleChange = (event: any) => {
          setInput(event.target.value)
    }

    const handleKeyDown = (event: any) => {
        if (event.key === "Enter") {
              console.log(input)
              sendMessage(input)
              setInput("")
        }
    }

    let display
    if (selected_chat) {
        const chat = chats.get(selected_chat)
        display = <div className={styles.chatRoomContainer}>
              <div className={styles.head}>
                    <div>UserName</div>
                    <div>Actions</div>
              </div>
              <div className={styles.mainChatContainer}>
                    {chat?.messages.map((message) => (
                          <div
                                className={styles.messageContainer}
                                key={message.received_timestamp}
                                style={{
                                      justifyContent: message.sender_peer_id === peer_id ? "flex-end" : "flex-start",
                                }}
                          >
                                <Message message={message} isUserMessage={peer_id === message.sender_peer_id}/>
                          </div>
                    ))}
              </div>
              <input type="text" className={styles.input} onChange={handleChange} value={input}

                     onKeyDown={handleKeyDown} placeholder="Write a message..."></input>
        </div>
    } else {
            display = <div className={styles.chatRoomContainer}>
                <div>
                        Select Chat to Start Messaging
                </div>
            </div>
    }

    return (
            <>
                {display}
            </>
    )
}

