pragma solidity ^0.4.24;

contract Select {

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    mapping(address => bool) public voters;  //Determine which accounts voted
    mapping(uint => Candidate) public candidates; //Fetch Candidate

    uint public candidatesCount; // Store Candidate Count
    string public Hottest; // Delcare the winner of the contest

    // Indicates that a voting event has occured
    event votedEvent (uint indexed _candidateId);

    // Hard code candidate list
    function Select () public {
        addCandidate("Donald Trump");
        addCandidate("Joe Lubin");
        addCandidate("Kim Ong Un");
    }

    // Create Candidate structure
    function addCandidate (string _name) private {
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    // Main function to tabulate all the votes and award a winner
    function vote (uint _candidateId) public {
        //allows only one vote per user
        require(!voters[msg.sender]);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount ++;

        // trigger voted event
        votedEvent(_candidateId);

        // determines who is Hot and Who is not
        if (candidates[_candidateId].voteCount >= 3)
        Hottest = candidates[_candidateId].name;
    }
}
