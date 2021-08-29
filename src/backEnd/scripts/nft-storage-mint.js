// https://docs.alchemy.com/alchemy/tutorials/how-to-create-an-nft/how-to-mint-a-nft

var path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') })


let PROJECT_ID = process.env.PROJECT_ID;
let PUBLIC_KEY = process.env.PUBLIC_KEY;
let PRIVATE_KEY = process.env.PRIVATE_KEY;
let NFTSTORAGE_APIKEY = process.env.NFTSTORAGE_APIKEY;
let contractAddress = '0x59925945Cad2b8125614C1F9689359A621DAC94F';

const Web3 = require('web3');

//const web3 = new Web3(
//  new Web3.providers.HttpProvider("http://localhost:7545"));

var web3 = new Web3(new Web3.providers.HttpProvider(
    'https://ropsten.infura.io/v3/'+ PROJECT_ID
));

const { NFTStorage, File } = require('nft.storage');
const apiKey = NFTSTORAGE_APIKEY;
const nftStorageClient = new NFTStorage({ token: apiKey })

const fs = require('fs')
const filePath = path.join(__dirname, '../abis')+ '\\NFT.json';
var parsed= JSON.parse(fs.readFileSync(filePath));

let nftsData = [] //NFT's database for front-end

let nft;
let accounts;

// !(migrate --reset) contract before running the script!
async function execute(callback) 
{ 
    accounts = await web3.eth.getAccounts();

    nft = new web3.eth.Contract(
      parsed.abi,
      contractAddress
    );

    console.log('\nPreparing metadata directory...')
    await fs.rmdirSync(`${__dirname}/metadata`, { recursive: true }, callback);
    await fs.mkdirSync(`${__dirname}/metadata`, { recursive: true }, callback);

    console.log('\nUploading images on IPFS...')

    let files = fs.readdirSync(`${__dirname}/gallery`);
    await handleFileProcessing(files);   
};

async function mintNFT(tokenURI) {
  const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'pending'); //get latest nonce

  //the transaction
  const tx = {
    'from': PUBLIC_KEY,
    'to': contractAddress,
    'nonce': nonce,
    'gas': 7600000,
    'maxPriorityFeePerGas': 1999999987,
    'data': nft.methods.mint(tokenURI, web3.utils.toWei('0.01', 'Ether')).encodeABI()
  };

  const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
  signPromise.then((signedTx) => {

    web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(err, hash) {
      if (!err) {
        console.log("The hash of your transaction is: ", hash, "\nCheck Infra Mempool to view the status of your transaction!"); 
      } else {
        console.log("Something went wrong when submitting your transaction:", err)
      }
    });
  }).catch((err) => {
    console.log(" Promise failed:", err);
  });
}


async function handleFileProcessing(files)
{
    let index = 0;

    for (const file of files)
    {
          const fullFilePath = `${__dirname}\\gallery\\` + file;
          console.log(fullFilePath);

          let date1 = new Date();

          const fileName = 'modernArt-'+ index;
          const metadata = await nftStorageClient.store({
            name: fileName,
            description: 'Modern Art ' + date1 + ' - ' + fileName,
            image: new File([
                await fs.promises.readFile(fullFilePath)
                ], 
                fileName + '.jpg',
                { type: 'image/jpg' })
          })

          console.log(metadata.url)
         
          console.log('\nCreating metadata...')
          let metadataJson = JSON.stringify({
              "name": `${/[^.]*/.exec(file)[0]}`,
              "description": 'Digital Art ' + date1 + ' -' + fileName,
              "image": metadata.data.image.href
            }, null, '\t');

          var img = fs.readFileSync(`${fullFilePath}`, {encoding: 'base64'});
          nftsData.push(metadataJson.slice(0, -2) +
             `,\n\t"img": "${img}"` + `,\n\t"id": ${index}\n}`)

          await fs.writeFileSync(`${__dirname}/metadata/${/[^.]*/.exec(file)[0]}.json`,
             metadataJson)
          
          console.log('\nMinting NFTs...')
          //await nft.methods.mint(metadata.url, web3.utils.toWei('1', 'Ether'))
          //  .send({from: accounts[0], gas:3000000})
          await mintNFT(metadata.url);

          const price = web3.utils.toWei('0.01', 'Ether');
          const tokenUri = metadata.url;

          nftsData[index] = nftsData[index].slice(0, -2) + `,\n\t"price": ${price},\n\t"uri": "${tokenUri}"\n}` //add price&URI to nftsData
          console.log(`\n${index+1} NFT is minted with URI:\n${tokenUri}`)

          index ++;
    }
}

console.log('Executing Function');

execute().then(async () => {
    console.log('\nAggregating NFTs data...')
    if(fs.existsSync(`${__dirname}/nftsData.js`)) {
      await fs.unlinkSync(`${__dirname}/nftsData.js`)
    }
    await fs.writeFileSync(`${__dirname}/nftsData.js`,
     `export const nftsData = [${nftsData}]`)

    console.log('\n\nSuccess.')
});