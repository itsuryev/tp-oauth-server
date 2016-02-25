NODE_ENV=production npm install

rm -rf ./typings
typings install

NODE_ENV=production npm run build

NODE_ENV=production node ./build/backend.js
