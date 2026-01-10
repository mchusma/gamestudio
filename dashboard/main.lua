-- Game Arcade Dashboard
local json = require("json")

local games = {}
local selected = 1
local cols = 4
local cellWidth = 180
local cellHeight = 200
local padding = 20
local startX = 60
local startY = 100

-- Get the arcade root directory
local function getArcadeDir()
    local sourceDir = love.filesystem.getSourceBaseDirectory()
    -- sourceDir is arcade/dashboard, strip off "dashboard" to get arcade root
    return sourceDir:gsub("/dashboard$", "") .. "/"
end

-- Scan directory using io.popen (works outside Love sandbox)
local function scanGamesFolder()
    local arcadeDir = getArcadeDir()
    local gamesDir = arcadeDir .. "games"

    local handle = io.popen('ls -1 "' .. gamesDir .. '" 2>/dev/null')
    if not handle then return end

    for folder in handle:lines() do
        local gamePath = gamesDir .. "/" .. folder
        local mainFile = io.open(gamePath .. "/main.lua", "r")

        if mainFile then
            mainFile:close()

            local game = {
                id = folder,
                name = folder,
                description = "",
                icon = nil,
                path = gamePath
            }

            -- Try to load game.json
            local jsonFile = io.open(gamePath .. "/game.json", "r")
            if jsonFile then
                local content = jsonFile:read("*all")
                jsonFile:close()
                local data = json.decode(content)
                if data then
                    game.name = data.name or folder
                    game.description = data.description or ""
                end
            end

            -- Try to load icon
            local iconPath = gamePath .. "/icon.png"
            local iconFile = io.open(iconPath, "rb")
            if iconFile then
                local iconData = iconFile:read("*all")
                iconFile:close()
                local fileData = love.filesystem.newFileData(iconData, "icon.png")
                local imageData = love.image.newImageData(fileData)
                game.icon = love.graphics.newImage(imageData)
            end

            table.insert(games, game)
        end
    end
    handle:close()

    -- Sort games alphabetically
    table.sort(games, function(a, b) return a.name < b.name end)
end

function love.load()
    love.window.setTitle("Game Arcade")
    love.window.setMode(800, 600)
    scanGamesFolder()
end

function love.update(dt)
end

function love.draw()
    -- Background
    love.graphics.setBackgroundColor(0.12, 0.12, 0.18)

    -- Title
    love.graphics.setColor(1, 1, 1)
    love.graphics.setFont(love.graphics.newFont(32))
    love.graphics.print("Game Arcade", startX, 30)

    love.graphics.setFont(love.graphics.newFont(14))
    love.graphics.setColor(0.6, 0.6, 0.6)
    love.graphics.print("Arrow keys to navigate, Enter to play, Escape to quit", startX, 70)

    -- Draw game grid
    for i, game in ipairs(games) do
        local col = (i - 1) % cols
        local row = math.floor((i - 1) / cols)
        local x = startX + col * (cellWidth + padding)
        local y = startY + row * (cellHeight + padding)

        -- Selection highlight
        if i == selected then
            love.graphics.setColor(0.3, 0.5, 0.9, 0.9)
            love.graphics.rectangle("fill", x - 5, y - 5, cellWidth + 10, cellHeight + 10, 10)
        end

        -- Card background
        love.graphics.setColor(0.22, 0.22, 0.28)
        love.graphics.rectangle("fill", x, y, cellWidth, cellHeight, 8)

        -- Icon or placeholder
        if game.icon then
            love.graphics.setColor(1, 1, 1)
            local scale = 100 / math.max(game.icon:getWidth(), game.icon:getHeight())
            local iconX = x + (cellWidth - game.icon:getWidth() * scale) / 2
            love.graphics.draw(game.icon, iconX, y + 15, 0, scale, scale)
        else
            -- Placeholder icon
            love.graphics.setColor(0.35, 0.35, 0.45)
            love.graphics.rectangle("fill", x + 40, y + 15, 100, 100, 8)
            love.graphics.setColor(0.5, 0.5, 0.6)
            love.graphics.setFont(love.graphics.newFont(48))
            love.graphics.printf("?", x + 40, y + 38, 100, "center")
        end

        -- Game name
        love.graphics.setColor(1, 1, 1)
        love.graphics.setFont(love.graphics.newFont(14))
        local name = game.name
        if #name > 18 then
            name = string.sub(name, 1, 16) .. ".."
        end
        love.graphics.printf(name, x, y + 125, cellWidth, "center")

        -- Description
        love.graphics.setColor(0.55, 0.55, 0.6)
        love.graphics.setFont(love.graphics.newFont(11))
        local desc = game.description
        if #desc > 40 then
            desc = string.sub(desc, 1, 38) .. ".."
        end
        love.graphics.printf(desc, x + 5, y + 150, cellWidth - 10, "center")
    end

    -- No games message
    if #games == 0 then
        love.graphics.setColor(0.6, 0.6, 0.65)
        love.graphics.setFont(love.graphics.newFont(18))
        love.graphics.printf("No games found in games/ folder", 0, 300, 800, "center")
    end
end

function love.keypressed(key)
    if key == "escape" then
        love.filesystem.write("selection.txt", "")
        love.event.quit()
    elseif key == "return" or key == "space" then
        if games[selected] then
            love.filesystem.write("selection.txt", games[selected].id)
            love.event.quit()
        end
    elseif key == "left" then
        selected = math.max(1, selected - 1)
    elseif key == "right" then
        selected = math.min(#games, selected + 1)
    elseif key == "up" then
        selected = math.max(1, selected - cols)
    elseif key == "down" then
        selected = math.min(#games, selected + cols)
    end
end

-- Gamepad support
function love.gamepadpressed(joystick, button)
    if button == "a" then
        love.keypressed("return")
    elseif button == "b" or button == "back" then
        love.keypressed("escape")
    elseif button == "dpleft" then
        love.keypressed("left")
    elseif button == "dpright" then
        love.keypressed("right")
    elseif button == "dpup" then
        love.keypressed("up")
    elseif button == "dpdown" then
        love.keypressed("down")
    end
end
