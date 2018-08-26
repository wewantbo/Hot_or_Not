## Who is HOT and WHO is NOT Voting dapp
A fun take on a decentralized voting application that allows users to ability to vote for the Hottest of three candidates.  Built this decentralized application to allow individuals the ability to vote for the person they find the hottest.  The candidate that gets three votes first wins!  Voters can only vote once, so for testing purposes in order to cast a second vote the user must sign in on a different account.  Pretty simple just log on and vote away! Enjoy!

Note to User: Since this is my first dapp this project utilized "battle hardened" code (Truffle Pet-shop project) and generic UI to achieve the objective of the class.  I would consider myself a novice and would appreciate some constructive feedback.  Thanks to hackermoon and dappuniversity for the help in this learning adventure.

## Setup ##
Below is a list of the dependencies needed to run this project:
- NPM: https://nodejs.org
- Truffle: https://github.com/trufflesuite/truffle
- Ganache: http://truffleframework.com/ganache/
- Metamask: https://metamask.io/

## Step 1. Clone the project
git clone https://github.com/wewantbo/Hot_or_Not

## Step 2. Install dependencies
$ cd election
$ npm install

## Step 3. Start Ganache
Open the Ganache GUI client that you downloaded and installed. This will start your local blockchain instance.

## Step 4. Compile & Deploy Election Smart Contract
`$ truffle migrate --reset`
You must migrate the election smart contract each time your restart ganache.

## Step 5. Configure Metamask
- Unlock Metamask
- Connect metamask to your local Etherum blockchain provided by Ganache.
- Import an account provided by ganache.

## Step 6. Run the Front End Application
`$ npm run dev`
Visit this URL in your browser: http://localhost:3000
