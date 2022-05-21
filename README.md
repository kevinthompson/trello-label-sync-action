# Trello Custom Field Sync Github Action

Trello Custom Field Sync Github Action helps to keep your Trello board up-to-date with what is happening on github.  Syncing will add (and remove unless settings tell otherwise) a custom field if there is not already one set.

## Prerequisites

- You must attach PRs to your trello cards to make this function correctly
- You must have a custom field added to your cards
- Github actions must be enabled for your github repository.

## Basic Usage

In your repository, add a file to run a github action that looks something like this:

```yml
# .github/workflows/trello.yml

name: Trello Label Syncing

on:
  push:
    branches:
      - staging # the name of the branch to sync, only one branch is supported

jobs:
  trello_label_sync:
    runs-on: ubuntu-latest
    steps:
      - uses: planningcenter/trello-custom-field-sync-action@v0.1.0
        with:
          trello_key: ${{ secrets.TRELLO_KEY }}
          trello_token: ${{ secrets.TRELLO_TOKEN }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          trello_board_id: H3L10 # assign your trello board id
          trello_label_id: W0R1D # assign your trello label id
```

## Action Inputs

To use these, add them to the list of `with:` key/value pairs.

| key | default | description |
|---| ---| ---|
|__`trello_board_id`(required)__ | none | Id of the board to sync with. Can be found in the URL of the main board: (ex. `trello.com/b/{ID}/your-board-name`) |
|__`trello_label_id`__ | none | Id of the board to sync with. Can be found in the JSON of the main board: (ex. `trello.com/b/{ID}/your-board-name.json`) |

## Setting Secrets

In order to protect your trello key and token, you will need to add them in github to your secrets.

GITHUB_TOKEN is added automatically by Github.

### Generating Trello Key/Token

Go to https://trello.com/app-key.  If you are logged in, you should see your key there.  To get a token, click on `Generate a Token` to get one.

### Adding secrets to Github

On Github, for the repository you are setting up, go to `Settings` -> `Secrets` -> `Actions`.

Click on `New repository secret`.

Create 2 secrets, one for the key with the `Name` of `TRELLO_KEY` and one for the token with the `Name` of `TRELLO_TOKEN`.

## Roadmap

- Sync when branches are attached to a trello card.
- Add support for squash merge detection
- Add testing
