#!/bin/sh

cd ./frontend

npm version patch


cd ../

git add ./frontend/package.json
git add ./frontend/package-lock.json

