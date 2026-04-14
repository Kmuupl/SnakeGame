import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Trophy, Play } from 'lucide-react';

import './App.css';

const SnakeGame = () => {
  const GRID_SIZE = 20;
  const CANVAS_SIZE = 400;
  const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
  const GAME_SPEED = 100;

  const directionRef = useRef([1, 0]);
  const [gameState, setGameState] = useState('registration');
  const [playerName, setPlayerName] = useState('');
  const [snake, setSnake] = useState([[10, 10]]);
  const [food, setFood] = useState([15, 15]);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playSound = (soundName) => {
    if (!soundEnabled) return;

    try {
      const audio = new Audio(`/sounds/${soundName}.mp3`);
      audio.volume = 0.3;
      audio.play().catch(err => console.log('Error:', err));
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const loadLeaderboard = () => {
    fetch("https://snakegame-api-fefxc8b8bcguajd0.polandcentral-01.azurewebsites.net/api/scores")
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        return res.json();
      })
      .then(data => {
        const sorted = data.sort((a, b) => b.score - a.score);
        setLeaderboard(sorted);
      })
      .catch(err => console.log(err));
  };


  // Загрузка лидерборда при монтировании компонента
  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(loadLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  // Фиксируем body при игре
  useEffect(() => {
    if (gameState === 'playing') {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    };
  }, [gameState]);

  // Клавиатура
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState === 'registration') return;

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) return;
      e.preventDefault();

      const keyMap = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        w: [0, -1],
        a: [-1, 0],
        s: [0, 1],
        d: [1, 0],
      };

      const newDir = keyMap[e.key];
      if (newDir &&
        !(directionRef.current[0] === -newDir[0] &&
          directionRef.current[1] === -newDir[1])
      ) {
        directionRef.current = newDir;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Свайпы
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minDistance = 15;

    if (Math.abs(deltaX) > minDistance || Math.abs(deltaY) > minDistance) {
      let newDir;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newDir = deltaX > 0 ? [1, 0] : [-1, 0];
      } else {
        newDir = deltaY > 0 ? [0, 1] : [0, -1];
      }

      if (!(directionRef.current[0] === -newDir[0] && directionRef.current[1] === -newDir[1])) {
        directionRef.current = newDir;
      }
    }
  };

  // GAME LOOP - ПРАВИЛЬНО В USEFFECT!
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = [...prevSnake[0]];

        head[0] += directionRef.current[0];
        head[1] += directionRef.current[1];

        // wall collision
        if (
          head[0] < 0 || head[0] >= GRID_SIZE ||
          head[1] < 0 || head[1] >= GRID_SIZE
        ) {
          playSound('gameover');
          setGameState('gameOver');
          return prevSnake;
        }

        // self collision
        if (prevSnake.some(seg => seg[0] === head[0] && seg[1] === head[1])) {
          playSound('gameover');
          setGameState('gameOver');
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // eat food
        if (head[0] === food[0] && head[1] === food[1]) {
          setScore(s => s + 10);
          playSound('eat');

          let newFood;
          do {
            newFood = [
              Math.floor(Math.random() * GRID_SIZE),
              Math.floor(Math.random() * GRID_SIZE),
            ];
          } while (
            newSnake.some(
              seg => seg[0] === newFood[0] && seg[1] === newFood[1]
            )
          );

          setFood(newFood);
          return newSnake;
        }

        return newSnake.slice(0, -1);
      });
    }, GAME_SPEED);

    return () => clearInterval(interval);
  }, [gameState, food]);

  // Рисование Canvas
  useEffect(() => {

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.fillStyle = '#efd7fe';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = '#d4b5e0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    ctx.fillStyle = '#a71255';
    ctx.beginPath();
    ctx.arc(food[0] * CELL_SIZE + CELL_SIZE / 2, food[1] * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#406832' : '#69a1b3';
      ctx.fillRect(segment[0] * CELL_SIZE + 1, segment[1] * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    });
  }, [snake, food]);

  const startGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name!');
      return;
    }
    setGameState('playing');
    setSnake([[10, 10]]);
    setFood([15, 15]);
    directionRef.current = [1, 0];
    setScore(0);
  };

  const resetGame = async () => {
    if (playerName.trim() && score > 0) {
      try {
        await fetch("https://snakegame-api-fefxc8b8bcguajd0.polandcentral-01.azurewebsites.net/api/scores", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            playerName,
            score
          })
        });

        await loadLeaderboard(); // 👈 только так

      } catch (err) {
        console.log("Save score error:", err);
      }
    }

    setGameState('playing');
    setSnake([[10, 10]]);
    setFood([15, 15]);
    directionRef.current = [1, 0];
    setScore(0);
  };

  if (gameState === 'registration') {
    return (
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #efd7fe 0%, #cf9bd5 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
          maxWidth: '500px',
          width: '100%',
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '56px',
              fontWeight: '700',
              color: '#406832',
              margin: '0 0 10px 0',
              letterSpacing: '-1px',
            }}>
              Snake Game
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#69a1b3',
              margin: '0',
              fontWeight: '500',
            }}>
              Ready for a challenge?
            </p>
          </div>

          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && startGame()}
            placeholder="Enter your name..."
            style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: '16px',
              border: 'none',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#406832',
              outline: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = '0 8px 25px rgba(167, 18, 85, 0.2)';
              e.target.style.backgroundColor = 'white';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            }}
          />

          <button
            onClick={startGame}
            style={{
              padding: '16px 48px',
              fontSize: '18px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: '#a71255',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 20px rgba(167, 18, 85, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 10px 30px rgba(167, 18, 85, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 6px 20px rgba(167, 18, 85, 0.3)';
            }}
          >
            START GAME
          </button>

          {leaderboard.length > 0 && (
            <div style={{
              width: '100%',
              marginTop: '20px',
              padding: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '12px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}>
                <Trophy size={20} style={{ color: '#a71255' }} />
                <h3 style={{
                  margin: '0',
                  color: '#406832',
                  fontSize: '16px',
                  fontWeight: '600',
                }}>
                  Leaderboard
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {leaderboard.slice(0, 5).map((entry, index) => (
                  <div key={entry.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(207, 155, 213, 0.3)',
                    fontSize: '14px',
                  }}>
                    <span style={{ color: '#69a1b3', fontWeight: '600' }}>
                      #{index + 1}
                    </span>

                    <span style={{ color: '#406832', flex: 1, marginLeft: '12px' }}>
                      {entry.playerName}
                    </span>

                    <span style={{ color: '#a71255', fontWeight: '700' }}>
                      {entry.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #efd7fe 0%, #cf9bd5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: gameState === 'gameOver' ? 'column' : 'row',
        gap: '30px',
        maxWidth: '900px',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          alignItems: 'center',
        }}>

          {gameState === 'playing' && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              maxWidth: '400px',
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#406832',
              }}>
                Score: <span style={{ color: '#a71255' }}>{score}</span>
              </div>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  padding: '8px 16px',
                  fontSize: '18px',
                  background: soundEnabled ? '#a71255' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
              >
                {soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF'}
              </button>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{
              border: '3px solid #406832',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
              touchAction: 'none',
            }}
          />

          {gameState === 'playing' && (
            <p style={{
              fontSize: '12px',
              color: '#69a1b3',
              textAlign: 'center',
              margin: '0',
            }}>
              Swipe to move • Arrow Keys / WASD on desktop
            </p>
          )}
        </div>

        {gameState === 'gameOver' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            padding: '40px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            textAlign: 'center',
            maxWidth: '400px',
            width: '100%',
          }}>
            <div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#a71255',
                margin: '0 0 12px 0',
              }}>
                Game Over!
              </h2>
              <p style={{
                fontSize: '48px',
                fontWeight: '800',
                color: '#406832',
                margin: '0 0 8px 0',
              }}>
                {score}
              </p>
              <p style={{
                fontSize: '16px',
                color: '#69a1b3',
                margin: '0',
              }}>
                {score > 200 ? '🔥 Excellent!' : score > 100 ? '👍 Nice play!' : '💪 Keep practicing!'}
              </p>
            </div>

            <button
              onClick={resetGame}
              style={{
                width: '100%',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: '#406832',
                border: 'none',
                borderRadius: '30px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(64, 104, 50, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 10px 30px rgba(64, 104, 50, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 6px 20px rgba(64, 104, 50, 0.3)';
              }}
            >
              <RotateCcw size={18} />
              Play Again
            </button>

            {leaderboard.length > 0 && (
              <div style={{
                width: '100%',
                marginTop: '16px',
                padding: '16px',
                backgroundColor: '#f5f0f9',
                borderRadius: '12px',
              }}>
                <h4 style={{
                  margin: '0 0 12px 0',
                  color: '#406832',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  justifyContent: 'center',
                }}>
                  <Trophy size={16} /> Top Scores
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div key={entry.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      backgroundColor: index === 0 ? 'rgba(167, 18, 85, 0.1)' : 'transparent',
                    }}>
                      <span style={{ color: '#69a1b3', fontWeight: '600', minWidth: '24px' }}>
                        #{index + 1}
                      </span>

                      <span style={{ color: '#406832', flex: 1, marginLeft: '8px' }}>
                        {entry.playerName}
                      </span>

                      <span style={{ color: '#a71255', fontWeight: '700' }}>
                        {entry.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SnakeGame;