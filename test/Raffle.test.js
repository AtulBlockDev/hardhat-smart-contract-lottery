const { assert, expect } = require("chai");
const { getNamedAccounts, ethers, deployments, network } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");


!developmentChains.includes(network.name) ? describe.skip

:describe("Raffle Unit Test", async()=>{

    let raffle
    let deployer
    let vrfCoordinatorV2Mock
    let EntranceFee 
    let interval


    beforeEach(async function(){

        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"]);
        raffle = await ethers.getContract("Raffle", deployer)
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        interval = await raffle.getInterval()
        EntranceFee = await raffle.getEntranceFee()

    })
    describe("constructor",async()=>{
        it("sets the constructor correctly", async()=>{
            const response= await raffle.vrfCoordinator();
           

            const RaffleState = await raffle.getRaffleState();
            const interval = await raffle.getInterval()
            assert.equal(interval.toString(), networkConfig[chainId]["interval"])
            assert.equal(RaffleState.toString(), "0");
            assert.equal(response, vrfCoordinatorV2Mock.address)


        })
    })
    describe("EnterRaffle",  async function(){
        it("reverts when players do not send enough eth", async function(){
            await expect(raffle.EnterRaffle()).to.be.revertedWith("Raffle_NotEnoughEtherEntered")

        })
        it("records player when they enter", async function(){
            await raffle.EnterRaffle({value: EntranceFee})
            const contractPlayer = await raffle.getPlayers(0)
            assert.equal(deployer,  contractPlayer)

        })
        it("emits event on enter", async function(){
            await expect(raffle.EnterRaffle({value: EntranceFee})).to.emit(raffle, "RaffleEnter")
        })
        it("reverts if RaffleState is not in open state",  async function(){
            await raffle.EnterRaffle({value: EntranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            await raffle.performUpkeep([])
            await expect(raffle.EnterRaffle({value: EntranceFee})).to.be.revertedWith("Raffle_NotOpen")
        })

    })
    describe("checkUpKeep", async function(){
        it("returns false if people haven't send any ETH Amount", async function(){
            await network.provider.send("evm_increaseTime", [interval.toNumber()+1])
            await network.provider.send("evm_mine", [])
            const{upkeepNeeded} = await raffle.callStatic.checkUpkeep([])
            assert(!upkeepNeeded)
        })

        it("returns false if raffle is not open", async function() {
            await raffle.EnterRaffle({value: EntranceFee})
            await network.provider.send("evm_increaseTime", [interval.toNumber()+1])
            await network.provider.send("evm_mine", [])
            await raffle.performUpkeep([])
            const raffleState = await raffle.getRaffleState()
            const{upKeepNeeded} = await raffle.callStatic.checkUpkeep([])
            assert.equal(raffleState.toString(), "1")
            assert.equal(upKeepNeeded, false)
            

        })
         it("returns false if enough time hasn't passed", async () => {
             await raffle.EnterRaffle({ value: EntranceFee })
             await network.provider.send("evm_increaseTime", [
                 interval.toNumber() - 5,
             ]) // use a higher number here if this test fails
             await network.provider.request({ method: "evm_mine", params: [] })
             const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
             assert(!upkeepNeeded)
         })
         it("returns true if enough time has passed, has players, eth, and is open", async () => {
             await raffle.EnterRaffle({ value: EntranceFee })
             await network.provider.send("evm_increaseTime", [
                 interval.toNumber() + 1,
             ])
             await network.provider.request({ method: "evm_mine", params: [] })
             const { upKeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
             assert(upKeepNeeded)
         })
    } )

        describe("performUpkeep", async function(){

            it("it only runs if checkUpKeep is true", async function(){
                await raffle.EnterRaffle({value: EntranceFee})
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.send("evm_mine", [])
                const tx = await raffle.performUpkeep([])
                assert(tx)

            })
            it("reverts when checkUpKeep is false", async function(){
                await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle_UpKeepNotNeeded")

            })
            it("updates the raffleState, emits an event, and calls the vrf coordinator", async function(){
                await raffle.EnterRaffle({value: EntranceFee})
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.send("evm_mine", [])
                const tx = await raffle.performUpkeep([])
                const txReceipt = await tx.wait(1)
                const raffleState = await raffle.getRaffleState()
                const requestId = txReceipt.events[1].args.requestId
                assert(requestId.toNumber() > 0)
                assert(raffleState == "1")

            })
            describe("fulfillRandomWords", async function(){
                beforeEach(async function(){
                    await raffle.EnterRaffle({value: EntranceFee})
                    await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                    await network.provider.send("evm_mine", [])

                })
                it("can only be called after performUpKeep",  async function(){
                    await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request")
                    await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)).to.be.revertedWith("nonexistent request")
                })

                it("picks a winner, resets the raffle, and sends money", async function(){
                    const accounts =  await ethers.getSigners()
                    const additionalEntrants = 3
                    const startingAccountIndex = 1 
                    for(i = startingAccountIndex; i< startingAccountIndex + additionalEntrants; i++){

                        const raffleConnectedAccounts = await raffle.connect(accounts[i])
                        await raffleConnectedAccounts.EnterRaffle({value: EntranceFee})

                    }
                    const staringTimeStamp = await raffle.getLastTimeStamp()
                

                await new Promise(async(resolve, reject)=>{
                    raffle.once("Raffle_RecentWinner", async ()=>{
                        console.log("Event Found!")
                        try{
                            
                            const recentWinner =  await raffle.getRecentWinner()
                            console.log(recentWinner)
                            console.log(accounts[1].address)
                            console.log(accounts[2].address)
                            console.log(accounts[3].address)
                            console.log(accounts[0].address)
                            const RaffleState = await raffle.getRaffleState()
                            const endingTimeStamp = await raffle.getLastTimeStamp()
                            const numPlayers = await raffle.getNumberOfPlayers()
                            const winnerEndingBalance = await accounts[1].getBalance()
                            assert.equal(numPlayers.toString(), "0")
                            assert.equal(RaffleState.toString(), "0")
                            assert(endingTimeStamp > staringTimeStamp)
                            assert.equal(winnerEndingBalance.toString(), winnerStartingBalance.add(EntranceFee.mul(additionalEntrants).add(EntranceFee)).toString())

                        }catch(e){
                            reject(e)
                        }
                        resolve()

                    })
                    const tx  = await raffle.performUpkeep([])
                    const txReceipt = await tx.wait(1)
                    const winnerStartingBalance = await accounts[1].getBalance()
                    await vrfCoordinatorV2Mock.fulfillRandomWords(txReceipt.events[1].args.requestId, raffle.address)

                    

                })


            })


        })
    })

    
    



})

