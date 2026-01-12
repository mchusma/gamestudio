-- Whack-a-Mole: Simple template game
-- Character moves between 4 holes and whacks moles

local WINDOW_WIDTH = 800
local WINDOW_HEIGHT = 600

-- Hole positions (4 holes evenly spaced)
local HOLE_COUNT = 4
local HOLE_Y = 400
local HOLE_WIDTH = 100
local HOLE_HEIGHT = 80

local holes = {}
local player = {
    position = 1,  -- Current hole position (1-4)
    isWhacking = false,
    whackTimer = 0,
    score = 0
}

local moles = {}  -- Active moles
local moleSpawnTimer = 0
local MOLE_SPAWN_INTERVAL = 1.5  -- Seconds between mole spawns
local MOLE_VISIBLE_TIME = 1.2    -- How long a mole stays up

function love.load()
    love.window.setTitle("Whack-a-Mole")
    love.window.setMode(WINDOW_WIDTH, WINDOW_HEIGHT)

    -- Calculate hole positions (evenly spaced)
    local spacing = WINDOW_WIDTH / (HOLE_COUNT + 1)
    for i = 1, HOLE_COUNT do
        holes[i] = {
            x = spacing * i,
            y = HOLE_Y
        }
    end
end

function love.update(dt)
    -- Update whack animation timer
    if player.isWhacking then
        player.whackTimer = player.whackTimer - dt
        if player.whackTimer <= 0 then
            player.isWhacking = false
        end
    end

    -- Spawn moles randomly
    moleSpawnTimer = moleSpawnTimer + dt
    if moleSpawnTimer >= MOLE_SPAWN_INTERVAL then
        moleSpawnTimer = 0
        spawnMole()
    end

    -- Update moles (countdown their visible time)
    for i = #moles, 1, -1 do
        local mole = moles[i]
        mole.timer = mole.timer - dt
        if mole.timer <= 0 then
            table.remove(moles, i)
        end
    end
end

function spawnMole()
    -- Pick a random hole that doesn't already have a mole
    local availableHoles = {}
    for i = 1, HOLE_COUNT do
        local hasMole = false
        for _, mole in ipairs(moles) do
            if mole.hole == i then
                hasMole = true
                break
            end
        end
        if not hasMole then
            table.insert(availableHoles, i)
        end
    end

    if #availableHoles > 0 then
        local holeIndex = availableHoles[math.random(#availableHoles)]
        table.insert(moles, {
            hole = holeIndex,
            timer = MOLE_VISIBLE_TIME
        })
    end
end

function whackMole()
    player.isWhacking = true
    player.whackTimer = 0.2  -- Whack animation duration

    -- Check if there's a mole at current position
    for i = #moles, 1, -1 do
        if moles[i].hole == player.position then
            table.remove(moles, i)
            player.score = player.score + 1
            break
        end
    end
end

function love.keypressed(key)
    if key == "escape" then
        love.event.quit()
    end

    -- Move left/right between holes
    if key == "left" or key == "a" then
        player.position = math.max(1, player.position - 1)
    elseif key == "right" or key == "d" then
        player.position = math.min(HOLE_COUNT, player.position + 1)
    end

    -- Whack with space
    if key == "space" and not player.isWhacking then
        whackMole()
    end
end

function love.draw()
    -- Background
    love.graphics.setBackgroundColor(0.2, 0.5, 0.2)  -- Green grass

    -- Draw ground
    love.graphics.setColor(0.4, 0.3, 0.2)  -- Brown dirt
    love.graphics.rectangle("fill", 0, HOLE_Y + 20, WINDOW_WIDTH, WINDOW_HEIGHT - HOLE_Y - 20)

    -- Draw holes
    for i, hole in ipairs(holes) do
        -- Hole (dark ellipse)
        love.graphics.setColor(0.15, 0.1, 0.05)
        love.graphics.ellipse("fill", hole.x, hole.y + 30, HOLE_WIDTH / 2, 25)

        -- Check if there's a mole in this hole
        for _, mole in ipairs(moles) do
            if mole.hole == i then
                -- Draw mole (simple brown circle for now)
                love.graphics.setColor(0.6, 0.4, 0.2)
                love.graphics.circle("fill", hole.x, hole.y - 10, 35)

                -- Mole eyes
                love.graphics.setColor(0, 0, 0)
                love.graphics.circle("fill", hole.x - 12, hole.y - 18, 6)
                love.graphics.circle("fill", hole.x + 12, hole.y - 18, 6)

                -- Mole nose
                love.graphics.setColor(1, 0.5, 0.5)
                love.graphics.circle("fill", hole.x, hole.y - 5, 8)
            end
        end
    end

    -- Draw player character
    local playerHole = holes[player.position]
    local playerY = 280

    -- Player body (simple rectangle for now)
    love.graphics.setColor(0.3, 0.3, 0.8)  -- Blue
    love.graphics.rectangle("fill", playerHole.x - 25, playerY, 50, 80)

    -- Player head
    love.graphics.setColor(1, 0.8, 0.6)  -- Skin tone
    love.graphics.circle("fill", playerHole.x, playerY - 20, 25)

    -- Player eyes
    love.graphics.setColor(0, 0, 0)
    love.graphics.circle("fill", playerHole.x - 8, playerY - 25, 4)
    love.graphics.circle("fill", playerHole.x + 8, playerY - 25, 4)

    -- Hammer/mallet
    local hammerOffsetY = 0
    if player.isWhacking then
        hammerOffsetY = 60  -- Hammer swings down when whacking
    end

    -- Hammer handle
    love.graphics.setColor(0.6, 0.4, 0.2)
    love.graphics.rectangle("fill", playerHole.x + 20, playerY - 10 + hammerOffsetY, 10, 50)

    -- Hammer head
    love.graphics.setColor(0.5, 0.5, 0.5)
    love.graphics.rectangle("fill", playerHole.x + 10, playerY + 35 + hammerOffsetY, 30, 25)

    -- UI
    love.graphics.setColor(1, 1, 1)
    love.graphics.setFont(love.graphics.newFont(24))
    love.graphics.print("Score: " .. player.score, 20, 20)

    love.graphics.setFont(love.graphics.newFont(16))
    love.graphics.print("Left/Right: Move    Space: Whack!", 20, 55)
    love.graphics.print("ESC: Quit", 20, 75)

    -- Position indicator
    love.graphics.setColor(1, 1, 0, 0.5)
    love.graphics.circle("line", playerHole.x, HOLE_Y + 30, 55)
end
