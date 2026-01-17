// Coin Collector - Kaplay port

export function registerCoinCollector(k) {
  k.scene("coin-collector", () => {
    const PLAYER_SPEED = 200
    const PLAYER_SIZE = 20
    const COIN_SIZE = 15

    let score = 0

    // Score display
    const scoreText = k.add([
      k.text("Score: 0", { size: 24 }),
      k.pos(10, 10),
      k.color(255, 255, 255),
      k.fixed()
    ])

    // Instructions
    k.add([
      k.text("Arrow Keys: Move | ESC: Back", { size: 14 }),
      k.pos(10, 40),
      k.color(150, 150, 150),
      k.fixed()
    ])

    // Player
    const player = k.add([
      k.circle(PLAYER_SIZE),
      k.pos(k.width() / 2, k.height() / 2),
      k.anchor("center"),
      k.color(50, 150, 255),
      k.area(),
      "player"
    ])

    // Spawn a coin at random position
    function spawnCoin() {
      k.add([
        k.circle(COIN_SIZE),
        k.pos(
          k.rand(50, k.width() - 50),
          k.rand(80, k.height() - 50)
        ),
        k.anchor("center"),
        k.color(255, 200, 0),
        k.area(),
        "coin"
      ])
    }

    // Spawn initial coins
    for (let i = 0; i < 5; i++) {
      spawnCoin()
    }

    // Player movement
    k.onUpdate(() => {
      let dx = 0
      let dy = 0

      if (k.isButtonDown("left")) dx -= 1
      if (k.isButtonDown("right")) dx += 1
      if (k.isButtonDown("up")) dy -= 1
      if (k.isButtonDown("down")) dy += 1

      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        dx *= 0.707
        dy *= 0.707
      }

      player.pos.x += dx * PLAYER_SPEED * k.dt()
      player.pos.y += dy * PLAYER_SPEED * k.dt()

      // Keep player on screen
      player.pos.x = k.clamp(player.pos.x, PLAYER_SIZE, k.width() - PLAYER_SIZE)
      player.pos.y = k.clamp(player.pos.y, PLAYER_SIZE + 60, k.height() - PLAYER_SIZE)
    })

    // Coin collection
    player.onCollide("coin", (coin) => {
      k.destroy(coin)
      score++
      scoreText.text = `Score: ${score}`
      spawnCoin()
    })

    // Back to dashboard
    k.onButtonPress("back", () => {
      k.go("dashboard")
    })
  })
}
