const{deployments, getNamedAccounts, ethers} = require("hardhat")

async function main(){
    const {deployer} = await getNamedAccounts()
    const raffle = await ethers.getContract("Raffle", deployer)
    const EntranceFee = await raffle.getEntranceFee()
    const transactionResponse = await raffle.EnterRaffle({value: EntranceFee})
    const transactionReceipt = await transactionResponse.wait(1)
    console.log("You have entered Raffle!")
    console.log("Find Your Transaction Hash Below")
    console.log(transactionResponse.hash)
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })