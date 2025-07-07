import React, { useState, useEffect, useRef } from 'react'
import bridge from '@vkontakte/vk-bridge'

function App() {
  const [count, setCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isPlaying, setIsPlaying] = useState(false)
  const [records, setRecords] = useState(() => {
    // Получить рекорды из localStorage по сегодняшней дате
    const today = new Date().toISOString().slice(0,10)
    const saved = localStorage.getItem('records_' + today)
    return saved ? JSON.parse(saved) : []
  })
  const [vkUser, setVkUser] = useState(null)

  const timerId = useRef(null)

  useEffect(() => {
    bridge.send('VKWebAppGetUserInfo').then(data => {
      setVkUser(data)
    })
  }, [])

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerId.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false)
      saveRecord()
    }
    return () => clearTimeout(timerId.current)
  }, [isPlaying, timeLeft])

  // Запрет клавиш Enter и Space
  useEffect(() => {
    const handler = e => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Сохраняет рекорд в localStorage и обновляет список
  function saveRecord() {
    if (!vkUser) return
    const today = new Date().toISOString().slice(0,10)
    const newRecord = { id: vkUser.id, name: vkUser.first_name, score: count }
    const updatedRecords = [...records, newRecord]
      .sort((a,b) => b.score - a.score)
      .slice(0, 5)
    localStorage.setItem('records_' + today, JSON.stringify(updatedRecords))
    setRecords(updatedRecords)
  }

  function startGame() {
    setCount(0)
    setTimeLeft(60)
    setIsPlaying(true)
  }

  // Увеличение счётчика только при клике мышью/тачпадом
  function handleClick(e) {
    if (!isPlaying) return
    if (e.pointerType === 'mouse' || e.pointerType === 'touch') {
      setCount(count + 1)
    }
  }

  // Репост рекорда (требует запуска в VK Mini Apps)
  function repost() {
    if (!vkUser) return
    bridge.send('VKWebAppShowWallPostBox', {
      message: `Мой рекорд в Superclick — ${count} кликов за 60 секунд! Попробуй побить!`,
      attachments: '',
    }).catch(console.error)
  }

  return (
    <div style={{maxWidth: 360, margin: '20px auto', fontFamily: 'Arial, sans-serif', textAlign: 'center'}}>
      <h1>Superclick</h1>
      {vkUser && <p>Привет, {vkUser.first_name}!</p>}
      <div>
        <button
          onPointerDown={handleClick}
          disabled={!isPlaying}
          style={{
            width: 200,
            height: 200,
            fontSize: 32,
            borderRadius: 100,
            cursor: isPlaying ? 'pointer' : 'not-allowed',
            userSelect: 'none'
          }}
        >
          {count}
        </button>
      </div>
      <div style={{marginTop: 20}}>
        {isPlaying ? (
          <p>Время: {timeLeft} сек</p>
        ) : (
          <button onClick={startGame} style={{padding: '10px 20px', fontSize: 18}}>
            Начать игру
          </button>
        )}
      </div>
      <h3>Рекорды за сегодня</h3>
      <ol style={{textAlign: 'left', maxWidth: 300, margin: '0 auto'}}>
        {records.map((r, i) => (
          <li key={i}>{r.name}: {r.score}</li>
        ))}
      </ol>
      <button onClick={repost} disabled={isPlaying || count === 0} style={{marginTop: 20}}>
        Репостнуть рекорд
      </button>
    </div>
  )
}

export default App