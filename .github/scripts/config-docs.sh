#!/bin/bash
git config --global user.name "Workflow"
git config --global user.email "elias.skogevall@gmail.com"
git add -A
set +e
git status | grep modified
if [ $? -eq 0 ]
then
    set -e
    git commit -m "Workflow build - $(date)"
    git push
    echo "Successfully commited and pushed to origin."
else
    set -e
    echo "No changes since last run."
fi
