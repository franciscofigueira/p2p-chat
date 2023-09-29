"use client"
import {useEffect, useState, useContext} from "react"
import { ChatsContext } from "@/contexts/ChatsContext"
import Message from "./Message/Message"
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

    const copy = async function copyTextToClipboard(text: string) {
      if ('clipboard' in navigator) {
            return await navigator.clipboard.writeText(text);
      } else {
            return document.execCommand('copy', true, text);
      }
}

    let display
    if (selected_chat) {
        //const chat = chats.get(selected_chat)
        const chat = chats[selected_chat]
        display = <div className={styles.chatRoomContainer}>
              <div className={styles.head}>
                    <div  className={styles.headInside}>{`${chat?.participant_public_key.slice(0, 10)}...${chat?.participant_public_key.slice(-10, -1)}`} 
                    <button onClick={() => copy(chat?.participant_public_key!)}>{copyIcon}</button></div>
                   
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
                <div style={{marginTop:"50%", display:"flex",justifyContent:"center"}}>
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

const copyIcon = (<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>)