import kaplay from "kaplay"

// Initialize Kaplay
const k = kaplay({
  width: 800,
  height: 600,
  background: [26, 26, 46],
  canvas: document.createElement("canvas"),
  global: false,
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
    k.pos(k.width() - 80, 30),
    k.anchor("center"),
    k.color(150, 150, 150),
    k.area()
  ])
  updatesLink.onClick(() => k.go("updates"))

  // Title
  k.add([
    k.text("ARCADE", { size: 48 }),
    k.pos(k.width() / 2, 80),
    k.anchor("center"),
    k.color(255, 255, 255)
  ])

  k.add([
    k.text("Select a game", { size: 20 }),
    k.pos(k.width() / 2, 130),
    k.anchor("center"),
    k.color(150, 150, 150)
  ])

  // Game cards
  const cardWidth = 200
  const cardHeight = 280
  const cardSpacing = 40
  const totalWidth = games.length * cardWidth + (games.length - 1) * cardSpacing
  const startX = (k.width() - totalWidth) / 2 + cardWidth / 2

  const cards = games.map((game, i) => {
    const x = startX + i * (cardWidth + cardSpacing)
    const y = 320

    // Card background
    const card = k.add([
      k.rect(cardWidth, cardHeight, { radius: 12 }),
      k.pos(x, y),
      k.anchor("center"),
      k.color(40, 40, 60),
      k.outline(3, k.rgb(60, 60, 80)),
      "card",
      { gameId: game.id, index: i }
    ])

    // Game color accent
    k.add([
      k.rect(cardWidth - 20, 80, { radius: 8 }),
      k.pos(x, y - 70),
      k.anchor("center"),
      k.color(...game.color),
      k.opacity(0.8)
    ])

    // Game name
    k.add([
      k.text(game.name, { size: 18, width: cardWidth - 20 }),
      k.pos(x, y + 30),
      k.anchor("center"),
      k.color(255, 255, 255)
    ])

    // Description
    k.add([
      k.text(game.description, { size: 12, width: cardWidth - 30 }),
      k.pos(x, y + 80),
      k.anchor("center"),
      k.color(150, 150, 150)
    ])

    return card
  })

  // Selection indicator
  const selector = k.add([
    k.rect(cardWidth + 10, cardHeight + 10, { radius: 14 }),
    k.pos(startX, 320),
    k.anchor("center"),
    k.outline(4, k.rgb(255, 220, 0)),
    k.opacity(0),
    "selector"
  ])

  function updateSelection() {
    const x = startX + selectedIndex * (cardWidth + cardSpacing)
    selector.pos.x = x
    selector.opacity = 1
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
    k.text("Arrow Keys: Navigate | Space: Select", { size: 14 }),
    k.pos(k.width() / 2, k.height() - 30),
    k.anchor("center"),
    k.color(100, 100, 100)
  ])
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
