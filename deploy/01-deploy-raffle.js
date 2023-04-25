const {network, ethers} = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async({getNamedAccounts, deployments})=>{
    const{deploy, log} = await deployments;
    const{deployer} = await getNamedAccounts();
    chainId = network.config.chainId

    let vrfCoordinatorV2Address
    const entranceFee = networkConfig[chainId]["entranceFee"]
    const callBackGasLimit = networkConfig[chainId]["callBackGasLimit"]
    const interval = networkConfig[chainId]["interval"]
    const gasLane = networkConfig[chainId]["gasLane"]
    let subscriptionId;
    const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("2");
    

    if(developmentChains.includes(network.name)){
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId

        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    }
    
    else{
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]

    }
    const argument = [
        entranceFee,
        vrfCoordinatorV2Address,
        gasLane,
        subscriptionId,
        callBackGasLimit,
        interval,
    ]


    const raffle = await deploy("Raffle",{
        contract: "Raffle",
        from: deployer,
        args:argument,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,

    })
    
    


    
        if (developmentChains.includes(network.name)) {
            const vrfCoordinatorV2Mock = await ethers.getContract(
                "VRFCoordinatorV2Mock"
            )
            await vrfCoordinatorV2Mock.addConsumer(
                subscriptionId,
                raffle.address
            )
        }
    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API){
        log("Verifying")
        await verify(raffle.address, argument);

    }
    log("_____________________________________")

  
    
}
module.exports.tags = ["all", "Raffle"]