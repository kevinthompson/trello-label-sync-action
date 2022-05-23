const core = require("@actions/core")
const github = require("@actions/github")
const fetch = require("node-fetch")

async function run() {
  try {
    const commits = await findCommitsFromShaToMaster()
    const cards = await getCards().filter(hasPullRequestAttachments)
    cards.forEach(async (card) => {
      setCardLabel(card, commits)
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

async function setCardLabel(card, commits) {
  const labelId = core.getInput("trello_label_id")
  const attachments = card.attachments.filter(isPullRequestAttachment)
  const shouldAddLabel = attachments.every(async (attachment) => {
    const prId = attachment.url.split("/").pop()
    const headCommitSha = await getHeadCommitShaForPR(prId)
    return commits.some((commit) => commit.sha === headCommitSha)
  })

  if (shouldAddLabel) {
    core.info(`Adding label to ${card.name}`)
    addLabel(card.id, labelId)
  } else {
    core.info(`Removing label from ${card.name}`)
    removeLabel(card.id, labelId)
  }
}

// we only get 250 per page so we will iterate over pages to grab more if there is more
async function findCommitsFromShaToMaster() {
  const { commits, total_commits } = await getCommitsFromMaster()
  let allCommits = commits
  const extraPagesCount = Math.min(Math.floor(total_commits / 250), 5) // let's cap at 1500 commits
  for (let index = 0; index < extraPagesCount; index++) {
    const page = index + 2 // we already loaded page 1
    const { commits: pageCommits } = await getCommitsFromMaster({ page })
    allCommits = [...allCommits, ...pageCommits]
  }

  return allCommits
}

function hasPullRequestAttachments(card) {
  return card.attachments.some(isPullRequestAttachment)
}

function isPullRequestAttachment(attachment) {
  const owner = github.context.repo.owner
  const repo = github.context.repo.repo
  return attachment.url.includes(`github.com/${owner}/${repo}/pull`)
}

async function getCards() {
  return await trelloFetch(`boards/${core.getInput("trello_board_id")}/cards?attachments=true`)
}

async function addLabel(cardId, labelId) {
  return await trelloFetch(`cards/${cardId}/idLabels?value=${labelId}`, {
    method: "POST",
  })
}

async function removeLabel(cardId, labelId) {
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

async function getHeadCommitShaForPR(id) {
  const owner = github.context.repo.owner
  const repo = github.context.repo.repo
  const {
    data: {
      head: { sha },
    },
  } = await getOctokit().request(`GET /repos/${owner}/${repo}/pulls/${id}`)
  return sha
}

async function getCommitsFromMaster(options = {}) {
  const owner = github.context.repo.owner
  const repo = github.context.repo.repo
  const currentSha = github.context.sha
  const basehead = `master...${currentSha}`
  const { data } = await getOctokit().request(
    `GET /repos/${owner}/${repo}/compare/${basehead}`,
    options,
  )
  return data
}

function getOctokit() {
  const githubToken = core.getInput("github_token")
  return github.getOctokit(githubToken)
}
