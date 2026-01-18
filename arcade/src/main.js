import kaplay from "kaplay"

// Initialize Kaplay
const k = kaplay({
  width: 800,
  height: 600,
  background: [26, 26, 46],
  canvas: document.createElement("canvas"),
  global: false,
  crisp: true,
  pixelDensity: window.devicePixelRatio || 1,
  buttons: {
    left: { keyboard: ["left", "a"] },
    right: { keyboard: ["right", "d"] },
    up: { keyboard: ["up", "w"] },
    down: { keyboard: ["down", "s"] },
    action: { keyboard: ["space", "enter"] },
    back: { keyboard: ["escape"] },
  }
})

document.body.appendChild(k.canvas)

// Ensure canvas has focus for keyboard input
k.canvas.tabIndex = 0
k.canvas.focus()
k.canvas.addEventListener("click", () => k.canvas.focus())

// Game registry
const games = [
  {
    id: "coin-collector",
    name: "Coin Collector",
    description: "Collect coins to score points!",
    color: [255, 200, 0]
  },
  {
    id: "whack-a-mole",
    name: "Whack-a-Mole",
    description: "Whack the moles before they hide!",
    color: [139, 90, 43]
  },
  {
    id: "road-puncher",
    name: "Road Puncher",
    description: "Classic 2D fighting action!",
    color: [200, 50, 50]
  }
]

// Dashboard scene
k.scene("dashboard", () => {
  let selectedIndex = 0

  // Updates link (top-right)
  const updatesLink = k.add([
    k.text("Updates >", { size: 16 }),
    k.pos(k.width() - 70, 30),
    k.anchor("center"),
    k.color(120, 120, 140),
    k.area()
  ])
  updatesLink.onClick(() => k.go("updates"))
  updatesLink.onHover(() => {
    updatesLink.color = k.rgb(180, 180, 200)
    k.canvas.style.cursor = "pointer"
  })
  updatesLink.onHoverEnd(() => {
    updatesLink.color = k.rgb(120, 120, 140)
    k.canvas.style.cursor = "default"
  })

  // Title
  k.add([
    k.text("ARCADE", { size: 52, letterSpacing: 4 }),
    k.pos(k.width() / 2, 75),
    k.anchor("center"),
    k.color(255, 255, 255)
  ])

  k.add([
    k.text("Select a game", { size: 18 }),
    k.pos(k.width() / 2, 125),
    k.anchor("center"),
    k.color(100, 100, 120)
  ])

  // Game cards layout
  const cardWidth = 200
  const cardHeight = 280
  const cardSpacing = 40
  const totalWidth = games.length * cardWidth + (games.length - 1) * cardSpacing
  const startX = (k.width() - totalWidth) / 2 + cardWidth / 2

  // Selection indicator (drawn first, so it's behind cards)
  const selector = k.add([
    k.rect(cardWidth + 10, cardHeight + 10, { radius: 14 }),
    k.pos(startX, 320),
    k.anchor("center"),
    k.color(26, 26, 46),
    k.outline(4, k.rgb(255, 220, 0)),
    "selector"
  ])

  // Game cards (drawn after selector, so they're on top)
  const cards = games.map((game, i) => {
    const x = startX + i * (cardWidth + cardSpacing)
    const y = 320

    // Card background
    const card = k.add([
      k.rect(cardWidth, cardHeight, { radius: 12 }),
      k.pos(x, y),
      k.anchor("center"),
      k.color(40, 42, 58),
      k.outline(2, k.rgb(55, 58, 75)),
      k.area(),
      "card",
      { gameId: game.id, index: i }
    ])

    // Game color accent (thumbnail placeholder)
    k.add([
      k.rect(cardWidth - 24, 90, { radius: 6 }),
      k.pos(x, y - 65),
      k.anchor("center"),
      k.color(...game.color)
    ])

    // Game name
    k.add([
      k.text(game.name, { size: 20, width: cardWidth - 24 }),
      k.pos(x, y + 40),
      k.anchor("center"),
      k.color(255, 255, 255)
    ])

    // Description
    k.add([
      k.text(game.description, { size: 13, width: cardWidth - 30 }),
      k.pos(x, y + 90),
      k.anchor("center"),
      k.color(130, 130, 145)
    ])

    // Click to select and play
    card.onClick(() => {
      selectedIndex = i
      updateSelection()
      k.go(game.id)
    })

    // Hover effect
    card.onHover(() => {
      k.canvas.style.cursor = "pointer"
    })
    card.onHoverEnd(() => {
      k.canvas.style.cursor = "default"
    })

    return card
  })

  function updateSelection() {
    const x = startX + selectedIndex * (cardWidth + cardSpacing)
    selector.pos.x = x
  }

  updateSelection()

  // Input handling
  k.onButtonPress("left", () => {
    selectedIndex = (selectedIndex - 1 + games.length) % games.length
    updateSelection()
  })

  k.onButtonPress("right", () => {
    selectedIndex = (selectedIndex + 1) % games.length
    updateSelection()
  })

  k.onButtonPress("action", () => {
    const game = games[selectedIndex]
    k.go(game.id)
  })

  // Controls hint
  k.add([
    k.text("← → Navigate  •  Space / Click to Play", { size: 14 }),
    k.pos(k.width() / 2, k.height() - 35),
    k.anchor("center"),
    k.color(80, 80, 100)
  ])

  // Subtle selector animation
  let time = 0
  k.onUpdate(() => {
    time += k.dt()
    const pulse = 1 + Math.sin(time * 3) * 0.02
    selector.scale = k.vec2(pulse, pulse)
  })
})

// Import and register game scenes
import { registerCoinCollector } from "./games/coinCollector.js"
import { registerWhackAMole } from "./games/whackAMole.js"
import { registerRoadPuncher } from "./games/roadPuncher.js"
import { registerUpdates } from "./scenes/updates.js"

registerCoinCollector(k)
registerWhackAMole(k)
registerRoadPuncher(k)
registerUpdates(k)

// Start at dashboard
k.go("dashboard")
