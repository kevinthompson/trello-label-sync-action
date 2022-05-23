const core = require("@actions/core")
const fetch = require("node-fetch")

exports.getCards = async function getCards() {
  return await trelloFetch(`boards/${core.getInput("trello_board_id")}/cards?attachments=true`)
}

exports.addLabel = async function addLabel(cardId, labelId) {
  return await trelloFetch(`cards/${cardId}/idLabels?value=${labelId}`, {
    method: "POST",
  })
}

exports.removeLabel = async function removeLabel(cardId, labelId) {
  return await trelloFetch(`cards/${cardId}/idLabels/${labelId}`, {
    method: "DELETE",
  })
}

async function trelloFetch(path, options = {}) {
  const defaultOptions = {
    headers: { "Content-Type": "application/json" },
  }

  const trelloKey = core.getInput("trello_key")
  const trelloToken = core.getInput("trello_token")

  const hasQuery = path.includes("?")
  const joinChar = hasQuery ? "&" : "?"
  const queryParams = `${joinChar}key=${trelloKey}&token=${trelloToken}`

  const url = `https://api.trello.com/1/${path}${queryParams}`
  const response = await fetch(url, { ...defaultOptions, ...options })
  return response.json()
}
