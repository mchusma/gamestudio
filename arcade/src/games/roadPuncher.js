// Road Puncher - Kaplay port (simplified)

export function registerRoadPuncher(k) {
  const GROUND_Y = 480
  const GRAVITY = 1800

  // Character definitions
  const characters = [
    {
      id: "brawler",
      name: "Brawler",
      color: [200, 50, 50],
      width: 60,
      height: 120,
      speed: 300,
      jumpForce: 700,
      health: 100,
      attacks: {
        punch: { damage: 8, range: 70, duration: 0.25, knockback: 100 },
        kick: { damage: 12, range: 90, duration: 0.35, knockback: 150 },
        special: { damage: 25, range: 150, duration: 0.5, knockback: 350, name: "Power Surge" }
      },
      description: "Balanced fighter"
    },
    {
      id: "speedster",
      name: "Speedster",
      color: [50, 150, 230],
      width: 50,
      height: 110,
      speed: 420,
      jumpForce: 750,
      health: 85,
      attacks: {
        punch: { damage: 6, range: 60, duration: 0.18, knockback: 80 },
        kick: { damage: 10, range: 80, duration: 0.25, knockback: 120 },
        special: { damage: 20, range: 200, duration: 0.4, knockback: 300, name: "Lightning Dash" }
      },
      description: "Fast but fragile"
    },
    {
      id: "tank",
      name: "Tank",
      color: [75, 175, 75],
      width: 80,
      height: 130,
      speed: 200,
      jumpForce: 600,
      health: 130,
      attacks: {
        punch: { damage: 12, range: 80, duration: 0.4, knockback: 150 },
        kick: { damage: 18, range: 100, duration: 0.5, knockback: 200 },
        special: { damage: 40, range: 120, duration: 0.7, knockback: 500, name: "Ground Slam" }
      },
      description: "Slow but powerful"
    },
    {
      id: "ninja",
      name: "Ninja",
      color: [130, 50, 150],
      width: 45,
      height: 105,
      speed: 380,
      jumpForce: 800,
      health: 75,
      attacks: {
        punch: { damage: 7, range: 65, duration: 0.2, knockback: 90 },
        kick: { damage: 11, range: 85, duration: 0.28, knockback: 130 },
        special: { damage: 30, range: 250, duration: 0.35, knockback: 280, name: "Shadow Strike" }
      },
      description: "Fragile but deadly"
    }
  ]

  // Game state
  let selectedCharacter = 0
  let player = null
  let opponent = null

  // Menu scene
  k.scene("road-puncher", () => {
    k.add([
      k.text("ROAD PUNCHER", { size: 48 }),
      k.pos(k.width() / 2, 100),
      k.anchor("center"),
      k.color(255, 75, 75)
    ])

    k.add([
      k.text("A Classic Fighting Game", { size: 20 }),
      k.pos(k.width() / 2, 150),
      k.anchor("center"),
      k.color(180, 180, 180)
    ])

    const options = ["VS CPU", "Back to Arcade"]
    let menuIndex = 0

    const menuItems = options.map((opt, i) => {
      return k.add([
        k.text(opt, { size: 28 }),
        k.pos(k.width() / 2, 280 + i * 60),
        k.anchor("center"),
        k.color(i === menuIndex ? [255, 255, 100] : [200, 200, 200]),
        { index: i }
      ])
    })

    function updateMenu() {
      menuItems.forEach((item, i) => {
        item.color = i === menuIndex ? k.rgb(255, 255, 100) : k.rgb(200, 200, 200)
        item.text = i === menuIndex ? `> ${options[i]} <` : options[i]
      })
    }
    updateMenu()

    k.onButtonPress("up", () => {
      menuIndex = (menuIndex - 1 + options.length) % options.length
      updateMenu()
    })

    k.onButtonPress("down", () => {
      menuIndex = (menuIndex + 1) % options.length
      updateMenu()
    })

    k.onButtonPress("action", () => {
      if (menuIndex === 0) {
        k.go("road-puncher-select")
      } else {
        k.go("dashboard")
      }
    })

    k.onButtonPress("back", () => {
      k.go("dashboard")
    })

    k.add([
      k.text("Up/Down: Navigate | Space: Select | ESC: Back", { size: 14 }),
      k.pos(k.width() / 2, k.height() - 30),
      k.anchor("center"),
      k.color(100, 100, 100)
    ])
  })

  // Character select scene
  k.scene("road-puncher-select", () => {
    k.add([
      k.text("SELECT YOUR FIGHTER", { size: 36 }),
      k.pos(k.width() / 2, 50),
      k.anchor("center"),
      k.color(255, 255, 255)
    ])

    const cardWidth = 150
    const cardHeight = 180
    const totalWidth = characters.length * cardWidth + (characters.length - 1) * 20
    const startX = (k.width() - totalWidth) / 2 + cardWidth / 2

    const cards = characters.map((char, i) => {
      const x = startX + i * (cardWidth + 20)
      const y = 200

      // Card bg
      k.add([
        k.rect(cardWidth, cardHeight, { radius: 8 }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(50, 50, 70)
      ])

      // Character preview
      k.add([
        k.rect(char.width * 0.8, char.height * 0.8, { radius: 6 }),
        k.pos(x, y - 20),
        k.anchor("center"),
        k.color(...char.color)
      ])

      // Name
      k.add([
        k.text(char.name, { size: 16 }),
        k.pos(x, y + 60),
        k.anchor("center"),
        k.color(255, 255, 255)
      ])

      return { x, y }
    })

    // Selector
    const selector = k.add([
      k.rect(cardWidth + 8, cardHeight + 8, { radius: 10 }),
      k.pos(cards[selectedCharacter].x, cards[selectedCharacter].y),
      k.anchor("center"),
      k.outline(4, k.rgb(255, 220, 0)),
      k.opacity(0.3),
      k.color(255, 220, 0)
    ])

    // Description
    const descText = k.add([
      k.text(characters[selectedCharacter].description, { size: 18 }),
      k.pos(k.width() / 2, 340),
      k.anchor("center"),
      k.color(180, 180, 180)
    ])

    // Stats
    const statsText = k.add([
      k.text(`HP: ${characters[selectedCharacter].health} | Speed: ${characters[selectedCharacter].speed}`, { size: 14 }),
      k.pos(k.width() / 2, 370),
      k.anchor("center"),
      k.color(150, 150, 150)
    ])

    // Special
    const specialText = k.add([
      k.text(`Special: ${characters[selectedCharacter].attacks.special.name}`, { size: 16 }),
      k.pos(k.width() / 2, 400),
      k.anchor("center"),
      k.color(255, 200, 50)
    ])

    function updateSelection() {
      selector.pos.x = cards[selectedCharacter].x
      descText.text = characters[selectedCharacter].description
      statsText.text = `HP: ${characters[selectedCharacter].health} | Speed: ${characters[selectedCharacter].speed}`
      specialText.text = `Special: ${characters[selectedCharacter].attacks.special.name}`
    }

    k.onButtonPress("left", () => {
      selectedCharacter = (selectedCharacter - 1 + characters.length) % characters.length
      updateSelection()
    })

    k.onButtonPress("right", () => {
      selectedCharacter = (selectedCharacter + 1) % characters.length
      updateSelection()
    })

    k.onButtonPress("action", () => {
      k.go("road-puncher-fight")
    })

    k.onButtonPress("back", () => {
      k.go("road-puncher")
    })

    k.add([
      k.text("Left/Right: Choose | Space: Fight! | ESC: Back", { size: 14 }),
      k.pos(k.width() / 2, k.height() - 30),
      k.anchor("center"),
      k.color(100, 100, 100)
    ])
  })

  // Fight scene
  k.scene("road-puncher-fight", () => {
    const playerChar = characters[selectedCharacter]
    // Pick random opponent (different from player)
    let opponentIndex = Math.floor(Math.random() * characters.length)
    while (opponentIndex === selectedCharacter && characters.length > 1) {
      opponentIndex = Math.floor(Math.random() * characters.length)
    }
    const opponentChar = characters[opponentIndex]

    // Background
    k.add([
      k.rect(k.width(), GROUND_Y),
      k.pos(0, 0),
      k.color(80, 60, 100) // Sky
    ])
    k.add([
      k.rect(k.width(), k.height() - GROUND_Y),
      k.pos(0, GROUND_Y),
      k.color(100, 75, 50) // Ground
    ])

    // Fighter state
    const createFighter = (char, startX, isPlayer) => {
      const fighter = {
        char,
        x: startX,
        y: GROUND_Y,
        vx: 0,
        vy: 0,
        health: char.health,
        maxHealth: char.health,
        facingRight: isPlayer,
        isGrounded: true,
        isAttacking: false,
        attackTimer: 0,
        currentAttack: null,
        hitStun: 0,
        isBlocking: false,
        specialCooldown: 0,
        isPlayer
      }
      return fighter
    }

    player = createFighter(playerChar, 200, true)
    opponent = createFighter(opponentChar, 600, false)

    // Health bars
    const p1HealthBg = k.add([
      k.rect(300, 30, { radius: 4 }),
      k.pos(20, 15),
      k.color(50, 50, 50),
      k.fixed()
    ])
    const p1HealthBar = k.add([
      k.rect(300, 30, { radius: 4 }),
      k.pos(20, 15),
      k.color(50, 200, 50),
      k.fixed(),
      "p1health"
    ])
    k.add([
      k.text(playerChar.name, { size: 14 }),
      k.pos(25, 48),
      k.color(...playerChar.color),
      k.fixed()
    ])

    const p2HealthBg = k.add([
      k.rect(300, 30, { radius: 4 }),
      k.pos(k.width() - 320, 15),
      k.color(50, 50, 50),
      k.fixed()
    ])
    const p2HealthBar = k.add([
      k.rect(300, 30, { radius: 4 }),
      k.pos(k.width() - 320, 15),
      k.color(50, 200, 50),
      k.fixed(),
      "p2health"
    ])
    k.add([
      k.text(opponentChar.name, { size: 14 }),
      k.pos(k.width() - 25, 48),
      k.anchor("topright"),
      k.color(...opponentChar.color),
      k.fixed()
    ])

    // Fighter visuals
    const p1Body = k.add([
      k.rect(playerChar.width, playerChar.height, { radius: 8 }),
      k.pos(player.x, player.y),
      k.anchor("bot"),
      k.color(...playerChar.color),
      "p1body"
    ])

    const p2Body = k.add([
      k.rect(opponentChar.width, opponentChar.height, { radius: 8 }),
      k.pos(opponent.x, opponent.y),
      k.anchor("bot"),
      k.color(...opponentChar.color),
      "p2body"
    ])

    // Attack effect
    let attackEffect = null

    function updateHealthBars() {
      const p1Pct = Math.max(0, player.health / player.maxHealth)
      const p2Pct = Math.max(0, opponent.health / opponent.maxHealth)

      p1HealthBar.width = 300 * p1Pct
      p1HealthBar.color = p1Pct < 0.3 ? k.rgb(220, 50, 50) : p1Pct < 0.5 ? k.rgb(220, 180, 50) : k.rgb(50, 200, 50)

      p2HealthBar.width = 300 * p2Pct
      p2HealthBar.pos.x = k.width() - 320 + 300 * (1 - p2Pct)
      p2HealthBar.color = p2Pct < 0.3 ? k.rgb(220, 50, 50) : p2Pct < 0.5 ? k.rgb(220, 180, 50) : k.rgb(50, 200, 50)
    }

    function startAttack(fighter, attackName) {
      if (fighter.isAttacking || fighter.hitStun > 0) return
      if (attackName === "special" && fighter.specialCooldown > 0) return

      const attack = fighter.char.attacks[attackName]
      if (!attack) return

      fighter.isAttacking = true
      fighter.currentAttack = attack
      fighter.attackTimer = attack.duration

      if (attackName === "special") {
        fighter.specialCooldown = 3
      }

      // Show attack effect
      if (attackEffect) k.destroy(attackEffect)
      const effectX = fighter.facingRight ? fighter.x + fighter.char.width / 2 : fighter.x - fighter.char.width / 2 - attack.range
      attackEffect = k.add([
        k.rect(attack.range, fighter.char.height * 0.4, { radius: 4 }),
        k.pos(effectX, fighter.y - fighter.char.height * 0.6),
        k.color(255, 150, 50),
        k.opacity(0.7),
        "attack-effect"
      ])
    }

    function checkHit(attacker, defender) {
      if (!attacker.isAttacking || !attacker.currentAttack) return false

      const attack = attacker.currentAttack
      const dist = Math.abs(attacker.x - defender.x)

      if (dist < attack.range + defender.char.width / 2) {
        // Check if defender is blocking
        if (defender.isBlocking) {
          defender.health -= attack.damage * 0.1 // Chip damage
          defender.vx = (defender.x > attacker.x ? 1 : -1) * attack.knockback * 0.3
          return false
        }

        defender.health -= attack.damage
        defender.hitStun = 0.3
        defender.vx = (defender.x > attacker.x ? 1 : -1) * attack.knockback
        defender.vy = -150
        defender.isGrounded = false
        return true
      }
      return false
    }

    function updateFighter(fighter, other) {
      // Cooldowns
      if (fighter.specialCooldown > 0) fighter.specialCooldown -= k.dt()
      if (fighter.hitStun > 0) fighter.hitStun -= k.dt()

      // Attack timer
      if (fighter.isAttacking) {
        fighter.attackTimer -= k.dt()
        if (fighter.attackTimer <= 0) {
          fighter.isAttacking = false
          fighter.currentAttack = null
          if (attackEffect) {
            k.destroy(attackEffect)
            attackEffect = null
          }
        }
      }

      // Gravity
      if (!fighter.isGrounded) {
        fighter.vy += GRAVITY * k.dt()
      }

      // Apply velocity
      fighter.x += fighter.vx * k.dt()
      fighter.y += fighter.vy * k.dt()

      // Ground collision
      if (fighter.y >= GROUND_Y) {
        fighter.y = GROUND_Y
        fighter.vy = 0
        fighter.isGrounded = true
      }

      // Friction
      fighter.vx *= fighter.isGrounded ? 0.85 : 0.98

      // Screen bounds
      fighter.x = k.clamp(fighter.x, fighter.char.width / 2 + 20, k.width() - fighter.char.width / 2 - 20)

      // Face opponent
      if (!fighter.isAttacking && fighter.hitStun <= 0) {
        fighter.facingRight = fighter.x < other.x
      }
    }

    // Simple AI
    let aiTimer = 0
    function updateAI() {
      aiTimer -= k.dt()
      if (aiTimer > 0) return

      aiTimer = 0.2 + Math.random() * 0.3

      const dist = Math.abs(opponent.x - player.x)

      if (opponent.hitStun > 0) return

      // Block sometimes when player attacks
      if (player.isAttacking && dist < 150 && Math.random() < 0.5) {
        opponent.isBlocking = true
        return
      }

      opponent.isBlocking = false

      // Attack if close
      if (dist < 100) {
        const r = Math.random()
        if (r < 0.4) startAttack(opponent, "punch")
        else if (r < 0.7) startAttack(opponent, "kick")
        else if (r < 0.85 && opponent.specialCooldown <= 0) startAttack(opponent, "special")
      } else if (dist < 250) {
        // Approach
        if (Math.random() < 0.6) {
          opponent.vx = (player.x > opponent.x ? 1 : -1) * opponent.char.speed * 0.7
        } else if (opponent.specialCooldown <= 0 && Math.random() < 0.3) {
          startAttack(opponent, "special")
        }
      } else {
        // Far - approach
        opponent.vx = (player.x > opponent.x ? 1 : -1) * opponent.char.speed * 0.7
        if (Math.random() < 0.3 && opponent.isGrounded) {
          opponent.vy = -opponent.char.jumpForce
          opponent.isGrounded = false
        }
      }
    }

    // Game over state
    let gameOver = false
    let winner = null

    // Main update
    k.onUpdate(() => {
      if (gameOver) return

      // Player input
      if (player.hitStun <= 0 && !player.isAttacking) {
        const holdingBack = (player.facingRight && k.isButtonDown("left")) ||
                          (!player.facingRight && k.isButtonDown("right"))
        const holdingDown = k.isButtonDown("down")

        if (holdingBack || holdingDown) {
          player.isBlocking = true
        } else {
          player.isBlocking = false

          if (k.isButtonDown("left")) player.vx = -playerChar.speed
          else if (k.isButtonDown("right")) player.vx = playerChar.speed

          if (k.isButtonDown("up") && player.isGrounded) {
            player.vy = -playerChar.jumpForce
            player.isGrounded = false
          }
        }
      }

      // Update fighters
      updateFighter(player, opponent)
      updateFighter(opponent, player)

      // AI
      updateAI()

      // Check hits (only once per attack)
      if (player.isAttacking && player.attackTimer > player.currentAttack.duration * 0.5) {
        checkHit(player, opponent)
      }
      if (opponent.isAttacking && opponent.attackTimer > opponent.currentAttack.duration * 0.5) {
        checkHit(opponent, player)
      }

      // Update visuals
      p1Body.pos.x = player.x
      p1Body.pos.y = player.y
      p1Body.color = player.hitStun > 0 ? k.rgb(255, 255, 255) :
                     player.isBlocking ? k.rgb(...playerChar.color.map(c => c * 0.6)) :
                     k.rgb(...playerChar.color)

      p2Body.pos.x = opponent.x
      p2Body.pos.y = opponent.y
      p2Body.color = opponent.hitStun > 0 ? k.rgb(255, 255, 255) :
                     opponent.isBlocking ? k.rgb(...opponentChar.color.map(c => c * 0.6)) :
                     k.rgb(...opponentChar.color)

      updateHealthBars()

      // Check win condition
      if (player.health <= 0) {
        gameOver = true
        winner = "opponent"
      } else if (opponent.health <= 0) {
        gameOver = true
        winner = "player"
      }

      if (gameOver) {
        k.add([
          k.rect(k.width(), k.height()),
          k.pos(0, 0),
          k.color(0, 0, 0),
          k.opacity(0.7),
          k.fixed()
        ])

        k.add([
          k.text(winner === "player" ? "YOU WIN!" : "YOU LOSE!", { size: 48 }),
          k.pos(k.width() / 2, k.height() / 2 - 50),
          k.anchor("center"),
          k.color(winner === "player" ? [255, 220, 50] : [200, 50, 50]),
          k.fixed()
        ])

        k.add([
          k.text("Press Space to continue", { size: 20 }),
          k.pos(k.width() / 2, k.height() / 2 + 30),
          k.anchor("center"),
          k.color(180, 180, 180),
          k.fixed()
        ])
      }
    })

    // Attack inputs
    k.onKeyPress("j", () => {
      if (!gameOver) startAttack(player, "punch")
    })

    k.onKeyPress("k", () => {
      if (!gameOver) startAttack(player, "kick")
    })

    k.onKeyPress("l", () => {
      if (!gameOver) startAttack(player, "special")
    })

    k.onButtonPress("action", () => {
      if (gameOver) {
        k.go("road-puncher")
      }
    })

    k.onButtonPress("back", () => {
      k.go("road-puncher")
    })

    // Controls hint
    k.add([
      k.text("Arrows: Move/Block | J: Punch | K: Kick | L: Special | ESC: Menu", { size: 12 }),
      k.pos(k.width() / 2, k.height() - 15),
      k.anchor("center"),
      k.color(100, 100, 100),
      k.fixed()
    ])
  })
}
