// SPDX-License-Identifier: MLT

pragma solidity 0.8.7;
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

 error Raffle_NotEnoughEtherEntered();
 error Raffle_TransferFailed();
 error Raffle_NotOpen();
 error Raffle_UpKeepNotNeeded(uint256 currentBalance, uint numPlayers, uint raffleState );

contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface{

enum RaffleState{
    Open,
    calculating,
    Closed
}
    event Raffle_RequestedRaffleWinner(uint256 indexed requestId);
    event RaffleEnter(address indexed player); //emits an event that aplayer joined the lottery
    event Raffle_RecentWinner(address indexed winner);

    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface public vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant numWords = 1;
    uint256 private immutable i_interval;

    //lottery variables

    address private s_recentWinner;
    RaffleState private s_raffleState;
    uint private s_lastTimeStamp;

    constructor(uint entranceFee, address vrfCoordinatorV2, bytes32 gasLane, uint64 subscriptionId,
     uint32 callbackGasLimit, uint interval) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.Open;
        i_interval = interval;
        s_lastTimeStamp = block.timestamp;
    }
    function checkUpkeep(bytes memory /*checkData*/) public override returns(bool upKeepNeeded, bytes memory /*performData*/){
        bool isOpen = (s_raffleState == RaffleState.Open);
        bool timePassed = (block.timestamp - s_lastTimeStamp > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = (address(this).balance > 0);
        upKeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);



    }

    function EnterRaffle() public payable{
        if(msg.value<i_entranceFee){
            revert Raffle_NotEnoughEtherEntered();
        }
        if(s_raffleState != RaffleState.Open){
            revert Raffle_NotOpen();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);

    }


    function performUpkeep(bytes calldata /*performData*/) external override  {

        (bool upKeepNeeded,) = checkUpkeep("");
        if(!upKeepNeeded){
            revert Raffle_UpKeepNotNeeded(address(this).balance, s_players.length, uint256(s_raffleState));
        }

        s_raffleState = RaffleState.calculating;

         uint256 requestId = vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            numWords
         );
         emit Raffle_RequestedRaffleWinner(requestId);


    }

    function fulfillRandomWords(uint requestId, uint256[] memory randomWords) internal override {
        uint winnerIndex = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[winnerIndex];
         s_recentWinner = recentWinner;
        s_raffleState = RaffleState.Open;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if(!success){
            revert Raffle_TransferFailed();
        }
        emit Raffle_RecentWinner(recentWinner);
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;


    }

    function getEntranceFee() public view returns(uint){
        return i_entranceFee;
    }
    function getPlayers(uint Index) public view returns(address){
        return s_players[Index];
    }
        function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }
    function getNumberOfPlayers() public view returns(uint){
        return s_players.length;
    }

    function getNumWords() public pure returns (uint256) {
        return numWords;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }
    function getInterval() public view returns(uint256){
    return i_interval;
    }
    function getLastTimeStamp() public view returns(uint256){
        return s_lastTimeStamp;
    }
    function getRecentWinner() public view returns(address){
        return s_recentWinner;
    } 
} 