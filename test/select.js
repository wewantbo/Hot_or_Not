var Select = artifacts.require("./Select.sol");

contract("Select", function(accounts) {
  var SelectInstance;

// Test verifies that the initialization of the the candidates functions correctly.
// It is important to determine that contract initializes with no more or less than 3.
  it("test initializes with three Hotties to select", function() {
    return Select.deployed().then(function(instance) {
      return instance.candidatesCount();
    }).then(function(count) {
      assert.equal(count, 3);
    });
  });

// This test initializes the candidates with the correct values.  This test validates
// that the correct information was assigned to the correct candidate.
  it("test initializes the hotties with the correct values", function() {
    return Select.deployed().then(function(instance) {
      SelectInstance = instance;
      return SelectInstance.candidates(1);
    }).then(function(candidate) {
      assert.equal(candidate[0], 1, "contains the correct id");
      assert.equal(candidate[1], "Donald Trump", "contains the correct name");
      assert.equal(candidate[2], 0, "contains the correct votes count");
      return SelectInstance.candidates(2);
    }).then(function(candidate) {
      assert.equal(candidate[0], 2, "contains the correct id");
      assert.equal(candidate[1], "Joe Lubin", "contains the correct name");
      assert.equal(candidate[2], 0, "contains the correct votes count");
    });
  });

// This test simulates the voter casting a vote.  It verifies that the voter function
// is executing as designed allowing votes to be tabulated.
  it("allows a voter to cast a vote", function() {
    return Select.deployed().then(function(instance) {
      SelectInstance = instance;
      candidateId = 1;
      return SelectInstance.vote(candidateId, { from: accounts[0] });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "an event was triggered");
      assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
      assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
      return SelectInstance.voters(accounts[0]);
    }).then(function(voted) {
      assert(voted, "the voter was marked as voted");
      return SelectInstance.candidates(candidateId);
    }).then(function(candidate) {
      var voteCount = candidate[2];
      assert.equal(voteCount, 1, "increments the candidate's vote count");
    })
  });

// This test will throw an exception for invalid candidates.  It is important to
// confirm that one can only vote on valid candidates.
  it("throws an exception for invalid Hotties", function() {
    return Select.deployed().then(function(instance) {
      SelectInstance = instance;
      return SelectInstance.vote(99, { from: accounts[1] })
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      return SelectInstance.candidates(1);
    }).then(function(candidate1) {
      var voteCount = candidate1[2];
      assert.equal(voteCount, 1, "candidate 1 did not receive any votes");
      return SelectInstance.candidates(2);
    }).then(function(candidate2) {
      var voteCount = candidate2[2];
      assert.equal(voteCount, 0, "candidate 2 did not receive any votes");
    });
  });

// This test verifies that double vote is not possible from the same address.
// This is important becuase it tests one of the contract's core rules.
  it("verification that double vote is not possible", function() {
    return Select.deployed().then(function(instance) {
      SelectInstance = instance;
      candidateId = 2;
      SelectInstance.vote(candidateId, { from: accounts[1] });
      return SelectInstance.candidates(candidateId);
    }).then(function(candidate) {
      var voteCount = candidate[2];
      assert.equal(voteCount, 1, "accepts first vote");
      return SelectInstance.vote(candidateId, { from: accounts[1] });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
      return SelectInstance.candidates(1);
    }).then(function(candidate1) {
      var voteCount = candidate1[2];
      assert.equal(voteCount, 1, "candidate 1 did not receive any votes");
      return SelectInstance.candidates(2);
    }).then(function(candidate2) {
      var voteCount = candidate2[2];
      assert.equal(voteCount, 1, "candidate 2 did not receive any votes");
    });
  });
});
