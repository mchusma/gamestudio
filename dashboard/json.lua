-- Simple JSON decoder for Lua
-- Minimal implementation for reading game.json files

local json = {}

local function skip_whitespace(str, pos)
    while pos <= #str and str:sub(pos, pos):match("%s") do
        pos = pos + 1
    end
    return pos
end

local function parse_string(str, pos)
    pos = pos + 1 -- skip opening quote
    local result = ""
    while pos <= #str do
        local c = str:sub(pos, pos)
        if c == '"' then
            return result, pos + 1
        elseif c == '\\' then
            pos = pos + 1
            c = str:sub(pos, pos)
            if c == 'n' then result = result .. '\n'
            elseif c == 't' then result = result .. '\t'
            else result = result .. c
            end
        else
            result = result .. c
        end
        pos = pos + 1
    end
    return result, pos
end

local function parse_number(str, pos)
    local start = pos
    while pos <= #str and str:sub(pos, pos):match("[%d%.%-eE%+]") do
        pos = pos + 1
    end
    return tonumber(str:sub(start, pos - 1)), pos
end

local parse_value -- forward declaration

local function parse_array(str, pos)
    local result = {}
    pos = pos + 1 -- skip [
    pos = skip_whitespace(str, pos)

    if str:sub(pos, pos) == ']' then
        return result, pos + 1
    end

    while pos <= #str do
        local value
        value, pos = parse_value(str, pos)
        table.insert(result, value)
        pos = skip_whitespace(str, pos)
        local c = str:sub(pos, pos)
        if c == ']' then
            return result, pos + 1
        elseif c == ',' then
            pos = skip_whitespace(str, pos + 1)
        end
    end
    return result, pos
end

local function parse_object(str, pos)
    local result = {}
    pos = pos + 1 -- skip {
    pos = skip_whitespace(str, pos)

    if str:sub(pos, pos) == '}' then
        return result, pos + 1
    end

    while pos <= #str do
        pos = skip_whitespace(str, pos)
        local key
        key, pos = parse_string(str, pos)
        pos = skip_whitespace(str, pos)
        pos = pos + 1 -- skip :
        pos = skip_whitespace(str, pos)
        local value
        value, pos = parse_value(str, pos)
        result[key] = value
        pos = skip_whitespace(str, pos)
        local c = str:sub(pos, pos)
        if c == '}' then
            return result, pos + 1
        elseif c == ',' then
            pos = pos + 1
        end
    end
    return result, pos
end

parse_value = function(str, pos)
    pos = skip_whitespace(str, pos)
    local c = str:sub(pos, pos)

    if c == '"' then
        return parse_string(str, pos)
    elseif c == '{' then
        return parse_object(str, pos)
    elseif c == '[' then
        return parse_array(str, pos)
    elseif c:match("[%d%-]") then
        return parse_number(str, pos)
    elseif str:sub(pos, pos + 3) == "true" then
        return true, pos + 4
    elseif str:sub(pos, pos + 4) == "false" then
        return false, pos + 5
    elseif str:sub(pos, pos + 3) == "null" then
        return nil, pos + 4
    end
    return nil, pos
end

function json.decode(str)
    if not str or str == "" then return nil end
    local result, _ = parse_value(str, 1)
    return result
end

return json
