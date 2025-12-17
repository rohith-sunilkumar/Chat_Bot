import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { initializeSocket, disconnectSocket, getSocket } from '../utils/socket'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token')
      const newSocket = initializeSocket(token)
      setSocket(newSocket)

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id)
      })

      newSocket.on('userOnline', ({ userId }) => {
        setOnlineUsers((prev) => new Set([...prev, userId]))
      })

      newSocket.on('userOffline', ({ userId }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev)
          updated.delete(userId)
          return updated
        })
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
      })

      return () => {
        disconnectSocket()
        setSocket(null)
      }
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}
