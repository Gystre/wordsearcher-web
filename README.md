# wordsearcher-web

production website for wordsearcher

# Stack

Frontend = React (Next.js)
ML Inference = Azure Functions (Node.js)
Database = Firebase
Image Storage = Backblaze B2

# TODO

## high priority

- chakra v2 doesn't work on my phone
- include the currently typed word to be solved
- enter an edit mode and edit box labels

## mid priority

- secure functions by only allowing the react app to use them, no one else
- find a way to make tesseract.js work on azure functions, won't load for some reason :(

## low priority

- validate file size on server (will require rewriting a lot of code so probs not gonna do)
- package to share error enums and other logic between front and backend to reduce copy pasting
  - causes issues that take time to solve during deployment so might not
  - consider if going to update wordsearch algorithm in the future
- use non native library to calculate sha1 in uploadToB2.ts to avoid crypto.js (other libraries give wrong hash no idea why)

# make sure

- azure using node 14 and 64 bit
- localhost domain is added to cors in azure function app
- set .env in vercel for website
- set .env in azure for server
- visual studio 2019 installed with c++ devlopment kit to build tensorflow binaries on `yarn install`
- sync env vars locally with `f1` -> `Azure Functions: Download Remote Settings...`
- if only see "select subscriptions" in azure extension, keep signing in and out ig
