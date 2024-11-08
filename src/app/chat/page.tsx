'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Paperclip, MessageSquare, Send } from 'lucide-react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { ScrollArea } from "~/components/ui/scroll-area"

type Message = {
  id: number
  text: string
  sender: 'user' | 'ai'
}

export default function TechServiceChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isManualInput, setIsManualInput] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const chatName = "Hydraulic Pump Maintenance Assistant"

  useEffect(() => {
    setMessages([
      { id: 1, text: "Hello! I'm your Hydraulic Pump Maintenance Assistant. How can I help you today?", sender: 'ai' }
    ])
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage: Message = { id: messages.length + 1, text: inputText, sender: 'user' }
      setMessages(prev => [...prev, newMessage])
      setInputText('')
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse: Message = { 
          id: messages.length + 2, 
          text: "I've received your message. How else can I assist you with the hydraulic pump maintenance?", 
          sender: 'ai' 
        }
        setMessages(prev => [...prev, aiResponse])
      }, 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Here you would typically start/stop actual audio recording
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // Here you would typically mute/unmute the microphone
  }

  const handleAttachment = () => {
    // Implement file attachment logic here
    console.log('File attachment clicked')
  }

  const toggleManualInput = () => {
    setIsManualInput(!isManualInput)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Top Panel */}
      <div className="bg-gray-800 p-4 text-center">
        <h1 className="text-xl font-bold">{chatName}</h1>
      </div>

      {/* Chat Messages Area */}
      <ScrollArea className="flex-grow p-4 overflow-y-auto" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`p-3 rounded-lg max-w-[80%] ${
                message.sender === 'user' 
                  ? 'bg-blue-600 ml-auto' 
                  : 'bg-gray-700'
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom Panel */}
      <div className="bg-gray-800 p-4 flex items-center gap-2">
        {/* Recording Animation */}
        <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />

        {/* Control Buttons */}
        <Button variant="ghost" size="icon" onClick={toggleMute}>
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>

        <Button variant="ghost" size="icon" onClick={handleAttachment}>
          <Paperclip className="h-6 w-6" />
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleManualInput}>
          <MessageSquare className="h-6 w-6" />
        </Button>

        {/* Manual Input Area */}
        {isManualInput && (
          <div className="flex-grow flex items-center gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-grow bg-gray-700 text-white"
            />
            <Button onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Record Button */}
        {!isManualInput && (
          <Button 
            variant={isRecording ? "destructive" : "default"}
            onClick={toggleRecording}
            className="ml-auto"
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
        )}
      </div>
    </div>
  )
}