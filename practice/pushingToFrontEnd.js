// const { ethers } = require("hardhat")
// const fs = require("fs")

// const frontendAddressFile = "../next-js-raffle/src/constants/contractAddresses.json"
// const frontendAbiFile = "../next-js-raffle/src/constants/abi.json"

// module.exports = async function(){
//     updateAbi()
//     updateAddress()
// }
// async function updateABI(){
//     const raffle = await ethers.getContract("Raffle")
//     fs.writeFileSync(frontendAbiFile, raffle.interface.format(ethers.utils.FormatTypes.json))
// }
// async function updateAddress(){
//     const raffle = await ethers.getContract("Raffle")
//     const chainID = network.config.chainId.toString() //getting the chainId of the currently deployed raffle contract
//     const currentAddress = JSON.parse(fs.readFileSync(frontendAddressFile, "utf8")) // making an object of frontendAddresses file
//     if(chainID in currentAddress){ //Checking if the user has defined any chainId in the frontend file
//         if(!currentAddress[chainID].includes(raffle.address)){ // if it is not including any raffle contract
//             currentAddress[ChainID].push(raffle.address) // we will push raffle.address in the chainId
//         }
//     }
//     else{
//         currentAddress[chainID] = [raffle.address] //otherwise if there is  no defind chainId, we will make a new chaiID key in frontend file
//         // and make it eual to raffle.address
//     }

//     fs.writeFileSync(frontendAddressFile, JSON.stringify(currentAddress)) //writing this whole object to frontEnd file
// }

// module.exports.tags = ["all", "frontend"]