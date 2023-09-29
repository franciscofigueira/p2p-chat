import { MessageType } from "@/contexts/ChatsContext"
import styles from "./message.module.css"

interface Props {
    message: MessageType
    isUserMessage: boolean
}

export default function Message({message, isUserMessage}: Props) {
      const date = new Date(Number(message.received_timestamp) * 1000)
      let hours = date.getHours()
      let minutes
      if (date.getMinutes() < 10) {
            minutes = "0" + date.getMinutes()
      } else {
            minutes = date.getMinutes()
      }
      let formattedTime = hours + ":" + minutes

      let container = isUserMessage ? styles.userMessageContainer : styles.otherMessageContainer
      let userDisplay = isUserMessage ? (
            <></>
      ) : (
            <div className={styles.senderContainer}>
                  <p className={styles.sender}>{message.content.from_public_key.slice(0, 10)} </p>
            </div>
      )
      return (
            <>
                  <div className={container}>
                        {userDisplay}
                        <div className={styles.contentContainer}>
                              <div className={styles.content}>{message.content?.text}</div>
                        </div>
                        <div className={styles.timeContainer}>
                              <p className={styles.timestamp}>{formattedTime}</p>
                        </div>
                  </div>
            </>
      )
}