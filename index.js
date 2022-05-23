const core = require("@actions/core")
const github = require("@actions/github")
const { getCards, addLabel, removeLabel } = require("./trelloRequests")
const { getHeadCommitShaForPR, getCommitsFromMaster } = require("./githubRequests")
const { log } = require("./utils/log")

;(async function () {
  try {
    const commits = await findCommitsFromShaToMaster()
    const cards = await getCards().filter(hasPullRequestAttachments)
    cards.forEach(async (card) => {
      setCardLabel(card, commits)
    })
  } catch (error) {
    log(error)
    core.setFailed(error.message)
  }
})()

async function setCardLabel(card, commits) {
  const labelId = core.getInput("trello_label_id")
  const attachments = card.attachments.filter(isPullRequestAttachment)
  const shoulAddLabel = attachments.every(async (attachment) => {
    const prId = attachment.url.split("/").pop()
    const headCommitSha = await getHeadCommitShaForPR(prId)
    return commits.some((commit) => commit.sha === headCommitSha)
  })

  if (shoulAddLabel) {
    log(`Adding label to ${card.name}`)
    addLabel(card.id, labelId)
  } else {
    log(`Removing label from ${card.name}`)
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
