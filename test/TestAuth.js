const Auth = artifacts.require('./Auth.sol');
const KycAttester = artifacts.require('./KycAttester.sol');
const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
  .should();

const eventsIn = async tx => {
  const { logs } = await tx;
  return logs.map(log => ({ name: log.event, args: log.args })); // as Array<{ name: string, args: object }>
};

const contractVersion = 1;

contract('TestAuth', function (accounts) {
  let auth;
  let kycAttester;

  const [owner, user, otherUser, otherAttester] = accounts;

  // signed with user address(m/44'/60'/0'/0/1, 0x9a9A0F5877351F45A2A6Bfda4177b8eAd662fBE6) and messageHash by attester
  const userSignature = {
    messageHash: "0xc2db1ebc487a4aed2d04b1ed92cf8d5243257f6fdb04a575dfcbe9d1807b0fc7",
    v: 27,
    r: "0x50a712d83d00730c679368bdd4cebc21273d510cef47772ff972399d582bc096",
    s: "0x703ec857592a945d7a9288f43fd6f65f3ad4f9427b3b21274b52a3f1f2b88b37"
  }
  // signed with user address(m/44'/60'/0'/0/2, 0xDbe33D3003a72f8485db700f7a31230aA69E4283) and messageHash by attester
  const otherUserSignature = {
    messageHash: "0x93152533426e326cdf1accbeaf148c79266ecc84458de5442e5a714aa501cdbf",
    v: 28,
    r: "0x66e1287483b8c50e8d78d7e52307d1408a1b762d025bc91a8b4a7342161f73e4",
    s: "0x3f90f7ecf24c82d8b856544c203a826600a488b3c74167ffec074983d68f04df"
  }

  const attesterId = "0xc8c5ec47727c9438f371ad99d933bce9a59a3fc7";
  const attesterName = 'Attester1';
  const otherAttesterId = otherAttester;
  const otherAttesterName = 'Attester2';

  const userAuthArgs = [userSignature.messageHash, attesterId, userSignature.v, userSignature.r, userSignature.s, { from: user }];
  const otherUserAuthArgs = [otherUserSignature.messageHash, attesterId, otherUserSignature.v, otherUserSignature.r, otherUserSignature.s, { from: otherUser }];
  

  beforeEach(async function () {
    auth = await Auth.new(contractVersion, { from: owner });
    kycAttester = await KycAttester.new(contractVersion, { from: owner });
    await kycAttester.add(attesterId, attesterName);
    await kycAttester.add(otherAttester, otherAttesterName);

  })

  describe('KYC attester contract setting', async function () {
    it('sets KYC attester contract', async function () {
      await auth.setKycAttesterContractAddress(kycAttester.address, { from: owner }).should.be.fulfilled;
      const kycAttesterContractAddress = await auth.getKycAttesterContractAddress();
      kycAttesterContractAddress.should.be.equal(kycAttester.address);
    });

    it('reverts on set by non owner ', async function () {
      await auth.setKycAttesterContractAddress(kycAttester.address, { from: user })
        .should.be.rejectedWith(/revert/);
      const kycAttesterContractAddress = await auth.getKycAttesterContractAddress();
      kycAttesterContractAddress.should.be.bignumber.equal(0);
    });
  });

  describe('Auth', async function () {
    beforeEach(async function () {
      await auth.setKycAttesterContractAddress(kycAttester.address, { from: owner });
    });

    it('returns empty list of user id as initial value', async function () {
      const userId = await auth.getUserIds();
      userId.length.should.be.zero;
    });

    it('reverts on getting not exsiting auth for use', async function () {
      await auth.getUserAuth(user).should.be.rejectedWith('user must be present in map');
      await auth.getUserAuthByIndex(0).should.be.rejectedWith('index must be in range');
    });

    it('adds a user auth', async function () {
      await auth.add(...userAuthArgs)
        .should.be.fulfilled;
      const [userId, userAuthHash, userAttesterId] = await auth.getUserAuth(user);

      userId.should.be.equal(user);
      userAuthHash.should.be.equal(userSignature.messageHash);
      userAttesterId.should.be.equal(attesterId);
    });

    it('reverts on adding an invalid user auth', async function () {
      const userAuthWithUnregisteredAttesterArgs = [userSignature.messageHash, owner, userSignature.v, userSignature.r, userSignature.s, { from: otherUser }];
      const userAuthWithInvalidAttesterArgs = [userSignature.messageHash, otherAttesterId, userSignature.v, userSignature.r, userSignature.s, { from: user }];
      const userAuthWithInvalidAuthHashArgs = [otherUserSignature.messageHash, attesterId, userSignature.v, userSignature.r, userSignature.s, { from: user }];
      const userAuthWithInvalidSignatureArgs = [userSignature.messageHash, attesterId, otherUserSignature.v, otherUserSignature.r, otherUserSignature.s, { from: user }];
      const userAuthFromInvalidUserArgs = [userSignature.messageHash, attesterId, userSignature.v, userSignature.r, userSignature.s, { from: otherUser }];

      await auth.add(...userAuthWithUnregisteredAttesterArgs).should.be.rejectedWith('the kyc attester should be registered', undefined, 'auth with unregistered attester');
      await auth.add(...userAuthWithInvalidAttesterArgs).should.be.rejectedWith('signature must be verified', undefined, 'auth with invalid attester');
      await auth.add(...userAuthWithInvalidAuthHashArgs).should.be.rejectedWith('signature must be verified', undefined, 'auth with invalid authHash');
      await auth.add(...userAuthWithInvalidSignatureArgs).should.be.rejectedWith('signature must be verified', undefined, 'auth with invalid signature');
      await auth.add(...userAuthFromInvalidUserArgs).should.be.rejectedWith('signature must be verified', undefined, 'auth from invalid user');
    });
    
    it('emits an event on adding a user auth', async function () {
      const tx = auth.add(...userAuthArgs);
      const [event] = await eventsIn(tx);
      
      event.name.should.be.equal('LogAuthAdded');
      event.args.userId.should.be.equal(user);
    });

    context('when user added auth', async function () {
      beforeEach(async function () {
        await auth.add(...userAuthArgs);
        await auth.add(...otherUserAuthArgs);
      });

      it('returns user auth', async function () {
        const userAuthTxs = [auth.getUserAuth(user), auth.getUserAuthByIndex(0)];
        const userAuths = await Promise.all(userAuthTxs);

        userAuths.forEach(([userId, userAuthHash, userAttesterId]) => {
          userId.should.be.equal(user);
          userAuthHash.should.be.equal(userSignature.messageHash);
          userAttesterId.should.be.equal(attesterId);
        });
      });

      it('returns list of user id', async function () {
        const userIds = await auth.getUserIds();
        userIds.length.should.be.equal(2);
      });

      it('checks if user id is contained or not', async function () {
        await auth.contains(user).should.eventually.be.true;
        await auth.contains(otherUser).should.eventually.be.true;
        await auth.contains(owner).should.eventually.be.false;
      });

      it('returns size of user auth list', async function () {
        await auth.size().should.eventually.bignumber.become(2);
      });

      it('reverts on adding already registered user', async function () {
        await auth.add(...userAuthArgs).should.be.rejectedWith('the user should not be registered');
      });
    });
  });
});