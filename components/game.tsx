'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { motion, useAnimation } from "framer-motion"

const GRAVITY = 0.6
const JUMP_FORCE = 12
const MOVE_SPEED = 5
const AIR_CONTROL = 0.7

export function GameComponent() {
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 270 })
  const [playerVelocity, setPlayerVelocity] = useState({ x: 0, y: 0 })
  const [isJumping, setIsJumping] = useState(false)
  const [isWalking, setIsWalking] = useState(false)
  const [facingRight, setFacingRight] = useState(true)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [levelComplete, setLevelComplete] = useState(false)
  const [isInvincible, setIsInvincible] = useState(false)
  const playerControls = useAnimation()

  const [platforms] = useState([
    { x: 0, y: 350, width: 300, height: 50 },
    { x: 350, y: 250, width: 200, height: 50 },
    { x: 600, y: 300, width: 150, height: 50 },
    { x: 800, y: 200, width: 250, height: 50 },
    { x: 1100, y: 250, width: 200, height: 50 },
    { x: 1350, y: 300, width: 200, height: 50 },
  ])

  const [enemies, setEnemies] = useState([
    { x: 400, y: 230, width: 40, height: 40, direction: 1 },
    { x: 850, y: 180, width: 40, height: 40, direction: -1 },
    { x: 1200, y: 230, width: 40, height: 40, direction: 1 },
  ])

  const [coins, setCoins] = useState([
    { x: 200, y: 300, collected: false },
    { x: 500, y: 200, collected: false },
    { x: 750, y: 250, collected: false },
    { x: 1000, y: 150, collected: false },
    { x: 1300, y: 200, collected: false },
  ])

  const [powerUps, setPowerUps] = useState([
    { x: 600, y: 250, collected: false },
    { x: 1100, y: 200, collected: false },
  ])

  const movePlayer = useCallback((direction: 'left' | 'right') => {
    if (gameOver || levelComplete) return

    setPlayerPos(prev => {
      const speed = isJumping ? MOVE_SPEED * AIR_CONTROL : MOVE_SPEED
      return {
        ...prev,
        x: direction === 'left' ? Math.max(0, prev.x - speed) : Math.min(1540, prev.x + speed)
      }
    })
    setFacingRight(direction === 'right')
    setIsWalking(true)
  }, [isJumping, gameOver, levelComplete])

  const stopMoving = useCallback(() => {
    setIsWalking(false)
  }, [])

  const jump = useCallback(() => {
    if (gameOver || levelComplete) return

    if (!isJumping) {
      setPlayerVelocity(prev => ({ ...prev, y: -JUMP_FORCE }))
      setIsJumping(true)
    }
  }, [isJumping, gameOver, levelComplete])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') movePlayer('left')
      if (e.key === 'ArrowRight') movePlayer('right')
      if (e.key === 'ArrowUp' || e.key === ' ') jump()
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') stopMoving()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [movePlayer, jump, stopMoving])

  useEffect(() => {
    if (isInvincible) {
      const timer = setTimeout(() => setIsInvincible(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isInvincible])

  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (gameOver || levelComplete) return

      setPlayerPos(prev => {
        let newX = prev.x + playerVelocity.x
        let newY = prev.y + playerVelocity.y
        let onPlatform = false

        platforms.forEach(platform => {
          if (
            newX < platform.x + platform.width &&
            newX + 60 > platform.x &&
            newY + 80 > platform.y &&
            newY + 80 < platform.y + platform.height
          ) {
            newY = platform.y - 80
            onPlatform = true
          }
        })

        if (onPlatform) {
          setPlayerVelocity(prev => ({ ...prev, y: 0 }))
          setIsJumping(false)
        } else {
          setPlayerVelocity(prev => ({ ...prev, y: Math.min(prev.y + GRAVITY, 10) }))
        }

        // Coin collection
        setCoins(prevCoins => 
          prevCoins.map(coin => {
            if (!coin.collected &&
                Math.abs(newX - coin.x) < 40 &&
                Math.abs(newY - coin.y) < 40) {
              setScore(s => s + 10)
              return { ...coin, collected: true }
            }
            return coin
          })
        )

        // Power-up collection
        setPowerUps(prevPowerUps => 
          prevPowerUps.map(powerUp => {
            if (!powerUp.collected &&
                Math.abs(newX - powerUp.x) < 40 &&
                Math.abs(newY - powerUp.y) < 40) {
              setIsInvincible(true)
              return { ...powerUp, collected: true }
            }
            return powerUp
          })
        )

        // Check for game over
        if (!isInvincible) {
          enemies.forEach(enemy => {
            if (
              newX < enemy.x + enemy.width &&
              newX + 60 > enemy.x &&
              newY < enemy.y + enemy.height &&
              newY + 80 > enemy.y
            ) {
              setGameOver(true)
            }
          })
        }

        // Check for level complete
        if (newX >= 1500) {
          setLevelComplete(true)
        }

        return { x: Math.max(0, Math.min(1540, newX)), y: Math.min(320, Math.max(0, newY)) }
      })

      // Move enemies
      setEnemies(prevEnemies => 
        prevEnemies.map(enemy => {
          let newX = enemy.x + enemy.direction
          if (newX <= 0 || newX >= 1560) {
            return { ...enemy, x: newX, direction: -enemy.direction }
          }
          return { ...enemy, x: newX }
        })
      )
    }, 1000 / 60)

    return () => clearInterval(gameLoop)
  }, [platforms, playerVelocity, enemies, coins, powerUps, isInvincible, gameOver, levelComplete])

  useEffect(() => {
    playerControls.start({
      x: 50,
      y: playerPos.y,
      transition: { type: "spring", stiffness: 500, damping: 50 }
    })
  }, [playerPos.y, playerControls])

  return (
    <div className="relative w-[1600px] h-[400px] overflow-hidden">
      {/* Parallax Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-sky-100" style={{backgroundPosition: `${-playerPos.x * 0.1}px 0`}} />
      <div className="absolute inset-0" style={{backgroundImage: "url('/placeholder.svg?height=100&width=1600')", backgroundPosition: `${-playerPos.x * 0.3}px 0`}} />
      <div className="absolute inset-0" style={{backgroundImage: "url('/placeholder.svg?height=150&width=1600')", backgroundPosition: `${-playerPos.x * 0.5}px 0`}} />
      
      <div className="absolute inset-0" style={{transform: `translateX(-${playerPos.x}px)`}}>
        {/* Platforms */}
        {platforms.map((platform, index) => (
          <div
            key={index}
            className="absolute bg-gradient-to-b from-green-600 to-green-700 border-t-4 border-green-500"
            style={{
              left: platform.x,
              top: platform.y,
              width: platform.width,
              height: platform.height,
            }}
          />
        ))}

        {/* Enemies */}
        {enemies.map((enemy, index) => (
          <motion.div
            key={index}
            className="absolute"
            style={{
              left: enemy.x,
              top: enemy.y,
              width: enemy.width,
              height: enemy.height,
            }}
            animate={{ x: enemy.x }}
          >
            <div className="w-full h-full bg-red-500 rounded-full relative">
              <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-white rounded-full flex items-center justify-center">
                <div className="w-1/2 h-1/2 bg-black rounded-full"></div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Coins */}
        {coins.map((coin, index) => (
          !coin.collected && (
            <motion.div
              key={index}
              className="absolute w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-600"
              style={{ left: coin.x, top: coin.y }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
          )
        ))}

        {/* Power-ups */}
        {powerUps.map((powerUp, index) => (
          !powerUp.collected && (
            <motion.div
              key={index}
              className="absolute w-10 h-10 bg-purple-500 rounded-full border-2 border-purple-700"
              style={{ left: powerUp.x, top: powerUp.y }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )
        ))}

        {/* Player */}
        <motion.div
          className="absolute w-[60px] h-[80px] z-10"
          style={{ 
            left: 50,
            top: playerPos.y 
          }}
          animate={playerControls}
        >
          <div className={`w-full h-full relative ${facingRight ? '' : 'scale-x-[-1]'}`}>
            <div className="absolute bottom-0 w-full h-3/4 bg-blue-600 rounded-t-2xl"></div>
            <div className="absolute bottom-0 w-full h-1/2 bg-blue-700 rounded-t-xl"></div>
            <div className="absolute top-0 w-full h-1/3 bg-red-500 rounded-t-2xl"></div>
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/4 bg-skin-200 rounded-full flex items-center justify-around">
              <div className="w-1/3 h-1/2 bg-white rounded-full flex items-center justify-center">
                <div className="w-1/2 h-1/2 bg-black rounded-full"></div>
              </div>
            </div>
            <div className="absolute bottom-0 left-1/4 w-1/2 h-1/4 bg-brown-600 rounded"></div>
            {isWalking && !isJumping && (
              <motion.div
                className="absolute bottom-0 left-1/4 w-1/2 h-1/4"
                animate={{ rotate: [0, 30, 0, -30, 0] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              />
            )}
          </div>
          {isInvincible && (
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              style={{ backgroundColor: 'rgba(255, 255, 0, 0.3)' }}
            />
          )}
        </motion.div>

        {/* Goal */}
        <div className="absolute top-0 left-[1550px] w-8 h-[400px] bg-gradient-to-b from-yellow-400 to-yellow-600">
          <div className="absolute top-0 left-0 w-full h-16  bg-red-500"></div>
        </div>
      </div>

      {/* Clouds */}
      <motion.div 
        className="absolute top-5 left-10 w-20 h-10 bg-white rounded-full"
        animate={{ x: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
      />
      <motion.div 
        className="absolute top-20 right-20 w-32 h-16 bg-white rounded-full"
        animate={{ x: [0, -30, 0] }}
        transition={{ repeat: Infinity, duration: 6 }}
      />
      

      {/* Controls */}
      <div className="fixed bottom-4 left-4 space-x-2">
        <Button onMouseDown={() => movePlayer('left')} onMouseUp={stopMoving} onMouseLeave={stopMoving}>←</Button>
        <Button onMouseDown={jump}>↑</Button>
        <Button onMouseDown={() => movePlayer('right')} onMouseUp={stopMoving} onMouseLeave={stopMoving}>→</Button>
      </div>

      {/* Score */}
      <div className="fixed top-4 right-4 bg-white bg-opacity-50 px-4 py-2 rounded-full">
        Score: {score}
      </div>

      {/* Game Over / Level Complete */}
      {(gameOver || levelComplete) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">{gameOver ? 'Game Over' : 'Level Complete!'}</h2>
            <p className="mb-4">Your score: {score}</p>
            <Button onClick={() => window.location.reload()}>Play Again</Button>
          </div>
        </div>
      )}
    </div>
  )
}