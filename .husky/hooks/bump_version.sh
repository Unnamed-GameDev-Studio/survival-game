#!/bin/sh

# Bump version based on commit message
last_commit_message=$(git log --format=%B -n 1 HEAD)

if echo "$last_commit_message" | grep -q 'bump skip'; then
  echo "Skipping version bump"
else
  # bump patch version
  yarn version --patch --no-commit-hooks --no-git-tag-version
fi

# Commit the version bump
git add package.json