-- Simple Love2D Game: Collect the Coins

local player = {
    x = 400,
    y = 300,
    size = 20,
    speed = 200,
    score = 0
}

local coins = {}
local coinSize = 15

function love.load()
    love.window.setTitle("Coin Collector")
    love.window.setMode(800, 600)

    -- Spawn initial coins
    for i = 1, 5 do
        spawnCoin()
    end
end

function spawnCoin()
    local coin = {
        x = math.random(50, 750),
        y = math.random(50, 550)
    }
    table.insert(coins, coin)
end

function love.update(dt)
    -- Player movement
    if love.keyboard.isDown("left") or love.keyboard.isDown("a") then
        player.x = player.x - player.speed * dt
    end
    if love.keyboard.isDown("right") or love.keyboard.isDown("d") then
        player.x = player.x + player.speed * dt
    end
    if love.keyboard.isDown("up") or love.keyboard.isDown("w") then
        player.y = player.y - player.speed * dt
    end
    if love.keyboard.isDown("down") or love.keyboard.isDown("s") then
        player.y = player.y + player.speed * dt
    end

    -- Keep player on screen
    player.x = math.max(player.size, math.min(800 - player.size, player.x))
    player.y = math.max(player.size, math.min(600 - player.size, player.y))

    -- Check coin collection
    for i = #coins, 1, -1 do
        local coin = coins[i]
        local dist = math.sqrt((player.x - coin.x)^2 + (player.y - coin.y)^2)
        if dist < player.size + coinSize then
            table.remove(coins, i)
            player.score = player.score + 1
            spawnCoin()
        end
    end
end

function love.draw()
    -- Draw background
    love.graphics.setBackgroundColor(0.1, 0.1, 0.2)

    -- Draw coins
    love.graphics.setColor(1, 0.8, 0)
    for _, coin in ipairs(coins) do
        love.graphics.circle("fill", coin.x, coin.y, coinSize)
    end

    -- Draw player
    love.graphics.setColor(0.2, 0.6, 1)
    love.graphics.circle("fill", player.x, player.y, player.size)

    -- Draw score
    love.graphics.setColor(1, 1, 1)
    love.graphics.print("Score: " .. player.score, 10, 10)
    love.graphics.print("Use arrow keys or WASD to move", 10, 30)
end

function love.keypressed(key)
    if key == "escape" then
        love.event.quit()
    end
end
