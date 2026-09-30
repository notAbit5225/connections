# Connections maker

Make a 4x4 connections puzzle with your own pictures and send it to a friend as a link.

## 1. Set up Firebase (one time, about 10 minutes)

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Create project**, give it any name. You can turn Google Analytics off.
3. Left menu: **Build > Firestore Database > Create database**. Pick a location close to you (any `europe-` one) and choose **production mode**.
4. Open the **Rules** tab, delete everything, paste the contents of `firestore.rules` from this folder, click **Publish**.
5. Click the gear icon > **Project settings**, scroll down, click the **</>** (web) icon, give it any name, and click Register.
6. You'll see `firebaseConfig` with values like `apiKey`. Copy those values into `src/app/firebase-config.ts`.

These values are safe to put on GitHub. The rules are what protect the database.

## 2. Run it on your computer

Install Node.js (LTS) from https://nodejs.org, then in a terminal inside this folder:

```
npm install
npm start
```

Open http://localhost:4200. Make a puzzle, click **Done, get my link**, and open the link to play it.

## 3. Put it online with GitHub Pages (free)

1. Make a GitHub account and create a new **public** repository (for example `connections`).
   Don't name it `yourname.github.io`.
2. Upload everything in this folder **except** `node_modules`, `dist` and `.angular` (if they exist).
   Easiest way: on the repo page click **uploading an existing file** and drag the files and folders in.
   Make sure the hidden `.github` folder gets uploaded too (on Mac press Cmd+Shift+. in Finder to see hidden folders).
3. In the repo go to **Settings > Pages**, and under **Source** choose **GitHub Actions**.
4. Go to the **Actions** tab. If nothing is running, click **Deploy to GitHub Pages > Run workflow**.
5. After 1-2 minutes your site is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

Every time you upload changes, the site updates by itself.

## How it works

- Pictures are cropped to squares and compressed in the browser, then saved with the puzzle in Firestore.
- The link looks like `.../#/play/SOME-ID`. Anyone with the link can play that one puzzle, but nobody can browse other puzzles.
- Puzzles can't be edited or deleted after they're made. Just make a new one.
- Firebase's free plan doesn't need a credit card, so you can't be charged.
