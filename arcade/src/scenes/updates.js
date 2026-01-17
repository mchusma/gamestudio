// Makers data
const makers = [
  { name: "Holden", color: [100, 180, 255] },
  { name: "Maker 2", color: [255, 150, 100] },
  { name: "Maker 3", color: [150, 255, 100] },
  { name: "Maker 4", color: [255, 100, 200] },
  { name: "Maker 5", color: [255, 220, 100] }
]

// Updates data (reverse chronological - newest first)
const updates = [
  {
    date: "2026-01-16",
    title: "Season 1 Begins",
    description: "Welcome to the arcade!"
  }
]

export function registerUpdates(k) {
  k.scene("updates", () => {
    // Back button
    const backBtn = k.add([
      k.text("< Back", { size: 18 }),
      k.pos(40, 30),
      k.color(150, 150, 150),
      k.area(),
      "backBtn"
    ])

    backBtn.onClick(() => k.go("dashboard"))

    k.onButtonPress("back", () => k.go("dashboard"))

    // Title
    k.add([
      k.text("UPDATES", { size: 42 }),
      k.pos(k.width() / 2, 60),
      k.anchor("center"),
      k.color(255, 255, 255)
    ])

    // Makers section
    k.add([
      k.text("The Makers", { size: 24 }),
      k.pos(k.width() / 2, 120),
      k.anchor("center"),
      k.color(200, 200, 200)
    ])

    // Maker cards
    const cardSize = 80
    const cardSpacing = 30
    const totalMakersWidth = makers.length * cardSize + (makers.length - 1) * cardSpacing
    const makersStartX = (k.width() - totalMakersWidth) / 2 + cardSize / 2

    makers.forEach((maker, i) => {
      const x = makersStartX + i * (cardSize + cardSpacing)
      const y = 190

      // Avatar box
      k.add([
        k.rect(cardSize, cardSize, { radius: 8 }),
        k.pos(x, y),
        k.anchor("center"),
        k.color(...maker.color),
        k.opacity(0.8)
      ])

      // Name
      k.add([
        k.text(maker.name, { size: 14 }),
        k.pos(x, y + cardSize / 2 + 16),
        k.anchor("center"),
        k.color(200, 200, 200)
      ])
    })

    // Updates section
    k.add([
      k.text("Latest Updates", { size: 24 }),
      k.pos(k.width() / 2, 290),
      k.anchor("center"),
      k.color(200, 200, 200)
    ])

    // Update entries
    const updateStartY = 340
    const updateSpacing = 80

    updates.forEach((update, i) => {
      const y = updateStartY + i * updateSpacing

      // Update card background
      k.add([
        k.rect(600, 60, { radius: 8 }),
        k.pos(k.width() / 2, y),
        k.anchor("center"),
        k.color(40, 40, 60),
        k.outline(2, k.rgb(60, 60, 80))
      ])

      // Date
      k.add([
        k.text(update.date, { size: 12 }),
        k.pos(k.width() / 2 - 270, y - 12),
        k.color(120, 120, 140)
      ])

      // Title
      k.add([
        k.text(update.title, { size: 18 }),
        k.pos(k.width() / 2 - 270, y + 8),
        k.color(255, 255, 255)
      ])

      // Description (if present)
      if (update.description) {
        k.add([
          k.text(update.description, { size: 14 }),
          k.pos(k.width() / 2 + 50, y),
          k.anchor("left"),
          k.color(150, 150, 150)
        ])
      }
    })

    // Controls hint
    k.add([
      k.text("ESC: Back to Dashboard", { size: 14 }),
      k.pos(k.width() / 2, k.height() - 30),
      k.anchor("center"),
      k.color(100, 100, 100)
    ])
  })
}
