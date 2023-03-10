const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25")
const GAS_PRICE_LINK = 1e9

module.exports = async({deployments, getNamedAccounts})=>{
    const{deploy, log} = await deployments
    const{deployer} = await getNamedAccounts()

    if(developmentChains.includes(network.name)){
        log("deploying mocks!")

        await deploy("VRFCoordinatorV2Mock",{
            from: deployer,
            args:[BASE_FEE, GAS_PRICE_LINK],
            log:true,
            waitConfrimations: network.config.blockConfirmations || 1,

        })

        console.log("Mocks Deployed!")
        console.log("--------------------------------")

    }
    
}
module.exports.tags = ["all", "mocks"]