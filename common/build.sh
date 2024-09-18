npx tsc --project ./
npm version patch
cp -a ./models/. ./build-models/
cd ../backend
npm install file:../common
cd ../frontend
npm install file:../common
cd ../common