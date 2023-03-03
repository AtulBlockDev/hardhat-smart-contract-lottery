const { assert, expect } = require("chai");
const { getNamedAccounts, ethers, deployments, network } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");


developmentChains.includes(network.name) ? describe.skip

:describe("Raffle Unit Test", async()=>{

    let raffle
    let deployer
    let EntranceFee 
  


    beforeEach(async function(){

        deployer = (await getNamedAccounts()).deployer
        raffle = await ethers.getContract("Raffle", deployer)
        EntranceFee = await raffle.getEntranceFee()

    })

    describe("fulfillRandomWords", function(){
        it("works with live chainlink keepers and chainlink vrf, we get a random number", async function(){
            const staringTimeStamp = await raffle.getLastTimeStamp()
            const accounts = await ethers.getSigners()
            console.log("Setting up Listener...")
            await new Promise(async (resolve, reject) => {
                raffle.once("Raffle_RecentWInner", async () => {
                    console.log("Winner Picked Event Fired!")
                    try {
                        const recentWinner = await raffle.getRecentWinner()
                        const raffleState = await raffle.getRaffleState()
                        const endingTimeStamp = await raffle.getLastTimeStamp()
                        const winnerEndingBalance =
                            await accounts[0].getBalance()

                        assert.equal(raffleState, 0)
                        assert.equal(
                            recentWinner.toString(),
                            accounts[0].address
                        )
                        assert.equal(
                            winnerEndingBalance.toString(),
                            winnerStartingBalance.add(EntranceFee).toString()
                        )
                        assert(endingTimeStamp > staringTimeStamp)

                        resolve()
                    } catch (error) {
                        console.log(error)
                        reject(error)
                    }
                })

                console.log("Entering Raffle")
                const tx = await raffle.EnterRaffle({ value: EntranceFee })
                await tx.wait(1)
                console.log("You have entered Raffle, hope for the best!")
                const winnerStartingBalance = await accounts[0].getBalance()
            })
        })
    })
})