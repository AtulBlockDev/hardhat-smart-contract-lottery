const {run} = require("hardhat");

async function verify(ContractAddress, args){

    console.log("Verifying Your Contract")
    try{
    await run("verify:verify",{

        address: ContractAddress,
        constructorArguments: args,

    })
}
catch(e){
    if(e.message.toLowerCase().includes("already verified")){
        console.log("Already Verfied")
    }
    else{
        console.log(e)
    }
}
}

module.exports = {verify}