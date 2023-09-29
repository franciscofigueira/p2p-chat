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
    < CreateChat close={close} show={display}/>
      <div className={styles.rightSide}>
        <User/>
        <ChatsList/>
        <div className={styles.buttonContainer}>
          <button className={styles.peerButton} onClick={() => {setDisplay(true)}}>
            Start Chat \ Connect to Peer 
          </button>
        </div> 
      </div>
      <div className={styles.leftSide}>
        <Chat/>
      </div>

    </div>
    </>
  )
}
