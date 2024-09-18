call npx tsc --project ./

call npm version patch

call xcopy /s /e "./models" "./build-models" /Y

call cd ../backend

call npm install file:../common

call cd ../frontend

call npm install file:../common

call cd ../common

