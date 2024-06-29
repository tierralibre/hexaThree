-- HexaClaim.lua

-- Initialize state
if not Claims then Claims = {} end
if not Bids then Bids = {} end
if not Guardians then Guardians = {} end
if not HexaBalances then HexaBalances = {} end

-- Constants
local ACTIVE_CLAIM_DURATION = 24 * 60 * 60  -- 24 hours in seconds
local BID_LOCK_DURATION = 7 * 24 * 60 * 60  -- 7 days in seconds
local INITIAL_HEXA_BALANCE = 100
local DAILY_ACTIVE_MINT = 10
local BID_WIN_MINT_FACTOR = 0.1  -- 10% of bid amount

-- Helper function to get current timestamp
local function getCurrentTimestamp()
  return os.time()
end

-- Function to initialize user if not exists
local function initializeUser(userId)
  if not HexaBalances[userId] then
    HexaBalances[userId] = INITIAL_HEXA_BALANCE
  end
end

-- Function to mint HEXA tokens
local function mintHexa(userId, amount)
  HexaBalances[userId] = (HexaBalances[userId] or 0) + amount
end

-- Function to submit an active claim
function submitActiveClaim(hexId, userId)
  initializeUser(userId)
  if not Claims[hexId] then
    Claims[hexId] = {}
  end
  Claims[hexId][userId] = getCurrentTimestamp()
  return "Active claim submitted for " .. hexId
end

-- Function to submit a bid
function submitBid(hexId, userId, bidAmount)
  initializeUser(userId)
  if HexaBalances[userId] < bidAmount then
    return "Insufficient HEXA balance"
  end
  if not Bids[hexId] then
    Bids[hexId] = {}
  end
  Bids[hexId][userId] = {amount = bidAmount, timestamp = getCurrentTimestamp()}
  HexaBalances[userId] = HexaBalances[userId] - bidAmount
  return "Bid submitted for " .. hexId
end

-- Function to update activity for active claim
function updateActivity(hexId, userId)
  if Claims[hexId] and Claims[hexId][userId] then
    Claims[hexId][userId] = getCurrentTimestamp()
    mintHexa(userId, DAILY_ACTIVE_MINT)
    return "Activity updated for " .. hexId
  end
  return "No active claim found for " .. hexId
end

-- Function to check and update guardian
function checkGuardian(hexId)
  local currentTime = getCurrentTimestamp()
  local activeGuardian = nil
  local highestBidder = nil
  local highestBid = 0

  -- Check active claims
  if Claims[hexId] then
    for userId, lastActivity in pairs(Claims[hexId]) do
      if currentTime - lastActivity <= ACTIVE_CLAIM_DURATION then
        activeGuardian = userId
        break
      end
    end
  end

  -- If no active guardian, check bids
  if not activeGuardian and Bids[hexId] then
    for userId, bid in pairs(Bids[hexId]) do
      if bid.amount > highestBid and currentTime - bid.timestamp >= BID_LOCK_DURATION then
        highestBidder = userId
        highestBid = bid.amount
      end
    end
  end

  -- Update guardian
  local newGuardian = activeGuardian or highestBidder
  if newGuardian and newGuardian ~= Guardians[hexId] then
    Guardians[hexId] = newGuardian
    if highestBidder then
      mintHexa(highestBidder, math.floor(highestBid * BID_WIN_MINT_FACTOR))
    end
    return "Guardian updated for " .. hexId
  end

  return "No update needed for " .. hexId
end

-- Function to get hexagon status
function getHexagonStatus(hexId)
  local guardian = Guardians[hexId]
  local status = guardian and "claimed" or "unclaimed"
  local activeClaims = Claims[hexId] and #Claims[hexId] or 0
  local highestBid = 0
  local highestBidder = nil

  if Bids[hexId] then
    for userId, bid in pairs(Bids[hexId]) do
      if bid.amount > highestBid then
        highestBid = bid.amount
        highestBidder = userId
      end
    end
  end

  return {
    status = status,
    guardian = guardian,
    activeClaims = activeClaims,
    highestBid = highestBid,
    highestBidder = highestBidder
  }
end

-- Function to get user's HEXA balance
function getHexaBalance(userId)
  return HexaBalances[userId] or 0
end

-- AO Handlers
Handlers.add(
  "submitActiveClaim",
  Handlers.utils.hasMatchingTag("action", "submitActiveClaim"),
  function(msg)
    local result = submitActiveClaim(msg.hexId, msg.userId)
    return { result = result }
  end
)

Handlers.add(
  "submitBid",
  Handlers.utils.hasMatchingTag("action", "submitBid"),
  function(msg)
    local result = submitBid(msg.hexId, msg.userId, msg.bidAmount)
    return { result = result }
  end
)

Handlers.add(
  "updateActivity",
  Handlers.utils.hasMatchingTag("action", "updateActivity"),
  function(msg)
    local result = updateActivity(msg.hexId, msg.userId)
    return { result = result }
  end
)

Handlers.add(
  "getHexagonStatus",
  Handlers.utils.hasMatchingTag("action", "getHexagonStatus"),
  function(msg)
    local status = getHexagonStatus(msg.hexId)
    return { status = status }
  end
)

Handlers.add(
  "getHexaBalance",
  Handlers.utils.hasMatchingTag("action", "getHexaBalance"),
  function(msg)
    local balance = getHexaBalance(msg.userId)
    return { balance = balance }
  end
)

-- Cron job to check guardians (this would be set up separately in AO)
Handlers.add(
  "checkGuardians",
  Handlers.utils.hasMatchingTag("action", "checkGuardians"),
  function(msg)
    local results = {}
    for hexId, _ in pairs(Claims) do
      results[hexId] = checkGuardian(hexId)
    end
    return { results = results }
  end
)
