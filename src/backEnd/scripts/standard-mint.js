const Web3 = require('web3');
const web3 = new Web3(
  new Web3.providers.HttpProvider("http://localhost:7545"));

const { create } = require('ipfs-http-client')
var path = require('path');

const ipfs = create('http://127.0.0.1:5001')
const IpfsHttpClient = require('ipfs-http-client')
const { globSource } = IpfsHttpClient

const fs = require('fs')
const filePath = path.join(__dirname, '../abis')+ '\\NFT.json';
var parsed= JSON.parse(fs.readFileSync(filePath));

// !(migrate --reset) contract before running the script!
async function execute(callback) 
{ 
    const nft = new web3.eth.Contract(
      parsed.abi,
      "0x4237D484Cd4e66e7761EAE40C7d75020471f0109"
    );

    let nftsData = [] //NFT's database for front-end

    const accounts = await web3.eth.getAccounts()

    console.log('\nUploading images on IPFS...')

    const index = 0
    let files = fs.readdirSync(`${__dirname}/gallery`).forEach(file => {
      console.log(file);

      fs.readFile(file, function (err, data) {
          if (err) throw err;
          const metadata = await client.store({
            name: 'Pinpie',
            description: 'Pin is not delicious beef!',
            image: new File(data.toString(), 'modernArt-'+ index.toString(),
               { type: 'image/png' })
          })
          console.log(metadata.url)
      });
    });

    let upload = await ipfs.add(globSource(`${__dirname}/gallery`,
       { recursive: true }))

    console.log('\nPreparing metadata directory...')
    await fs.rmdirSync(`${__dirname}/metadata`, { recursive: true }, callback);
    await fs.mkdirSync(`${__dirname}/metadata`, { recursive: true }, callback);

    console.log('\nCreating metadata...')
    for(let i=0; i<files.length; i++){
      let metadata = JSON.stringify({
        "name": `${/[^.]*/.exec(files[i])[0]}`,
        "description": "Modern Art",
        "image": `https://ipfs.io/ipfs/${upload.cid.toString()}/${files[i]}`
      }, null, '\t');

      var img = fs.readFileSync(`${__dirname}/gallery/${files[i]}`, {encoding: 'base64'});
      nftsData.push(metadata.slice(0, -2) + `,\n\t"img": "${img}"` + `,\n\t"id": ${i+1}\n}`)

      // nftsData.push(metadata.slice(0, -2) + `,\n\t"id": ${i+1}\n}`) //add metadata&id to nftsData
      await fs.writeFileSync(`${__dirname}/metadata/${/[^.]*/.exec(files[i])[0]}.json`, metadata)
    }

    console.log('\nUploading metadata on IPFS...')
    files = fs.readdirSync(`${__dirname}/metadata`);
    upload = await ipfs.add(globSource(`${__dirname}/metadata`,
       { recursive: true }))

    console.log('\nMinting NFTs...')
    for(let i=0; i<files.length; i++){
      await nft.methods.mint(`https://ipfs.io/ipfs/${upload.cid.toString()}/${files[i]}`, web3.utils.toWei('1', 'Ether'))
        .send({from: accounts[0], gas:3000000})
      const price = web3.utils.toWei('1', 'Ether');
      const tokenUri = `https://ipfs.io/ipfs/${upload.cid.toString()}/${files[i]}`;

      nftsData[i] = nftsData[i].slice(0, -2) + `,\n\t"price": ${price},\n\t"uri": "${tokenUri}"\n}` //add price&URI to nftsData
      console.log(`\n${i+1} NFT is minted with URI:\n${tokenUri}`)
    }

    console.log('\nAggregating NFTs data...')
    if(fs.existsSync(`${__dirname}/nftsData.js`)) {
      await fs.unlinkSync(`${__dirname}/nftsData.js`)
    }
    await fs.writeFileSync(`${__dirname}/nftsData.js`, `export const nftsData = [${nftsData}]`)

    console.log('\n\nSuccess.')
 };

console.log('Executing function');
execute();