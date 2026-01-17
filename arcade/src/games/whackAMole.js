// Whack-a-Mole - Kaplay port

export function registerWhackAMole(k) {
  k.scene("whack-a-mole", () => {
    const HOLE_COUNT = 4
    const HOLE_Y = 400
    const HOLE_WIDTH = 100
    const MOLE_SPAWN_INTERVAL = 1.5
    const MOLE_VISIBLE_TIME = 1.2

    let score = 0
    let playerPosition = 0
    let isWhacking = false
    let whackTimer = 0
    const moles = [] // { holeIndex, timer, obj }

    // Background - grass
    k.add([
      k.rect(k.width(), HOLE_Y + 20),
      k.pos(0, 0),
      k.color(50, 130, 50)
    ])

    // Ground - dirt
    k.add([
      k.rect(k.width(), k.height() - HOLE_Y - 20),
      k.pos(0, HOLE_Y + 20),
      k.color(100, 75, 50)
    ])

    // Score display
    const scoreText = k.add([
      k.text("Score: 0", { size: 24 }),
      k.pos(20, 20),
      k.color(255, 255, 255),
      k.fixed()
    ])

    // Instructions
    k.add([
      k.text("Left/Right: Move | Space: Whack | ESC: Back", { size: 14 }),
      k.pos(20, 55),
      k.color(200, 200, 200),
      k.fixed()
    ])

    // Calculate hole positions
    const spacing = k.width() / (HOLE_COUNT + 1)
    const holes = []
    for (let i = 0; i < HOLE_COUNT; i++) {
      const x = spacing * (i + 1)
      holes.push({ x, y: HOLE_Y })

      // Draw hole (dark ellipse)
      k.add([
        k.ellipse(HOLE_WIDTH / 2, 25),
        k.pos(x, HOLE_Y + 30),
        k.anchor("center"),
        k.color(38, 25, 12)
      ])
    }

    // Player character
    function createPlayer() {
      const hole = holes[playerPosition]

      // Body
      const body = k.add([
        k.rect(50, 80, { radius: 4 }),
        k.pos(hole.x, 280),
        k.anchor("center"),
        k.color(75, 75, 200),
        "player-body"
      ])

      // Head
      const head = k.add([
        k.circle(25),
        k.pos(hole.x, 240),
        k.anchor("center"),
        k.color(255, 200, 150),
        "player-head"
      ])

      // Eyes
      k.add([
        k.circle(4),
        k.pos(hole.x - 8, 235),
        k.anchor("center"),
        k.color(0, 0, 0),
        "player-eye"
      ])
      k.add([
        k.circle(4),
        k.pos(hole.x + 8, 235),
        k.anchor("center"),
        k.color(0, 0, 0),
        "player-eye"
      ])

      return { body, head }
    }

    // Hammer
    let hammerObj = null
    function createHammer(offsetY = 0) {
      const hole = holes[playerPosition]

      // Handle
      const handle = k.add([
        k.rect(10, 50, { radius: 2 }),
        k.pos(hole.x + 30, 250 + offsetY),
        k.anchor("center"),
        k.color(150, 100, 50),
        "hammer"
      ])

      // Head
      const hammerHead = k.add([
        k.rect(30, 25, { radius: 4 }),
        k.pos(hole.x + 30, 290 + offsetY),
        k.anchor("center"),
        k.color(128, 128, 128),
        "hammer"
      ])

      return { handle, hammerHead }
    }

    let playerParts = createPlayer()
    hammerObj = createHammer()

    // Selection indicator
    const selector = k.add([
      k.circle(55),
      k.pos(holes[0].x, HOLE_Y + 30),
      k.anchor("center"),
      k.color(255, 255, 0),
      k.opacity(0.3),
      k.outline(2, k.rgb(255, 255, 0))
    ])

    function updatePlayerPosition() {
      // Remove old player parts
      k.get("player-body").forEach(k.destroy)
      k.get("player-head").forEach(k.destroy)
      k.get("player-eye").forEach(k.destroy)
      k.get("hammer").forEach(k.destroy)

      playerParts = createPlayer()
      hammerObj = createHammer(isWhacking ? 60 : 0)
      selector.pos.x = holes[playerPosition].x
    }

    // Spawn mole
    function spawnMole() {
      // Find available holes
      const occupiedHoles = moles.map(m => m.holeIndex)
      const availableHoles = []
      for (let i = 0; i < HOLE_COUNT; i++) {
        if (!occupiedHoles.includes(i)) {
          availableHoles.push(i)
        }
      }

      if (availableHoles.length === 0) return

      const holeIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)]
      const hole = holes[holeIndex]

      // Mole body
      const body = k.add([
        k.circle(35),
        k.pos(hole.x, hole.y - 10),
        k.anchor("center"),
        k.color(150, 100, 50),
        "mole"
      ])

      // Mole eyes
      const eye1 = k.add([
        k.circle(6),
        k.pos(hole.x - 12, hole.y - 18),
        k.anchor("center"),
        k.color(0, 0, 0),
        "mole"
      ])

      const eye2 = k.add([
        k.circle(6),
        k.pos(hole.x + 12, hole.y - 18),
        k.anchor("center"),
        k.color(0, 0, 0),
        "mole"
      ])

      // Mole nose
      const nose = k.add([
        k.circle(8),
        k.pos(hole.x, hole.y - 5),
        k.anchor("center"),
        k.color(255, 128, 128),
        "mole"
      ])

      moles.push({
        holeIndex,
        timer: MOLE_VISIBLE_TIME,
        parts: [body, eye1, eye2, nose]
      })
    }

    // Whack action
    function whack() {
      if (isWhacking) return

      isWhacking = true
      whackTimer = 0.2
      updatePlayerPosition()

      // Check if there's a mole at current position
      for (let i = moles.length - 1; i >= 0; i--) {
        if (moles[i].holeIndex === playerPosition) {
          // Hit the mole!
          moles[i].parts.forEach(k.destroy)
          moles.splice(i, 1)
          score++
          scoreText.text = `Score: ${score}`
          break
        }
      }
    }

    // Mole spawn timer
    let spawnTimer = 0

    // Game loop
    k.onUpdate(() => {
      // Update whack animation
      if (isWhacking) {
        whackTimer -= k.dt()
        if (whackTimer <= 0) {
          isWhacking = false
          updatePlayerPosition()
        }
      }

      // Spawn moles
      spawnTimer += k.dt()
      if (spawnTimer >= MOLE_SPAWN_INTERVAL) {
        spawnTimer = 0
        spawnMole()
      }

      // Update mole timers
      for (let i = moles.length - 1; i >= 0; i--) {
        moles[i].timer -= k.dt()
        if (moles[i].timer <= 0) {
          moles[i].parts.forEach(k.destroy)
          moles.splice(i, 1)
        }
      }
    })

    // Input
    k.onButtonPress("left", () => {
      if (playerPosition > 0) {
        playerPosition--
        updatePlayerPosition()
      }
    })

    k.onButtonPress("right", () => {
      if (playerPosition < HOLE_COUNT - 1) {
        playerPosition++
        updatePlayerPosition()
      }
    })

    k.onButtonPress("action", () => {
      whack()
    })

    k.onButtonPress("back", () => {
      k.go("dashboard")
    })
  })
}
