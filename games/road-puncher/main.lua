-- Road Puncher - A Classic 2D Fighting Game
-- Placeholder graphics version - sprites and sounds to be added later

-- ============================================================================
-- GAME CONFIGURATION
-- ============================================================================

local SCREEN_WIDTH = 800
local SCREEN_HEIGHT = 600
local GROUND_Y = 480
local GRAVITY = 1800
local ROUND_TIME = 99

-- ============================================================================
-- GAME STATES
-- ============================================================================

local GameState = {
    MENU = "menu",
    CHARACTER_SELECT = "character_select",
    WORLD_SELECT = "world_select",
    FIGHT = "fight",
    ROUND_END = "round_end",
    VICTORY = "victory"
}

local currentState = GameState.MENU

-- ============================================================================
-- CHARACTER DEFINITIONS
-- ============================================================================

local characters = {
    {
        id = "brawler",
        name = "Brawler",
        color = {0.8, 0.2, 0.2},  -- Red
        width = 60,
        height = 120,
        speed = 300,
        jumpForce = 700,
        health = 100,
        -- Attack definitions
        attacks = {
            punch = { damage = 8, range = 70, startup = 0.05, active = 0.1, recovery = 0.15, knockback = 100 },
            kick = { damage = 10, range = 90, startup = 0.08, active = 0.12, recovery = 0.2, knockback = 150 },
            heavy_punch = { damage = 15, range = 80, startup = 0.15, active = 0.1, recovery = 0.3, knockback = 200 },
            heavy_kick = { damage = 18, range = 100, startup = 0.2, active = 0.15, recovery = 0.35, knockback = 250 },
            special = { damage = 25, range = 150, startup = 0.3, active = 0.2, recovery = 0.5, knockback = 350, name = "Power Surge" }
        },
        description = "Balanced fighter with solid fundamentals"
    },
    {
        id = "speedster",
        name = "Speedster",
        color = {0.2, 0.6, 0.9},  -- Blue
        width = 50,
        height = 110,
        speed = 420,
        jumpForce = 750,
        health = 85,
        attacks = {
            punch = { damage = 6, range = 60, startup = 0.03, active = 0.08, recovery = 0.1, knockback = 80 },
            kick = { damage = 8, range = 80, startup = 0.05, active = 0.1, recovery = 0.12, knockback = 120 },
            heavy_punch = { damage = 12, range = 70, startup = 0.1, active = 0.08, recovery = 0.2, knockback = 180 },
            heavy_kick = { damage = 14, range = 90, startup = 0.12, active = 0.1, recovery = 0.25, knockback = 200 },
            special = { damage = 20, range = 200, startup = 0.15, active = 0.3, recovery = 0.4, knockback = 300, name = "Lightning Dash" }
        },
        description = "Fast and agile but takes more damage"
    },
    {
        id = "tank",
        name = "Tank",
        color = {0.3, 0.7, 0.3},  -- Green
        width = 80,
        height = 130,
        speed = 200,
        jumpForce = 600,
        health = 130,
        attacks = {
            punch = { damage = 12, range = 80, startup = 0.1, active = 0.15, recovery = 0.25, knockback = 150 },
            kick = { damage = 14, range = 100, startup = 0.12, active = 0.18, recovery = 0.3, knockback = 200 },
            heavy_punch = { damage = 22, range = 90, startup = 0.25, active = 0.15, recovery = 0.4, knockback = 300 },
            heavy_kick = { damage = 25, range = 110, startup = 0.3, active = 0.2, recovery = 0.5, knockback = 350 },
            special = { damage = 40, range = 120, startup = 0.5, active = 0.25, recovery = 0.7, knockback = 500, name = "Ground Slam" }
        },
        description = "Slow but hits like a truck"
    },
    {
        id = "ninja",
        name = "Ninja",
        color = {0.5, 0.2, 0.6},  -- Purple
        width = 45,
        height = 105,
        speed = 380,
        jumpForce = 800,
        health = 75,
        attacks = {
            punch = { damage = 7, range = 65, startup = 0.04, active = 0.08, recovery = 0.1, knockback = 90 },
            kick = { damage = 9, range = 85, startup = 0.06, active = 0.1, recovery = 0.14, knockback = 130 },
            heavy_punch = { damage = 14, range = 75, startup = 0.12, active = 0.1, recovery = 0.22, knockback = 190 },
            heavy_kick = { damage = 16, range = 95, startup = 0.15, active = 0.12, recovery = 0.28, knockback = 220 },
            special = { damage = 30, range = 250, startup = 0.2, active = 0.15, recovery = 0.35, knockback = 280, name = "Shadow Strike" }
        },
        description = "Fragile but deadly with high jumps"
    }
}

-- ============================================================================
-- WORLD/STAGE DEFINITIONS
-- ============================================================================

local worlds = {
    {
        id = "dojo",
        name = "Ancient Dojo",
        groundColor = {0.4, 0.3, 0.2},
        skyColor = {0.9, 0.8, 0.7},
        accentColor = {0.6, 0.1, 0.1},
        hasColumns = true,
        description = "Traditional training grounds"
    },
    {
        id = "street",
        name = "Back Alley",
        groundColor = {0.3, 0.3, 0.35},
        skyColor = {0.15, 0.1, 0.2},
        accentColor = {0.8, 0.6, 0.2},
        hasLamps = true,
        description = "Fight in the urban shadows"
    },
    {
        id = "arena",
        name = "Grand Arena",
        groundColor = {0.5, 0.4, 0.3},
        skyColor = {0.3, 0.5, 0.8},
        accentColor = {0.9, 0.8, 0.3},
        hasCrowd = true,
        description = "The championship stage"
    },
    {
        id = "temple",
        name = "Sky Temple",
        groundColor = {0.7, 0.7, 0.8},
        skyColor = {0.4, 0.6, 0.9},
        accentColor = {0.9, 0.9, 1.0},
        hasClouds = true,
        description = "Battle among the clouds"
    }
}

-- ============================================================================
-- PLAYER/FIGHTER CLASS
-- ============================================================================

local Fighter = {}
Fighter.__index = Fighter

function Fighter:new(characterDef, playerNum, isAI)
    local self = setmetatable({}, Fighter)

    self.character = characterDef
    self.playerNum = playerNum
    self.isAI = isAI or false

    -- Position and physics
    self.x = playerNum == 1 and 200 or 600
    self.y = GROUND_Y
    self.vx = 0
    self.vy = 0
    self.facingRight = playerNum == 1

    -- Dimensions from character
    self.width = characterDef.width
    self.height = characterDef.height

    -- Stats from character
    self.maxHealth = characterDef.health
    self.health = characterDef.health
    self.speed = characterDef.speed
    self.jumpForce = characterDef.jumpForce

    -- State
    self.state = "idle"  -- idle, walking, jumping, attacking, hit, blocking, victory
    self.isGrounded = true
    self.isBlocking = false

    -- Attack state
    self.currentAttack = nil
    self.attackTimer = 0
    self.attackPhase = nil  -- startup, active, recovery
    self.hasHit = false
    self.comboCount = 0
    self.lastHitTime = 0

    -- Hit state
    self.hitStun = 0
    self.blockStun = 0

    -- Animation timers
    self.animTimer = 0
    self.victoryTimer = 0

    -- Special move cooldown
    self.specialCooldown = 0

    -- AI specific
    self.aiDecisionTimer = 0
    self.aiAction = nil

    return self
end

function Fighter:startAttack(attackName)
    if self.state == "attacking" or self.hitStun > 0 or self.blockStun > 0 then
        return false
    end

    if attackName == "special" and self.specialCooldown > 0 then
        return false
    end

    local attack = self.character.attacks[attackName]
    if not attack then return false end

    self.state = "attacking"
    self.currentAttack = attack
    self.attackTimer = 0
    self.attackPhase = "startup"
    self.hasHit = false

    if attackName == "special" then
        self.specialCooldown = 3.0  -- 3 second cooldown
    end

    return true
end

function Fighter:getHitbox()
    local attack = self.currentAttack
    if not attack or self.attackPhase ~= "active" then
        return nil
    end

    local hbX = self.facingRight and (self.x + self.width/2) or (self.x - self.width/2 - attack.range)
    local hbY = self.y - self.height * 0.6
    local hbW = attack.range
    local hbH = self.height * 0.4

    return { x = hbX, y = hbY, w = hbW, h = hbH }
end

function Fighter:getHurtbox()
    return {
        x = self.x - self.width/2,
        y = self.y - self.height,
        w = self.width,
        h = self.height
    }
end

function Fighter:takeHit(attack, attackerX)
    if self.isBlocking then
        self.blockStun = 0.3
        self.state = "blocking"
        -- Chip damage when blocking
        self.health = self.health - attack.damage * 0.1
        -- Push back when blocking
        local dir = self.x > attackerX and 1 or -1
        self.vx = dir * attack.knockback * 0.3
        return false  -- Hit was blocked
    end

    self.health = self.health - attack.damage
    self.hitStun = 0.4
    self.state = "hit"

    -- Knockback
    local dir = self.x > attackerX and 1 or -1
    self.vx = dir * attack.knockback
    self.vy = -200
    self.isGrounded = false

    return true  -- Hit connected
end

function Fighter:update(dt, opponent)
    -- Update cooldowns
    if self.specialCooldown > 0 then
        self.specialCooldown = self.specialCooldown - dt
    end

    -- Update stun states
    if self.hitStun > 0 then
        self.hitStun = self.hitStun - dt
        if self.hitStun <= 0 then
            self.state = "idle"
        end
    end

    if self.blockStun > 0 then
        self.blockStun = self.blockStun - dt
        if self.blockStun <= 0 and self.state == "blocking" then
            self.state = "idle"
        end
    end

    -- Update attack
    if self.state == "attacking" and self.currentAttack then
        self.attackTimer = self.attackTimer + dt
        local attack = self.currentAttack

        if self.attackPhase == "startup" and self.attackTimer >= attack.startup then
            self.attackPhase = "active"
            self.attackTimer = 0
        elseif self.attackPhase == "active" and self.attackTimer >= attack.active then
            self.attackPhase = "recovery"
            self.attackTimer = 0
        elseif self.attackPhase == "recovery" and self.attackTimer >= attack.recovery then
            self.state = "idle"
            self.currentAttack = nil
            self.attackPhase = nil
        end
    end

    -- Apply gravity
    if not self.isGrounded then
        self.vy = self.vy + GRAVITY * dt
    end

    -- Apply velocity
    self.x = self.x + self.vx * dt
    self.y = self.y + self.vy * dt

    -- Ground collision
    if self.y >= GROUND_Y then
        self.y = GROUND_Y
        self.vy = 0
        self.isGrounded = true
        if self.state == "jumping" then
            self.state = "idle"
        end
    end

    -- Friction
    if self.isGrounded then
        self.vx = self.vx * 0.85
    else
        self.vx = self.vx * 0.98
    end

    -- Screen bounds
    self.x = math.max(self.width/2 + 20, math.min(SCREEN_WIDTH - self.width/2 - 20, self.x))

    -- Face opponent
    if opponent and self.state ~= "attacking" and self.hitStun <= 0 then
        self.facingRight = self.x < opponent.x
    end

    -- Animation timer
    self.animTimer = self.animTimer + dt

    -- Victory animation
    if self.state == "victory" then
        self.victoryTimer = self.victoryTimer + dt
    end

    -- AI behavior
    if self.isAI and opponent then
        self:updateAI(dt, opponent)
    end
end

function Fighter:updateAI(dt, opponent)
    self.aiDecisionTimer = self.aiDecisionTimer - dt

    if self.aiDecisionTimer <= 0 then
        self.aiDecisionTimer = 0.1 + math.random() * 0.2  -- Decide every 0.1-0.3 seconds

        local dist = math.abs(self.x - opponent.x)
        local healthRatio = self.health / self.maxHealth

        -- AI decision making
        if self.hitStun > 0 or self.blockStun > 0 then
            self.aiAction = nil
            return
        end

        -- If opponent is attacking, maybe block
        if opponent.state == "attacking" and dist < 150 and math.random() < 0.6 then
            self.aiAction = "block"
            return
        end

        -- If close enough, attack
        if dist < 100 then
            local r = math.random()
            if r < 0.3 then
                self.aiAction = "punch"
            elseif r < 0.5 then
                self.aiAction = "kick"
            elseif r < 0.65 then
                self.aiAction = "heavy_punch"
            elseif r < 0.8 then
                self.aiAction = "heavy_kick"
            elseif r < 0.9 and self.specialCooldown <= 0 then
                self.aiAction = "special"
            else
                self.aiAction = "block"
            end
        -- If medium range, approach or use ranged special
        elseif dist < 250 then
            local r = math.random()
            if r < 0.4 then
                self.aiAction = "approach"
            elseif r < 0.6 and self.specialCooldown <= 0 then
                self.aiAction = "special"
            elseif r < 0.8 then
                self.aiAction = "jump_approach"
            else
                self.aiAction = "wait"
            end
        -- If far, approach
        else
            if math.random() < 0.7 then
                self.aiAction = "approach"
            else
                self.aiAction = "jump_approach"
            end
        end

        -- Low health makes AI more defensive
        if healthRatio < 0.3 and math.random() < 0.4 then
            self.aiAction = "block"
        end
    end

    -- Execute AI action
    self:executeAIAction(opponent)
end

function Fighter:executeAIAction(opponent)
    if not self.aiAction then return end

    local dir = opponent.x > self.x and 1 or -1

    if self.aiAction == "approach" then
        if self.state ~= "attacking" and self.hitStun <= 0 then
            self.vx = dir * self.speed * 0.7
            self.state = "walking"
        end
        self.isBlocking = false
    elseif self.aiAction == "jump_approach" then
        if self.isGrounded and self.state ~= "attacking" then
            self.vy = -self.jumpForce
            self.vx = dir * self.speed * 0.5
            self.isGrounded = false
            self.state = "jumping"
        end
        self.isBlocking = false
    elseif self.aiAction == "punch" then
        self:startAttack("punch")
        self.isBlocking = false
    elseif self.aiAction == "kick" then
        self:startAttack("kick")
        self.isBlocking = false
    elseif self.aiAction == "heavy_punch" then
        self:startAttack("heavy_punch")
        self.isBlocking = false
    elseif self.aiAction == "heavy_kick" then
        self:startAttack("heavy_kick")
        self.isBlocking = false
    elseif self.aiAction == "special" then
        self:startAttack("special")
        self.isBlocking = false
    elseif self.aiAction == "block" then
        self.isBlocking = true
        self.state = "blocking"
    elseif self.aiAction == "wait" then
        self.isBlocking = false
    end
end

function Fighter:handleInput(dt)
    if self.isAI then return end
    if self.hitStun > 0 or self.state == "victory" then return end

    local moving = false

    -- Movement (Player 1: A/D, Player 2: Left/Right)
    local leftKey = self.playerNum == 1 and "a" or "left"
    local rightKey = self.playerNum == 1 and "d" or "right"
    local upKey = self.playerNum == 1 and "w" or "up"
    local downKey = self.playerNum == 1 and "s" or "down"

    -- Blocking (hold back or down)
    local holdingBack = (self.facingRight and love.keyboard.isDown(leftKey)) or
                        (not self.facingRight and love.keyboard.isDown(rightKey))
    local holdingDown = love.keyboard.isDown(downKey)

    if (holdingBack or holdingDown) and self.isGrounded and self.state ~= "attacking" then
        self.isBlocking = true
        if self.state ~= "blocking" and self.blockStun <= 0 then
            self.state = "blocking"
        end
    else
        self.isBlocking = false
    end

    -- Only move if not blocking and not attacking
    if not self.isBlocking and self.state ~= "attacking" and self.blockStun <= 0 then
        if love.keyboard.isDown(leftKey) then
            self.vx = -self.speed
            moving = true
        elseif love.keyboard.isDown(rightKey) then
            self.vx = self.speed
            moving = true
        end

        if moving and self.isGrounded and self.state ~= "jumping" then
            self.state = "walking"
        elseif self.isGrounded and self.state == "walking" then
            self.state = "idle"
        end

        -- Jump
        if love.keyboard.isDown(upKey) and self.isGrounded then
            self.vy = -self.jumpForce
            self.isGrounded = false
            self.state = "jumping"
        end
    end
end

function Fighter:draw()
    local char = self.character

    -- Draw shadow
    love.graphics.setColor(0, 0, 0, 0.3)
    love.graphics.ellipse("fill", self.x, GROUND_Y + 5, self.width * 0.6, 10)

    -- Body color based on state
    local r, g, b = char.color[1], char.color[2], char.color[3]

    if self.hitStun > 0 then
        -- Flash white when hit
        r, g, b = 1, 1, 1
    elseif self.isBlocking then
        -- Darker when blocking
        r, g, b = r * 0.6, g * 0.6, b * 0.6
    elseif self.state == "attacking" and self.attackPhase == "active" then
        -- Brighter during active attack
        r, g, b = math.min(1, r + 0.3), math.min(1, g + 0.3), math.min(1, b + 0.3)
    end

    love.graphics.setColor(r, g, b)

    -- Victory dance animation
    if self.state == "victory" then
        local bounce = math.sin(self.victoryTimer * 8) * 10
        local sway = math.sin(self.victoryTimer * 4) * 5

        -- Body with bounce
        love.graphics.rectangle("fill",
            self.x - self.width/2 + sway,
            self.y - self.height + bounce,
            self.width,
            self.height,
            8, 8)

        -- Raised arms
        local armAngle = math.sin(self.victoryTimer * 6) * 0.3
        love.graphics.push()
        love.graphics.translate(self.x - self.width/2, self.y - self.height * 0.7 + bounce)
        love.graphics.rotate(-1.2 + armAngle)
        love.graphics.rectangle("fill", 0, 0, self.width * 0.6, 12, 4, 4)
        love.graphics.pop()

        love.graphics.push()
        love.graphics.translate(self.x + self.width/2, self.y - self.height * 0.7 + bounce)
        love.graphics.rotate(1.2 - armAngle)
        love.graphics.rectangle("fill", -self.width * 0.6, 0, self.width * 0.6, 12, 4, 4)
        love.graphics.pop()

        return
    end

    -- Normal body
    local bodyOffsetY = 0
    if self.state == "jumping" then
        bodyOffsetY = -5
    elseif self.state == "walking" then
        bodyOffsetY = math.sin(self.animTimer * 15) * 3
    end

    -- Main body
    love.graphics.rectangle("fill",
        self.x - self.width/2,
        self.y - self.height + bodyOffsetY,
        self.width,
        self.height,
        8, 8)

    -- Head (slightly different shade)
    love.graphics.setColor(r * 1.1, g * 1.1, b * 1.1)
    love.graphics.circle("fill", self.x, self.y - self.height + 20 + bodyOffsetY, 20)

    -- Eyes (face direction)
    love.graphics.setColor(1, 1, 1)
    local eyeOffset = self.facingRight and 5 or -5
    love.graphics.circle("fill", self.x + eyeOffset - 6, self.y - self.height + 16 + bodyOffsetY, 4)
    love.graphics.circle("fill", self.x + eyeOffset + 6, self.y - self.height + 16 + bodyOffsetY, 4)
    love.graphics.setColor(0, 0, 0)
    love.graphics.circle("fill", self.x + eyeOffset - 6 + (self.facingRight and 1 or -1), self.y - self.height + 16 + bodyOffsetY, 2)
    love.graphics.circle("fill", self.x + eyeOffset + 6 + (self.facingRight and 1 or -1), self.y - self.height + 16 + bodyOffsetY, 2)

    -- Draw attack effect
    if self.state == "attacking" and self.currentAttack then
        local attack = self.currentAttack
        local armX = self.facingRight and (self.x + self.width/2) or (self.x - self.width/2)
        local armY = self.y - self.height * 0.5 + bodyOffsetY

        if self.attackPhase == "startup" then
            -- Wind-up
            love.graphics.setColor(1, 1, 0, 0.5)
            love.graphics.circle("fill", armX, armY, 15)
        elseif self.attackPhase == "active" then
            -- Active attack
            love.graphics.setColor(1, 0.5, 0, 0.8)
            local length = attack.range * 0.8
            if self.facingRight then
                love.graphics.rectangle("fill", armX, armY - 10, length, 20, 5, 5)
            else
                love.graphics.rectangle("fill", armX - length, armY - 10, length, 20, 5, 5)
            end

            -- Special attack effect
            if attack.name then
                love.graphics.setColor(1, 1, 0, 0.6)
                for i = 1, 5 do
                    local sparkX = armX + (self.facingRight and 1 or -1) * (math.random() * attack.range)
                    local sparkY = armY + math.random(-30, 30)
                    love.graphics.circle("fill", sparkX, sparkY, math.random(3, 8))
                end
            end
        elseif self.attackPhase == "recovery" then
            -- Recovery
            love.graphics.setColor(0.5, 0.5, 0.5, 0.3)
            love.graphics.circle("fill", armX, armY, 10)
        end
    end

    -- Blocking shield effect
    if self.isBlocking then
        love.graphics.setColor(0.3, 0.6, 1, 0.4)
        love.graphics.rectangle("fill",
            self.x - self.width/2 - 10,
            self.y - self.height - 10,
            self.width + 20,
            self.height + 20,
            10, 10)
        love.graphics.setColor(0.5, 0.8, 1, 0.8)
        love.graphics.setLineWidth(3)
        love.graphics.rectangle("line",
            self.x - self.width/2 - 10,
            self.y - self.height - 10,
            self.width + 20,
            self.height + 20,
            10, 10)
        love.graphics.setLineWidth(1)
    end
end

-- ============================================================================
-- GAME VARIABLES
-- ============================================================================

local player1 = nil
local player2 = nil
local selectedCharacter1 = 1
local selectedCharacter2 = 2
local selectedWorld = 1
local menuSelection = 1
local roundTimer = ROUND_TIME
local roundNumber = 1
local maxRounds = 3
local player1Wins = 0
local player2Wins = 0
local roundEndTimer = 0
local roundEndMessage = ""
local characterSelectPlayer = 1
local isPaused = false
local hitEffects = {}

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

local function checkCollision(box1, box2)
    if not box1 or not box2 then return false end
    return box1.x < box2.x + box2.w and
           box1.x + box1.w > box2.x and
           box1.y < box2.y + box2.h and
           box1.y + box1.h > box2.y
end

local function addHitEffect(x, y, damage)
    table.insert(hitEffects, {
        x = x,
        y = y,
        timer = 0.3,
        damage = damage,
        particles = {}
    })
    -- Add particles
    for i = 1, 8 do
        table.insert(hitEffects[#hitEffects].particles, {
            x = x,
            y = y,
            vx = (math.random() - 0.5) * 400,
            vy = (math.random() - 0.5) * 400 - 100,
            life = 0.3
        })
    end
end

local function startRound()
    player1 = Fighter:new(characters[selectedCharacter1], 1, false)
    player2 = Fighter:new(characters[selectedCharacter2], 2, true)  -- AI opponent
    roundTimer = ROUND_TIME
    hitEffects = {}
end

local function checkRoundEnd()
    if player1.health <= 0 then
        player2.state = "victory"
        player2Wins = player2Wins + 1
        roundEndMessage = player2.character.name .. " WINS!"
        currentState = GameState.ROUND_END
        roundEndTimer = 3
    elseif player2.health <= 0 then
        player1.state = "victory"
        player1Wins = player1Wins + 1
        roundEndMessage = player1.character.name .. " WINS!"
        currentState = GameState.ROUND_END
        roundEndTimer = 3
    elseif roundTimer <= 0 then
        -- Time up - whoever has more health wins
        if player1.health > player2.health then
            player1.state = "victory"
            player1Wins = player1Wins + 1
            roundEndMessage = player1.character.name .. " WINS! (Time Up)"
        elseif player2.health > player1.health then
            player2.state = "victory"
            player2Wins = player2Wins + 1
            roundEndMessage = player2.character.name .. " WINS! (Time Up)"
        else
            roundEndMessage = "DRAW!"
        end
        currentState = GameState.ROUND_END
        roundEndTimer = 3
    end
end

-- ============================================================================
-- LOVE CALLBACKS
-- ============================================================================

function love.load()
    love.window.setTitle("Road Puncher")
    love.window.setMode(SCREEN_WIDTH, SCREEN_HEIGHT)
    love.graphics.setBackgroundColor(0.1, 0.1, 0.15)

    -- Set default font
    mainFont = love.graphics.newFont(24)
    titleFont = love.graphics.newFont(48)
    smallFont = love.graphics.newFont(16)
    love.graphics.setFont(mainFont)
end

function love.update(dt)
    -- Update hit effects
    for i = #hitEffects, 1, -1 do
        local effect = hitEffects[i]
        effect.timer = effect.timer - dt
        for _, p in ipairs(effect.particles) do
            p.x = p.x + p.vx * dt
            p.y = p.y + p.vy * dt
            p.vy = p.vy + 500 * dt
            p.life = p.life - dt
        end
        if effect.timer <= 0 then
            table.remove(hitEffects, i)
        end
    end

    if currentState == GameState.MENU then
        -- Menu doesn't need update

    elseif currentState == GameState.CHARACTER_SELECT then
        -- Character select doesn't need update

    elseif currentState == GameState.WORLD_SELECT then
        -- World select doesn't need update

    elseif currentState == GameState.FIGHT then
        if isPaused then return end

        -- Update timer
        roundTimer = roundTimer - dt

        -- Handle player input
        player1:handleInput(dt)
        player2:handleInput(dt)

        -- Update fighters
        player1:update(dt, player2)
        player2:update(dt, player1)

        -- Check for hits
        local hitbox1 = player1:getHitbox()
        local hitbox2 = player2:getHitbox()
        local hurtbox1 = player1:getHurtbox()
        local hurtbox2 = player2:getHurtbox()

        -- Player 1 hits Player 2
        if hitbox1 and not player1.hasHit and checkCollision(hitbox1, hurtbox2) then
            local connected = player2:takeHit(player1.currentAttack, player1.x)
            player1.hasHit = true
            if connected then
                addHitEffect(player2.x, player2.y - player2.height/2, player1.currentAttack.damage)
            end
        end

        -- Player 2 hits Player 1
        if hitbox2 and not player2.hasHit and checkCollision(hitbox2, hurtbox1) then
            local connected = player1:takeHit(player2.currentAttack, player2.x)
            player2.hasHit = true
            if connected then
                addHitEffect(player1.x, player1.y - player1.height/2, player2.currentAttack.damage)
            end
        end

        -- Check round end
        checkRoundEnd()

    elseif currentState == GameState.ROUND_END then
        -- Update victory animations
        player1:update(dt, player2)
        player2:update(dt, player1)

        roundEndTimer = roundEndTimer - dt
        if roundEndTimer <= 0 then
            -- Check if match is over
            local winsNeeded = math.ceil(maxRounds / 2)
            if player1Wins >= winsNeeded then
                currentState = GameState.VICTORY
                roundEndMessage = "PLAYER 1 WINS THE MATCH!"
            elseif player2Wins >= winsNeeded then
                currentState = GameState.VICTORY
                roundEndMessage = "PLAYER 2 WINS THE MATCH!"
            else
                -- Next round
                roundNumber = roundNumber + 1
                startRound()
                currentState = GameState.FIGHT
            end
        end

    elseif currentState == GameState.VICTORY then
        -- Update victory animation
        if player1.state == "victory" then
            player1:update(dt, player2)
        end
        if player2.state == "victory" then
            player2:update(dt, player1)
        end
    end
end

function love.draw()
    if currentState == GameState.MENU then
        drawMenu()
    elseif currentState == GameState.CHARACTER_SELECT then
        drawCharacterSelect()
    elseif currentState == GameState.WORLD_SELECT then
        drawWorldSelect()
    elseif currentState == GameState.FIGHT then
        drawFight()
    elseif currentState == GameState.ROUND_END then
        drawFight()
        drawRoundEnd()
    elseif currentState == GameState.VICTORY then
        drawFight()
        drawVictory()
    end
end

function love.keypressed(key)
    if currentState == GameState.MENU then
        if key == "up" or key == "w" then
            menuSelection = menuSelection - 1
            if menuSelection < 1 then menuSelection = 3 end
        elseif key == "down" or key == "s" then
            menuSelection = menuSelection + 1
            if menuSelection > 3 then menuSelection = 1 end
        elseif key == "return" or key == "space" then
            if menuSelection == 1 then
                -- VS CPU
                currentState = GameState.CHARACTER_SELECT
                characterSelectPlayer = 1
            elseif menuSelection == 2 then
                -- VS Player (not implemented yet)
                currentState = GameState.CHARACTER_SELECT
                characterSelectPlayer = 1
            elseif menuSelection == 3 then
                love.event.quit()
            end
        end

    elseif currentState == GameState.CHARACTER_SELECT then
        if key == "left" or key == "a" then
            if characterSelectPlayer == 1 then
                selectedCharacter1 = selectedCharacter1 - 1
                if selectedCharacter1 < 1 then selectedCharacter1 = #characters end
            else
                selectedCharacter2 = selectedCharacter2 - 1
                if selectedCharacter2 < 1 then selectedCharacter2 = #characters end
            end
        elseif key == "right" or key == "d" then
            if characterSelectPlayer == 1 then
                selectedCharacter1 = selectedCharacter1 + 1
                if selectedCharacter1 > #characters then selectedCharacter1 = 1 end
            else
                selectedCharacter2 = selectedCharacter2 + 1
                if selectedCharacter2 > #characters then selectedCharacter2 = 1 end
            end
        elseif key == "return" or key == "space" then
            if characterSelectPlayer == 1 then
                characterSelectPlayer = 2
            else
                currentState = GameState.WORLD_SELECT
            end
        elseif key == "escape" then
            if characterSelectPlayer == 2 then
                characterSelectPlayer = 1
            else
                currentState = GameState.MENU
            end
        end

    elseif currentState == GameState.WORLD_SELECT then
        if key == "left" or key == "a" then
            selectedWorld = selectedWorld - 1
            if selectedWorld < 1 then selectedWorld = #worlds end
        elseif key == "right" or key == "d" then
            selectedWorld = selectedWorld + 1
            if selectedWorld > #worlds then selectedWorld = 1 end
        elseif key == "return" or key == "space" then
            -- Start the fight!
            player1Wins = 0
            player2Wins = 0
            roundNumber = 1
            startRound()
            currentState = GameState.FIGHT
        elseif key == "escape" then
            currentState = GameState.CHARACTER_SELECT
            characterSelectPlayer = 2
        end

    elseif currentState == GameState.FIGHT then
        if key == "escape" then
            isPaused = not isPaused
        end

        if isPaused then
            if key == "q" then
                currentState = GameState.MENU
                isPaused = false
            end
            return
        end

        -- Player 1 attacks (J, K, L, U, I, O)
        if key == "j" then
            player1:startAttack("punch")
        elseif key == "k" then
            player1:startAttack("kick")
        elseif key == "u" then
            player1:startAttack("heavy_punch")
        elseif key == "i" then
            player1:startAttack("heavy_kick")
        elseif key == "o" then
            player1:startAttack("special")
        end

    elseif currentState == GameState.ROUND_END then
        -- Wait for timer

    elseif currentState == GameState.VICTORY then
        if key == "return" or key == "space" then
            currentState = GameState.MENU
        end
    end
end

-- ============================================================================
-- DRAW FUNCTIONS
-- ============================================================================

function drawMenu()
    -- Title
    love.graphics.setFont(titleFont)
    love.graphics.setColor(1, 0.3, 0.3)
    love.graphics.printf("ROAD PUNCHER", 0, 100, SCREEN_WIDTH, "center")

    -- Subtitle
    love.graphics.setFont(smallFont)
    love.graphics.setColor(0.7, 0.7, 0.7)
    love.graphics.printf("A Classic Fighting Game", 0, 160, SCREEN_WIDTH, "center")

    -- Menu options
    love.graphics.setFont(mainFont)
    local options = {"VS CPU", "VS Player", "Quit"}

    for i, option in ipairs(options) do
        local y = 280 + (i - 1) * 60
        if i == menuSelection then
            love.graphics.setColor(1, 1, 0)
            love.graphics.printf("> " .. option .. " <", 0, y, SCREEN_WIDTH, "center")
        else
            love.graphics.setColor(0.8, 0.8, 0.8)
            love.graphics.printf(option, 0, y, SCREEN_WIDTH, "center")
        end
    end

    -- Controls hint
    love.graphics.setFont(smallFont)
    love.graphics.setColor(0.5, 0.5, 0.5)
    love.graphics.printf("Use W/S or Arrow Keys to navigate, Enter to select", 0, 520, SCREEN_WIDTH, "center")
end

function drawCharacterSelect()
    love.graphics.setFont(titleFont)
    love.graphics.setColor(1, 1, 1)
    love.graphics.printf("SELECT YOUR FIGHTER", 0, 30, SCREEN_WIDTH, "center")

    -- Show which player is selecting
    love.graphics.setFont(mainFont)
    love.graphics.setColor(1, 1, 0)
    love.graphics.printf("Player " .. characterSelectPlayer, 0, 80, SCREEN_WIDTH, "center")

    -- Draw character cards
    local cardWidth = 150
    local cardHeight = 200
    local startX = (SCREEN_WIDTH - (#characters * cardWidth + (#characters - 1) * 20)) / 2

    for i, char in ipairs(characters) do
        local x = startX + (i - 1) * (cardWidth + 20)
        local y = 150

        local isSelected = (characterSelectPlayer == 1 and i == selectedCharacter1) or
                          (characterSelectPlayer == 2 and i == selectedCharacter2)
        local isP1Selected = i == selectedCharacter1 and characterSelectPlayer == 2

        -- Card background
        if isSelected then
            love.graphics.setColor(1, 1, 0, 0.3)
        elseif isP1Selected then
            love.graphics.setColor(0.3, 0.3, 1, 0.3)
        else
            love.graphics.setColor(0.2, 0.2, 0.25)
        end
        love.graphics.rectangle("fill", x, y, cardWidth, cardHeight, 10, 10)

        -- Border
        if isSelected then
            love.graphics.setColor(1, 1, 0)
            love.graphics.setLineWidth(3)
        elseif isP1Selected then
            love.graphics.setColor(0.5, 0.5, 1)
            love.graphics.setLineWidth(2)
        else
            love.graphics.setColor(0.4, 0.4, 0.4)
            love.graphics.setLineWidth(1)
        end
        love.graphics.rectangle("line", x, y, cardWidth, cardHeight, 10, 10)
        love.graphics.setLineWidth(1)

        -- Character preview
        love.graphics.setColor(char.color)
        love.graphics.rectangle("fill", x + 45, y + 30, 60, 100, 8, 8)

        -- Character name
        love.graphics.setFont(smallFont)
        love.graphics.setColor(1, 1, 1)
        love.graphics.printf(char.name, x, y + 140, cardWidth, "center")

        -- P1/P2 indicator
        if isP1Selected then
            love.graphics.setColor(0.3, 0.3, 1)
            love.graphics.printf("P1", x, y + 160, cardWidth, "center")
        end
        if isSelected then
            love.graphics.setColor(1, 1, 0)
            love.graphics.printf("P" .. characterSelectPlayer, x, y + 160, cardWidth, "center")
        end
    end

    -- Selected character info
    local selectedChar = characterSelectPlayer == 1 and characters[selectedCharacter1] or characters[selectedCharacter2]
    love.graphics.setFont(smallFont)
    love.graphics.setColor(0.8, 0.8, 0.8)
    love.graphics.printf(selectedChar.description, 0, 380, SCREEN_WIDTH, "center")

    -- Stats
    love.graphics.setColor(0.6, 0.6, 0.6)
    local statsY = 420
    love.graphics.printf(string.format("Health: %d  |  Speed: %d  |  Jump: %d",
        selectedChar.health, selectedChar.speed, selectedChar.jumpForce), 0, statsY, SCREEN_WIDTH, "center")

    -- Special move
    love.graphics.setColor(1, 0.8, 0.2)
    love.graphics.printf("Special: " .. selectedChar.attacks.special.name, 0, statsY + 25, SCREEN_WIDTH, "center")

    -- Controls
    love.graphics.setColor(0.5, 0.5, 0.5)
    love.graphics.printf("A/D or Left/Right to choose, Enter to confirm, Escape to go back", 0, 550, SCREEN_WIDTH, "center")
end

function drawWorldSelect()
    love.graphics.setFont(titleFont)
    love.graphics.setColor(1, 1, 1)
    love.graphics.printf("SELECT ARENA", 0, 30, SCREEN_WIDTH, "center")

    -- Draw world cards
    local cardWidth = 170
    local cardHeight = 220
    local startX = (SCREEN_WIDTH - (#worlds * cardWidth + (#worlds - 1) * 15)) / 2

    for i, world in ipairs(worlds) do
        local x = startX + (i - 1) * (cardWidth + 15)
        local y = 120

        local isSelected = i == selectedWorld

        -- Card background with world colors
        love.graphics.setColor(world.skyColor)
        love.graphics.rectangle("fill", x, y, cardWidth, cardHeight * 0.7, 10, 10)
        love.graphics.setColor(world.groundColor)
        love.graphics.rectangle("fill", x, y + cardHeight * 0.5, cardWidth, cardHeight * 0.3)

        -- Accent elements
        love.graphics.setColor(world.accentColor)
        if world.hasColumns then
            love.graphics.rectangle("fill", x + 20, y + 50, 15, 100)
            love.graphics.rectangle("fill", x + cardWidth - 35, y + 50, 15, 100)
        elseif world.hasLamps then
            love.graphics.circle("fill", x + 30, y + 40, 10)
            love.graphics.circle("fill", x + cardWidth - 30, y + 40, 10)
        elseif world.hasCrowd then
            for j = 1, 8 do
                love.graphics.circle("fill", x + 10 + j * 18, y + cardHeight * 0.45, 8)
            end
        elseif world.hasClouds then
            love.graphics.ellipse("fill", x + 40, y + 30, 25, 12)
            love.graphics.ellipse("fill", x + cardWidth - 40, y + 50, 30, 15)
        end

        -- Border
        if isSelected then
            love.graphics.setColor(1, 1, 0)
            love.graphics.setLineWidth(4)
        else
            love.graphics.setColor(0.4, 0.4, 0.4)
            love.graphics.setLineWidth(1)
        end
        love.graphics.rectangle("line", x, y, cardWidth, cardHeight, 10, 10)
        love.graphics.setLineWidth(1)

        -- World name
        love.graphics.setFont(smallFont)
        love.graphics.setColor(1, 1, 1)
        love.graphics.printf(world.name, x, y + cardHeight - 45, cardWidth, "center")
    end

    -- Selected world description
    local selectedWorldData = worlds[selectedWorld]
    love.graphics.setFont(mainFont)
    love.graphics.setColor(0.9, 0.9, 0.9)
    love.graphics.printf(selectedWorldData.description, 0, 380, SCREEN_WIDTH, "center")

    -- Matchup preview
    love.graphics.setFont(smallFont)
    love.graphics.setColor(0.7, 0.7, 0.7)
    love.graphics.printf(characters[selectedCharacter1].name .. "  VS  " .. characters[selectedCharacter2].name, 0, 430, SCREEN_WIDTH, "center")

    -- Controls
    love.graphics.setColor(0.5, 0.5, 0.5)
    love.graphics.printf("A/D or Left/Right to choose, Enter to FIGHT!, Escape to go back", 0, 550, SCREEN_WIDTH, "center")
end

function drawFight()
    local world = worlds[selectedWorld]

    -- Draw background
    love.graphics.setColor(world.skyColor)
    love.graphics.rectangle("fill", 0, 0, SCREEN_WIDTH, GROUND_Y)

    love.graphics.setColor(world.groundColor)
    love.graphics.rectangle("fill", 0, GROUND_Y, SCREEN_WIDTH, SCREEN_HEIGHT - GROUND_Y)

    -- Draw world accents
    love.graphics.setColor(world.accentColor[1], world.accentColor[2], world.accentColor[3], 0.6)
    if world.hasColumns then
        love.graphics.rectangle("fill", 50, 200, 40, 280)
        love.graphics.rectangle("fill", SCREEN_WIDTH - 90, 200, 40, 280)
        love.graphics.rectangle("fill", 40, 180, 60, 30)
        love.graphics.rectangle("fill", SCREEN_WIDTH - 100, 180, 60, 30)
    elseif world.hasLamps then
        love.graphics.setColor(world.accentColor)
        love.graphics.circle("fill", 100, 100, 30)
        love.graphics.circle("fill", SCREEN_WIDTH - 100, 100, 30)
        love.graphics.setColor(1, 1, 0.8, 0.3)
        love.graphics.circle("fill", 100, 100, 60)
        love.graphics.circle("fill", SCREEN_WIDTH - 100, 100, 60)
    elseif world.hasCrowd then
        for i = 1, 20 do
            local cx = 30 + (i - 1) * 40
            love.graphics.setColor(0.3 + math.random() * 0.3, 0.3 + math.random() * 0.3, 0.3 + math.random() * 0.3)
            love.graphics.circle("fill", cx, 80 + math.sin(love.timer.getTime() * 3 + i) * 5, 15)
        end
    elseif world.hasClouds then
        love.graphics.setColor(1, 1, 1, 0.7)
        love.graphics.ellipse("fill", 100 + math.sin(love.timer.getTime() * 0.3) * 20, 80, 60, 25)
        love.graphics.ellipse("fill", 300 + math.sin(love.timer.getTime() * 0.2) * 30, 120, 80, 30)
        love.graphics.ellipse("fill", 600 + math.sin(love.timer.getTime() * 0.25) * 25, 60, 70, 28)
    end

    -- Ground line
    love.graphics.setColor(0, 0, 0, 0.3)
    love.graphics.rectangle("fill", 0, GROUND_Y, SCREEN_WIDTH, 5)

    -- Draw fighters
    player1:draw()
    player2:draw()

    -- Draw hit effects
    for _, effect in ipairs(hitEffects) do
        -- Impact flash
        local alpha = effect.timer / 0.3
        love.graphics.setColor(1, 1, 1, alpha * 0.8)
        love.graphics.circle("fill", effect.x, effect.y, 30 * alpha)

        -- Damage number
        love.graphics.setFont(mainFont)
        love.graphics.setColor(1, 0.3, 0.3, alpha)
        love.graphics.print("-" .. effect.damage, effect.x - 20, effect.y - 40 - (1 - alpha) * 30)

        -- Particles
        love.graphics.setColor(1, 0.5, 0.2, alpha)
        for _, p in ipairs(effect.particles) do
            if p.life > 0 then
                love.graphics.circle("fill", p.x, p.y, 4 * (p.life / 0.3))
            end
        end
    end

    -- UI
    drawFightUI()

    -- Pause overlay
    if isPaused then
        love.graphics.setColor(0, 0, 0, 0.7)
        love.graphics.rectangle("fill", 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

        love.graphics.setFont(titleFont)
        love.graphics.setColor(1, 1, 1)
        love.graphics.printf("PAUSED", 0, 200, SCREEN_WIDTH, "center")

        love.graphics.setFont(mainFont)
        love.graphics.setColor(0.8, 0.8, 0.8)
        love.graphics.printf("Press ESC to resume", 0, 280, SCREEN_WIDTH, "center")
        love.graphics.printf("Press Q to quit to menu", 0, 320, SCREEN_WIDTH, "center")
    end
end

function drawFightUI()
    -- Health bars background
    love.graphics.setColor(0.1, 0.1, 0.1, 0.8)
    love.graphics.rectangle("fill", 0, 0, SCREEN_WIDTH, 60)

    -- Player 1 health bar
    local p1HealthPercent = math.max(0, player1.health / player1.maxHealth)
    love.graphics.setColor(0.3, 0.3, 0.3)
    love.graphics.rectangle("fill", 20, 15, 300, 30, 5, 5)
    love.graphics.setColor(0.2, 0.8, 0.2)
    if p1HealthPercent < 0.3 then
        love.graphics.setColor(0.9, 0.2, 0.2)
    elseif p1HealthPercent < 0.5 then
        love.graphics.setColor(0.9, 0.7, 0.2)
    end
    love.graphics.rectangle("fill", 20, 15, 300 * p1HealthPercent, 30, 5, 5)
    love.graphics.setColor(1, 1, 1)
    love.graphics.setLineWidth(2)
    love.graphics.rectangle("line", 20, 15, 300, 30, 5, 5)
    love.graphics.setLineWidth(1)

    -- Player 1 name
    love.graphics.setFont(smallFont)
    love.graphics.setColor(player1.character.color)
    love.graphics.print(player1.character.name, 25, 48)

    -- Player 2 health bar
    local p2HealthPercent = math.max(0, player2.health / player2.maxHealth)
    love.graphics.setColor(0.3, 0.3, 0.3)
    love.graphics.rectangle("fill", SCREEN_WIDTH - 320, 15, 300, 30, 5, 5)
    love.graphics.setColor(0.2, 0.8, 0.2)
    if p2HealthPercent < 0.3 then
        love.graphics.setColor(0.9, 0.2, 0.2)
    elseif p2HealthPercent < 0.5 then
        love.graphics.setColor(0.9, 0.7, 0.2)
    end
    -- Draw from right side
    love.graphics.rectangle("fill", SCREEN_WIDTH - 320 + 300 * (1 - p2HealthPercent), 15, 300 * p2HealthPercent, 30, 5, 5)
    love.graphics.setColor(1, 1, 1)
    love.graphics.setLineWidth(2)
    love.graphics.rectangle("line", SCREEN_WIDTH - 320, 15, 300, 30, 5, 5)
    love.graphics.setLineWidth(1)

    -- Player 2 name
    love.graphics.setFont(smallFont)
    love.graphics.setColor(player2.character.color)
    love.graphics.printf(player2.character.name, SCREEN_WIDTH - 320, 48, 295, "right")

    -- Timer
    love.graphics.setFont(mainFont)
    love.graphics.setColor(1, 1, 1)
    love.graphics.printf(string.format("%02d", math.max(0, math.ceil(roundTimer))), 0, 15, SCREEN_WIDTH, "center")

    -- Round indicator
    love.graphics.setFont(smallFont)
    love.graphics.setColor(0.8, 0.8, 0.8)
    love.graphics.printf("Round " .. roundNumber, 0, 45, SCREEN_WIDTH, "center")

    -- Win counters
    love.graphics.setColor(1, 0.8, 0.2)
    for i = 1, player1Wins do
        love.graphics.circle("fill", 330 + (i - 1) * 25, 30, 8)
    end
    for i = 1, player2Wins do
        love.graphics.circle("fill", SCREEN_WIDTH - 330 - (i - 1) * 25, 30, 8)
    end

    -- Controls hint
    love.graphics.setFont(smallFont)
    love.graphics.setColor(0.5, 0.5, 0.5, 0.7)
    love.graphics.print("WASD: Move/Block | J: Punch | K: Kick | U: Heavy Punch | I: Heavy Kick | O: Special", 10, SCREEN_HEIGHT - 25)
end

function drawRoundEnd()
    -- Overlay
    love.graphics.setColor(0, 0, 0, 0.5)
    love.graphics.rectangle("fill", 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

    -- Message
    love.graphics.setFont(titleFont)
    love.graphics.setColor(1, 1, 0)
    love.graphics.printf(roundEndMessage, 0, 200, SCREEN_WIDTH, "center")

    -- Continue hint
    love.graphics.setFont(smallFont)
    love.graphics.setColor(0.8, 0.8, 0.8)
    love.graphics.printf("Next round starting...", 0, 280, SCREEN_WIDTH, "center")
end

function drawVictory()
    -- Overlay
    love.graphics.setColor(0, 0, 0, 0.7)
    love.graphics.rectangle("fill", 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

    -- Winner announcement
    love.graphics.setFont(titleFont)
    love.graphics.setColor(1, 0.8, 0.2)
    love.graphics.printf(roundEndMessage, 0, 150, SCREEN_WIDTH, "center")

    -- Score
    love.graphics.setFont(mainFont)
    love.graphics.setColor(1, 1, 1)
    love.graphics.printf(string.format("Final Score: %d - %d", player1Wins, player2Wins), 0, 230, SCREEN_WIDTH, "center")

    -- Winner character
    local winner = player1Wins > player2Wins and player1 or player2
    love.graphics.setColor(winner.character.color)
    love.graphics.printf(winner.character.name .. " is the champion!", 0, 280, SCREEN_WIDTH, "center")

    -- Continue hint
    love.graphics.setFont(smallFont)
    love.graphics.setColor(0.6, 0.6, 0.6)
    love.graphics.printf("Press Enter to return to menu", 0, 450, SCREEN_WIDTH, "center")
end
