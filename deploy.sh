npm install

rm -rf ./typings
typings install

NODE_ENV=production npm run build
