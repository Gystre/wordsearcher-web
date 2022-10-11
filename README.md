# wordsearcher-web
production website for wordsearcher

# TODO
## high priority
* if width > 3000, resize resolution to half
* upload via url then save images to backblaze

## mid priority
* secure functions by only allowing the react app to use them, no one else
* find a way to make tesseract.js work on azure functions, won't load for some reason :( 

## low priority
* validate file size on server (will require rewriting a lot of code so probs not gonna do)
* package to share error enums and other logic to reduce copy pasting 
	* causes issues that take time to solve during deployment so might not
	* consider if going to update wordsearch algorithm in the future

# make sure
* azure using node 14 and 64 bit
* domain added to cors in function app
* set .env in vercel for website
* set .env in azure for server