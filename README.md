# wordsearcher-web
production website for wordsearcher

# TODO
## high priority
* test upload via url during prod
* mobile view for [uid].tsx
	* resize word search like an image (convert box coordinates to make sure everything stays where it is)

## mid priority
* secure functions by only allowing the react app to use them, no one else
* find a way to make tesseract.js work on azure functions, won't load for some reason :( 

## low priority
* validate file size on server (will require rewriting a lot of code so probs not gonna do)
* package to share error enums and other logic between front and backend to reduce copy pasting 
	* causes issues that take time to solve during deployment so might not
	* consider if going to update wordsearch algorithm in the future
* use non native library to calculate sha1 in uploadToB2.ts to avoid crypto.js (other libraries give wrong hash no idea why)

# make sure
* azure using node 14 and 64 bit
* domain added to cors in function app
* set .env in vercel for website
* set .env in azure for server