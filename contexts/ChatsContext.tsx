"use client"
import React, {createContext, useState, useEffect, Children, SetStateAction, Dispatch} from "react"
import {invoke} from "@tauri-apps/api/tauri"
import {listen, Event as TauriEvent} from "@tauri-apps/api/event"
import * as ecc from "@toruslabs/eccrypto"

type EncryptedMessageType = {
    from: string,
    sent_timestamp: string,
    text: string,
}

type P2PMessageType = {
    to_public_key: string,
    encrypted: string
}

export type MessageContentType = {
    from_public_key: string,
    to_public_key: string,
    sent_timestamp: string,
    text: string
}

export type MessageType = {
    sender_peer_id: string
    received_timestamp: string
    content: MessageContentType
}

export type ChatType = {
    participant_public_key: string 
    messages: Array<MessageType>
    latest_message_timestamp: string
}

export type ChatsContextTypes = {
    chats: {[key:string]:ChatType},
    peer_id: string 
    public_key: string
    selected_chat: string | undefined
    setChats: Dispatch<SetStateAction<{[key:string]:ChatType}>>
    setSelectedChat: Dispatch<SetStateAction<string | undefined>>

    sendMessage: (message: string) => void
    connect: (peer: string) => void
    createChat: (pub_key: string) => void
    setSelfPeerId: () => void
}

export const ChatsContext = createContext<ChatsContextTypes>({
    chats: {},
    peer_id: "",
    public_key: "",
    selected_chat: undefined,
    setChats: () => {},
    setSelectedChat: () => {},
    sendMessage: (message: string) => {},
    connect: (peer: string) => {},
    createChat: (pub_key: string) => {},
    setSelfPeerId: () => {}
})

interface Props {
    children: React.ReactNode
}


export default function ChatsProvider({children}: Props) {
    const [selected_chat, setSelectedChat] = useState<string | undefined>(undefined)

    const [chats, setChats] = useState< {[key:string]:ChatType}>({})
    const [peer_id, setPeer_id] = useState<string>("")
    const [private_key, setPrivate_Key] = useState<Buffer>(Buffer.from("72a68370bc044eb10ecd191c83662e152ff19a874a4f5c05506a6e22beb99dec", "hex"))
    const [public_key, setPublicKey] = useState<string>("048e6265577e280221de5e3f2a6b2b9def346a5bf81c2f9daee9e8734580e40a5c8a65aec23fca6861eaf95b7431c5e49b111638887e304c183a38f36634cae3f0")

   

    useEffect(() => {
        const privateKey = Buffer.from("72a68370bc044eb10ecd191c83662e152ff19a874a4f5c05506a6e22beb99dec", "hex")//ecc.generatePrivate()
        // console.log(privateK.toString('hex'))
        // setPrivate_Key(privateK)
        // setPublicKey(ecc.getPublic(privateK).toString('hex'))
        // const enc = parseEncryptedMessage('{"iv":"65f2e009981ef7f7ac2f0393a17ddb38","ephemPublicKey":"04cad9406d52289d0cda95fc5879f02c8fb2b0ad87f61056ad0f708b06376895b4486ff7d61937f0322649d9e0cdf026819d40f4b6c2f67d9e786077a19dcc56ed","ciphertext":"45d821bb5730570f233a6147cc331261","mac":"e243f97a5c1475ad61d787b86dfcddf603fe7f88d44a228c583c5a4846c639b6"}')
        // ecc.decrypt(privateK, enc).then(function (plaintext) {
        //       console.log("Message to part B:", plaintext.toString());
        // });
        //const privateKey = ecc.generatePrivate()
        setPrivate_Key(privateKey)
        setPublicKey(ecc.getPublic(privateKey).toString('hex'))
        setSelfPeerId()
    }, [])

    const createChat = (pub_key: string) => {
       const chat = chats[pub_key]
        if (chat) {
            return
        } else{
         
            setChats((chats)=>{
                const newChats = {... chats}
                newChats[pub_key] = {
                        participant_public_key: pub_key,
                        messages: [],
                        latest_message_timestamp: '0'
                    }
                return newChats
            })
        }
    }

    const sendMessage = async (messageToSend: string) => {
        console.log("Message sent")
       
        if (selected_chat) {
              
                const chat = chats[selected_chat!]
                const formatedMessage = {
                    from_public_key: public_key,
                    to_public_key: chat?.participant_public_key!,
                    sent_timestamp: (Date.now() / 1000).toString(),
                    text: messageToSend
                }
                const message_to_send = await encryptMessage(formatedMessage)
                console.log(messageToSend)

              if (chat) {
                    invoke<string>("send_message", {msg: message_to_send})
                          .then((message) => {})
                          .catch(console.error)
                        chat.messages.push(
                          {
                            sender_peer_id: peer_id,
                            received_timestamp: (Date.now() / 1000).toString(),
                            content: formatedMessage,
                          }
                        )
                        chat.latest_message_timestamp = (Date.now() / 1000).toString()
                    
                   
                    setChats((chats)=>{
                        const newChats = {... chats}
                        newChats[selected_chat] = chat
                        return newChats
                    })      

                    // setChats( {
                    //    ... chats
                    // })
              }
        }
    }

    const setSelfPeerId = () => {
        invoke<string>("get_peer_id")
                .then((message) => {
                    console.log(message)
                    setPeer_id(message)
                })
                .catch(console.error)
    }

    const connect = (peer: string) => {
            console.log("connecting")
            invoke<string>("dial", {id: peer})
                .then((message) => {
                })
                .catch(console.error)
    }

    useEffect(() => {
        const unListen = listen("identify", (e: TauriEvent<any>) => {
              console.log(e.payload, "identify")
           
        })
        return () => {
              unListen.then((f) => f())
        }
    }, [])

  useEffect(() => {
        const unListen = listen("messageReceived", async (e: TauriEvent<any>) => {
              console.log("message received", e)
              // sets3(`message received  ${e.payload[1]} from   ${e.payload[0]}`)

            try {
                const p2p_msg: P2PMessageType = JSON.parse(e.payload[1])
                console.log(p2p_msg.to_public_key)
                console.log(public_key)
                let parsedMessage: EncryptedMessageType
                if (public_key != p2p_msg.to_public_key){
                    console.log("returned")
                    return 
                } else{
                    console.log("continued")
                    const encrypted = parseEncryptedMessage(p2p_msg.encrypted)
                    console.log("encrypted",encrypted)
                    let dec = await ecc.decrypt(private_key,encrypted)
                    let message = dec.toString('utf16le')
                    parsedMessage= JSON.parse(message)
                    console.log("parsed",parsedMessage)
                
                }
                
                  //const chat = chats.get(parsedMessage.from)
                  const chat = chats[parsedMessage.from]
    
                  console.warn(chat,"chat on message received")
                  if (chat) {
                        chat.messages.push(
                              {
                                sender_peer_id: e.payload[0],
                                received_timestamp: (Date.now() / 1000).toString(),
                                content: {
                                    from_public_key: parsedMessage.from,
                                    to_public_key: public_key,
                                    text: parsedMessage.text,
                                    sent_timestamp: parsedMessage.sent_timestamp
                                },
                              }
                        )
                        chat.latest_message_timestamp = (Date.now() / 1000).toString()
                        
                        setChats((chats)=> {
                            const newChats = {...chats}
                            newChats[parsedMessage.from] = chat
                            return newChats
                        })
                  } else {
                                           
                    setChats((chats)=> {
                        const newChats = {...chats}
                        newChats[parsedMessage.from] = {
                                participant_public_key: parsedMessage.from,
                                messages: [{
                                    sender_peer_id: e.payload[0],
                                    received_timestamp: (Date.now() / 1000).toString(),
                                    content: {
                                        from_public_key: parsedMessage.from,
                                        to_public_key: public_key,
                                        text: parsedMessage.text,
                                        sent_timestamp: parsedMessage.sent_timestamp
                                    },
                              }],
                                latest_message_timestamp: parsedMessage.sent_timestamp
                            }
                        return newChats
                    })
                    setSelectedChat(parsedMessage.from)
                  }
            } catch (error) {
                console.log(error)
            } 
        })
        return () => {
              unListen.then((f) => f())
        }
    },[chats])

  return (
        <ChatsContext.Provider
              value={{
                    chats,
                    peer_id,
                    public_key,
                    selected_chat,
                    setChats,
                    setSelectedChat,
                    sendMessage,
                    connect,
                    createChat,
                    setSelfPeerId
              }}
        >
              {children}
        </ChatsContext.Provider>
  )
}


async function encryptMessage(msg: MessageContentType){
    const formatedMessage = {
        from: msg.from_public_key,
        sent_timestamp: msg.sent_timestamp,
        text: msg.text,
    }
    const string_msg = JSON.stringify(formatedMessage)
    const buff_msg = Buffer.from(string_msg,'utf16le')
    let encrypted_buff = await ecc.encrypt(Buffer.from(msg.to_public_key,'hex'), buff_msg)
    let encrypted_string = stringfyEncryptedMessage(encrypted_buff)
    let p2pmessage: P2PMessageType = {
        to_public_key: msg.to_public_key,
        encrypted: encrypted_string,
    }

    return JSON.stringify(p2pmessage)
}


function stringfyEncryptedMessage(e: ecc.Ecies) {
    return JSON.stringify({
          iv: e.iv.toString("hex"),
          ephemPublicKey: e.ephemPublicKey.toString("hex"),
          ciphertext: e.ciphertext.toString("hex"),
          mac: e.mac.toString("hex"),
    })
}

function parseEncryptedMessage(ef: string) {
    const e = JSON.parse(ef)
    return {
          iv: Buffer.from(e.iv, "hex"),
          ephemPublicKey: Buffer.from(e.ephemPublicKey, "hex"),
          ciphertext: Buffer.from(e.ciphertext, "hex"),
          mac: Buffer.from(e.mac, "hex"),
    }
}
