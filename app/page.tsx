"use client"

import styles from './page.module.css'
import {useState} from "react";
import Chat from '@/components/Chat/Chat'
import ChatsList from '@/components/ChatsList/ChatsList';
import User from '@/components/User/Usert';
import CreateChat from '@/components/CreateChat/CreateChat';

export default function Home() {
  const [display, setDisplay] = useState<boolean>(false)

      const close = () => {
        setDisplay(false)
      }

  return (
    <>
    <div className={styles.container}>

    <ChatsList/>
      <Chat/>
      <User/>
    <button onClick={
                  () => {
                    setDisplay(true)
                  }
            }>Connect to Peer
            </button>
            < CreateChat close={close} show={display}/>
      </div>
    </>
  )
}
